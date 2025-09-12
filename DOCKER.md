# Docker 部署指南

## 🐳 Docker 镜像

本项目已配置自动构建Docker镜像并推送到GitHub Container Registry。

### 镜像信息

- **Registry**: `ghcr.io`
- **镜像名称**: `ghcr.io/[用户名]/[仓库名]`
- **标签策略**:
  - `latest` - 主分支最新版本
  - `main` - 主分支标签
  - `v1.0.0` - 版本标签
  - `v1.0` - 主版本标签

### 自动构建

每次推送到主分支或创建Release时，GitHub Actions会自动：

1. 构建Docker镜像
2. 推送到GitHub Container Registry
3. 应用多标签策略

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

### 使用GitHub镜像

```bash
# 拉取镜像
docker pull ghcr.io/[用户名]/[仓库名]:latest

# 运行容器
docker run -p 34343:34343 \
  -e CLIENT_ID=your_client_id \
  -e TENANT_ID=your_tenant_id \
  -e CLIENT_SECRET=your_client_secret \
  -e token=your_admin_token \
  ghcr.io/[用户名]/[仓库名]:latest
```

### 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `CLIENT_ID` | ✅ | Microsoft Graph API客户端ID |
| `TENANT_ID` | ✅ | Azure租户ID |
| `CLIENT_SECRET` | ✅ | Microsoft Graph API客户端密钥 |
| `token` | ✅ | 管理员访问令牌 |
| `PORT` | ❌ | 服务端口（默认34343） |
| `NODE_ENV` | ❌ | 运行环境（默认development） |

### Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'
services:
  microsoft-account-api:
    image: ghcr.io/[用户名]/[仓库名]:latest
    ports:
      - "34343:34343"
    environment:
      - CLIENT_ID=your_client_id
      - TENANT_ID=your_tenant_id
      - CLIENT_SECRET=your_client_secret
      - token=your_admin_token
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:34343/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 健康检查

容器包含内置健康检查，每30秒检查一次服务状态：

```bash
# 检查容器健康状态
docker ps

# 查看健康检查日志
docker inspect [容器ID] | grep -A 10 Health
```

### 安全特性

- ✅ 使用非root用户运行
- ✅ Alpine Linux基础镜像（更小更安全）
- ✅ 只安装生产依赖
- ✅ 内置健康检查
- ✅ 环境变量配置

### 故障排除

1. **端口冲突**: 确保34343端口未被占用
2. **环境变量**: 检查所有必需的环境变量是否设置
3. **网络问题**: 确保容器可以访问Microsoft Graph API
4. **权限问题**: 检查Microsoft Graph API权限配置

### 监控

访问健康检查端点：
```bash
curl http://localhost:34343/api/health
```
