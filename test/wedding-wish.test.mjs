import assert from "node:assert/strict";
import test from "node:test";

import {
  escapeHtml,
  formatWishDate,
  getGuestName,
  normalizeWish,
  pageWishes,
} from "../src/wedding-wish-client.js";

test("normalizeWish trims valid guest input", () => {
  assert.deepEqual(normalizeWish({ name: "  Hani  ", message: "  Selamat!  " }), {
    name: "Hani",
    message: "Selamat!",
  });
});

test("normalizeWish rejects blank or oversized input", () => {
  assert.throws(() => normalizeWish({ name: "", message: "Selamat" }));
  assert.throws(() => normalizeWish({ name: "Hani", message: " " }));
  assert.throws(() => normalizeWish({ name: "x".repeat(81), message: "Selamat" }));
  assert.throws(() => normalizeWish({ name: "Hani", message: "x".repeat(1_001) }));
});

test("escapeHtml prevents guest content from becoming markup", () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
});

test("formatWishDate displays the Jakarta date and time", () => {
  assert.equal(formatWishDate("2026-05-23T04:00:00.000Z"), "23 May 2026, 11:00");
});

test("getGuestName uses and normalizes the to URL parameter", () => {
  assert.equal(getGuestName("?to=Apriansyah%20%20Rahman"), "Apriansyah Rahman");
  assert.equal(getGuestName("??to=Apriansyah"), "Apriansyah");
  assert.equal(getGuestName("?to="), "");
  assert.equal(getGuestName("?to=apriansyah-rizqi-setiawan"), "Apriansyah Rizqi Setiawan");
  assert.equal(getGuestName("?to=APRIANSYAH_RIZQI_SETIAWAN"), "Apriansyah Rizqi Setiawan");
  assert.equal(getGuestName("?to=apriansyah  rizqi  setiawan"), "Apriansyah Rizqi Setiawan");
});

test("pageWishes returns a stable newest-first page and cursor", () => {
  const result = pageWishes([
    { createdAt: "2026-07-05T08:00:00.000Z", name: "A", message: "1" },
    { createdAt: "2026-07-05T10:00:00.000Z", name: "B", message: "2" },
    { createdAt: "2026-07-05T09:00:00.000Z", name: "C", message: "3" },
  ], 0, 2);

  assert.deepEqual(result.items.map((wish) => wish.name), ["B", "C"]);
  assert.equal(result.nextOffset, 2);
});
