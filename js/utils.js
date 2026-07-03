// ==========================================================================
// UTILS — শেয়ার্ড হেল্পার ফাংশন (কার্ট, টোস্ট, ফরম্যাটিং)
// নতুন কোনো ইউটিলিটি ফাংশন দরকার হলে এখানে যোগ করুন
// ==========================================================================

export function formatPrice(num) {
  return "৳" + Number(num).toLocaleString("en-BD");
}

export function showToast(message, duration = 2200) {
  let toast = document.getElementById("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), duration);
}

// ---------- Cart (localStorage — per-device shopping cart) ----------
const CART_KEY = "shopbd_cart";

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

export function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images ? product.images[0] : "",
      qty
    });
  }
  saveCart(cart);
}

export function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
}

export function updateCartQty(productId, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty = qty;
    if (item.qty <= 0) return removeFromCart(productId);
  }
  saveCart(cart);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

export function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

export function updateCartBadge() {
  const badge = document.querySelector(".cart-badge");
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

// ---------- Buy Now (single item, skips cart) ----------
export function setBuyNow(product, qty = 1) {
  sessionStorage.setItem("shopbd_buynow", JSON.stringify({
    id: product.id, name: product.name, price: product.price,
    image: product.images ? product.images[0] : "", qty
  }));
}
export function getBuyNow() {
  try {
    return JSON.parse(sessionStorage.getItem("shopbd_buynow"));
  } catch { return null; }
}
export function clearBuyNow() {
  sessionStorage.removeItem("shopbd_buynow");
}

// ---------- Logo secret-tap → admin login ----------
export function bindAdminSecretTap(el, redirectUrl) {
  let count = 0;
  let timer = null;
  el.addEventListener("click", () => {
    count++;
    clearTimeout(timer);
    timer = setTimeout(() => { count = 0; }, 1500);
    if (count >= 5) {
      count = 0;
      window.location.href = redirectUrl;
    }
  });
}

// ---------- Simple HTML escape (basic XSS guard for user-entered text) ----------
export function esc(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---------- Category Icon Renderer ----------
// অ্যাডমিন ইমোজি / ছবির লিংক / HTML-SVG কোড — যেকোনো একটা দিতে পারে।
// এটা ডিটেক্ট করে সঠিকভাবে রেন্ডার করে, .cat-icon-box (ফিক্সড সাইজ) এর ভিতরে বসানোর জন্য।
// নোট: HTML/SVG ইনপুট শুধু অ্যাডমিন প্যানেল (পাসওয়ার্ড প্রোটেক্টেড) থেকে আসে, তাই innerHTML সরাসরি বসানো হয়েছে।
export function renderIconHtml(value) {
  const v = (value ?? "").toString().trim();
  if (!v) return "🏷️";
  if (/^https?:\/\//i.test(v) || v.startsWith("data:image")) {
    return `<img src="${esc(v)}" alt="">`;
  }
  if (v.includes("<")) {
    return v; // HTML বা SVG কোড — যেমন আছে তেমন রেন্ডার হবে
  }
  return esc(v); // সাধারণ ইমোজি/টেক্সট
}

// ---------- Customer Session (চেকআউটে লগইন/রেজিস্ট্রেশনের জন্য) ----------
const CUSTOMER_KEY = "shopbd_customer";

export function getCustomerSession() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY));
  } catch {
    return null;
  }
}

export function setCustomerSession(customer) {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
}

export function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_KEY);
}
