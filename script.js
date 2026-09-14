// ============================================================
// CONFIG
// ============================================================

// Your UPI ID, shown on the offering screen for guests to copy.
// Find it in GPay: Profile photo -> Bank account -> your UPI ID.
// It must be the same account as the printed Offering Box QR.
const UPI_ID = "deshmusn@okaxis";

// First day of your celebration, as YYYY-MM-DD. Used for the "Day 3 of our
// celebration" badge. Set it to your Ganesh Chaturthi date, or leave it as
// null to hide the badge entirely.
const FESTIVAL_START = null; // e.g. "2026-09-14"
const FESTIVAL_DAYS = 11;

// ============================================================
// STATE
// ============================================================
let selectedAmount = null;
let audioCtx = null;

// ============================================================
// SCREENS
// ============================================================
let screenSwitchTimer = null;

// Cross-fades: the current screen fades out briefly, then the next fades in.
function showScreen(id) {
  const next = document.getElementById(id);
  const current = document.querySelector(".screen.active:not(.leaving)");
  if (current === next) return;

  clearTimeout(screenSwitchTimer);
  const swap = () => {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active", "leaving"));
    next.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!current) return swap();
  current.classList.add("leaving");
  screenSwitchTimer = setTimeout(swap, 180);
}

// A tiny tap of vibration on key moments. Android only -- iPhone ignores it.
function buzz(pattern = 12) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
}

// ============================================================
// SOUND
// ============================================================

// The temple bell is synthesised with the Web Audio API rather than loaded
// from a file -- a bell is just a few inharmonic partials ringing out, so
// this needs no asset and works offline on both Android and iPhone.
function playBell() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();

    const now = audioCtx.currentTime;
    const partials = [
      { freq: 523.3, gain: 0.50, decay: 3.4 },
      { freq: 784.0, gain: 0.16, decay: 2.4 },
      { freq: 1046.5, gain: 0.28, decay: 2.2 },
      { freq: 1567.9, gain: 0.14, decay: 1.6 },
      { freq: 2093.0, gain: 0.09, decay: 1.1 },
    ];

    partials.forEach(p => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = p.freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(p.gain, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + p.decay + 0.05);
    });
  } catch {
    // No Web Audio support -- the visual darshan still works fine.
  }
}

function playMorya() {
  const audio = document.getElementById("audio-morya");
  audio.currentTime = 0;
  return audio.play().catch(() => {
    // Autoplay blocked, or assets/bappa-morya.mp3 hasn't been added --
    // the chant is a bonus, so carry on silently.
  });
}

// iOS won't play audio later unless it was first started inside a user
// gesture, so prime the element on the very first tap (the door).
function primeMoryaAudio() {
  const audio = document.getElementById("audio-morya");
  audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
  }).catch(() => {});
}

// ============================================================
// PETALS
// ============================================================
const PETAL_CHARS = ["🌸", "🌺", "🌼", "🏵️", "🌹"];

function showerPetals(count = 22) {
  const layer = document.getElementById("petal-layer");
  for (let i = 0; i < count; i++) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.textContent = PETAL_CHARS[Math.floor(Math.random() * PETAL_CHARS.length)];
    petal.style.left = Math.random() * 100 + "vw";
    petal.style.fontSize = (14 + Math.random() * 16) + "px";
    const duration = 3.5 + Math.random() * 3;
    petal.style.animationDuration = duration + "s";
    petal.style.animationDelay = (Math.random() * 1.5) + "s";
    layer.appendChild(petal);
    setTimeout(() => petal.remove(), (duration + 2) * 1000);
  }
}

function floatWishUp(wishText) {
  const el = document.createElement("div");
  el.className = "rising-wish";
  const petal = document.createElement("span");
  petal.className = "rw-petal";
  petal.textContent = "🌸";
  el.appendChild(petal);

  if (wishText) {
    const text = document.createElement("span");
    text.className = "rw-text";
    text.textContent = wishText.length > 60 ? wishText.slice(0, 60) + "…" : wishText;
    el.appendChild(text);
  }

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1700);
}

