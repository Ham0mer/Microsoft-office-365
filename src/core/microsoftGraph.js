const axios = require('axios');

/**
 * 获取Microsoft Graph访问令牌
 * @param {string} tenantId - 租户ID
 * @param {string} clientId - 客户端ID
 * @param {string} clientSecret - 客户端密钥
 * @returns {Promise<string|null>} 访问令牌
 */
async function getMsToken(tenantId, clientId, clientSecret) {
    try {
        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('scope', 'https://graph.microsoft.com/.default');
        params.append('grant_type', 'client_credentials');
        
        const response = await axios.post(tokenUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        return response.data.access_token;
    } catch (error) {
        console.error('获取访问令牌失败:', error.message);
        return null;
    }
}

/**
 * 查询用户账户状态
 * @param {string} email - 邮箱地址
 * @param {string} token - 访问令牌
 * @returns {Promise<object>} 查询结果
 */
async function accountStatus(email, token) {
    try {
        const userUrl = `https://graph.microsoft.com/v1.0/users/${email}?$select=id,userPrincipalName,displayName,accountEnabled`;
        
        const response = await axios.get(userUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        
        return {
            success: true,
            enabled: response.data.accountEnabled,
            userPrincipalName: response.data.userPrincipalName,
            displayName: response.data.displayName
        };
    } catch (error) {
        console.error('查询用户状态失败:', error.message);
        
        if (error.response) {
            const status = error.response.status;
            if (status === 404) {
                return {
                    success: false,
                    enabled: false,
                    error: '用户不存在'
                };
            } else if (status === 403) {
                return {
                    success: false,
                    enabled: false,
                    error: '权限不足，无法查询该用户'
                };
            } else if (status === 401) {
                return {
                    success: false,
                    enabled: false,
                    error: '访问令牌无效或已过期'
                };
            }
        }
        
        return {
            success: false,
            enabled: false,
            error: '查询用户状态失败'
        };
    }
}

/**
 * 获取用户订阅信息
 * @param {string} email - 邮箱地址
 * @param {string} token - 访问令牌
 * @returns {Promise<object>} 查询结果
 */
async function getUserSubscriptions(email, token) {
    try {
        const subscriptionsUrl = `https://graph.microsoft.com/v1.0/users/${email}/licenseDetails`;
        
        const response = await axios.get(subscriptionsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const subscriptions = response.data.value.map(license => ({
            skuId: license.skuId,
            skuPartNumber: license.skuPartNumber,
            servicePlans: license.servicePlans.map(plan => ({
                servicePlanId: plan.servicePlanId,
                servicePlanName: plan.servicePlanName,
                provisioningStatus: plan.provisioningStatus
            }))
        }));
        
        return {
            success: true,
            subscriptions,
            totalCount: subscriptions.length
        };
    } catch (error) {
        console.error('获取用户订阅信息失败:', error.message);
        
        if (error.response) {
            const status = error.response.status;
            if (status === 404) {
                return {
                    success: false,
                    subscriptions: [],
                    error: '用户不存在'
                };
            } else if (status === 403) {
                return {
                    success: false,
                    subscriptions: [],
                    error: '权限不足，无法查询该用户的订阅信息'
                };
            }
        }
        
        return {
            success: false,
            subscriptions: [],
            error: '获取订阅信息失败'
        };
    }
}

/**
 * 获取租户订阅SKU信息
 * @param {string} token - 访问令牌
 * @returns {Promise<object>} 查询结果
 */
async function getSubscribedSkus(token) {
    try {
        const skusUrl = 'https://graph.microsoft.com/v1.0/subscribedSkus';
        
        const response = await axios.get(skusUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const skus = response.data.value.map(sku => ({
            skuId: sku.skuId,
            skuPartNumber: sku.skuPartNumber,
            capabilityStatus: sku.capabilityStatus,
            consumedUnits: sku.consumedUnits,
            prepaidUnits: {
                enabled: sku.prepaidUnits.enabled,
                suspended: sku.prepaidUnits.suspended,
                warning: sku.prepaidUnits.warning
            }
        }));
        
        return {
            success: true,
            skus,
            totalCount: skus.length
        };
    } catch (error) {
        console.error('获取租户SKU信息失败:', error.message);
        
        return {
            success: false,
            skus: [],
            error: '获取SKU信息失败'
        };
    }
}

/**
 * 获取用户OneDrive存储使用情况
 * @param {string} email - 邮箱地址
 * @param {string} token - 访问令牌
 * @returns {Promise<object>} 查询结果
 */
async function getOneDriveUsage(email, token) {
    try {
        // 直接获取用户的OneDrive信息，包含quota数据
        const driveUrl = `https://graph.microsoft.com/v1.0/users/${email}/drive`;
        
        const response = await axios.get(driveUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const drive = response.data;
        const quota = drive.quota;
        
        // 计算已使用空间（总容量 - 剩余空间）
        const used = quota.total - quota.remaining;
        
        // 计算使用百分比
        const usedPercentage = quota.total > 0 ? (used / quota.total * 100).toFixed(2) : 0;
        
        return {
            success: true,
            usage: {
                used: used,
                total: quota.total,
                remaining: quota.remaining,
                deleted: quota.deleted || 0,
                state: quota.state || 'unknown',
                usedPercentage: parseFloat(usedPercentage),
                usedFormatted: formatBytes(used),
                totalFormatted: formatBytes(quota.total),
                remainingFormatted: formatBytes(quota.remaining),
                deletedFormatted: formatBytes(quota.deleted || 0)
            }
        };
    } catch (error) {
        console.error('获取OneDrive使用情况失败:', error.message);
        
        if (error.response) {
            const status = error.response.status;
            if (status === 404) {
                return {
                    success: false,
                    usage: null,
                    error: '用户OneDrive不存在或无法访问'
                };
            } else if (status === 403) {
                return {
                    success: false,
                    usage: null,
                    error: '权限不足，无法查询OneDrive使用情况'
                };
            }
        }
        
        return {
            success: false,
            usage: null,
            error: '获取OneDrive使用情况失败'
        };
    }
}

/**
 * 格式化字节数为可读格式
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字符串
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取租户下所有用户的OneDrive使用情况
 * @param {string} token - 访问令牌
 * @returns {Promise<object>} 查询结果
 */
async function getAllUsersOneDriveUsage(token) {
    try {
        // 首先获取租户下的所有用户
        const usersUrl = 'https://graph.microsoft.com/v1.0/users?$select=id,userPrincipalName,displayName,accountEnabled&$top=999';
        
        const usersResponse = await axios.get(usersUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const users = usersResponse.data.value;
        console.log(`找到 ${users.length} 个用户，开始查询OneDrive使用情况...`);
        
        // 并行查询所有用户的OneDrive使用情况
        const onedrivePromises = users.map(async (user) => {
            try {
                const driveUrl = `https://graph.microsoft.com/v1.0/users/${user.id}/drive`;
                
                const driveResponse = await axios.get(driveUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const drive = driveResponse.data;
                const quota = drive.quota;
                
                // 计算已使用空间
                const used = quota.total - quota.remaining;
                const usedPercentage = quota.total > 0 ? (used / quota.total * 100).toFixed(2) : 0;
                
                return {
                    success: true,
                    user: {
                        id: user.id,
                        userPrincipalName: user.userPrincipalName,
                        displayName: user.displayName,
                        accountEnabled: user.accountEnabled
                    },
                    usage: {
                        used: used,
                        total: quota.total,
                        remaining: quota.remaining,
                        deleted: quota.deleted || 0,
                        state: quota.state || 'unknown',
                        usedPercentage: parseFloat(usedPercentage),
                        usedFormatted: formatBytes(used),
                        totalFormatted: formatBytes(quota.total),
                        remainingFormatted: formatBytes(quota.remaining),
                        deletedFormatted: formatBytes(quota.deleted || 0)
                    }
                };
            } catch (error) {
                console.log(`用户 ${user.userPrincipalName} OneDrive查询失败: ${error.message}`);
                return {
                    success: false,
                    user: {
                        id: user.id,
                        userPrincipalName: user.userPrincipalName,
                        displayName: user.displayName,
                        accountEnabled: user.accountEnabled
                    },
                    usage: null,
                    error: error.response?.status === 404 ? 'OneDrive不存在' : 
                           error.response?.status === 403 ? '权限不足' : '查询失败'
                };
            }
        });
        
        // 等待所有查询完成
        const results = await Promise.all(onedrivePromises);
        
        // 统计信息
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const totalUsed = successful.reduce((sum, r) => sum + r.usage.used, 0);
        const totalCapacity = successful.reduce((sum, r) => sum + r.usage.total, 0);
        const totalRemaining = successful.reduce((sum, r) => sum + r.usage.remaining, 0);
        const totalDeleted = successful.reduce((sum, r) => sum + r.usage.deleted, 0);
        
        return {
            success: true,
            summary: {
                totalUsers: users.length,
                successfulQueries: successful.length,
                failedQueries: failed.length,
                totalUsed: totalUsed,
                totalCapacity: totalCapacity,
                totalRemaining: totalRemaining,
                totalDeleted: totalDeleted,
                totalUsedFormatted: formatBytes(totalUsed),
                totalCapacityFormatted: formatBytes(totalCapacity),
                totalRemainingFormatted: formatBytes(totalRemaining),
                totalDeletedFormatted: formatBytes(totalDeleted),
                averageUsagePercentage: successful.length > 0 ? 
                    (successful.reduce((sum, r) => sum + r.usage.usedPercentage, 0) / successful.length).toFixed(2) : 0
            },
            users: results
        };
        
    } catch (error) {
        console.error('获取所有用户OneDrive使用情况失败:', error.message);
        
        return {
            success: false,
            summary: null,
            users: [],
            error: '获取用户列表失败'
        };
    }
}

module.exports = {
    getMsToken,
    accountStatus,
    getUserSubscriptions,
    getSubscribedSkus,
    getOneDriveUsage,
    getAllUsersOneDriveUsage,
};