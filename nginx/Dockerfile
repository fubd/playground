ARG NGINX_IMAGE=registry.cn-hangzhou.aliyuncs.com/fubd_own/nginx:alpine

FROM ${NGINX_IMAGE}

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 创建静态文件目录
RUN mkdir -p /usr/share/nginx/html

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
