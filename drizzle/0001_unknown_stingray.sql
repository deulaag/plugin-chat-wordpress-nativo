CREATE TABLE `agent_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`status` enum('online','offline','away') NOT NULL DEFAULT 'offline',
	`active_sessions` int NOT NULL DEFAULT 0,
	`last_heartbeat` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_status_agent_id_unique` UNIQUE(`agent_id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`sender_id` int,
	`sender_type` enum('customer','agent') NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`is_read` boolean NOT NULL DEFAULT false,
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`customer_id` int,
	`customer_email` varchar(320),
	`customer_name` varchar(255),
	`agent_id` int,
	`token` varchar(64) NOT NULL,
	`status` enum('active','closed','waiting') NOT NULL DEFAULT 'waiting',
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`closed_at` timestamp,
	CONSTRAINT `chat_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `quick_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quick_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('outgoing','incoming') NOT NULL,
	`url` text,
	`event` varchar(255) NOT NULL,
	`payload` text,
	`status_code` int,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_logs_id` PRIMARY KEY(`id`)
);
