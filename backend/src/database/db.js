const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'marathon.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      name TEXT,
      gender TEXT,
      id_card TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      registration_start DATETIME NOT NULL,
      registration_end DATETIME NOT NULL,
      status TEXT DEFAULT 'upcoming',
      route_image TEXT,
      rules TEXT,
      requirements TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      distance INTEGER NOT NULL,
      price REAL NOT NULL,
      quota INTEGER NOT NULL,
      registered_count INTEGER DEFAULT 0,
      min_age INTEGER,
      max_age INTEGER,
      description TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      bib_number TEXT UNIQUE,
      status TEXT DEFAULT 'pending',
      health_declaration TEXT DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (category_id) REFERENCES event_categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      registration_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      payment_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (registration_id) REFERENCES registrations(id)
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      email TEXT,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
    CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
    CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  `);

  insertSampleData();
}

function insertSampleData() {
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get();
  if (eventCount.count > 0) return;

  const insertEvent = db.prepare(`
    INSERT INTO events (name, description, location, start_time, end_time, registration_start, registration_end, status, rules, requirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCategory = db.prepare(`
    INSERT INTO event_categories (event_id, name, distance, price, quota, min_age, max_age, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const events = [
    {
      name: '2024城市马拉松',
      description: '一年一度的城市马拉松盛会，欢迎广大跑步爱好者参与',
      location: '城市体育中心',
      start_time: '2024-06-15 07:00:00',
      end_time: '2024-06-15 14:00:00',
      registration_start: '2024-01-01 00:00:00',
      registration_end: '2024-05-31 23:59:59',
      status: 'open',
      rules: '1. 参赛者须年满18周岁\n2. 身体健康，无心脏病等不适宜运动的疾病\n3. 遵守比赛规则，服从裁判指挥',
      requirements: '身份证、健康证明、报名费'
    },
    {
      name: '2024秋季半程马拉松',
      description: '秋季半程马拉松，享受跑步的乐趣',
      location: '滨江公园',
      start_time: '2024-10-20 07:30:00',
      end_time: '2024-10-20 12:00:00',
      registration_start: '2024-07-01 00:00:00',
      registration_end: '2024-10-10 23:59:59',
      status: 'upcoming',
      rules: '1. 参赛者须年满16周岁\n2. 身体健康\n3. 遵守比赛规则',
      requirements: '身份证、报名费'
    }
  ];

  events.forEach(event => {
    const result = insertEvent.run(
      event.name, event.description, event.location,
      event.start_time, event.end_time,
      event.registration_start, event.registration_end,
      event.status, event.rules, event.requirements
    );

    const categories = [
      { name: '全程马拉松', distance: 42195, price: 200, quota: 5000, min_age: 18, max_age: 65, description: '42.195公里全程' },
      { name: '半程马拉松', distance: 21097, price: 150, quota: 8000, min_age: 16, max_age: 70, description: '21.097公里半程' },
      { name: '迷你跑', distance: 5000, price: 80, quota: 10000, min_age: 10, max_age: 75, description: '5公里健康跑' }
    ];

    categories.forEach(cat => {
      insertCategory.run(result.lastInsertRowid, cat.name, cat.distance, cat.price, cat.quota, cat.min_age, cat.max_age, cat.description);
    });
  });

  const insertAdmin = db.prepare(`
    INSERT INTO users (phone, email, password, name, role)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  insertAdmin.run('13800000000', 'admin@marathon.com', hashedPassword, '系统管理员', 'admin');
}

module.exports = {
  db,
  initializeDatabase
};
