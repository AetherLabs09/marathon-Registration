const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const eventRoutes = require('./routes/event');
const registrationRoutes = require('./routes/registration');
const orderRoutes = require('./routes/order');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

db.initializeDatabase();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
