// Microsoft 365 邮箱订阅查询前端交互脚本

document.addEventListener('DOMContentLoaded', function() {
    // 初始化图标
            lucide.createIcons();

    // 显示加载提示
    function showLoading() {
        const loadingToast = document.createElement('div');
        loadingToast.className = 'toast toast-end';
        loadingToast.innerHTML = `
            <div class="alert alert-info">
                <i data-lucide="loader-2" class="h-6 w-6 animate-spin"></i>
                <span>正在查询中，请稍候...</span>
            </div>
        `;
        document.body.appendChild(loadingToast);
        lucide.createIcons();
        return loadingToast;
    }

    // 隐藏加载提示
    function hideLoading(loadingToast) {
        if (loadingToast) {
            loadingToast.remove();
        }
    }

    // 显示结果
    function showResult(containerId, content, isError = false) {
        const container = document.getElementById(containerId);
        container.innerHTML = content;
        container.classList.remove('hidden');
        
        // 添加动画效果
        gsap.from(container, { opacity: 0, y: 20, duration: 0.3 });
    }

    // 通用错误处理函数
    function handleError(containerId, error, loadingToast) {
        hideLoading(loadingToast);
        showResult(containerId, `
            <div class="alert alert-error">
                <i data-lucide="alert-circle" class="h-6 w-6"></i>
                <div>
                    <div class="font-bold">网络错误</div>
                    <div class="text-sm">${error.message}</div>
                </div>
            </div>
        `, true);
        lucide.createIcons();
    }

    // 通用Token验证函数
    function validateToken(token) {
        if (!token) {
            return {
                valid: false,
                message: `
                    <div class="alert alert-error">
                        <i data-lucide="alert-circle" class="h-6 w-6"></i>
                        <div>
                            <div class="font-bold">请输入Token</div>
                            <div class="text-sm">请先输入管理员访问令牌</div>
                        </div>
                    </div>
                `
            };
        }
        return { valid: true };
    }

    // 显示提示消息
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-center';
        toast.innerHTML = `
            <div class="alert alert-info">
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);

        gsap.fromTo(toast, 
            { opacity: 0, y: -20 }, 
            { opacity: 1, y: 0, duration: 0.3 }
        );

        setTimeout(() => {
            gsap.to(toast, { 
                opacity: 0, 
                y: -20, 
                duration: 0.3,
                onComplete: () => toast.remove()
            });
        }, 3000);
    }

    // 获取服务计划的具体名称
    function getServicePlanDisplayName(servicePlanName) {
        // 从 core.json 中获取服务计划的中文名称
        const servicePlanNames = {
            "O365_BUSINESS_ESSENTIALS": "Microsoft 365 商业基础版（包含邮箱、Teams、SharePoint 等核心云服务）",
            "INSIGHTS_BY_MYANALYTICS": "MyAnalytics Insights（个人工作模式洞察）",
            "MICROSOFT_MYANALYTICS_FULL": "MyAnalytics 完整版",
            "PEOPLE_SKILLS_FOUNDATION": "Viva Skills（技能管理基础功能）",
            "PLACES_CORE": "Microsoft Places 核心功能（混合办公与空间管理：工位/会议室预订、到岗计划、空间利用分析）",
            "GRAPH_CONNECTORS_SEARCH_INDEX": "Microsoft Graph 连接器搜索索引（将外部数据源接入 Microsoft Search）",
            "Bing_Chat_Enterprise": "企业版必应聊天（带数据保护的 Copilot 聊天）",
            "MESH_IMMERSIVE_FOR_TEAMS": "Microsoft Mesh 沉浸式会议（Teams 中的 3D/VR 协作）",
            "MESH_AVATARS_ADDITIONAL_FOR_TEAMS": "Teams Mesh 额外头像功能",
            "MESH_AVATARS_FOR_TEAMS": "Teams Mesh 头像功能",
            "M365_LIGHTHOUSE_CUSTOMER_PLAN1": "Microsoft 365 Lighthouse（面向 MSP 的多租户管理）",
            "VIVAENGAGE_CORE": "Viva Engage 核心功能（企业社交平台，前身 Yammer）",
            "MICROSOFTBOOKINGS": "Microsoft Bookings（预约与排班工具）",
            "RMS_S_BASIC": "Azure Rights Management 基础版（信息保护）",
            "VIVA_LEARNING_SEEDED": "Viva Learning（学习平台基础功能）",
            "Nucleus": "Microsoft Loop 核心组件（协作内容块）",
            "POWER_VIRTUAL_AGENTS_O365_P1": "Power Virtual Agents（聊天机器人）",
            "CDS_O365_P1": "Dataverse（原 Common Data Service）",
            "PROJECT_O365_P1": "Project for Office 365（项目管理）",
            "DYN365_CDS_O365_P1": "Dynamics 365 与 Dataverse 集成",
            "MICROSOFT_SEARCH": "Microsoft Search（统一搜索）",
            "WHITEBOARD_PLAN1": "Microsoft Whiteboard（白板协作）",
            "MYANALYTICS_P2": "MyAnalytics 高级版",
            "KAIZALA_O365_P2": "Microsoft Kaizala（移动群组通讯，已并入 Teams）",
            "STREAM_O365_SMB": "Microsoft Stream（视频服务）",
            "OFFICEMOBILE_SUBSCRIPTION": "Office Mobile（移动版 Office 应用订阅）",
            "BPOS_S_TODO_1": "Microsoft To Do（任务管理）",
            "FORMS_PLAN_E1": "Microsoft Forms（表单与问卷）",
            "FLOW_O365_P1": "Power Automate（流程自动化）",
            "POWERAPPS_O365_P1": "Power Apps（低代码应用开发）",
            "TEAMS1": "Microsoft Teams",
            "PROJECTWORKMANAGEMENT": "Planner（项目/任务管理）",
            "SWAY": "Microsoft Sway（在线演示文稿）",
            "INTUNE_O365": "Microsoft Intune（设备与应用管理）",
            "SHAREPOINTWAC": "Office for the Web（网页版 Word/Excel/PowerPoint）",
            "YAMMER_ENTERPRISE": "Yammer 企业版（现 Viva Engage）",
            "EXCHANGE_S_STANDARD": "Exchange Online（企业邮箱）",
            "MCOSTANDARD": "Microsoft Teams（核心通话/会议功能）",
            "SHAREPOINTSTANDARD": "SharePoint Online（团队站点与文档管理）"
        };
        
        return servicePlanNames[servicePlanName] || servicePlanName;
    }

    // 邮箱信息查询（使用合并接口）
    document.getElementById('emailForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.querySelector('#emailForm input[name="email"]').value;
        
        const loadingToast = showLoading();
        
        try {
            // 使用合并接口一次性获取所有信息
            const response = await fetch(`/api/account/info/${email}`);
            const data = await response.json();
            
            hideLoading(loadingToast);
            
            let content = '';
            if (data.code === 0) {
                const statusClass = data.data.enabled ? 'badge-success' : 'badge-error';
                const statusText = data.data.enabled ? '已启用' : '已禁用';
                const statusIcon = data.data.enabled ? 'check-circle' : 'x-circle';
                
                content = `
                    <div class="card bg-base-100 shadow-md">
                        <div class="card-body p-4 sm:p-6">
                            <h2 class="card-title text-primary flex items-center gap-2 text-lg sm:text-xl">
                                <i data-lucide="check-circle" class="h-5 w-5 sm:h-6 sm:w-6"></i>
                                <span class="break-words">${data.msg}</span>
                            </h2>
                            
                            <!-- 账户基本信息 -->
                            <div class="space-y-4 mt-4">
                                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-bold text-base sm:text-lg break-words">${data.data.userPrincipalName || email}</h3>
                                        <p class="text-sm opacity-70 break-words">${data.data.displayName || '无显示名称'}</p>
                                    </div>
                                    <div class="flex-shrink-0">
                                        <div class="badge ${statusClass} gap-2 text-xs sm:text-sm">
                                            <i data-lucide="${statusIcon}" class="h-3 w-3 sm:h-4 sm:w-4"></i>
                                            ${statusText}
                                        </div>
                                    </div>
                                </div>
                            </div>
                `;
                
                // OneDrive使用情况部分
                if (data.data.onedriveUsage) {
                    const usage = data.data.onedriveUsage;
                    const progressWidth = Math.min(usage.usedPercentage, 100);
                    const progressColor = usage.usedPercentage > 80 ? 'bg-error' : usage.usedPercentage > 60 ? 'bg-warning' : 'bg-success';
                    const stateColor = usage.state === 'normal' ? 'text-success' : usage.state === 'approachingLimit' ? 'text-warning' : 'text-error';
                    const stateText = usage.state === 'normal' ? '正常' : usage.state === 'approachingLimit' ? '接近限制' : '超出限制';
                    
                    content += `
                        <div class="divider">OneDrive存储</div>
                        <div class="space-y-3">
                            <div class="card bg-base-200">
                                <div class="card-body">
                                    <h4 class="font-bold flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="hard-drive" class="h-5 w-5"></i>
                                            OneDrive存储使用情况
                                        </div>
                                        <span class="text-sm font-normal ${stateColor}">${stateText}</span>
                                    </h4>
                                    <div class="space-y-3 mt-3">
                                        <div class="flex justify-between text-sm">
                                            <span>已使用: ${usage.usedFormatted}</span>
                                            <span>总容量: ${usage.totalFormatted}</span>
                                        </div>
                                        <progress class="progress progress-secondary w-full" value="${progressWidth}" max="100"></progress>
                                        <div class="flex justify-between text-xs text-base-content/70">
                                            <span>使用率: ${usage.usedPercentage}%</span>
                                            <span>剩余: ${usage.remainingFormatted}</span>
                                        </div>
                                        <div class="flex justify-end text-xs">
                                            <span>回收站: ${usage.deletedFormatted}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                // 订阅信息部分
                if (data.data.subscriptions && data.data.subscriptions.length > 0) {
                    content += `
                        <div class="divider">订阅信息</div>
                        <div class="space-y-3">
                            <div class="text-sm text-base-content/70">
                                找到 ${data.data.subscriptionCount} 个订阅
                            </div>
                    `;
                    
                    data.data.subscriptions.forEach((subscription, index) => {
                        content += `
                            <div class="card bg-base-200">
                                <div class="card-body">
                                    <h4 class="font-bold">订阅 ${index + 1}</h4>
                                    <div class="space-y-2 text-sm">
                                        <div class="break-all">
                                            <strong>SKU ID:</strong> 
                                            <span class="font-mono text-xs bg-base-100 px-2 py-1 rounded">${subscription.skuId}</span>
                                        </div>
                                        <div class="break-all">
                                            <strong>部件号:</strong> 
                                            <span class="font-mono text-xs bg-base-100 px-2 py-1 rounded">${getServicePlanDisplayName(subscription.skuPartNumber)}</span>
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        <strong>服务计划:</strong>
                                        <div class="mt-1 space-y-1">
                        `;
                        
                        subscription.servicePlans.forEach(plan => {
                            const statusClass = plan.provisioningStatus === 'Success' ? 'badge-success' : 'badge-error';
                            const displayName = getServicePlanDisplayName(plan.servicePlanName);
                            content += `
                                <div class="bg-base-100 p-2 rounded service-plan-item">
                                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div class="flex-1 min-w-0">
                                            <div class="text-sm break-words leading-relaxed">
                                                <div class="font-medium">${displayName}</div>
                                                <div class="text-xs text-base-content/60 mt-1">${plan.servicePlanName}</div>
                                            </div>
                                        </div>
                                        <div class="flex-shrink-0">
                                            <div class="badge ${statusClass} text-xs">${plan.provisioningStatus}</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        content += `
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    content += '</div>';
                } else {
                    content += `
                        <div class="divider">订阅信息</div>
                        <div class="alert alert-info">
                            <i data-lucide="info" class="h-5 w-5"></i>
                            <span>该用户暂无订阅信息</span>
                        </div>
                    `;
                }
                
                content += '</div></div>';
            } else {
                content = `
                    <div class="alert alert-error">
                        <i data-lucide="alert-circle" class="h-6 w-6"></i>
                        <div>
                            <div class="font-bold">查询失败</div>
                            <div class="text-sm">${data.msg}</div>
                        </div>
                    </div>
                `;
            }
            
            showResult('emailResult', content);
            lucide.createIcons();
            
        } catch (error) {
            hideLoading(loadingToast);
            showResult('emailResult', `
                <div class="alert alert-error">
                    <i data-lucide="alert-circle" class="h-6 w-6"></i>
                    <div>
                        <div class="font-bold">网络错误</div>
                        <div class="text-sm">${error.message}</div>
                    </div>
                </div>
            `, true);
            lucide.createIcons();
        }
    });

    // 租户SKU查询
    document.getElementById('skuForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = document.getElementById('adminToken').value.trim();
        const validation = validateToken(token);
        if (!validation.valid) {
            showResult('skuResult', validation.message, true);
            lucide.createIcons();
            return;
        }
        
        const loadingToast = showLoading();
        
        try {
            const response = await fetch('/api/subscriptions/skus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: token })
            });
            const data = await response.json();
            
            hideLoading(loadingToast);
            
            let content = '';
            if (data.code === 0) {
                content = `
                    <div class="card bg-base-100 shadow-md">
                        <div class="card-body">
                            <h2 class="card-title text-primary flex items-center gap-2">
                                <i data-lucide="check-circle" class="h-6 w-6"></i>
                                查询成功 - 找到 ${data.data.totalCount} 个SKU
                            </h2>
                            <div class="space-y-3 mt-4">
                `;
                
                data.data.skus.forEach((sku, index) => {
                    const statusClass = sku.capabilityStatus === 'Enabled' ? 'badge-success' : 'badge-error';
                    content += `
                        <div class="card bg-base-200">
                            <div class="card-body">
                                <div class="flex items-center justify-between mb-2">
                                    <h4 class="font-bold">SKU ${index + 1}</h4>
                                    <div class="badge ${statusClass}">${sku.capabilityStatus}</div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div><strong>SKU ID:</strong> ${sku.skuId}</div>
                                    <div><strong>部件号:</strong> ${sku.skuPartNumber}</div>
                                    <div><strong>已消费:</strong> ${sku.consumedUnits}</div>
                                    <div><strong>可用:</strong> ${sku.prepaidUnits.enabled}</div>
                                </div>
                                <div class="mt-2">
                                    <div class="flex justify-between text-xs">
                                        <span>启用: ${sku.prepaidUnits.enabled}</span>
                                        <span>暂停: ${sku.prepaidUnits.suspended}</span>
                                        <span>警告: ${sku.prepaidUnits.warning}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                content += '</div></div></div>';
            } else {
                content = `
                    <div class="alert alert-error">
                        <i data-lucide="alert-circle" class="h-6 w-6"></i>
                        <div>
                            <div class="font-bold">查询失败</div>
                            <div class="text-sm">${data.msg}</div>
                        </div>
                    </div>
                `;
            }
            
            showResult('skuResult', content);
            lucide.createIcons();
            
        } catch (error) {
            handleError('skuResult', error, loadingToast);
        }
    });

    // 全局OneDrive查询
    document.getElementById('globalOnedriveForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = document.getElementById('adminToken').value.trim();
        const validation = validateToken(token);
        if (!validation.valid) {
            showResult('globalOnedriveResult', validation.message, true);
            lucide.createIcons();
            return;
        }
        
        const loadingToast = showLoading();
        
        try {
            const response = await fetch('/api/onedrive/all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: token })
            });
            const data = await response.json();
            
            hideLoading(loadingToast);
            
            let content = '';
            if (data.code === 0) {
                const summary = data.data.summary;
                const users = data.data.users;
                
                content = `
                    <div class="card bg-base-100 shadow-md">
                        <div class="card-body">
                            <h2 class="card-title text-primary flex items-center gap-2">
                                <i data-lucide="check-circle" class="h-6 w-6"></i>
                                ${data.msg}
                            </h2>
                            
                            <!-- 统计概览 -->
                            <div class="divider">统计概览</div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div class="stat bg-base-200 rounded-lg">
                                    <div class="stat-title">总用户数</div>
                                    <div class="stat-value text-primary">${summary.totalUsers}</div>
                                </div>
                                <div class="stat bg-base-200 rounded-lg">
                                    <div class="stat-title">成功查询</div>
                                    <div class="stat-value text-success">${summary.successfulQueries}</div>
                                </div>
                                <div class="stat bg-base-200 rounded-lg">
                                    <div class="stat-title">查询失败</div>
                                    <div class="stat-value text-error">${summary.failedQueries}</div>
                                </div>
                                <div class="stat bg-base-200 rounded-lg">
                                    <div class="stat-title">平均使用率</div>
                                    <div class="stat-value text-warning text-lg">${summary.averageUsagePercentage}%</div>
                                </div>
                            </div>
                            
                            <!-- 总体存储使用情况 -->
                            <div class="divider">总体存储使用情况</div>
                            <div class="card bg-base-200 mb-4">
                                <div class="card-body">
                                    <div class="flex justify-between text-sm mb-2">
                                        <span>总已使用: ${summary.totalUsedFormatted}</span>
                                        <span>总容量: ${summary.totalCapacityFormatted}</span>
                                    </div>
                                    <progress class="progress progress-warning w-full h-3 mb-2" value="${(summary.totalUsed / summary.totalCapacity * 100).toFixed(2)}" max="100"></progress>
                                    <div class="flex justify-between text-xs text-base-content/70">
                                        <span>总剩余: ${summary.totalRemainingFormatted}</span>
                                        <span>总回收站: ${summary.totalDeletedFormatted}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 用户列表 -->
                            <div class="divider">用户详情</div>
                            <div class="space-y-2 max-h-96 overflow-y-auto">
                `;
                
                users.forEach((userData, index) => {
                    if (userData.success && userData.usage) {
                        const usage = userData.usage;
                        const progressWidth = Math.min(usage.usedPercentage, 100);
                        const progressColor = usage.usedPercentage > 80 ? 'bg-error' : usage.usedPercentage > 60 ? 'bg-warning' : 'bg-success';
                        const stateColor = usage.state === 'normal' ? 'text-success' : usage.state === 'approachingLimit' ? 'text-warning' : 'text-error';
                        const stateText = usage.state === 'normal' ? '正常' : usage.state === 'approachingLimit' ? '接近限制' : '超出限制';
                        
                        content += `
                            <div class="card bg-base-100 border border-base-300">
                                <div class="card-body p-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <div class="avatar placeholder">
                                                <div class="bg-neutral text-neutral-content rounded-full w-8">
                                                    <span class="text-xs">${userData.user.displayName ? userData.user.displayName.charAt(0).toUpperCase() : 'U'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="font-medium">${userData.user.displayName || '无显示名称'}</div>
                                                <div class="text-xs text-base-content/70">${userData.user.userPrincipalName}</div>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-sm font-medium ${stateColor}">${stateText}</div>
                                            <div class="text-xs text-base-content/70">${usage.usedPercentage}%</div>
                                        </div>
                                    </div>
                                    <div class="flex justify-between text-xs mb-2">
                                        <span>已使用: ${usage.usedFormatted}</span>
                                        <span>总容量: ${usage.totalFormatted}</span>
                                    </div>
                                    <progress class="progress progress-accent w-full h-1.5" value="${progressWidth}" max="100"></progress>
                                    <div class="flex justify-between text-xs text-base-content/60 mt-1">
                                        <span>剩余: ${usage.remainingFormatted}</span>
                                        <span>回收站: ${usage.deletedFormatted}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        content += `
                            <div class="card bg-base-100 border border-base-300">
                                <div class="card-body p-4">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <div class="avatar placeholder">
                                                <div class="bg-neutral text-neutral-content rounded-full w-8">
                                                    <span class="text-xs">${userData.user.displayName ? userData.user.displayName.charAt(0).toUpperCase() : 'U'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="font-medium">${userData.user.displayName || '无显示名称'}</div>
                                                <div class="text-xs text-base-content/70">${userData.user.userPrincipalName}</div>
                                            </div>
                                        </div>
                                        <div class="text-error text-sm">
                                            <i data-lucide="x-circle" class="h-4 w-4 inline mr-1"></i>
                                            ${userData.error || '查询失败'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                });
                
                content += '</div></div></div>';
            } else {
                content = `
                    <div class="alert alert-error">
                        <i data-lucide="alert-circle" class="h-6 w-6"></i>
                        <div>
                            <div class="font-bold">查询失败</div>
                            <div class="text-sm">${data.msg}</div>
                        </div>
                    </div>
                `;
            }
            
            showResult('globalOnedriveResult', content);
            lucide.createIcons();
            
        } catch (error) {
            handleError('globalOnedriveResult', error, loadingToast);
        }
    });

    // 服务状态弹窗功能
    const serviceStatusBtn = document.getElementById('serviceStatusBtn');
    const serviceStatusModal = document.getElementById('serviceStatusModal');
    const closeServiceStatusModal = document.getElementById('closeServiceStatusModal');
    const serviceStatusContent = document.getElementById('serviceStatusContent');

    // 打开服务状态弹窗
    serviceStatusBtn.addEventListener('click', async () => {
        serviceStatusModal.classList.add('modal-open');
        
        // 重置内容为加载状态
        serviceStatusContent.innerHTML = `
            <div class="flex items-center justify-center">
                <span class="loading loading-spinner loading-md"></span>
                <span class="ml-2">正在检查服务状态...</span>
            </div>
        `;
        
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (data.code === 0) {
                serviceStatusContent.innerHTML = `
                    <div class="space-y-4">
                        <div class="alert alert-success">
                            <i data-lucide="check-circle" class="h-6 w-6"></i>
                            <div>
                                <div class="font-bold">服务运行正常</div>
                                <div class="text-sm">${data.msg}</div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="stat bg-base-200 rounded-lg">
                                <div class="stat-title">服务状态</div>
                                <div class="stat-value text-success text-lg">在线</div>
                                <div class="stat-desc">运行时间: ${data.data.uptime || '未知'}</div>
                            </div>
                            
                            <div class="stat bg-base-200 rounded-lg">
                                <div class="stat-title">响应时间</div>
                                <div class="stat-value text-info text-lg">${data.data.responseTime || '< 100ms'}</div>
                                <div class="stat-desc">API响应正常</div>
                            </div>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="stat bg-base-200 rounded-lg">
                                <div class="stat-title">内存使用</div>
                                <div class="stat-value text-warning text-lg">${data.data.memory?.heapUsed || '未知'}</div>
                                <div class="stat-desc">总内存: ${data.data.memory?.heapTotal || '未知'}</div>
                            </div>
                            
                            <div class="stat bg-base-200 rounded-lg">
                                <div class="stat-title">Node版本</div>
                                <div class="stat-value text-info text-lg">${data.data.nodeVersion || '未知'}</div>
                                <div class="stat-desc">平台: ${data.data.platform || '未知'}</div>
                            </div>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <div class="text-sm text-base-content/70">
                            <div class="flex items-center gap-2 mb-2">
                                <i data-lucide="server" class="h-4 w-4"></i>
                                <span>服务器信息</span>
                            </div>
                            <div class="space-y-1">
                                <div>• 端口: ${data.data.port || '3000'}</div>
                                <div>• 环境: ${data.data.environment || 'development'}</div>
                                <div>• 版本: ${data.data.version || '1.0.0'}</div>
                                <div>• 时间戳: ${new Date(data.data.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                serviceStatusContent.innerHTML = `
                    <div class="alert alert-error">
                        <i data-lucide="alert-circle" class="h-6 w-6"></i>
                        <div>
                            <div class="font-bold">服务异常</div>
                            <div class="text-sm">${data.msg}</div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            serviceStatusContent.innerHTML = `
                <div class="alert alert-error">
                    <i data-lucide="alert-circle" class="h-6 w-6"></i>
                    <div>
                        <div class="font-bold">连接失败</div>
                        <div class="text-sm">无法连接到服务器: ${error.message}</div>
                    </div>
                </div>
            `;
        }
        
        // 重新创建图标
        lucide.createIcons();
    });

    // 关闭服务状态弹窗
    closeServiceStatusModal.addEventListener('click', () => {
        serviceStatusModal.classList.remove('modal-open');
    });

    // 点击弹窗外部关闭
    serviceStatusModal.addEventListener('click', (e) => {
        if (e.target === serviceStatusModal) {
            serviceStatusModal.classList.remove('modal-open');
        }
    });
});
