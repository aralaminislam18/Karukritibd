// ==========================================================================
// CUSTOMER ORDER LOOKUP LOGIC (ফোন নাম্বার দিয়ে নিজের অর্ডার খুঁজে দেখা)
// ==========================================================================
import { db, ref, get } from "../js/firebase-config.js?v=2";
import { formatPrice, updateCartBadge, esc } from "../js/utils.js?v=2";

updateCartBadge();

const statusLabels = {
  pending: "পেন্ডিং",
  confirmed: "কনফার্ম হয়েছে",
  delivered: "ডেলিভার হয়েছে"
};
const statusColors = {
  pending: "#b8860b", confirmed: "#1565c0", delivered: "#1f7a54"
};

async function searchOrders() {
  const phone = document.getElementById("phoneSearch").value.trim();
  const listEl = document.getElementById("ordersList");

  if (!phone) {
    listEl.innerHTML = `<p class="text-muted" style="text-align:center; padding:20px;">ফোন নাম্বার লিখুন</p>`;
    return;
  }

  listEl.innerHTML = `<div class="spinner"></div>`;

  try {
    const snap = await get(ref(db, "orders"));
    if (!snap.exists()) {
      listEl.innerHTML = `<div class="empty-state"><div class="emoji">📋</div><p>কোনো অর্ডার পাওয়া যায়নি</p></div>`;
      return;
    }

    const all = snap.val();
    const matched = Object.entries(all)
      .filter(([id, o]) => o.phone === phone)
      .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));

    if (matched.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="emoji">📋</div><p>এই নাম্বারে কোনো অর্ডার পাওয়া যায়নি</p></div>`;
      return;
    }

    listEl.innerHTML = matched.map(([id, o]) => {
      const itemsText = (o.items || []).map(i => `${i.name} ×${i.qty}`).join(", ");
      const status = o.status || "pending";
      const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" }) : "";
      return `
        <div class="order-card">
          <div class="order-card-top">
            <span class="order-id">#${esc(id.slice(-6).toUpperCase())} · ${date}</span>
            <span class="status-pill" style="background:${statusColors[status]}22; color:${statusColors[status]};">${statusLabels[status] || status}</span>
          </div>
          <div class="order-items-line">${esc(itemsText)}</div>
          <div class="order-total-line">${formatPrice(o.total)}</div>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<div class="empty-state"><div class="emoji">⚠️</div><p>লোড করতে সমস্যা হয়েছে</p></div>`;
  }
}

document.getElementById("searchBtn").addEventListener("click", searchOrders);
document.getElementById("phoneSearch").addEventListener("keydown", e => {
  if (e.key === "Enter") searchOrders();
});
