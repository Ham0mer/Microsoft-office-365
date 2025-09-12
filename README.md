# 邮箱订阅状态查询服务

这是一个简化的Node.js服务，专门用于查询Microsoft 365邮箱的订阅状态。

## 🐳 Docker 部署

### 使用GitHub镜像（推荐）

```bash
docker run -p 34343:34343 \
  -e CLIENT_ID=your_client_id \
  -e TENANT_ID=your_tenant_id \
  -e CLIENT_SECRET=your_client_secret \
  -e token=your_admin_token \
  ghcr.io/[用户名]/[仓库名]:latest
```

### 本地构建

```bash
# 构建镜像
docker build -t microsoft-account-api .

# 运行容器
docker run -p 34343:34343 \
  -e CLIENT_ID=your_client_id \
  -e TENANT_ID=your_tenant_id \
  -e CLIENT_SECRET=your_client_secret \
  -e token=your_admin_token \
  microsoft-account-api
```

> 📖 详细的Docker部署指南请查看 [DOCKER.md](./DOCKER.md)

## 功能

- **邮箱完整信息查询**: 通过邮箱地址一次性获取账户状态、订阅信息和OneDrive使用情况
- **租户SKU查询**: 查询租户中可用的订阅SKU信息（需要管理员Token）
- **全局OneDrive查询**: 查询租户下所有用户的OneDrive使用情况（需要管理员Token）
- **服务状态监控**: 提供服务健康状态检查和系统信息

## API接口

### 1. 查询邮箱完整信息（推荐）
```
GET /api/account/info/:email
```

**参数:**
- `email`: 要查询的邮箱地址

**功能:**
- 账户状态（启用/禁用）
- 订阅信息（所有许可证和服务计划）
- OneDrive使用情况（存储使用量、剩余空间等）

**成功响应示例:**
```json
{
  "code": 0,
  "msg": "获取邮箱信息成功",
  "data": {
    "enabled": true,
    "userPrincipalName": "user@domain.com",
    "displayName": "用户显示名称",
    "subscriptions": [
      {
        "skuId": "3b555118-da6a-4418-894f-7df1e2096870",
        "skuPartNumber": "O365_BUSINESS_ESSENTIALS",
        "servicePlans": [...]
      }
    ],
    "subscriptionCount": 1,
    "onedriveUsage": {
      "used": 549293939666,
      "total": 1099511627776,
      "remaining": 550217688110,
      "deleted": 1534871465,
      "state": "normal",
      "usedPercentage": 49.96,
      "usedFormatted": "511.57 GB",
      "totalFormatted": "1 TB",
      "remainingFormatted": "512.43 GB",
      "deletedFormatted": "1.43 GB"
    }
  }
}
```

**错误响应示例:**
```json
{
  "code": 1,
  "msg": "用户不存在",
  "data": {
    "enabled": false,
    "subscriptions": []
  }
}
```

**可能的错误信息:**
- `邮箱格式不正确`: 邮箱地址格式无效
- `获取访问令牌失败`: Microsoft Graph API认证失败
- `用户不存在`: 指定的邮箱地址在租户中不存在
- `权限不足，无法访问用户信息`: 应用权限不足
- `访问令牌无效或已过期`: 认证令牌问题

### 2. 查询租户订阅SKU信息
```
POST /api/subscriptions/skus
```

**成功响应示例:**
```json
{
  "code": 0,
  "msg": "获取SKU信息成功",
  "data": {
    "skus": [
      {
        "skuId": "3b555118-da6a-4418-894f-7df1e2096870",
        "skuPartNumber": "SPB",
        "prepaidUnits": {
          "enabled": 100,
          "suspended": 0,
          "warning": 0
        },
        "consumedUnits": 5,
        "capabilityStatus": "Enabled"
      }
    ],
    "totalCount": 1
  }
}
```

### 3. 查询全局OneDrive使用情况
```
POST /api/onedrive/all
```

**参数:**
- `token`: 管理员访问令牌（在请求体中）

**功能:**
- 查询租户下所有用户的OneDrive使用情况
- 提供统计概览和用户详情

**成功响应示例:**
```json
{
  "code": 0,
  "msg": "获取所有用户OneDrive使用情况成功",
  "data": {
    "summary": {
      "totalUsers": 2,
      "successfulQueries": 2,
      "failedQueries": 0,
      "totalUsed": 549294049470,
      "totalCapacity": 2199023255552,
      "totalRemaining": 1649729206082,
      "totalDeleted": 1534871465,
      "totalUsedFormatted": "511.57 GB",
      "totalCapacityFormatted": "2 TB",
      "totalRemainingFormatted": "1.5 TB",
      "totalDeletedFormatted": "1.43 GB",
      "averageUsagePercentage": "24.98"
    },
    "users": [...]
  }
}
```

### 4. 健康检查
```
GET /api/health
```

**响应示例:**
```json
{
  "code": 0,
  "msg": "服务正常",
  "data": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456
  }
}
```

## 配置

### 环境变量配置

1. 复制环境变量模板文件：
```bash
cp env.example env
```

2. 编辑 `env` 文件，填入您的配置信息：
```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 会话密钥（用于验证管理员权限）
token=your_admin_token_here

# 允许的源
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Microsoft Graph API 配置
# 请从 Azure Portal 获取这些信息
TENANT_ID=your_tenant_id_here
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
```

### 获取 Microsoft Graph API 凭据

1. 登录 [Azure Portal](https://portal.azure.com)
2. 进入 "Azure Active Directory" > "应用注册"
3. 创建新应用或选择现有应用
4. 在 "证书和密码" 中创建客户端密码
5. 在 "API 权限" 中添加以下权限：
   - `User.Read.All` (读取所有用户)
   - `Directory.Read.All` (读取目录数据)
   - `Organization.Read.All` (读取组织信息)

### 安全注意事项

- ⚠️ **重要**: `env` 文件包含敏感信息，不要提交到版本控制
- 🔒 确保 `env` 文件权限设置为仅所有者可读
- 🔄 定期轮换客户端密码
- 🚫 不要在代码中硬编码敏感信息

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动服务：
```bash
npm start
```

服务将在端口3000上运行。

## 环境变量

可以通过环境变量配置：

- `PORT`: 服务端口（默认3000）
- `ALLOWED_ORIGINS`: 允许的CORS源（逗号分隔）
- `NODE_ENV`: 环境模式（production/development）

## 依赖

- express: Web框架
- cors: 跨域支持
- helmet: 安全中间件
- express-rate-limit: 速率限制
- axios: HTTP客户端
- body-parser: 请求解析
- dotenv: 环境变量支持