// ============================================================
// TEMPLE DOORS
// ============================================================
const doors = document.getElementById("doors");
let doorsOpened = false;

function openDoors() {
  if (doorsOpened) return;
  doorsOpened = true;

  playBell();
  buzz([18, 60, 18]);
  primeMoryaAudio();
  doors.classList.add("open");
  document.getElementById("welcome-photo").classList.add("darshan");
  setTimeout(() => showerPetals(16), 500);
  setTimeout(() => doors.classList.add("gone"), 1700);
}

doors.addEventListener("click", openDoors);

// ============================================================
// FESTIVAL DAY BADGE
// ============================================================
function renderDayBadge() {
  if (!FESTIVAL_START) return;

  const start = new Date(FESTIVAL_START + "T00:00:00");
  if (isNaN(start)) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const day = Math.floor((today - start) / 86400000) + 1;
  if (day < 1 || day > FESTIVAL_DAYS) return;

  const badge = document.getElementById("day-badge");
  badge.textContent = `🪔 Day ${day} of our celebration`;
  badge.style.display = "block";
}
renderDayBadge();

// Fall back to an 🕉️ wherever a Bappa photo fails to load.
document.querySelectorAll(".bappa-img").forEach(img => {
  const markMissing = () => img.parentElement.classList.add("img-missing");
  if (img.complete && img.naturalWidth === 0) markMissing();
  img.addEventListener("error", markMissing);
});

// ============================================================
// WISH -> BLESSING MATCHING
// ============================================================
const BLESSING_CATEGORIES = [
  {
    keywords: ["exam", "marks", "study", "studies", "college", "school", "result", "grade", "test", "board", "entrance", "admission"],
    message: "Bappa blesses you with a sharp mind and steady focus. You will do wonderfully in your exams! 📚✨"
  },
  {
    keywords: ["job", "career", "interview", "promotion", "work", "placement", "office", "appraisal", "internship"],
    message: "Bappa opens doors of new opportunity for you. Your career will flourish! 💼🌟"
  },
  {
    keywords: ["health", "ill", "sick", "recover", "surgery", "hospital", "pain", "doctor", "medicine", "operation"],
    message: "Bappa blesses you and your loved ones with good health, strength, and a speedy recovery. 💪🌿"
  },
  {
    keywords: ["marriage", "marry", "wedding", "relationship", "love", "partner", "engaged", "girlfriend", "boyfriend", "husband", "wife"],
    message: "Bappa blesses your relationships with harmony, understanding, and lasting happiness. 💞"
  },
  {
    keywords: ["money", "wealth", "business", "finance", "loan", "property", "rich", "profit", "salary", "startup", "shop"],
    message: "Bappa showers you with prosperity and abundance in everything you undertake. 💰🙏"
  },
  {
    keywords: ["family", "happiness", "peace", "home", "parents", "children", "kids", "baby", "mother", "father"],
    message: "Bappa fills your home with peace, love, and laughter, always. 🏡❤️"
  },
  {
    keywords: ["travel", "journey", "trip", "flight", "abroad", "visa", "foreign"],
    message: "Bappa guides your journey safely and makes it joyful from start to finish. ✈️🛡️"
  },
  {
    keywords: ["exam stress", "worry", "fear", "anxiety", "tension", "stress", "depress", "sad", "lonely"],
    message: "Bappa lifts every worry from your heart and fills it with calm and courage. 🕊️💛"
  },
];

const DEFAULT_BLESSING = "Bappa blesses you with happiness, good health, and success in everything you do. 🙏✨";

function getBlessing(wishText) {
  const text = (wishText || "").toLowerCase();
  for (const category of BLESSING_CATEGORIES) {
    if (category.keywords.some(k => text.includes(k))) return category.message;
  }
  return DEFAULT_BLESSING;
}

