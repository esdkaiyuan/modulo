#!/bin/bash
# 快速部署脚本 - Linux服务器
# 使用方法: bash deploy.sh

echo "======================================"
echo "  字库取模工具 - 快速部署脚本"
echo "======================================"
echo ""

# 配置变量
DEPLOY_DIR="/var/www/html/font-modulo-tool"
NGINX_CONF="/etc/nginx/conf.d/font-modulo-tool.conf"
DOMAIN="your-domain.com"  # 修改为您的域名

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用root权限运行此脚本"
    echo "   使用方法: sudo bash deploy.sh"
    exit 1
fi

# 创建部署目录
echo "📁 创建部署目录..."
mkdir -p $DEPLOY_DIR

# 复制文件
echo "📦 复制文件到部署目录..."
cp -r dist/* $DEPLOY_DIR/

# 设置权限
echo "🔐 设置文件权限..."
chown -R www-data:www-data $DEPLOY_DIR
chmod -R 755 $DEPLOY_DIR

# 复制Nginx配置
echo "⚙️  配置Nginx..."
sed "s/your-domain.com/$DOMAIN/g" nginx.conf > $NGINX_CONF

# 测试Nginx配置
echo "🧪 测试Nginx配置..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx配置测试通过"
    
    # 重载Nginx
    echo "🔄 重载Nginx..."
    nginx -s reload
    
    echo ""
    echo "======================================"
    echo "  ✅ 部署成功！"
    echo "======================================"
    echo ""
    echo "📍 网站目录: $DEPLOY_DIR"
    echo "🌐 访问地址: http://$DOMAIN"
    echo "📝 Nginx配置: $NGINX_CONF"
    echo ""
    echo "💡 提示："
    echo "   1. 请确保域名已解析到服务器IP"
    echo "   2. 如需HTTPS，请配置SSL证书"
    echo "   3. 查看日志: tail -f /var/log/nginx/font-modulo-tool-*.log"
    echo ""
else
    echo "❌ Nginx配置测试失败，请检查配置文件"
    exit 1
fi
