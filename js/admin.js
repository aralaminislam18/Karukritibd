// ==========================================================================
// ADMIN PANEL LOGIC
// ==========================================================================
import { db, ref, get, set, push, update, remove, onValue } from "../js/firebase-config.js?v=2";
import { formatPrice, showToast, esc, renderIconHtml } from "../js/utils.js?v=2";

const ADMIN_PASSWORD = "18924";

let allProducts = {};
let allCategories = {};
let allBanners = {};
let allOrders = {};
let allSettings = {};
let currentOrderFilter = "all";

// ---------- Auth ----------
const loginScreen = document.getElementById("loginScreen");
const adminDashboard = document.getElementById("adminDashboard");

function checkAuth() {
  if (sessionStorage.getItem("shopbd_admin_auth") === "1") {
    showDashboard();
  } else {
    loginScreen.style.display = "flex";
    adminDashboard.style.display = "none";
  }
}

function showDashboard() {
  loginScreen.style.display = "none";
  adminDashboard.style.display = "block";
  initDashboard();
}

document.getElementById("loginBtn").addEventListener("click", tryLogin);
document.getElementById("loginPin").addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });

function tryLogin() {
  const val = document.getElementById("loginPin").value;
  if (val === ADMIN_PASSWORD) {
    sessionStorage.setItem("shopbd_admin_auth", "1");
    showDashboard();
  } else {
    document.getElementById("loginError").textContent = "ভুল পাসওয়ার্ড";
    document.getElementById("loginPin").value = "";
  }
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("shopbd_admin_auth");
  window.location.href = "../index.html";
});

checkAuth();

// ---------- Tabs ----------
function initDashboard() {
  document.querySelectorAll(".admin-tabs .admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tabs .admin-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
      const panelId = "panel-" + tab.dataset.tab;
      document.getElementById(panelId).classList.add("active");
      updateFab(tab.dataset.tab);
    });
  });

  document.querySelectorAll("#ordersFilterBar .admin-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#ordersFilterBar .admin-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentOrderFilter = btn.dataset.status;
      renderOrders();
    });
  });

  updateFab("dashboard");
  bindFab();
  bindForms();
  loadAllData();
}

function updateFab(tabName) {
  const fab = document.getElementById("fabAdd");
  if (tabName === "products" || tabName === "categories" || tabName === "banners") {
    fab.style.display = "flex";
    fab.dataset.for = tabName;
  } else {
    fab.style.display = "none";
  }
}

function bindFab() {
  document.getElementById("fabAdd").addEventListener("click", () => {
    const target = document.getElementById("fabAdd").dataset.for;
    if (target === "products") openProductModal();
    if (target === "categories") openModal("categoryModal");
    if (target === "banners") openModal("bannerModal");
  });
}

function openModal(id) { document.getElementById(id).classList.add("show"); }
function closeModal(id) { document.getElementById(id).classList.remove("show"); }

// close modals on backdrop click
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("show");
  });
});

// ---------- Data loading ----------
function loadAllData() {
  onValue(ref(db, "products"), snap => { allProducts = snap.val() || {}; renderProducts(); renderStats(); });
  onValue(ref(db, "categories"), snap => { allCategories = snap.val() || {}; renderCategories(); populateCategorySelect(); });
  onValue(ref(db, "banners"), snap => { allBanners = snap.val() || {}; renderBanners(); });
  onValue(ref(db, "orders"), snap => { allOrders = snap.val() || {}; renderOrders(); renderStats(); renderRecentOrders(); });
  onValue(ref(db, "settings"), snap => { allSettings = snap.val() || {}; renderSettings(); });
}

// ---------- Dashboard stats ----------
function renderStats() {
  const orders = Object.values(allOrders);
  const products = Object.values(allProducts);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => (o.status || "pending") === "pending").length;
  const totalProducts = products.length;
  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const boxes = document.querySelectorAll("#statGrid .stat-box .stat-num");
  if (boxes.length === 4) {
    boxes[0].textContent = totalOrders;
    boxes[1].textContent = pendingOrders;
    boxes[2].textContent = totalProducts;
    boxes[3].textContent = formatPrice(totalSales);
  }
}

function renderRecentOrders() {
  const el = document.getElementById("recentOrders");
  const orders = Object.entries(allOrders).sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0)).slice(0, 5);
  if (orders.length === 0) { el.textContent = "কোনো অর্ডার নেই"; return; }
  el.innerHTML = orders.map(([id, o]) => `
    <div class="flex justify-between" style="padding:6px 0; border-bottom:1px solid #f0f1f5;">
      <span>${esc(o.customerName)} — ${esc(o.phone)}</span>
      <span style="font-weight:700;">${formatPrice(o.total)}</span>
    </div>
  `).join("");
}