// ============================================================
// WISH SUBMISSION -> BLESSING
// ============================================================
function getName() { return document.getElementById("input-name").value.trim(); }
function getWish() { return document.getElementById("input-wish").value.trim(); }

document.getElementById("btn-goto-wish").addEventListener("click", () => {
  showScreen("section-wish");
});

document.getElementById("input-wish").addEventListener("input", () => {
  document.getElementById("wish-error").style.display = "none";
});

document.getElementById("btn-submit-wish").addEventListener("click", () => {
  const wish = getWish();
  if (!wish) {
    document.getElementById("wish-error").style.display = "block";
    document.getElementById("input-wish").focus();
    return;
  }

  // The wish drifts up on a petal to Bappa's feet, then the blessing appears.
  document.getElementById("input-wish").blur(); // drop the keyboard first
  floatWishUp(wish);
  playBell();
  buzz(15);
  setTimeout(revealBlessing, 1250);
});

function revealBlessing() {
  const name = getName();
  const wish = getWish();

  document.getElementById("bc-name").textContent = name ? `For ${name}` : "For you";
  document.getElementById("bc-wish").textContent = wish ? `"${wish}"` : "";
  document.getElementById("bc-blessing").textContent = getBlessing(wish);

  showScreen("section-blessing");
  showerPetals(26);
  playMorya();
}

// ============================================================
// DOWNLOADABLE BLESSING PHOTO
// ============================================================
// The card is redrawn on a <canvas> rather than screenshotted from the page,
// so the saved photo is crisp, portrait-sized for phones and WhatsApp
// statuses, and looks the same on every device.

const PHOTO_W = 1080;
const PHOTO_H = 1350;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Word-wraps text to maxWidth, capped at maxLines (the last line gets "…").
function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (ctx.measureText(attempt).width <= maxWidth || !line) {
      line = attempt;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + "…").width > maxWidth && last.includes(" ")) {
      last = last.slice(0, last.lastIndexOf(" "));
    }
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Temple-arch outline: an elliptical dome on top of a straight-sided base.
function archPath(ctx, x, y, w, h, domeH) {
  const r = 18;
  ctx.beginPath();
  ctx.moveTo(x, y + domeH);
  ctx.ellipse(x + w / 2, y + domeH, w / 2, domeH, 0, Math.PI, 0);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.closePath();
}

