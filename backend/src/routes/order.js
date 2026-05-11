const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

function generateOrderNo() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `M${dateStr}${random}`;
}

router.post('/create', authMiddleware, (req, res) => {
  const { registration_id } = req.body;

  if (!registration_id) {
    return res.status(400).json({ error: '缺少报名ID' });
  }

  const registration = db.prepare(
    'SELECT r.*, c.price, c.name as category_name FROM registrations r JOIN event_categories c ON r.category_id = c.id WHERE r.id = ? AND r.user_id = ?'
  ).get(registration_id, req.user.id);

  if (!registration) {
    return res.status(404).json({ error: '报名记录不存在' });
  }

  const existingOrder = db.prepare(
    'SELECT * FROM orders WHERE registration_id = ? AND status != "cancelled"'
  ).get(registration_id);

  if (existingOrder) {
    return res.json({ message: '订单已存在', order: existingOrder });
  }

  const orderNo = generateOrderNo();

  try {
    const result = db.prepare(
      'INSERT INTO orders (order_no, user_id, registration_id, amount) VALUES (?, ?, ?, ?)'
    ).run(orderNo, req.user.id, registration_id, registration.price);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

    res.json({ message: '订单创建成功', order });
  } catch (error) {
    res.status(500).json({ error: '订单创建失败', message: error.message });
  }
});

router.post('/pay', authMiddleware, (req, res) => {
  const { order_id, payment_method } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: '缺少订单ID' });
  }

  const order = db.prepare(
    'SELECT o.*, r.event_id, r.category_id FROM orders o JOIN registrations r ON o.registration_id = r.id WHERE o.id = ? AND o.user_id = ?'
  ).get(order_id, req.user.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status === 'paid') {
    return res.status(400).json({ error: '订单已支付' });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({ error: '订单已取消' });
  }

  try {
    db.prepare(
      'UPDATE orders SET status = "paid", payment_method = ?, payment_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(payment_method || 'mock', order_id);

    db.prepare(
      'UPDATE registrations SET status = "confirmed", updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(order.registration_id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);

    res.json({ message: '支付成功', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: '支付失败', message: error.message });
  }
});

router.get('/my', authMiddleware, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, e.name as event_name, c.name as category_name, c.distance
    FROM orders o
    JOIN registrations r ON o.registration_id = r.id
    JOIN events e ON r.event_id = e.id
    JOIN event_categories c ON r.category_id = c.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  res.json(orders);
});

router.get('/:id', authMiddleware, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, e.name as event_name, e.location, e.start_time,
           c.name as category_name, c.distance,
           r.bib_number, u.name as user_name
    FROM orders o
    JOIN registrations r ON o.registration_id = r.id
    JOIN events e ON r.event_id = e.id
    JOIN event_categories c ON r.category_id = c.id
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ? AND o.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  res.json(order);
});

router.put('/:id/cancel', authMiddleware, (req, res) => {
  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status === 'paid') {
    return res.status(400).json({ error: '已支付订单无法取消，请联系客服退款' });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({ error: '订单已取消' });
  }

  db.prepare('UPDATE orders SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(order.id);
  db.prepare('UPDATE registrations SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(order.registration_id);
  db.prepare('UPDATE event_categories SET registered_count = registered_count - 1 WHERE id = (SELECT category_id FROM registrations WHERE id = ?)').run(order.registration_id);

  res.json({ message: '订单已取消' });
});

module.exports = router;
