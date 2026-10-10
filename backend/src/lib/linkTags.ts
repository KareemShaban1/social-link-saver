import prisma from './prisma.js';

const TAG_NAME_MAX = 100;
const TAGS_PER_LINK_MAX = 20;

export function normalizeTagName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!name || name.length > TAG_NAME_MAX) return null;
  return name;
}

export function normalizeTagList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of raw) {
    const name = normalizeTagName(item);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    tags.push(name);
    if (tags.length >= TAGS_PER_LINK_MAX) break;
  }
  return tags;
}

/** Ensure tags exist for the user and return their IDs in order. */
export async function ensureTagIds(userId: string, names: string[]): Promise<string[]> {
  if (names.length === 0) return [];

  const existing = await prisma.tag.findMany({
    where: { userId, name: { in: names } },
    select: { id: true, name: true },
  });
  const byName = new Map(existing.map((t) => [t.name, t.id]));

  const missing = names.filter((n) => !byName.has(n));
  if (missing.length > 0) {
    await prisma.tag.createMany({
      data: missing.map((name) => ({ name, userId })),
      skipDuplicates: true,
    });
    const created = await prisma.tag.findMany({
      where: { userId, name: { in: missing } },
      select: { id: true, name: true },
    });
    for (const tag of created) {
      byName.set(tag.name, tag.id);
    }
  }

  return names.map((name) => byName.get(name)!).filter(Boolean);
}

/** Replace all tags on a link with the given names (user-scoped). */
export async function syncLinkTags(linkId: string, userId: string, names: string[]): Promise<void> {
  const tagIds = await ensureTagIds(userId, names);

  await prisma.linkTag.deleteMany({ where: { linkId } });
  if (tagIds.length === 0) return;

  await prisma.linkTag.createMany({
    data: tagIds.map((tagId) => ({ linkId, tagId })),
    skipDuplicates: true,
  });
}

export const linkInclude = {
  category: {
    select: {
      id: true,
      name: true,
      color: true,
      parentId: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

export function mapLinkTags<T extends { tags?: { tag: { id: string; name: string } }[] }>(
  link: T
): Omit<T, 'tags'> & { tags: { id: string; name: string }[] } {
  const { tags, ...rest } = link;
  return {
    ...rest,
    tags: (tags ?? []).map((lt) => lt.tag),
  };
}

export function parseRemindAt(raw: unknown): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === '') return null;
  if (typeof raw !== 'string' && !(raw instanceof Date)) return undefined;
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}
