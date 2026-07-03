// ==========================================================================
// CART PAGE LOGIC
// ==========================================================================
import { getCart, updateCartQty, removeFromCart, cartTotal, formatPrice, updateCartBadge, esc } from "../js/utils.js?v=2";

updateCartBadge();

function render() {
  const cart = getCart();
  const content = document.getElementById("cartContent");

  if (cart.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="emoji">🛒</div>
        <p>আপনার কার্ট খালি</p>
        <a href="../index.html" class="btn btn-primary mt-16" style="display:inline-flex;">শপিং শুরু করুন</a>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div id="cartItems"></div>
    <div class="surface-card mt-16">
      <div class="summary-row"><span>সাবটোটাল</span><span>${formatPrice(cartTotal())}</span></div>
      <div class="summary-row text-muted"><span>ডেলিভারি চার্জ</span><span>চেকআউটে হিসাব হবে</span></div>
      <div class="summary-row total"><span>মোট</span><span>${formatPrice(cartTotal())}</span></div>
    </div>
    <button class="btn btn-primary btn-block mt-16" id="checkoutBtn">চেকআউট করুন →</button>
  `;

  const itemsEl = document.getElementById("cartItems");
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${esc(item.image)}" alt="${esc(item.name)}">
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.name)}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="cart-qty-stepper mt-8">
          <button data-action="minus" data-id="${esc(item.id)}">−</button>
          <span>${item.qty}</span>
          <button data-action="plus" data-id="${esc(item.id)}">+</button>
        </div>
      </div>
      <button class="cart-remove" data-action="remove" data-id="${esc(item.id)}">🗑️</button>
    </div>
  `).join("");

  itemsEl.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const item = cart.find(i => i.id === id);
      if (action === "plus") updateCartQty(id, item.qty + 1);
      else if (action === "minus") updateCartQty(id, item.qty - 1);
      else if (action === "remove") removeFromCart(id);
      render();
    });
  });

  document.getElementById("checkoutBtn")?.addEventListener("click", () => {
    window.location.href = "checkout.html?mode=cart";
  });
}

render();
