import prisma from './prisma.js';

/** Idempotent: adds is_favorite if the production DB was never migrated. */
export async function ensureLinksFavoritesColumn(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE `links` ADD COLUMN `is_favorite` BOOLEAN NOT NULL DEFAULT false'
    );
    console.log('Schema: added links.is_favorite column');
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { code?: string }; message?: string };
    const code = err.meta?.code ?? err.code;
    const message = String(err.message ?? '');
    if (code === '1060' || message.includes('Duplicate column')) {
      return;
    }
    console.warn('Schema: could not add links.is_favorite:', message);
  }

  try {
    await prisma.$executeRawUnsafe(
      'CREATE INDEX `links_user_id_is_favorite_idx` ON `links`(`user_id`, `is_favorite`)'
    );
  } catch {
    // Index may already exist
  }
}
