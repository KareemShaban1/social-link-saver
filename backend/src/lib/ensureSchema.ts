import prisma from './prisma.js';

function isDuplicateSchemaError(error: unknown): boolean {
  const err = error as { code?: string; meta?: { code?: string }; message?: string };
  const code = err.meta?.code ?? err.code;
  const message = String(err.message ?? '');
  return (
    code === '1060' ||
    code === '1061' ||
    code === '1050' ||
    message.includes('Duplicate column') ||
    message.includes('Duplicate key') ||
    message.includes('already exists')
  );
}

async function runSql(sql: string, label: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`Schema: ${label}`);
  } catch (error: unknown) {
    if (isDuplicateSchemaError(error)) return;
    const message = String((error as { message?: string }).message ?? error);
    console.warn(`Schema: could not ${label}:`, message);
  }
}

/** Idempotent: adds is_favorite if the production DB was never migrated. */
export async function ensureLinksFavoritesColumn(): Promise<void> {
  await runSql(
    'ALTER TABLE `links` ADD COLUMN `is_favorite` BOOLEAN NOT NULL DEFAULT false',
    'added links.is_favorite column'
  );

  await runSql(
    'CREATE INDEX `links_user_id_is_favorite_idx` ON `links`(`user_id`, `is_favorite`)',
    'added links favorite index'
  );
}

/** Idempotent: tags, link_tags, and remind_at for competitor parity features. */
export async function ensureTagsAndRemindersSchema(): Promise<void> {
  await runSql(
    'ALTER TABLE `links` ADD COLUMN `remind_at` DATETIME(3) NULL',
    'added links.remind_at column'
  );

  await runSql(
    'CREATE INDEX `links_user_id_remind_at_idx` ON `links`(`user_id`, `remind_at`)',
    'added links remind_at index'
  );

  await runSql(
    `CREATE TABLE IF NOT EXISTS \`tags\` (
      \`id\` CHAR(36) NOT NULL,
      \`name\` VARCHAR(100) NOT NULL,
      \`user_id\` CHAR(36) NOT NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`tags_user_id_name_key\` (\`user_id\`, \`name\`),
      INDEX \`tags_user_id_idx\` (\`user_id\`),
      CONSTRAINT \`tags_user_id_fkey\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    'ensured tags table'
  );

  await runSql(
    `CREATE TABLE IF NOT EXISTS \`link_tags\` (
      \`link_id\` CHAR(36) NOT NULL,
      \`tag_id\` CHAR(36) NOT NULL,
      PRIMARY KEY (\`link_id\`, \`tag_id\`),
      INDEX \`link_tags_tag_id_idx\` (\`tag_id\`),
      CONSTRAINT \`link_tags_link_id_fkey\` FOREIGN KEY (\`link_id\`) REFERENCES \`links\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`link_tags_tag_id_fkey\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    'ensured link_tags table'
  );
}