// ---------- Products ----------
function renderProducts() {
  const el = document.getElementById("productsList");
  const products = Object.entries(allProducts);
  if (products.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="emoji">📦</div><p>কোনো প্রোডাক্ট নেই। + বাটনে ক্লিক করে যোগ করুন</p></div>`;
    return;
  }
  el.innerHTML = products.map(([id, p]) => `
    <div class="admin-card">
      <img src="${esc((p.images && p.images[0]) || '')}" alt="">
      <div class="admin-card-info">
        <div class="admin-card-title">${esc(p.name)}</div>
        <div class="admin-card-sub">${formatPrice(p.price)} · ${esc(allCategories[p.category]?.name || "—")} ${p.stock === false ? " · স্টক নেই" : ""}</div>
      </div>
      <div class="admin-card-actions">
        <button class="icon-action" data-edit="${esc(id)}">✏️</button>
        <button class="icon-action danger" data-delete-product="${esc(id)}">🗑️</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openProductModal(btn.dataset.edit));
  });
  el.querySelectorAll("[data-delete-product]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("এই প্রোডাক্টটি ডিলিট করবেন?")) {
        await remove(ref(db, `products/${btn.dataset.deleteProduct}`));
        showToast("প্রোডাক্ট ডিলিট হয়েছে");
      }
    });
  });
}

function populateCategorySelect() {
  const select = document.getElementById("pCategory");
  select.innerHTML = Object.entries(allCategories).map(([id, c]) => `<option value="${esc(id)}">${esc(c.name)}</option>`).join("");
}

function renderImageInputs(images = [""]) {
  const container = document.getElementById("imageInputs");
  const imgs = images.length ? images : [""];
  container.innerHTML = imgs.map((img, i) => `
    <div class="image-input-row">
      <img class="image-preview-thumb" src="${esc(img)}" onerror="this.style.opacity=0.3">
      <input type="text" class="form-input img-url-input" data-idx="${i}" value="${esc(img)}" placeholder="https://...">
      ${imgs.length > 1 ? `<button type="button" class="icon-action danger" data-remove-img="${i}">✕</button>` : ""}
    </div>
  `).join("");

  container.querySelectorAll(".img-url-input").forEach(input => {
    input.addEventListener("input", () => {
      const thumb = input.closest(".image-input-row").querySelector(".image-preview-thumb");
      thumb.src = input.value;
      thumb.style.opacity = 1;
    });
  });
  container.querySelectorAll("[data-remove-img]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.removeImg);
      const current = getImageValues();
      current.splice(idx, 1);
      renderImageInputs(current);
    });
  });

  if (imgs.length < 4) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-outline btn-sm mt-8";
    addBtn.textContent = "+ আরেকটি ছবি যোগ করুন";
    addBtn.addEventListener("click", () => {
      const current = getImageValues();
      current.push("");
      renderImageInputs(current);
    });
    container.appendChild(addBtn);
  }
}

function getImageValues() {
  return Array.from(document.querySelectorAll(".img-url-input")).map(i => i.value.trim()).filter(Boolean);
}

function openProductModal(id = null) {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = id || "";
  document.getElementById("productModalTitle").textContent = id ? "প্রোডাক্ট এডিট করুন" : "নতুন প্রোডাক্ট";
  const stockToggle = document.getElementById("pStockToggle");

  if (id && allProducts[id]) {
    const p = allProducts[id];
    document.getElementById("pName").value = p.name || "";
    document.getElementById("pCategory").value = p.category || "";
    document.getElementById("pPrice").value = p.price || "";
    document.getElementById("pOldPrice").value = p.oldPrice || "";
    document.getElementById("pDescription").value = p.description || "";
    renderImageInputs(p.images || [""]);
    stockToggle.classList.toggle("on", p.stock !== false);
  } else {
    renderImageInputs([""]);
    stockToggle.classList.add("on");
  }

  openModal("productModal");
}

document.getElementById("pStockToggle").addEventListener("click", function () {
  this.classList.toggle("on");
});

