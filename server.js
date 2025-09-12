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
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'nonce-lucide-init'",
                "https://cdn.tailwindcss.com",
                "https://unpkg.com",
                "https://cdnjs.cloudflare.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加额外的安全头
app.use((req, res, next) => {
    // 设置 Origin-Agent-Cluster 头
    res.setHeader('Origin-Agent-Cluster', '?1');
    
    // 设置其他安全头
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 主页面路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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