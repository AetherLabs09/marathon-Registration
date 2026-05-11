const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

router.get('/overview', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "user"').get().count;
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  const totalRegistrations = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE status != "cancelled"').get().count;
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = "paid"').get().total;

  res.json({
    totalUsers,
    totalEvents,
    totalRegistrations,
    totalRevenue
  });
});

router.get('/events/:id/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM registrations r WHERE r.category_id = c.id AND r.status != 'cancelled') as registered_count
    FROM event_categories c
    WHERE c.event_id = ?
  `).all(req.params.id);

  res.json(categories);
});

router.get('/events/:id/gender', (req, res) => {
  const genderStats = db.prepare(`
    SELECT u.gender, COUNT(*) as count
    FROM registrations r
    JOIN users u ON r.user_id = u.id
    WHERE r.event_id = ? AND r.status != 'cancelled'
    GROUP BY u.gender
  `).all(req.params.id);

  res.json(genderStats);
});

router.get('/events/:id/age', (req, res) => {
  const ageStats = db.prepare(`
    SELECT 
      CASE 
        WHEN CAST(strftime('%Y', 'now') AS INT) - CAST(substr(u.id_card, 7, 4) AS INT) < 20 THEN '20岁以下'
        WHEN CAST(strftime('%Y', 'now') AS INT) - CAST(substr(u.id_card, 7, 4) AS INT) < 30 THEN '20-29岁'
        WHEN CAST(strftime('%Y', 'now') AS INT) - CAST(substr(u.id_card, 7, 4) AS INT) < 40 THEN '30-39岁'
        WHEN CAST(strftime('%Y', 'now') AS INT) - CAST(substr(u.id_card, 7, 4) AS INT) < 50 THEN '40-49岁'
        WHEN CAST(strftime('%Y', 'now') AS INT) - CAST(substr(u.id_card, 7, 4) AS INT) < 60 THEN '50-59岁'
        ELSE '60岁以上'
      END as age_group,
      COUNT(*) as count
    FROM registrations r
    JOIN users u ON r.user_id = u.id
    WHERE r.event_id = ? AND r.status != 'cancelled' AND u.id_card IS NOT NULL AND length(u.id_card) >= 14
    GROUP BY age_group
  `).all(req.params.id);

  res.json(ageStats);
});

router.get('/revenue', (req, res) => {
  const { start_date, end_date } = req.query;

  let sql = `
    SELECT date(payment_time) as date, SUM(amount) as total
    FROM orders
    WHERE status = 'paid'
  `;
  const params = [];

  if (start_date) {
    sql += ' AND date(payment_time) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    sql += ' AND date(payment_time) <= ?';
    params.push(end_date);
  }

  sql += ' GROUP BY date(payment_time) ORDER BY date';

  const revenue = db.prepare(sql).all(...params);

  res.json(revenue);
});

router.get('/daily-registrations', (req, res) => {
  const { event_id, days = 30 } = req.query;

  let sql = `
    SELECT date(created_at) as date, COUNT(*) as count
    FROM registrations
    WHERE status != 'cancelled' AND date(created_at) >= date('now', '-' || ? || ' days')
  `;
  const params = [days];

  if (event_id) {
    sql += ' AND event_id = ?';
    params.push(event_id);
  }

  sql += ' GROUP BY date(created_at) ORDER BY date';

  const stats = db.prepare(sql).all(...params);

  res.json(stats);
});

module.exports = router;
