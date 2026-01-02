-- Server Monitor Database Schema
-- 初始化脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS server_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE server_monitor;

-- 系统监控日志表
CREATE TABLE IF NOT EXISTS system_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cpu_usage DECIMAL(5,2) NOT NULL COMMENT 'CPU 使用率',
  memory_usage DECIMAL(5,2) NOT NULL COMMENT '内存使用率',
  disk_usage JSON COMMENT '磁盘使用情况 JSON',
  network_info JSON COMMENT '网络信息 JSON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统监控日志';

-- 告警记录表
CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL COMMENT '告警类型: cpu, memory, disk',
  alert_level ENUM('info', 'warning', 'critical') NOT NULL COMMENT '告警级别',
  message TEXT NOT NULL COMMENT '告警消息',
  threshold_value DECIMAL(5,2) COMMENT '阈值',
  actual_value DECIMAL(5,2) COMMENT '实际值',
  resolved BOOLEAN DEFAULT FALSE COMMENT '是否已解决',
  resolved_at TIMESTAMP NULL COMMENT '解决时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alert_type (alert_type),
  INDEX idx_alert_level (alert_level),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统告警记录';

-- 配置表
CREATE TABLE IF NOT EXISTS configurations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  config_value TEXT NOT NULL COMMENT '配置值',
  description VARCHAR(255) COMMENT '配置描述',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置';

-- 插入默认配置
INSERT INTO configurations (config_key, config_value, description) VALUES
('cpu_warning_threshold', '70', 'CPU 使用率警告阈值'),
('cpu_critical_threshold', '90', 'CPU 使用率严重告警阈值'),
('memory_warning_threshold', '80', '内存使用率警告阈值'),
('memory_critical_threshold', '95', '内存使用率严重告警阈值'),
('disk_warning_threshold', '80', '磁盘使用率警告阈值'),
('disk_critical_threshold', '95', '磁盘使用率严重告警阈值')
ON DUPLICATE KEY UPDATE config_value=VALUES(config_value);

-- 创建用于远程连接的用户（如果需要）
-- CREATE USER IF NOT EXISTS 'monitor'@'%' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON server_monitor.* TO 'monitor'@'%';
-- FLUSH PRIVILEGES;

SELECT 'Database initialization completed successfully!' AS message;
