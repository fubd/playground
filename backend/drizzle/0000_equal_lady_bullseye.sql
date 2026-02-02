CREATE TABLE `alerts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`alert_type` varchar(50) NOT NULL,
	`alert_level` enum('info','warning','critical') NOT NULL,
	`message` text NOT NULL,
	`threshold_value` decimal(5,2),
	`actual_value` decimal(5,2),
	`resolved` boolean DEFAULT false,
	`resolved_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_key` varchar(100) NOT NULL,
	`config_value` text NOT NULL,
	`description` varchar(255),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `configurations_id` PRIMARY KEY(`id`),
	CONSTRAINT `configurations_config_key_unique` UNIQUE(`config_key`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` varchar(36) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`mime_type` varchar(100),
	`size` bigint,
	`type` enum('file','folder') DEFAULT 'file',
	`parent_id` varchar(36),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cpu_load` float NOT NULL,
	`memory_usage` float NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `system_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	CONSTRAINT `mock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`completed` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `todos_id` PRIMARY KEY(`id`)
);