async function renderBlessingPhoto() {
  // Canvas text doesn't wait for web fonts, so load them explicitly first.
  await Promise.all([
    document.fonts.load('60px "Yatra One"', "गणपती Bappa"),
    document.fonts.load('40px "Poppins"'),
    document.fonts.load('italic 34px "Poppins"'),
  ]).catch(() => {});

  const bappa = await loadImage("assets/ganpati-portrait.jpg").catch(() => null);

  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_W;
  canvas.height = PHOTO_H;
  const ctx = canvas.getContext("2d");
  ctx.textAlign = "center";
  const cx = PHOTO_W / 2;

  // Maroon festive background with a saffron glow at the top
  const bg = ctx.createRadialGradient(cx, 0, 40, cx, 0, PHOTO_H * 1.05);
  bg.addColorStop(0, "#ff7a1a");
  bg.addColorStop(0.5, "#5b0e15");
  bg.addColorStop(1, "#3a070c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, PHOTO_W, PHOTO_H);

  // Cream card with a double gold border
  const m = 44;
  const cream = ctx.createLinearGradient(0, m, 0, PHOTO_H - m);
  cream.addColorStop(0, "#fff8e9");
  cream.addColorStop(1, "#ffeccc");
  roundedRectPath(ctx, m, m, PHOTO_W - m * 2, PHOTO_H - m * 2, 36);
  ctx.fillStyle = cream;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffcd6b";
  ctx.stroke();
  roundedRectPath(ctx, m + 14, m + 14, PHOTO_W - (m + 14) * 2, PHOTO_H - (m + 14) * 2, 26);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Marigold toran along the top edge
  ctx.font = '34px sans-serif';
  ctx.fillText("🌼 🍃 🌼 🍃 🌼 🍃 🌼", cx, m + 58);

  // Bappa in a temple-arch window, with a soft golden glow behind
  const aw = 620, ah = 520, ax = cx - aw / 2, ay = 124, dome = 190;
  ctx.save();
  ctx.shadowColor = "rgba(255,170,60,.85)";
  ctx.shadowBlur = 50;
  archPath(ctx, ax, ay, aw, ah, dome);
  ctx.fillStyle = "#ffe0b0";
  ctx.fill();
  ctx.restore();

  ctx.save();
  archPath(ctx, ax, ay, aw, ah, dome);
  ctx.clip();
  if (bappa) {
    // "object-fit: cover", biased toward the top so the crown stays in frame
    const scale = Math.max(aw / bappa.width, ah / bappa.height);
    const sw = aw / scale, sh = ah / scale;
    const sx = (bappa.width - sw) / 2;
    const sy = (bappa.height - sh) * 0.06;
    ctx.drawImage(bappa, sx, sy, sw, sh, ax, ay, aw, ah);
  } else {
    ctx.font = '200px sans-serif';
    ctx.fillText("🕉️", cx, ay + ah / 2 + 70);
  }
  ctx.restore();

  archPath(ctx, ax, ay, aw, ah, dome);
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#ffcd6b";
  ctx.stroke();

  // Text block
  let y = ay + ah + 70;
  ctx.fillStyle = "#ff7a1a";
  ctx.font = '38px "Yatra One", serif';
  ctx.fillText("Bappa's Blessing", cx, y);

  const textWidth = PHOTO_W - 220;
  const name = getName();
  const nameText = name ? `For ${name}` : "For you";
  y += 72;
  ctx.fillStyle = "#5b0e15";
  let nameSize = 58;
  do {
    ctx.font = `${nameSize}px "Yatra One", serif`;
  } while (ctx.measureText(nameText).width > textWidth && (nameSize -= 4) > 30);
  ctx.fillText(nameText, cx, y);
  const wish = getWish();
  if (wish) {
    ctx.fillStyle = "#8a6a52";
    ctx.font = 'italic 32px "Poppins", sans-serif';
    for (const line of wrapLines(ctx, `"${wish}"`, textWidth, 2)) {
      y += 46;
      ctx.fillText(line, cx, y);
    }
  }

  // Bottom section is anchored, so the blessing gets whatever room is left
  const footerTop = PHOTO_H - m - 186;
  const blessing = getBlessing(wish);
  let size = 40;
  let lines;
  ctx.fillStyle = "#3a2417";
  do {
    ctx.font = `${size}px "Poppins", sans-serif`;
    lines = wrapLines(ctx, blessing, textWidth, 4);
    const needed = lines.length * size * 1.4 + 30;
    if (y + needed <= footerTop - 30 || size <= 28) break;
    size -= 2;
  } while (true);
  y += 30;
  for (const line of lines) {
    y += size * 1.4;
    ctx.fillText(line, cx, y);
  }

  // Footer
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = "#ffcd6b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(150, footerTop + 16);
  ctx.lineTo(PHOTO_W - 150, footerTop + 16);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#5b0e15";
  ctx.font = '46px "Yatra One", serif';
  ctx.fillText("गणपती बाप्पा मोरया! 🙏", cx, footerTop + 80);

  ctx.fillStyle = "#9a7b62";
  ctx.font = '26px "Poppins", sans-serif';
  ctx.fillText(`Deshmukh Family · Ganesh Chaturthi ${new Date().getFullYear()}`, cx, footerTop + 124);

  return canvas;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 3000);
}

function blessingFileName() {
  const name = getName().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  return `Bappa-Blessing${name ? "-" + name : ""}.jpg`;
}

