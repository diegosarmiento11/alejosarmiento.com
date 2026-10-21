// Post format rules with no server dependencies, so the /escribir editor can use them too.

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const STOP_WORDS = new Set([
  "a", "al", "con", "de", "del", "el", "en", "la", "las", "lo", "los", "o", "para", "por",
  "que", "se", "su", "sus", "un", "una", "unos", "unas", "y", "mi", "mis", "tu", "tus",
]);

export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word && !STOP_WORDS.has(word))
    .join("-");
}
