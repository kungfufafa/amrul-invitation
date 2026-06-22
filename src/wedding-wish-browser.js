import { formatWishDate, getGuestName, normalizeWish } from "./wedding-wish-client.js";

function config() { return { endpoint: String(window.WEDDING_WISH_CONFIG?.endpoint || "").trim(), pageSize: Number(window.WEDDING_WISH_CONFIG?.pageSize || 10) }; }
function notify(message, status = "error") { if (typeof window.showAlert === "function") window.showAlert(message, status); else window.alert(message); }
async function callApi(endpoint, action, payload = {}) {
  if (!endpoint) throw new Error("Wedding Wish belum dikonfigurasi.");
  const response = await fetch(endpoint, { method: "POST", headers: { Accept: "application/json" }, body: new URLSearchParams({ action, ...payload }) });
  if (!response.ok) throw new Error("Tidak dapat menghubungi penyimpanan ucapan.");
  const result = await response.json();
  if (!result.ok) throw new Error(result.message || "Ucapan tidak dapat diproses.");
  return result;
}
function wishElement(wish) {
  const item = document.createElement("article"); item.className = "comment-item";
  const head = document.createElement("div"); head.className = "comment-head";
  const name = document.createElement("strong"); name.className = "comment-name"; name.textContent = wish.name;
  const date = document.createElement("span"); date.className = "comment-date";
  date.textContent = formatWishDate(wish.createdAt);
  head.append(name, date);
  const content = document.createElement("div"); content.className = "comment-body";
  const message = document.createElement("p"); message.className = "comment-caption"; message.style.whiteSpace = "pre-line"; message.textContent = wish.message;
  content.append(message); item.append(head, content); return item;
}
function renderWishes(container, wishes, replace) {
  if (replace) container.replaceChildren();
  if (replace && wishes.length === 0) { const empty = document.createElement("p"); empty.className = "no-comment"; empty.textContent = "Jadilah yang pertama mengirim ucapan."; container.append(empty); container.classList.add("show"); return; }
  container.classList.toggle("show", container.children.length > 0 || wishes.length > 0); wishes.forEach((wish) => container.append(wishElement(wish)));
}
function bootWeddingWishes() {
  const guestName = getGuestName(window.location.search);
  const section = document.querySelector(".wedding-wish-wrap");
  if (!guestName) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  const form = document.querySelector("#weddingWishForm"), container = document.querySelector(".comment-wrap"), moreButton = document.querySelector("#moreComment"), moreWrap = document.querySelector(".more-comment-wrap");
  if (!form || !container || !moreButton || !moreWrap) return;
  const { endpoint, pageSize } = config(); let nextOffset = 0, isLoading = false;
  const setMoreButton = (offset) => { nextOffset = offset; moreWrap.classList.toggle("show", offset !== null); moreButton.disabled = false; moreButton.textContent = "Show more comments"; };
  const loadWishes = async (replace = false) => { if (!endpoint || isLoading) return; isLoading = true; try { const result = await callApi(endpoint, "list", { offset: replace ? "0" : String(nextOffset), limit: String(pageSize) }); renderWishes(container, result.items || [], replace); setMoreButton(result.nextOffset ?? null); } catch (error) { if (replace) container.classList.remove("show"); console.error("Unable to load wedding wishes", error); } finally { isLoading = false; } };
  window.load_comment = () => loadWishes(true); window.jQuery?.(document).off("submit", "form#weddingWishForm"); window.jQuery?.(document).off("click", "#moreComment");
  form.addEventListener("submit", async (event) => { event.preventDefault(); if (isLoading) return; if (!guestName) { notify("Nama tamu tidak ditemukan. Gunakan link undangan yang memuat parameter ?to=Nama."); return; } let wish; try { wish = normalizeWish({ name: guestName, message: form.elements.comment.value }); } catch (error) { notify(error.message); return; } const submit = form.querySelector("button[type='submit']"), originalText = submit.textContent; submit.disabled = true; submit.textContent = "Mengirim..."; try { await callApi(endpoint, "create", wish); form.elements.comment.value = ""; notify("Ucapan berhasil dikirim.", "success"); await loadWishes(true); } catch (error) { notify(error.message || "Ucapan gagal dikirim."); } finally { submit.disabled = false; submit.textContent = originalText; } });
  moreButton.addEventListener("click", () => loadWishes(false)); loadWishes(true);
}
function applyGuestGreeting() {
  const guestName = getGuestName(window.location.search);
  document.querySelectorAll("[data-guest-greeting]").forEach((greeting) => {
    if (!guestName) {
      greeting.hidden = true;
      greeting.replaceChildren();
      return;
    }

    greeting.hidden = false;
    const prefix = document.createElement("span");
    prefix.className = "guest-greeting-prefix";
    prefix.textContent = "Kepada Yth.";
    const title = document.createElement("span");
    title.className = "guest-greeting-title";
    title.textContent = "Bapak/Ibu/Saudara/i";
    const name = document.createElement("strong");
    name.className = "guest-greeting-name";
    name.textContent = guestName;
    greeting.replaceChildren(prefix, title, name);
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { applyGuestGreeting(); bootWeddingWishes(); }, { once: true }); else { applyGuestGreeting(); bootWeddingWishes(); }
