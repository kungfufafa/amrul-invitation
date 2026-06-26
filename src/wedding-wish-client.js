const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 1000;

// Resolve a UI string from the shared window.TRANSLATIONS dictionary for the
// active language (set in index.html). Supports a single {n} placeholder for
// numeric interpolation (e.g. validation length limits). Falls back to the key.
function t(key, n) {
  const value = typeof window !== "undefined" && typeof window.t9n === "function" ? window.t9n(key) : key;
  return n == null ? value : String(value).replace("{n}", String(n));
}

export function normalizeWish({ name, message }) {
  const normalizedName = String(name ?? "").trim().replace(/\s+/g, " ");
  const normalizedMessage = String(message ?? "").trim();

  if (!normalizedName) throw new Error(t("wish_err_name"));
  if (!normalizedMessage) throw new Error(t("wish_err_message"));
  if (normalizedName.length > MAX_NAME_LENGTH) {
    throw new Error(t("wish_err_name_len", MAX_NAME_LENGTH));
  }
  if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
    throw new Error(t("wish_err_message_len", MAX_MESSAGE_LENGTH));
  }

  return { name: normalizedName, message: normalizedMessage };
}

export function getGuestName(search) {
  const params = new URLSearchParams(search);
  const rawName = String(params.get("to") ?? params.get("?to") ?? "").trim();
  if (!rawName) return "";

  // Replace hyphens and underscores with spaces
  let name = rawName.replace(/[-_]+/g, " ");

  // Normalise multiple spaces to a single space
  name = name.replace(/\s+/g, " ");

  // Convert to Title Case
  name = name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return name.slice(0, MAX_NAME_LENGTH);
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

export function pageWishes(wishes, offset = 0, limit = 10) {
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  const safeLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
  const sorted = [...wishes].sort((left, right) =>
    String(right.createdAt).localeCompare(String(left.createdAt)),
  );
  const items = sorted.slice(safeOffset, safeOffset + safeLimit);
  const nextOffset = safeOffset + items.length < sorted.length ? safeOffset + items.length : null;

  return { items, nextOffset };
}

export function formatWishDate(value) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.valueOf())) return "";

  const locale = typeof window !== "undefined" && window.CURRENT_LANG === "ID" ? "id-ID" : "en-GB";
  return timestamp.toLocaleString(locale, {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
