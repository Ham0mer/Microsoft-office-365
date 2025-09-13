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
  ghcr.io/ham0mer/server:latest
```

```bash
# 会话密钥（用于验证管理员权限）
token=your_admin_token_here

# Microsoft Graph API 配置
# 请从 Azure Portal 获取这些信息
TENANT_ID=your_tenant_id_here
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
```
- `PORT`: 服务端口（默认34343）
- `ALLOWED_ORIGINS`: 允许的CORS源（逗号分隔）
- `NODE_ENV`: 环境模式（production/development）
