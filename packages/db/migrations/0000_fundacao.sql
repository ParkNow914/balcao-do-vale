CREATE TABLE `auditoria` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`usuario_id` text,
	`acao` text NOT NULL,
	`entidade` text NOT NULL,
	`entidade_id` text,
	`detalhes` text,
	`criado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auditoria_tenant_idx` ON `auditoria` (`tenant_id`,`criado_em`);--> statement-breakpoint
CREATE TABLE `outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`tipo` text NOT NULL,
	`payload` text NOT NULL,
	`tentativas` integer DEFAULT 0 NOT NULL,
	`proxima_tentativa_em` text,
	`status` text DEFAULT 'pendente' NOT NULL,
	`erro` text,
	`criado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`atualizado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `outbox_status_idx` ON `outbox` (`status`,`proxima_tentativa_em`);--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`nome` text NOT NULL,
	`codigo_barras` text,
	`preco_centavos` integer NOT NULL,
	`custo_centavos` integer,
	`estoque` integer DEFAULT 0 NOT NULL,
	`estoque_minimo` integer DEFAULT 0 NOT NULL,
	`publicado_no_catalogo` integer DEFAULT false NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`atualizado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `produtos_tenant_idx` ON `produtos` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `produtos_barras_idx` ON `produtos` (`tenant_id`,`codigo_barras`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`slug` text NOT NULL,
	`cnpj` text,
	`cidade` text DEFAULT 'Lorena' NOT NULL,
	`plano` text DEFAULT 'presenca' NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`atualizado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`papel` text NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`atualizado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unq` ON `usuarios` (`email`);--> statement-breakpoint
CREATE INDEX `usuarios_tenant_idx` ON `usuarios` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `venda_itens` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`venda_id` text NOT NULL,
	`produto_id` text NOT NULL,
	`quantidade` integer NOT NULL,
	`preco_unitario_centavos` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `venda_itens_venda_idx` ON `venda_itens` (`venda_id`);--> statement-breakpoint
CREATE TABLE `vendas` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`total_centavos` integer NOT NULL,
	`desconto_centavos` integer DEFAULT 0 NOT NULL,
	`forma_pagamento` text NOT NULL,
	`status` text DEFAULT 'concluida' NOT NULL,
	`nfce_status` text DEFAULT 'nao_aplicavel' NOT NULL,
	`nfce_chave` text,
	`realizada_em` text NOT NULL,
	`criado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`atualizado_em` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vendas_tenant_data_idx` ON `vendas` (`tenant_id`,`realizada_em`);