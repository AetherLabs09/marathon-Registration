const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

function generateBibNumber(categoryId) {
  const prefix = ['A', 'B', 'C'][categoryId - 1] || 'D';
  const number = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${prefix}${number}`;
}

function calculateAge(idCard) {
  if (!idCard || idCard.length < 14) return null;
  const birthYear = parseInt(idCard.substring(6, 10));
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

router.post('/', authMiddleware, (req, res) => {
  const { event_id, category_id, health_declaration } = req.body;

  if (!event_id || !category_id) {
    return res.status(400).json({ error: '请选择赛事和组别' });
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(event_id);
  if (!event) {
    return res.status(404).json({ error: '赛事不存在' });
  }

  if (event.status !== 'open') {
    return res.status(400).json({ error: '该赛事暂未开放报名' });
  }

  const category = db.prepare('SELECT * FROM event_categories WHERE id = ? AND event_id = ?').get(category_id, event_id);
  if (!category) {
    return res.status(404).json({ error: '组别不存在' });
  }

  if (category.registered_count >= category.quota) {
    return res.status(400).json({ error: '该组别名额已满' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user.name || !user.id_card) {
    return res.status(400).json({ error: '请先完善个人信息' });
  }

  const age = calculateAge(user.id_card);
  if (category.min_age && age < category.min_age) {
    return res.status(400).json({ error: `年龄不符合要求，最小年龄为${category.min_age}岁` });
  }
  if (category.max_age && age > category.max_age) {
    return res.status(400).json({ error: `年龄不符合要求，最大年龄为${category.max_age}岁` });
  }

  const existing = db.prepare(
    'SELECT id FROM registrations WHERE user_id = ? AND event_id = ? AND status != "cancelled"'
  ).get(req.user.id, event_id);

  if (existing) {
    return res.status(400).json({ error: '您已报名该赛事' });
  }

  const bibNumber = generateBibNumber(category_id);

  try {
    const result = db.prepare(
      'INSERT INTO registrations (user_id, event_id, category_id, bib_number, health_declaration) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, event_id, category_id, bibNumber, health_declaration || 'confirmed');

    db.prepare(
      'UPDATE event_categories SET registered_count = registered_count + 1 WHERE id = ?'
    ).run(category_id);

    const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      message: '报名成功',
      registration: {
        ...registration,
        event_name: event.name,
        category_name: category.name,
        price: category.price
      }
    });
  } catch (error) {
    res.status(500).json({ error: '报名失败', message: error.message });
  }
});

router.get('/my', authMiddleware, (req, res) => {
  const registrations = db.prepare(`
    SELECT r.*, e.name as event_name, e.location, e.start_time, e.end_time,
           c.name as category_name, c.distance, c.price,
           o.status as order_status, o.order_no
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN event_categories c ON r.category_id = c.id
    LEFT JOIN orders o ON o.registration_id = r.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.id);

  res.json(registrations);
});

router.get('/:id', authMiddleware, (req, res) => {
  const registration = db.prepare(`
    SELECT r.*, e.name as event_name, e.location, e.start_time, e.end_time, e.rules,
           c.name as category_name, c.distance, c.price,
           u.name as user_name, u.id_card, u.phone, u.emergency_contact, u.emergency_phone
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN event_categories c ON r.category_id = c.id
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ? AND r.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!registration) {
    return res.status(404).json({ error: '报名记录不存在' });
  }

  res.json(registration);
});

router.put('/:id/cancel', authMiddleware, (req, res) => {
  const registration = db.prepare(
    'SELECT * FROM registrations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!registration) {
    return res.status(404).json({ error: '报名记录不存在' });
  }

  if (registration.status === 'cancelled') {
    return res.status(400).json({ error: '该报名已取消' });
  }

  const order = db.prepare(
    'SELECT * FROM orders WHERE registration_id = ? AND status = "paid"'
  ).get(registration.id);

  if (order) {
    return res.status(400).json({ error: '已支付的订单无法直接取消，请联系客服' });
  }

  db.prepare('UPDATE registrations SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(registration.id);
  db.prepare('UPDATE event_categories SET registered_count = registered_count - 1 WHERE id = ?').run(registration.category_id);

  if (registration.status === 'pending') {
    db.prepare('UPDATE orders SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE registration_id = ?').run(registration.id);
  }

  res.json({ message: '取消成功' });
});

module.exports = router;