document.getElementById("btn-download").addEventListener("click", async () => {
  const btn = document.getElementById("btn-download");
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "✨ Preparing your photo…";
  buzz(12);

  try {
    const canvas = await renderBlessingPhoto();

    if (getPlatform() === "ios") {
      // iPhone Safari saves "downloads" to the Files app, where nobody looks.
      // Showing the image lets the guest press-and-hold -> Save to Photos.
      document.getElementById("save-preview").src = canvas.toDataURL("image/jpeg", 0.92);
      document.getElementById("save-overlay").hidden = false;
    } else {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = blessingFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast("📥 Saved! Find it in your gallery or Downloads");
    }
  } catch {
    showToast("Couldn't create the photo. A screenshot works too 📸");
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
});

document.getElementById("btn-close-save").addEventListener("click", () => {
  document.getElementById("save-overlay").hidden = true;
});

// ============================================================
// OFFERING SELECTION
// ============================================================
const offerings = document.querySelectorAll(".offering");
const customAmountInput = document.getElementById("input-custom-amount");

document.getElementById("btn-goto-offering").addEventListener("click", () => {
  showScreen("section-offering");
});

document.getElementById("btn-back-to-blessing").addEventListener("click", () => {
  showScreen("section-blessing");
});

document.getElementById("btn-skip-offering").addEventListener("click", () => {
  showThankYou(false);
});

offerings.forEach(offering => {
  offering.addEventListener("click", () => {
    offerings.forEach(o => o.classList.remove("selected"));
    offering.classList.add("selected");

    if (offering.dataset.amount === "custom") {
      customAmountInput.style.display = "block";
      customAmountInput.focus();
      selectedAmount = customAmountInput.value || null;
    } else {
      customAmountInput.style.display = "none";
      selectedAmount = offering.dataset.amount;
    }
  });
});

customAmountInput.addEventListener("input", () => {
  selectedAmount = customAmountInput.value;
});

// ============================================================
// PLACING THE OFFERING
// ============================================================
// Why there's no "tap to pay ₹201" link: GPay blocks payment links that are
// pre-filled with a *personal* UPI ID ("exceeded bank limit / money not
// debited"), whatever the amount -- only merchant UPI IDs are allowed that.
// So guests pay the two ways GPay always allows between people: scanning a
// QR with GPay's own scanner (the Offering Box QR at Bappa's feet), or
// entering a UPI ID. The site copies the UPI ID and opens GPay for them.

const GPAY_ANDROID_PACKAGE = "com.google.android.apps.nbu.paisa.user";

let openAppTimer = null;

function getPlatform() {
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return "android";
  // iPadOS 13+ reports a Mac user agent, so check for touch support too.
  if (/iPhone|iPad|iPod/i.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "other";
}

function formattedAmount() {
  const amount = Number(selectedAmount);
  return amount > 0 ? `₹${amount}` : null;
}

document.getElementById("btn-continue-offer").addEventListener("click", () => {
  if (!document.querySelector(".offering.selected")) {
    showToast("Please choose an offering first 🙏");
    return;
  }

  const amount = formattedAmount();
  document.getElementById("pay-heading").textContent =
    amount ? `Place your ${amount} offering` : "Place your offering";
  document.querySelectorAll(".pay-amount").forEach(el => {
    el.textContent = amount || "your offering";
  });
  document.getElementById("open-gpay-hint").hidden = true;
  buzz(12);
  showScreen("section-pay");
});

function showOpenGpayHint() {
  document.getElementById("open-gpay-hint").hidden = false;
}

// Opens GPay's home screen, where the Scan QR and Pay UPI ID buttons are.
function openGpay() {
  sessionStorage.setItem("ganpati_awaiting_payment", "1");
  document.getElementById("open-gpay-hint").hidden = true;

  // If this page is still on screen a moment later, GPay didn't open.
  clearTimeout(openAppTimer);
  openAppTimer = setTimeout(() => {
    if (document.visibilityState === "visible") showOpenGpayHint();
  }, 2500);

  const platform = getPlatform();
  if (platform === "android") {
    // Launch the GPay app itself. If Chrome can't, it follows the fallback
    // URL instead: this same page plus a #fragment, which doesn't reload the
    // page -- it just shows the "open it yourself" hint.
    const fallback = encodeURIComponent(location.href.split("#")[0] + "#gpay-not-opened");
    location.href = "intent:#Intent;action=android.intent.action.MAIN;" +
      `category=android.intent.category.LAUNCHER;package=${GPAY_ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${fallback};end`;
  } else if (platform === "ios") {
    // GPay India claims the tez:// scheme on iPhone.
    location.href = "tez://";
  }
  // On a computer there's no GPay to open, so the hint shows after the timer.
}

window.addEventListener("hashchange", () => {
  if (location.hash !== "#gpay-not-opened") return;
  history.replaceState(null, "", location.pathname + location.search);
  showOpenGpayHint();
});

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  // The clipboard API only exists on https (and localhost), so fall back to
  // the older copy command -- e.g. when testing over WiFi on http.
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, text.length);
  let copied = false;
  try { copied = document.execCommand("copy"); } catch {}
  area.remove();
  return copied;
}

