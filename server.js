require('dotenv').config({ path: './env' });
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const apiRoutes = require('./src/api/routes');

const app = express();
const PORT = process.env.PORT || 34343;

// 基础安全中间件
app.use(helmet());
app.use(cors());

// 请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, 'public')));
// 路由
app.use('/', apiRoutes);

// API路由
app.use('/api', apiRoutes);

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: '未找到资源' });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/api/health`);
    console.log(`前端页面: http://localhost:${PORT}/`);
});

module.exports = app;