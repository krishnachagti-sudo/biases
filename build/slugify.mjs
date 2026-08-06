// Derive a URL-safe slug from a human-readable law name.
// NFKD decomposes accented letters into base + combining mark, which the
// combining-marks strip (U+0300-U+036F) then removes, folding most diacritics.
// Straight and curly (U+2019) apostrophes are deleted so possessives read as
// one word (Goodhart's -> goodharts); every other non-[a-z0-9] run collapses
// to a single hyphen, with leading/trailing hyphens trimmed. The mark range
// (U+0300-U+036F) and the U+2019 apostrophe are written as explicit unicode
// escapes, so no literal combining marks or invisible characters live here.
// Note: non-decomposing letters (o-slash, l-stroke, sharp-s) won't fold;
// acceptable for seed data, revisit for Plan B scale.
export function slugify(name) {
  return name
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
