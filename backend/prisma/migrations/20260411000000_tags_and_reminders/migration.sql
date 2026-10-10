-- AlterTable
ALTER TABLE `links` ADD COLUMN `remind_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `links_user_id_remind_at_idx` ON `links`(`user_id`, `remind_at`);

-- CreateTable
CREATE TABLE `tags` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tags_user_id_idx`(`user_id`),
    UNIQUE INDEX `tags_user_id_name_key`(`user_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `link_tags` (
    `link_id` CHAR(36) NOT NULL,
    `tag_id` CHAR(36) NOT NULL,

    INDEX `link_tags_tag_id_idx`(`tag_id`),
    PRIMARY KEY (`link_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tags` ADD CONSTRAINT `tags_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `link_tags` ADD CONSTRAINT `link_tags_link_id_fkey` FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `link_tags` ADD CONSTRAINT `link_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