function bindForms() {
  document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("productId").value;
    const images = getImageValues();
    const data = {
      name: document.getElementById("pName").value.trim(),
      category: document.getElementById("pCategory").value,
      price: Number(document.getElementById("pPrice").value),
      oldPrice: document.getElementById("pOldPrice").value ? Number(document.getElementById("pOldPrice").value) : null,
      description: document.getElementById("pDescription").value.trim(),
      images: images.length ? images : [],
      stock: document.getElementById("pStockToggle").classList.contains("on")
    };

    try {
      if (id) {
        data.id = id;
        await update(ref(db, `products/${id}`), data);
        showToast("প্রোডাক্ট আপডেট হয়েছে");
      } else {
        const newRef = push(ref(db, "products"));
        data.id = newRef.key;
        await set(newRef, data);
        showToast("প্রোডাক্ট যোগ হয়েছে");
      }
      closeModal("productModal");
    } catch (err) {
      console.error(err);
      showToast("সমস্যা হয়েছে, আবার চেষ্টা করুন");
    }
  });

  document.getElementById("categoryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("catName").value.trim();
    const icon = document.getElementById("catIcon").value.trim() || "🏷️";
    try {
      const newRef = push(ref(db, "categories"));
      await set(newRef, { id: newRef.key, name, icon });
      showToast("ক্যাটাগরি যোগ হয়েছে");
      closeModal("categoryModal");
      document.getElementById("categoryForm").reset();
    } catch (err) {
      console.error(err);
      showToast("সমস্যা হয়েছে");
    }
  });

  document.getElementById("bannerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const image = document.getElementById("bannerImageUrl").value.trim();
    try {
      const order = Object.keys(allBanners).length + 1;
      const newRef = push(ref(db, "banners"));
      await set(newRef, { id: newRef.key, image, order });
      showToast("ব্যানার যোগ হয়েছে");
      closeModal("bannerModal");
      document.getElementById("bannerForm").reset();
    } catch (err) {
      console.error(err);
      showToast("সমস্যা হয়েছে");
    }
  });

  document.getElementById("toggleCod").addEventListener("click", async function () {
    const newVal = !this.classList.contains("on");
    this.classList.toggle("on", newVal);
    await update(ref(db, "settings/paymentMethods"), { cod: newVal });
    showToast("সেভ হয়েছে");
  });

  document.getElementById("toggleOnline").addEventListener("click", async function () {
    const newVal = !this.classList.contains("on");
    this.classList.toggle("on", newVal);
    await update(ref(db, "settings/paymentMethods"), { online: newVal });
    showToast("সেভ হয়েছে");
  });

  document.getElementById("saveNumberBtn").addEventListener("click", async () => {
    const val = document.getElementById("bkashNumberInput").value.trim();
    await update(ref(db, "settings"), { bkashNumber: val, nagadNumber: val });
    showToast("নাম্বার সেভ হয়েছে");
  });

  document.getElementById("saveSiteNameBtn").addEventListener("click", async () => {
    const val = document.getElementById("siteNameInput").value.trim();
    if (!val) return;
    await update(ref(db, "settings"), { siteName: val });
    showToast("সাইটের নাম সেভ হয়েছে");
  });

  document.getElementById("togglePromo").addEventListener("click", async function () {
    const newVal = !this.classList.contains("on");
    this.classList.toggle("on", newVal);
    await update(ref(db, "settings/promo"), { enabled: newVal });
    showToast("সেভ হয়েছে");
  });

  document.getElementById("savePromoBtn").addEventListener("click", async () => {
    const title = document.getElementById("promoTitleInput").value.trim();
    const image = document.getElementById("promoImageInput").value.trim();
    await update(ref(db, "settings/promo"), { title, image });
    showToast("প্রোমো পপআপ সেভ হয়েছে");
  });
}

// ---------- Categories ----------
function renderCategories() {
  const el = document.getElementById("categoriesList");
  const cats = Object.entries(allCategories);
  if (cats.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="emoji">🏷️</div><p>কোনো ক্যাটাগরি নেই</p></div>`;
    return;
  }
  el.innerHTML = cats.map(([id, c]) => `
    <div class="admin-card">
      <div class="cat-icon-box lg">${renderIconHtml(c.icon)}</div>
      <div class="admin-card-info"><div class="admin-card-title">${esc(c.name)}</div></div>
      <div class="admin-card-actions">
        <button class="icon-action danger" data-delete-cat="${esc(id)}">🗑️</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll("[data-delete-cat]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("এই ক্যাটাগরি ডিলিট করবেন? এই ক্যাটাগরির প্রোডাক্টগুলো ক্যাটাগরিহীন হয়ে যাবে।")) {
        await remove(ref(db, `categories/${btn.dataset.deleteCat}`));
        showToast("ক্যাটাগরি ডিলিট হয়েছে");
      }
    });
  });
}

// ---------- Banners ----------
function renderBanners() {
  const el = document.getElementById("bannersList");
  const banners = Object.entries(allBanners).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
  if (banners.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="emoji">🖼️</div><p>কোনো ব্যানার নেই</p></div>`;
    return;
  }
  el.innerHTML = banners.map(([id, b]) => `
    <div class="admin-card">
      <img src="${esc(b.image)}" alt="" style="width:80px; height:45px; border-radius:8px;">
      <div class="admin-card-info"><div class="admin-card-sub">অর্ডার: ${b.order || "—"}</div></div>
      <div class="admin-card-actions">
        <button class="icon-action danger" data-delete-banner="${esc(id)}">🗑️</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll("[data-delete-banner]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("এই ব্যানারটি ডিলিট করবেন?")) {
        await remove(ref(db, `banners/${btn.dataset.deleteBanner}`));
        showToast("ব্যানার ডিলিট হয়েছে");
      }
    });
  });
}

