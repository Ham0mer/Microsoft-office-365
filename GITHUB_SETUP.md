# GitHub 仓库设置指南

## 📋 上传到GitHub的步骤

### 1. 创建GitHub仓库

1. 登录GitHub
2. 点击 "New repository"
3. 填写仓库信息：
   - **Repository name**: `microsoft-account-api` (或您喜欢的名称)
   - **Description**: `Microsoft 365 邮箱订阅状态查询服务`
   - **Visibility**: Public 或 Private
   - **不要**勾选 "Add a README file"（我们已经有了）

### 2. 上传代码

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: Microsoft 365 account API service"

# 添加远程仓库（替换为您的仓库URL）
git remote add origin https://github.com/[用户名]/[仓库名].git

# 推送到GitHub
git push -u origin main
```

### 3. 配置GitHub Actions权限

1. 进入仓库的 **Settings** 页面
2. 点击左侧的 **Actions** → **General**
3. 在 **Workflow permissions** 部分：
   - 选择 **Read and write permissions**
   - 勾选 **Allow GitHub Actions to create and approve pull requests**

### 4. 配置环境变量（可选）

如果需要使用GitHub Secrets存储敏感信息：

1. 进入仓库的 **Settings** 页面
2. 点击左侧的 **Secrets and variables** → **Actions**
3. 点击 **New repository secret** 添加：
   - `CLIENT_ID`: Microsoft Graph API客户端ID
   - `TENANT_ID`: Azure租户ID
   - `CLIENT_SECRET`: Microsoft Graph API客户端密钥
   - `ADMIN_TOKEN`: 管理员访问令牌

## 🐳 Docker 镜像自动构建

### 触发条件

- ✅ 推送到 `main` 或 `master` 分支
- ✅ 创建 Pull Request
- ✅ 发布 Release

### 镜像标签策略

- `latest` - 主分支最新版本
- `main` - 主分支标签
- `v1.0.0` - 版本标签（如 v1.0.0）
- `v1.0` - 主版本标签（如 v1.0）

### 查看构建状态

1. 进入仓库的 **Actions** 页面
2. 查看 **Build and Push Docker Image** 工作流
3. 点击具体的运行记录查看详细日志

### 查看Docker镜像

1. 进入仓库的 **Packages** 页面
2. 找到对应的Docker镜像
3. 查看镜像标签和大小

## 📦 使用Docker镜像

### 拉取镜像

```bash
# 拉取最新版本
docker pull ghcr.io/[用户名]/[仓库名]:latest

# 拉取特定版本
docker pull ghcr.io/[用户名]/[仓库名]:v1.0.0
```

### 运行容器

```bash
docker run -p 34343:34343 \
  -e CLIENT_ID=your_client_id \
  -e TENANT_ID=your_tenant_id \
  -e CLIENT_SECRET=your_client_secret \
  -e token=your_admin_token \
  ghcr.io/[用户名]/[仓库名]:latest
```

## 🔧 故障排除

### 常见问题

1. **权限不足**
   - 确保GitHub Actions有写入Packages的权限
   - 检查仓库设置中的Workflow permissions

2. **构建失败**
   - 检查Dockerfile语法
   - 查看Actions日志中的错误信息
   - 确保所有必需文件都已提交

3. **镜像推送失败**
   - 检查GitHub Token权限
   - 确保仓库是公开的或您有访问权限

### 调试步骤

1. 查看GitHub Actions日志
2. 本地测试Docker构建：
   ```bash
   docker build -t test-image .
   docker run -p 34343:34343 test-image
   ```
3. 检查环境变量配置

## 📚 相关文档

- [Docker部署指南](./DOCKER.md)
- [API接口文档](./README.md#api接口)
- [环境变量配置](./README.md#配置)
