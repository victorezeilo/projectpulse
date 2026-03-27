export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(name: string): string {
  const base = generateSlug(name);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}