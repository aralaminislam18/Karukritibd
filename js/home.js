// ==========================================================================
// HOMEPAGE LOGIC
// ==========================================================================
import { db, ref, onValue, get } from "./firebase-config.js?v=2";
import { seedDemoData } from "./seed-data.js?v=2";
import { formatPrice, updateCartBadge, esc, renderIconHtml } from "./utils.js?v=2";

seedDemoData();
updateCartBadge();
initPromoPopup();

let bannerTimer = null;
let currentBannerIndex = 0;
let allProducts = {};
let allCategories = {};
let activeCategory = "all";
let searchQuery = "";

// ---------- Admin secret tap ----------
const logoTap = document.getElementById("logoTap");
const adminModal = document.getElementById("adminModal");
const adminPinInput = document.getElementById("adminPinInput");
const adminPinError = document.getElementById("adminPinError");
const ADMIN_PASSWORD = "18924";

let tapCount = 0;
let tapTimer = null;
logoTap.addEventListener("click", () => {
  tapCount++;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => { tapCount = 0; }, 1500);
  if (tapCount >= 5) {
    tapCount = 0;
    adminModal.classList.add("show");
    adminPinInput.value = "";
    adminPinError.textContent = "";
    setTimeout(() => adminPinInput.focus(), 200);
  }
});

document.getElementById("adminCancelBtn").addEventListener("click", () => {
  adminModal.classList.remove("show");
});

function trySubmitAdminPin() {
  if (adminPinInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem("shopbd_admin_auth", "1");
    window.location.href = "admin/index.html";
  } else {
    adminPinError.textContent = "ভুল পাসওয়ার্ড, আবার চেষ্টা করুন";
    adminPinInput.value = "";
  }
}
document.getElementById("adminSubmitBtn").addEventListener("click", trySubmitAdminPin);
adminPinInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") trySubmitAdminPin();
});

// ---------- Product Search (ক্লিকে বড় হবে, ছাড়ার পর ছোট হয়ে যাবে) ----------
const headerSearch = document.getElementById("headerSearch");
const productSearchInput = document.getElementById("productSearchInput");
const searchToggleBtn = document.getElementById("searchToggleBtn");

if (headerSearch && productSearchInput && searchToggleBtn) {
  searchToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isExpanded = headerSearch.classList.contains("expanded");
    if (!isExpanded) {
      headerSearch.classList.add("expanded");
      productSearchInput.focus();
    } else if (productSearchInput.value.trim() === "") {
      headerSearch.classList.remove("expanded");
    } else {
      productSearchInput.focus();
    }
  });

  productSearchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderProducts();
  });

  productSearchInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (productSearchInput.value.trim() === "") {
        headerSearch.classList.remove("expanded");
      }
    }, 150);
  });
}

// ---------- Banner Slider ----------
function renderBanners(banners) {
  const track = document.getElementById("bannerTrack");
  const dots = document.getElementById("bannerDots");
  const sorted = Object.values(banners).sort((a, b) => (a.order || 0) - (b.order || 0));

  if (sorted.length === 0) {
    document.getElementById("bannerSlider").style.display = "none";
    return;
  }

  track.innerHTML = sorted.map(b => `
    <div class="banner-slide"><img src="${esc(b.image)}" alt="প্রোমো ব্যানার" loading="lazy"></div>
  `).join("");

  dots.innerHTML = sorted.map((_, i) => `<div class="banner-dot ${i === 0 ? 'active' : ''}"></div>`).join("");

  currentBannerIndex = 0;
  clearInterval(bannerTimer);
  bannerTimer = setInterval(() => {
    currentBannerIndex = (currentBannerIndex + 1) % sorted.length;
    track.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
    document.querySelectorAll(".banner-dot").forEach((d, i) => {
      d.classList.toggle("active", i === currentBannerIndex);
    });
  }, 5000);
}

// ---------- Categories ----------
function renderCategories(categories) {
  allCategories = categories;
  const scroll = document.getElementById("categoryScroll");
  const cats = Object.values(categories);

  let html = `<div class="category-chip active" data-cat="all">
    <span class="cat-icon-box">🏷️</span><span class="cat-name">সব</span>
  </div>`;
  html += cats.map(c => `
    <div class="category-chip" data-cat="${esc(c.id)}">
      <span class="cat-icon-box">${renderIconHtml(c.icon)}</span><span class="cat-name">${esc(c.name)}</span>
    </div>
  `).join("");
  scroll.innerHTML = html;

  scroll.querySelectorAll(".category-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      scroll.querySelectorAll(".category-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeCategory = chip.dataset.cat;
      const heading = document.getElementById("productsHeading");
      heading.textContent = activeCategory === "all" ? "সব প্রোডাক্ট" : (categories[activeCategory]?.name || "প্রোডাক্ট");
      renderProducts();
    });
  });
}

