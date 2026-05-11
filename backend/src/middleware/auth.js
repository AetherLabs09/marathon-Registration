const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'marathon-secret-key-2024';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的token' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  authMiddleware,
  adminMiddleware,
  generateToken,
  JWT_SECRET
};
