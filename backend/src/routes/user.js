const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.get('/profile', authMiddleware, (req, res) => {
  const user = db.prepare(
    'SELECT id, phone, email, name, gender, id_card, emergency_contact, emergency_phone, role, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json(user);
});

router.put('/profile', authMiddleware, (req, res) => {
  const { name, gender, id_card, emergency_contact, emergency_phone } = req.body;

  try {
    db.prepare(
      'UPDATE users SET name = ?, gender = ?, id_card = ?, emergency_contact = ?, emergency_phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(name, gender, id_card, emergency_contact, emergency_phone, req.user.id);

    const user = db.prepare(
      'SELECT id, phone, email, name, gender, id_card, emergency_contact, emergency_phone, role FROM users WHERE id = ?'
    ).get(req.user.id);

    res.json({ message: '更新成功', user });
  } catch (error) {
    res.status(500).json({ error: '更新失败', message: error.message });
  }
});

router.get('/registrations', authMiddleware, (req, res) => {
  const registrations = db.prepare(`
    SELECT r.*, e.name as event_name, e.location, e.start_time,
           c.name as category_name, c.distance, o.status as order_status, o.amount
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN event_categories c ON r.category_id = c.id
    LEFT JOIN orders o ON o.registration_id = r.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.id);

  res.json(registrations);
});

module.exports = router;
