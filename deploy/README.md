# 字库取模工具 - 部署说明

## 📦 文件说明

本压缩包包含已构建完成的生产环境文件，可直接部署到Web服务器。

### 目录结构
```
font-modulo-tool-deploy/
├── dist/                    # 生产环境构建文件
│   ├── index.html          # 主页面
│   └── assets/             # 静态资源（CSS、JS）
│       ├── index-xxx.css   # 样式文件
│       └── index-xxx.js    # JavaScript文件
├── nginx.conf              # Nginx配置示例
└── README.md               # 本文件
```

## 🚀 快速部署

### 方式一：Nginx部署（推荐）

1. **将dist目录上传到服务器**
   ```bash
   # 例如上传到 /var/www/html/font-modulo-tool
   scp -r dist/* user@server:/var/www/html/font-modulo-tool/
   ```

2. **配置Nginx**
   ```bash
   # 复制nginx.conf到Nginx配置目录
   cp nginx.conf /etc/nginx/conf.d/font-modulo-tool.conf
   
   # 测试配置
   nginx -t
   
   # 重载Nginx
   nginx -s reload
   ```

3. **访问网站**
   ```
   http://your-domain.com
   ```

### 方式二：Apache部署

1. **将dist目录上传到服务器**
   ```bash
   scp -r dist/* user@server:/var/www/html/font-modulo-tool/
   ```

2. **配置Apache虚拟主机**
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       DocumentRoot /var/www/html/font-modulo-tool
       
       <Directory /var/www/html/font-modulo-tool>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

3. **重启Apache**
   ```bash
   systemctl restart apache2
   ```

### 方式三：Node.js静态服务器

1. **安装serve**
   ```bash
   npm install -g serve
   ```

2. **启动服务**
   ```bash
   cd dist
   serve -s . -l 3000
   ```

3. **访问网站**
   ```
   http://localhost:3000
   ```

## ⚙️ Nginx配置详解

### 基础配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/font-modulo-tool;
    index index.html;

    # 启用Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### HTTPS配置（推荐）
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /var/www/html/font-modulo-tool;
    index index.html;

    # SSL证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 其他配置同上...
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 性能优化建议

### 1. 启用Gzip压缩
已在nginx.conf中配置，可减少70%传输体积

### 2. 浏览器缓存
静态资源设置1年缓存，提升二次访问速度

### 3. CDN加速
可将dist目录上传到CDN，全球加速访问

### 4. HTTP/2
Nginx配置中已启用http2，提升并发性能

## 🔧 常见问题

### Q1: 刷新页面出现404错误
**原因**：SPA路由需要特殊配置  
**解决**：确保Nginx配置中包含 `try_files $uri $uri/ /index.html;`

### Q2: 页面加载缓慢
**解决**：
- 检查是否启用了Gzip压缩
- 确认静态资源缓存配置正确
- 考虑使用CDN加速

### Q3: HTTPS证书配置
**解决**：
- 使用Let's Encrypt免费证书
- 运行 `certbot --nginx -d your-domain.com`

### Q4: 跨域问题
**解决**：在Nginx配置中添加
```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
```

## 📝 更新部署

当需要更新版本时：

1. **本地重新构建**
   ```bash
   npm run build
   ```

2. **上传新文件**
   ```bash
   scp -r dist/* user@server:/var/www/html/font-modulo-tool/
   ```

3. **清除浏览器缓存**
   - 用户需要强制刷新（Ctrl+F5）
   - 或更改文件名版本号

## 🔐 安全建议

1. **启用HTTPS**：保护数据传输安全
2. **配置防火墙**：仅开放80/443端口
3. **定期更新**：保持Nginx和系统最新
4. **备份数据**：定期备份配置文件

## 📞 技术支持

如有问题，请访问：https://esdkaiyuan.online

---

**祝您部署顺利！** 🎉

---

## 🌐 GitHub Pages 托管（当前线上方案）

**站点地址**：https://esdkaiyuan.github.io/modulo/
**发布方式**：构建产物推送到 `gh-pages` 分支，仓库 Pages 的 Source 即该分支根目录。

### 重新部署

```bash
# 1) 构建（base 必须是 /modulo/，Pages 项目站点在子路径下）
MSYS_NO_PATHCONV=1 VITE_BASE=/modulo/ npx vite build --outDir dist-pages-build

# 2) 基于远端 gh-pages 建临时 worktree，替换产物后推送（fast-forward）
git fetch origin gh-pages
git worktree add --detach .ghpages-tmp origin/gh-pages
git -C .ghpages-tmp checkout -B gh-pages origin/gh-pages
git -C .ghpages-tmp rm -rf . -q        # 清掉上一次的产物（含旧 hash 资源）
cp -r dist-pages-build/. .ghpages-tmp/
touch .ghpages-tmp/.nojekyll
git -C .ghpages-tmp add -A
git -C .ghpages-tmp commit -m "chore: publish static build"
git -C .ghpages-tmp push origin gh-pages

# 3) 清理（务必先把 shell 切回仓库根目录，否则 Windows 下删不掉该目录）
cd /d/aesdnew/modulo
git worktree remove .ghpages-tmp --force
rm -rf dist-pages-build
```

> 该分支首次建立时用的是 orphan 提交（历史里只有一次）；之后都按上面的增量流程，推送是快进的。

### 注意点

- 构建必须带 `VITE_BASE=/modulo/`，否则资源 404；Windows Git Bash 下还需 `MSYS_NO_PATHCONV=1`，否则 `/modulo/` 会被 MSYS 当成路径转换。
- 应用用 hash 路由（`#/xxx`），**不需要** SPA 回退配置，直接刷新不会 404。
- `.nojekyll` 必须保留，避免 Jekyll 处理资源目录。
- 完整构建可直接用 `npm run build`（含 `vue-tsc` 类型检查）；只想出产物、跳过类型门禁时用 `npx vite build`。上面的部署命令因为要自定义 `--outDir`，用的是后者。

### 当前限制（重要）

Pages 是纯静态托管，**没有 `/api` 后端**：登录/注册走 `/api/auth/*` 与 `/mailapi`（邮箱验证码），而这些请求在 Pages 上会 404；同时所有工具页都受登录保护（`src/App.vue` 的 PROTECTED 列表）。**线上目前只有首页与登录页可用，9 个工具页进不去。**

要恢复功能需要：把后端（Express+MySQL 方案，见 `docs/superpowers/specs/`）部署到公网可访问的服务，并让前端支持外部 API 地址与跨域凭据（`credentials: 'include'` + 后端 CORS）。
