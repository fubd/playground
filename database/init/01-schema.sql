-- 数据库
CREATE DATABASE IF NOT EXISTS server_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE server_monitor;

-- system_metrics 表
CREATE TABLE IF NOT EXISTS system_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cpu_load FLOAT NOT NULL,
  memory_usage FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- files 表
CREATE TABLE IF NOT EXISTS files (
  id VARCHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size BIGINT,
  type ENUM('file','folder') DEFAULT 'file',
  parent_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- todos 表
CREATE TABLE IF NOT EXISTS todos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- alerts 表（保留原来的）
CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  alert_level ENUM('info', 'warning', 'critical') NOT NULL,
  message TEXT NOT NULL,
  threshold_value DECIMAL(5,2),
  actual_value DECIMAL(5,2),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alert_type (alert_type),
  INDEX idx_alert_level (alert_level),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- configurations 表（保留原来的）
CREATE TABLE IF NOT EXISTS configurations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
