const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);

router.get('/events', (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let sql = 'SELECT * FROM events WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const events = db.prepare(sql).all(...params);

  const eventsWithCategories = events.map(event => {
    const categories = db.prepare('SELECT * FROM event_categories WHERE event_id = ?').all(event.id);
    return { ...event, categories };
  });

  res.json({ data: eventsWithCategories, total, page: parseInt(page), limit: parseInt(limit) });
});

router.post('/events', (req, res) => {
  const { name, description, location, start_time, end_time, registration_start, registration_end, status, rules, requirements, categories } = req.body;

  if (!name || !location || !start_time || !end_time) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO events (name, description, location, start_time, end_time, registration_start, registration_end, status, rules, requirements) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, description, location, start_time, end_time, registration_start, registration_end, status || 'upcoming', rules, requirements);

    if (categories && categories.length > 0) {
      const insertCategory = db.prepare(
        'INSERT INTO event_categories (event_id, name, distance, price, quota, min_age, max_age, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      categories.forEach(cat => {
        insertCategory.run(result.lastInsertRowid, cat.name, cat.distance, cat.price, cat.quota, cat.min_age, cat.max_age, cat.description);
      });
    }

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    res.json({ message: '创建成功', event });
  } catch (error) {
    res.status(500).json({ error: '创建失败', message: error.message });
  }
});

router.put('/events/:id', (req, res) => {
  const { name, description, location, start_time, end_time, registration_start, registration_end, status, rules, requirements } = req.body;

  try {
    db.prepare(
      'UPDATE events SET name = ?, description = ?, location = ?, start_time = ?, end_time = ?, registration_start = ?, registration_end = ?, status = ?, rules = ?, requirements = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(name, description, location, start_time, end_time, registration_start, registration_end, status, rules, requirements, req.params.id);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    res.json({ message: '更新成功', event });
  } catch (error) {
    res.status(500).json({ error: '更新失败', message: error.message });
  }
});

router.put('/events/:id/status', (req, res) => {
  const { status } = req.body;

  const validStatuses = ['upcoming', 'open', 'closed', 'ongoing', 'finished'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态' });
  }

  db.prepare('UPDATE events SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

  res.json({ message: '状态更新成功' });
});

router.delete('/events/:id', (req, res) => {
  const registrations = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE event_id = ?').get(req.params.id);
  if (registrations.count > 0) {
    return res.status(400).json({ error: '该赛事已有报名记录，无法删除' });
  }

  db.prepare('DELETE FROM event_categories WHERE event_id = ?').run(req.params.id);
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);

  res.json({ message: '删除成功' });
});

router.get('/registrations', (req, res) => {
  const { event_id, status, keyword, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT r.*, e.name as event_name, c.name as category_name, c.distance,
           u.name as user_name, u.phone, u.id_card, u.gender,
           o.status as order_status, o.amount
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN event_categories c ON r.category_id = c.id
    JOIN users u ON r.user_id = u.id
    LEFT JOIN orders o ON o.registration_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (event_id) {
    sql += ' AND r.event_id = ?';
    params.push(event_id);
  }

  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }

  if (keyword) {
    sql += ' AND (u.name LIKE ? OR u.phone LIKE ? OR r.bib_number LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const countSql = sql.replace('SELECT r.*', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;

  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const registrations = db.prepare(sql).all(...params);

  res.json({ data: registrations, total, page: parseInt(page), limit: parseInt(limit) });
});

router.put('/registrations/:id/status', (req, res) => {
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'checked_in', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态' });
  }

  db.prepare('UPDATE registrations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

  res.json({ message: '状态更新成功' });
});

router.get('/orders', (req, res) => {
  const { status, event_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT o.*, e.name as event_name, c.name as category_name,
           u.name as user_name, u.phone
    FROM orders o
    JOIN registrations r ON o.registration_id = r.id
    JOIN events e ON r.event_id = e.id
    JOIN event_categories c ON r.category_id = c.id
    JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND o.status = ?';
    params.push(status);
  }

  if (event_id) {
    sql += ' AND r.event_id = ?';
    params.push(event_id);
  }

  const countSql = sql.replace('SELECT o.*', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;

  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const orders = db.prepare(sql).all(...params);

  res.json({ data: orders, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/users', (req, res) => {
  const { keyword, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = 'SELECT id, phone, email, name, gender, id_card, emergency_contact, emergency_phone, role, created_at FROM users WHERE 1=1';
  const params = [];

  if (keyword) {
    sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const countSql = sql.replace('SELECT id, phone, email, name, gender, id_card, emergency_contact, emergency_phone, role, created_at', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const users = db.prepare(sql).all(...params);

  res.json({ data: users, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/export/registrations', (req, res) => {
  const { event_id } = req.query;

  let sql = `
    SELECT r.bib_number, u.name, u.gender, u.id_card, u.phone, u.emergency_contact, u.emergency_phone,
           e.name as event_name, c.name as category_name, c.distance, r.status, r.created_at
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN event_categories c ON r.category_id = c.id
    JOIN users u ON r.user_id = u.id
    WHERE r.status != 'cancelled'
  `;
  const params = [];

  if (event_id) {
    sql += ' AND r.event_id = ?';
    params.push(event_id);
  }

  sql += ' ORDER BY r.created_at DESC';

  const registrations = db.prepare(sql).all(...params);

  const headers = ['参赛号', '姓名', '性别', '身份证号', '手机号', '紧急联系人', '紧急联系电话', '赛事名称', '组别', '距离', '状态', '报名时间'];
  const csvContent = [
    headers.join(','),
    ...registrations.map(r => [
      r.bib_number,
      r.name,
      r.gender,
      r.id_card,
      r.phone,
      r.emergency_contact,
      r.emergency_phone,
      r.event_name,
      r.category_name,
      r.distance,
      r.status,
      r.created_at
    ].join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
  res.send('\uFEFF' + csvContent);
});

module.exports = router;
