const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 1000;

export function normalizeWish({ name, message }) {
  const normalizedName = String(name ?? "").trim().replace(/\s+/g, " ");
  const normalizedMessage = String(message ?? "").trim();

  if (!normalizedName) throw new Error("Nama wajib diisi.");
  if (!normalizedMessage) throw new Error("Ucapan wajib diisi.");
  if (normalizedName.length > MAX_NAME_LENGTH) {
    throw new Error(`Nama maksimal ${MAX_NAME_LENGTH} karakter.`);
  }
  if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Ucapan maksimal ${MAX_MESSAGE_LENGTH} karakter.`);
  }

  return { name: normalizedName, message: normalizedMessage };
}

export function getGuestName(search) {
  const params = new URLSearchParams(search);
  return String(params.get("to") ?? params.get("?to") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_NAME_LENGTH);
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

  return timestamp.toLocaleString("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
