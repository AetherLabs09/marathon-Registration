const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

router.get('/', (req, res) => {
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
    const categories = db.prepare(
      'SELECT * FROM event_categories WHERE event_id = ?'
    ).all(event.id);
    return { ...event, categories };
  });

  res.json({
    data: eventsWithCategories,
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/open', (req, res) => {
  const events = db.prepare(
    "SELECT * FROM events WHERE status = 'open' AND registration_end > datetime('now') ORDER BY registration_start ASC"
  ).all();

  const eventsWithCategories = events.map(event => {
    const categories = db.prepare(
      'SELECT * FROM event_categories WHERE event_id = ?'
    ).all(event.id);
    return { ...event, categories };
  });

  res.json(eventsWithCategories);
});

router.get('/history', (req, res) => {
  const events = db.prepare(
    "SELECT * FROM events WHERE status = 'finished' ORDER BY start_time DESC"
  ).all();

  res.json(events);
});

router.get('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

  if (!event) {
    return res.status(404).json({ error: '赛事不存在' });
  }

  const categories = db.prepare(
    'SELECT * FROM event_categories WHERE event_id = ?'
  ).all(event.id);

  res.json({ ...event, categories });
});

module.exports = router;
