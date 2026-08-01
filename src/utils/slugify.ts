/**
 * Converts a string into a clean, URL-friendly slug.
 * Supports English and non-ASCII (e.g. Arabic) characters.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\u0600-\u06FF-]+/g, '') // Remove all non-word chars except Arabic & hyphens
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}
