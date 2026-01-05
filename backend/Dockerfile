# 开发阶段
FROM node:20-slim AS development

WORKDIR /app

# COPY package*.json ./
# RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]

# 生产构建阶段
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 生产运行阶段
FROM node:20-slim AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["npm", "start"]