// ---------- Search matching (৪০% অক্ষর মিল হলে সাজেশনে আসবে) ----------
function normalizeText(str) {
  return (str || "").toString().toLowerCase().trim();
}

// Query-এর কতটুকু অংশ target-এর ভেতরে ধারাবাহিকভাবে (substring হিসেবে) পাওয়া যাচ্ছে
// তার ভিত্তিতে মিলের শতাংশ বের করে। খুব ছোট query দিয়েও কাজ করে।
function matchPercentage(query, target) {
  query = normalizeText(query);
  target = normalizeText(target);
  if (!query) return 100;
  if (!target) return 0;

  // সরাসরি substring হিসেবে থাকলে বেশি স্কোর
  if (target.includes(query)) return 100;

  // অক্ষর ধরে ধরে মিলানো (query-এর কতগুলো ক্যারেক্টার target-এ ক্রমানুসারে পাওয়া যায়)
  let qi = 0;
  let matchedChars = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) {
      matchedChars++;
      qi++;
    }
  }
  return (matchedChars / query.length) * 100;
}

function productMatchesSearch(product, query) {
  if (!query) return true;
  const nameScore = matchPercentage(query, product.name);
  const idScore = matchPercentage(query, product.id);
  return Math.max(nameScore, idScore) >= 40;
}

// ---------- Products ----------
function renderProducts() {
  const grid = document.getElementById("productGrid");
  let products = Object.values(allProducts);

  if (activeCategory !== "all") {
    products = products.filter(p => p.category === activeCategory);
  }

  if (searchQuery) {
    products = products.filter(p => productMatchesSearch(p, searchQuery));
  }

  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <div class="emoji">📦</div><p>কোনো প্রোডাক্ট পাওয়া যায়নি</p>
    </div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const discount = p.oldPrice && p.oldPrice > p.price
      ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const img = (p.images && p.images[0]) || "";
    return `
      <a href="pages/product.html?id=${esc(p.id)}" class="product-card fade-in">
        <div class="img-wrap">
          <img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">
          ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ""}
          ${p.stock === false ? `<div class="stock-badge">স্টক নেই</div>` : ""}
        </div>
        <div class="product-info">
          <div class="product-name">${esc(p.name)}</div>
          <div class="price-row">
            <span class="price-now">${formatPrice(p.price)}</span>
            ${p.oldPrice && p.oldPrice > p.price ? `<span class="price-old">${formatPrice(p.oldPrice)}</span>` : ""}
          </div>
        </div>
      </a>
    `;
  }).join("");
}

// ---------- Promo Popup (অ্যাডমিন থেকে অন করলে হোমপেজ লোড হওয়ার সাথে সাথে দেখাবে) ----------
async function initPromoPopup() {
  try {
    const snap = await get(ref(db, "settings/promo"));
    const promo = snap.val();
    if (!promo || !promo.enabled || !promo.image) return;
    showPromoPopup(promo);
  } catch (err) {
    console.error("Promo popup load error:", err);
  }
}

function showPromoPopup(promo) {
  const overlay = document.getElementById("promoOverlay");
  const img = document.getElementById("promoImage");
  const titleEl = document.getElementById("promoTitleText");
  const closeBtn = document.getElementById("promoCloseBtn");

  img.src = promo.image;
  if (promo.title) {
    titleEl.textContent = promo.title;
    titleEl.style.display = "block";
  } else {
    titleEl.style.display = "none";
  }

  closeBtn.classList.remove("visible");
  overlay.classList.add("show");

  let closed = false;
  function closePopup() {
    if (closed) return;
    closed = true;
    overlay.classList.remove("show");
  }

  // প্রথম ২ সেকেন্ড কেউ বন্ধ করতে পারবে না, তারপর ক্রস চিহ্ন দেখা যাবে এবং অটো বন্ধ হয়ে যাবে
  setTimeout(() => {
    closeBtn.classList.add("visible");
  }, 2000);

  closeBtn.onclick = closePopup;
}

// ---------- Firebase listeners ----------
onValue(ref(db, "banners"), (snap) => {
  renderBanners(snap.val() || {});
});

onValue(ref(db, "categories"), (snap) => {
  renderCategories(snap.val() || {});
});

onValue(ref(db, "products"), (snap) => {
  allProducts = snap.val() || {};
  renderProducts();
});

onValue(ref(db, "settings/siteName"), (snap) => {
  const name = snap.val();
  if (name) document.getElementById("siteNameLabel").textContent = name;
});
