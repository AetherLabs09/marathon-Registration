# 马拉松报名系统

基于 Vue3 + Element Plus + Node.js + SQLite 的马拉松报名系统。

## 功能特性

### 用户端
- 用户注册/登录（手机号/邮箱）
- 个人信息管理
- 赛事浏览与查询
- 在线报名（支持年龄校验）
- 订单管理与支付
- 参赛凭证/号码布查看

### 管理端
- 赛事管理（增删改查、上下架）
- 报名名单管理
- 订单管理
- 用户管理
- 数据统计与报表

## 项目结构

```
repo/
├── backend/          # 后端代码
│   ├── src/
│   │   ├── app.js    # 入口文件
│   │   ├── database/ # 数据库
│   │   ├── routes/   # 路由
│   │   └── middleware/
│   └── package.json
├── frontend/         # 前端代码
│   ├── src/
│   │   ├── views/    # 页面
│   │   ├── layouts/  # 布局
│   │   ├── stores/   # 状态管理
│   │   ├── router/   # 路由
│   │   └── utils/    # 工具
│   └── package.json
└── db/               # 数据库文件（运行时生成）
```

## 本地开发

### 环境要求
- Node.js 18+
- npm 或 yarn

### 启动后端
```bash
cd repo/backend
npm install
npm start
```

### 启动前端
```bash
cd repo/frontend
npm install
npm run dev
```

## Docker 部署

### 构建镜像
```bash
docker build -t marathon-registration .
```

### 运行容器
```bash
docker run -d -p 3000:3000 -v marathon-data:/app/db --name marathon marathon-registration
```

### 访问应用
- 前端页面: http://localhost:3000
- API接口: http://localhost:3000/api

## 默认账号

### 管理员账号
- 手机号: 13800000000
- 密码: admin123

## 技术栈

- **前端**: Vue 3, Element Plus, Pinia, Vue Router, Axios
- **后端**: Node.js, Express, better-sqlite3
- **认证**: JWT
- **构建**: Vite