// ---------- Orders ----------
const statusLabels = { pending: "পেন্ডিং", confirmed: "কনফার্ম হয়েছে", delivered: "ডেলিভার হয়েছে" };

function renderOrders() {
  const el = document.getElementById("ordersList");
  let orders = Object.entries(allOrders).sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
  if (currentOrderFilter !== "all") {
    orders = orders.filter(([id, o]) => (o.status || "pending") === currentOrderFilter);
  }
  if (orders.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="emoji">📋</div><p>কোনো অর্ডার নেই</p></div>`;
    return;
  }
  el.innerHTML = orders.map(([id, o]) => {
    const status = o.status || "pending";
    return `
      <div class="admin-card" data-view-order="${esc(id)}" style="cursor:pointer;">
        <div class="admin-card-info">
          <div class="admin-card-title">${esc(o.customerName)} — ${esc(o.phone)}</div>
          <div class="admin-card-sub">${formatPrice(o.total)} · <span class="status-pill status-${status}">${statusLabels[status]}</span></div>
        </div>
      </div>
    `;
  }).join("");

  el.querySelectorAll("[data-view-order]").forEach(card => {
    card.addEventListener("click", () => openOrderDetail(card.dataset.viewOrder));
  });
}

function openOrderDetail(id) {
  const o = allOrders[id];
  if (!o) return;
  const status = o.status || "pending";
  const itemsHtml = (o.items || []).map(i => `
    <div class="order-detail-row"><span>${esc(i.name)} × ${i.qty}</span><span>${formatPrice(i.price * i.qty)}</span></div>
  `).join("");

  document.getElementById("orderDetailContent").innerHTML = `
    <div class="order-detail-row"><span>নাম</span><span>${esc(o.customerName)}</span></div>
    <div class="order-detail-row"><span>ফোন</span><span>${esc(o.phone)}</span></div>
    <div class="order-detail-row"><span>এলাকা</span><span>${esc(o.area)}</span></div>
    <div class="order-detail-row"><span>ঠিকানা</span><span>${esc(o.address)}</span></div>
    <div class="order-detail-row"><span>পেমেন্ট</span><span>${o.paymentMethod === "cod" ? "COD" : "অনলাইন"}</span></div>
    ${o.transactionId ? `<div class="order-detail-row"><span>ট্রানজেকশন আইডি</span><span>${esc(o.transactionId)}</span></div>` : ""}
    <div style="border-top:1px solid #eee; margin:10px 0; padding-top:10px;">${itemsHtml}</div>
    <div class="order-detail-row" style="font-weight:800; font-size:15px;"><span>মোট</span><span>${formatPrice(o.total)}</span></div>

    <div class="form-group mt-16">
      <label class="form-label">অর্ডার স্ট্যাটাস</label>
      <select class="form-select" id="orderStatusSelect">
        <option value="pending" ${status === "pending" ? "selected" : ""}>পেন্ডিং</option>
        <option value="confirmed" ${status === "confirmed" ? "selected" : ""}>কনফার্ম হয়েছে</option>
        <option value="delivered" ${status === "delivered" ? "selected" : ""}>ডেলিভার হয়েছে</option>
      </select>
    </div>
    <button class="btn btn-primary btn-block" id="saveOrderStatusBtn">স্ট্যাটাস আপডেট করুন</button>
  `;

  document.getElementById("saveOrderStatusBtn").addEventListener("click", async () => {
    const newStatus = document.getElementById("orderStatusSelect").value;
    await update(ref(db, `orders/${id}`), { status: newStatus });
    showToast("স্ট্যাটাস আপডেট হয়েছে");
    closeModal("orderModal");
  });

  openModal("orderModal");
}

// ---------- Settings ----------
function renderSettings() {
  const pm = allSettings.paymentMethods || { cod: true, online: true };
  document.getElementById("toggleCod").classList.toggle("on", !!pm.cod);
  document.getElementById("toggleOnline").classList.toggle("on", !!pm.online);
  document.getElementById("bkashNumberInput").value = allSettings.bkashNumber || "";
  document.getElementById("siteNameInput").value = allSettings.siteName || "";

  const promo = allSettings.promo || {};
  document.getElementById("togglePromo").classList.toggle("on", !!promo.enabled);
  document.getElementById("promoTitleInput").value = promo.title || "";
  document.getElementById("promoImageInput").value = promo.image || "";
}
