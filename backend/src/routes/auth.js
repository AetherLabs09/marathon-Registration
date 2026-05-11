const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../database/db');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

function generateCode() {
  return Math.random().toString().slice(2, 8);
}

router.post('/register', (req, res) => {
  const { phone, email, password, code } = req.body;

  if (!password || (!phone && !email)) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  if (phone) {
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) {
      return res.status(400).json({ error: '该手机号已注册' });
    }
  }

  if (email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: '该邮箱已注册' });
    }
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  try {
    const result = db.prepare(
      'INSERT INTO users (phone, email, password) VALUES (?, ?, ?)'
    ).run(phone || null, email || null, hashedPassword);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user);

    res.json({ 
      message: '注册成功', 
      token,
      user: { id: user.id, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: '注册失败', message: error.message });
  }
});

router.post('/login', (req, res) => {
  const { account, password } = req.body;

  if (!account || !password) {
    return res.status(400).json({ error: '请填写账号和密码' });
  }

  const user = db.prepare(
    'SELECT * FROM users WHERE phone = ? OR email = ?'
  ).get(account, account);

  if (!user) {
    return res.status(400).json({ error: '账号不存在' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(400).json({ error: '密码错误' });
  }

  const token = generateToken(user);
  res.json({
    message: '登录成功',
    token,
    user: { id: user.id, phone: user.phone, email: user.email, name: user.name, role: user.role }
  });
});

router.post('/send-code', (req, res) => {
  const { phone, email, type } = req.body;

  if (!phone && !email) {
    return res.status(400).json({ error: '请提供手机号或邮箱' });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO verification_codes (phone, email, code, type, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(phone || null, email || null, code, type || 'register', expiresAt);

  console.log(`验证码已发送到 ${phone || email}: ${code}`);

  res.json({ message: '验证码已发送', code: process.env.NODE_ENV === 'development' ? code : undefined });
});

router.post('/verify-code', (req, res) => {
  const { phone, email, code } = req.body;

  const record = db.prepare(
    'SELECT * FROM verification_codes WHERE (phone = ? OR email = ?) AND code = ? AND used = 0 AND expires_at > ?'
  ).get(phone || null, email || null, code, new Date().toISOString());

  if (!record) {
    return res.status(400).json({ error: '验证码无效或已过期' });
  }

  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(record.id);

  res.json({ message: '验证成功' });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, phone, email, name, gender, id_card, emergency_contact, emergency_phone, role, created_at FROM users WHERE id = ?').get(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json(user);
});

module.exports = router;
