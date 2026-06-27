-- AlterTable
ALTER TABLE `links` ADD COLUMN `is_favorite` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `links_user_id_is_favorite_idx` ON `links`(`user_id`, `is_favorite`);