document.getElementById("upi-id-display").textContent = UPI_ID;

document.getElementById("btn-open-gpay").addEventListener("click", () => {
  buzz(12);
  openGpay();
});

document.getElementById("btn-copy-open-gpay").addEventListener("click", async () => {
  buzz(12);
  const copied = await copyText(UPI_ID);
  if (copied) {
    showToast("📋 UPI ID copied! Paste it in GPay");
    // A short pause so the guest sees it was copied before GPay takes over.
    setTimeout(openGpay, 600);
  } else {
    // Rare, but never leave them stuck: the UPI ID is on screen to long-press.
    showToast("Press and hold the UPI ID above to copy it");
  }
});

document.getElementById("btn-back-from-pay").addEventListener("click", () => {
  clearTimeout(openAppTimer);
  sessionStorage.removeItem("ganpati_awaiting_payment");
  showScreen("section-offering");
});

document.getElementById("btn-confirm-paid").addEventListener("click", () => {
  showThankYou(true);
});

// When the guest comes back from GPay, thank them automatically.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    // GPay opened, so the "didn't open" hint isn't needed.
    clearTimeout(openAppTimer);
    return;
  }
  if (sessionStorage.getItem("ganpati_awaiting_payment") === "1") {
    showThankYou(true);
  }
});

// ============================================================
// THANK YOU
// ============================================================
function showThankYou(didOffer) {
  clearTimeout(openAppTimer);
  sessionStorage.removeItem("ganpati_awaiting_payment");

  // Built from text nodes, not innerHTML, since the name is typed by the guest.
  const name = getName();
  const heading = document.getElementById("ty-heading");
  heading.replaceChildren(
    name ? `Thank you, ${name}!` : "Thank you",
    document.createElement("br"),
    name ? "From our family to yours" : "from our family to yours"
  );

  document.getElementById("ty-text").textContent = didOffer
    ? "Your offering has been received with so much gratitude. May Bappa return it to you many times over. 🙏"
    : "Thank you for your prayers and for being part of our celebration. Bappa's blessings are always with you. 🙏";

  showScreen("section-thankyou");
  showerPetals(30);
  playBell();
  setTimeout(playMorya, 400);
}

// ============================================================
// RESTART
// ============================================================
document.getElementById("btn-restart").addEventListener("click", () => {
  document.getElementById("input-name").value = "";
  document.getElementById("input-wish").value = "";
  document.getElementById("wish-error").style.display = "none";
  customAmountInput.value = "";
  customAmountInput.style.display = "none";
  offerings.forEach(o => o.classList.remove("selected"));
  selectedAmount = null;
  document.getElementById("save-overlay").hidden = true;
  sessionStorage.clear();
  showScreen("section-welcome");
});
