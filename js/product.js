// ==========================================================================
// PRODUCT DETAIL PAGE LOGIC
// ==========================================================================
import { db, ref, get, child } from "../js/firebase-config.js?v=2";
import { formatPrice, showToast, addToCart, setBuyNow, updateCartBadge, esc } from "../js/utils.js?v=2";

updateCartBadge();

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const content = document.getElementById("productContent");

let currentQty = 1;
let currentSlide = 0;
let productData = null;

async function loadProduct() {
  if (!productId) {
    content.innerHTML = `<div class="empty-state" style="margin-top:100px;"><div class="emoji">❌</div><p>প্রোডাক্ট পাওয়া যায়নি</p></div>`;
    return;
  }
  try {
    const snap = await get(child(ref(db), `products/${productId}`));
    if (!snap.exists()) {
      content.innerHTML = `<div class="empty-state" style="margin-top:100px;"><div class="emoji">❌</div><p>প্রোডাক্ট পাওয়া যায়নি</p></div>`;
      return;
    }
    productData = { id: productId, ...snap.val() };

    // fetch category name
    let catName = "";
    if (productData.category) {
      const catSnap = await get(child(ref(db), `categories/${productData.category}`));
      if (catSnap.exists()) catName = catSnap.val().name;
    }

    renderProduct(productData, catName);
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="empty-state" style="margin-top:100px;"><div class="emoji">⚠️</div><p>লোড করতে সমস্যা হয়েছে</p></div>`;
  }
}

function renderProduct(p, catName) {
  const images = (p.images && p.images.length) ? p.images : ["https://placehold.co/600x600?text=No+Image"];
  const discount = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const outOfStock = p.stock === false;

  content.innerHTML = `
    <div class="pd-gallery">
      <div class="pd-gallery-track" id="galleryTrack">
        ${images.map(img => `<div class="pd-gallery-slide"><img src="${esc(img)}" alt="${esc(p.name)}"></div>`).join("")}
      </div>
      ${discount > 0 ? `<span class="discount-badge" style="top:56px;">-${discount}%</span>` : ""}
    </div>
    ${images.length > 1 ? `
      <div class="pd-thumbs" id="pdThumbs">
        ${images.map((img, i) => `<div class="pd-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}"><img src="${esc(img)}"></div>`).join("")}
      </div>` : ""}

    <div class="pd-body">
      ${catName ? `<span class="pd-cat-tag">${esc(catName)}</span>` : ""}
      <div class="pd-name">${esc(p.name)}</div>
      <div class="pd-price-row">
        <span class="pd-price-now">${formatPrice(p.price)}</span>
        ${discount > 0 ? `<span class="pd-price-old">${formatPrice(p.oldPrice)}</span>` : ""}
      </div>

      ${outOfStock ? `<div style="background:#fdecea;color:#c0392b;padding:10px 14px;border-radius:10px;font-weight:700;font-size:13px;margin-bottom:12px;">এই মুহূর্তে স্টকে নেই</div>` : ""}

      <div class="flex items-center gap-12">
        <span style="font-weight:700; font-size:14px;">পরিমাণ:</span>
        <div class="qty-stepper">
          <button id="qtyMinus">−</button>
          <span id="qtyValue">1</span>
          <button id="qtyPlus">+</button>
        </div>
      </div>

      <div class="pd-desc-title">প্রোডাক্ট বিবরণ</div>
      <div class="pd-desc">${esc(p.description || "কোনো বিবরণ দেওয়া হয়নি।")}</div>
    </div>

    <div class="sticky-bar">
      <button class="btn btn-outline" id="addCartBtn" ${outOfStock ? "disabled" : ""}>🛒 কার্টে যোগ</button>
      <button class="btn btn-primary btn-block" id="orderNowBtn" ${outOfStock ? "disabled" : ""}>এখনই অর্ডার করুন</button>
    </div>
  `;

  // gallery swipe/thumb logic
  const track = document.getElementById("galleryTrack");
  const thumbs = document.querySelectorAll(".pd-thumb");
  thumbs.forEach(t => {
    t.addEventListener("click", () => {
      currentSlide = parseInt(t.dataset.idx);
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      thumbs.forEach(x => x.classList.remove("active"));
      t.classList.add("active");
    });
  });

  // basic swipe support
  let touchStartX = 0;
  const gallery = document.querySelector(".pd-gallery");
  gallery.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; });
  gallery.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0 && currentSlide < images.length - 1) currentSlide++;
      else if (diff > 0 && currentSlide > 0) currentSlide--;
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      thumbs.forEach((x, i) => x.classList.toggle("active", i === currentSlide));
    }
  });

  // qty stepper
  document.getElementById("qtyMinus").addEventListener("click", () => {
    if (currentQty > 1) { currentQty--; document.getElementById("qtyValue").textContent = currentQty; }
  });
  document.getElementById("qtyPlus").addEventListener("click", () => {
    currentQty++; document.getElementById("qtyValue").textContent = currentQty;
  });

  document.getElementById("addCartBtn")?.addEventListener("click", () => {
    addToCart(productData, currentQty);
    showToast("কার্টে যোগ করা হয়েছে ✓");
  });

  document.getElementById("orderNowBtn")?.addEventListener("click", () => {
    setBuyNow(productData, currentQty);
    window.location.href = "checkout.html?mode=buynow";
  });
}

loadProduct();
