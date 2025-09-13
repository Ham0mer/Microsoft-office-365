const express = require('express');

const config = require('../core/config');
const utils = require('../core/utils');
const microsoftGraph = require('../core/microsoftGraph');
const router = express.Router();

// 邮箱格式验证中间件
const validateEmail = (req, res, next) => {
    const { email } = req.params;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return res.json(utils.response(1, '邮箱格式不正确'));
    }
    next();
};

// Token验证中间件
const validateAdminToken = (req, res, next) => {
    const { token } = req.body;
    
    if (!token) {
        return res.json(utils.response(1, '请提供访问令牌'));
    }
    
    if (token !== process.env.token) {
        return res.json(utils.response(1, '访问令牌无效'));
    }
    next();
};

// 通用Token获取函数
const getGraphToken = async () => {
    const token = await microsoftGraph.getMsToken(
        config.tenant_id,
        config.client_id,
        config.client_secret
    );
    
    if (!token) {
        console.error('获取访问令牌失败');
        return null;
    }
    
    console.log('访问令牌获取成功');
    return token;
};


/**
 * 获取邮箱完整信息（合并账户状态、订阅信息和OneDrive使用情况）
 */
router.get('/account/info/:email', validateEmail, async (req, res) => {
    try {
        const { email } = req.params;
        console.log(`正在查询邮箱完整信息: ${email}`);
        
        const token = await getGraphToken();
        if (!token) {
            return res.json(utils.response(1, '获取访问令牌失败'));
        }
        
        // 并行查询账户状态、订阅信息和OneDrive使用情况
        const [statusResult, subscriptionResult, onedriveResult] = await Promise.all([
            microsoftGraph.accountStatus(email, token),
            microsoftGraph.getUserSubscriptions(email, token),
            microsoftGraph.getOneDriveUsage(email, token)
        ]);
        
        // 如果账户状态查询失败，直接返回错误
        if (!statusResult.success) {
            return res.json(utils.response(1, statusResult.error, {
                enabled: statusResult.enabled,
                subscriptions: []
            }));
        }
        
        // 构建响应数据
        const responseData = {
            enabled: statusResult.enabled,
            userPrincipalName: statusResult.userPrincipalName,
            displayName: statusResult.displayName,
            subscriptions: subscriptionResult.success ? subscriptionResult.subscriptions : [],
            subscriptionCount: subscriptionResult.success ? subscriptionResult.totalCount : 0,
            onedriveUsage: onedriveResult.success ? onedriveResult.usage : null
        };
        
        let message = '获取邮箱信息成功';
        if (!subscriptionResult.success) {
            message += '（订阅信息查询失败）';
        }
        if (!onedriveResult.success) {
            message += '（OneDrive信息查询失败）';
        }
        
        res.json(utils.response(0, message, responseData));
        
    } catch (error) {
        console.error('获取邮箱信息失败:', error.message);
        res.json(utils.response(1, '服务器内部错误'));
    }
});

/**
 * 获取租户订阅SKU信息
 */
router.post('/subscriptions/skus', validateAdminToken, async (req, res) => {
    try {
        console.log('正在查询租户订阅SKU信息');
        
        const token = await getGraphToken();
        if (!token) {
            return res.json(utils.response(1, '获取Microsoft Graph访问令牌失败'));
        }
        
        const result = await microsoftGraph.getSubscribedSkus(token);
        
        if (result.success) {
            res.json(utils.response(0, '获取SKU信息成功', {
                skus: result.skus,
                totalCount: result.totalCount
            }));
        } else {
            res.json(utils.response(1, result.error, {
                skus: result.skus
            }));
        }
        
    } catch (error) {
        console.error('获取SKU信息失败:', error.message);
        res.json(utils.response(1, '服务器内部错误'));
    }
});

/**
 * 获取租户下所有用户的OneDrive使用情况
 */
router.post('/onedrive/all', validateAdminToken, async (req, res) => {
    try {
        console.log('正在查询租户下所有用户的OneDrive使用情况');
        
        const token = await getGraphToken();
        if (!token) {
            return res.json(utils.response(1, '获取Microsoft Graph访问令牌失败'));
        }
        
        const result = await microsoftGraph.getAllUsersOneDriveUsage(token);
        
        if (result.success) {
            res.json(utils.response(0, '获取所有用户OneDrive使用情况成功', {
                summary: result.summary,
                users: result.users
            }));
        } else {
            res.json(utils.response(1, result.error, {
                summary: result.summary,
                users: result.users
            }));
        }
        
    } catch (error) {
        console.error('获取所有用户OneDrive使用情况失败:', error.message);
        res.json(utils.response(1, '服务器内部错误'));
    }
});

/**
 * 健康检查
 */
router.get('/health', (req, res) => {
    const startTime = Date.now();
    
    // 计算运行时间
    const uptime = process.uptime();
    const uptimeFormatted = formatUptime(uptime);
    
    // 获取内存使用情况
    const memoryUsage = process.memoryUsage();
    const memoryUsageFormatted = {
        rss: formatBytes(memoryUsage.rss),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        external: formatBytes(memoryUsage.external)
    };
    
    const responseTime = Date.now() - startTime;
    
    res.json(utils.response(0, '服务运行正常', { 
        timestamp: new Date().toISOString(),
        uptime: uptimeFormatted,
        uptimeSeconds: Math.floor(uptime),
        responseTime: `${responseTime}ms`,
        port: process.env.PORT || 34343,
        environment: process.env.NODE_ENV || 'development',
        version: '1.1.1',
        memory: memoryUsageFormatted,
        nodeVersion: process.version,
        platform: process.platform
    }));
});

// 格式化运行时间
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) {
        return `${days}天 ${hours}小时 ${minutes}分钟`;
    } else if (hours > 0) {
        return `${hours}小时 ${minutes}分钟`;
    } else if (minutes > 0) {
        return `${minutes}分钟 ${secs}秒`;
    } else {
        return `${secs}秒`;
    }
}

// 格式化字节数（从microsoftGraph模块导入）
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = router;
