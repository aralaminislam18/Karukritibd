// ==========================================================================
// CHECKOUT PAGE LOGIC
// লগইন/রেজিস্ট্রেশন (ফোন + পাসওয়ার্ড) বাধ্যতামূলক -> অর্ডার ফর্ম -> রিসিট (শেয়ার/ডাউনলোড)
// ==========================================================================
import { db, ref, get, push, set, update } from "../js/firebase-config.js?v=2";
import {
  getCart, getBuyNow, clearCart, clearBuyNow, cartTotal, formatPrice,
  showToast, esc, getCustomerSession, setCustomerSession, clearCustomerSession
} from "../js/utils.js?v=2";

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") || "cart";
const content = document.getElementById("checkoutContent");

let orderItems = [];
let orderTotal = 0;
let paymentSettings = { cod: true, online: true };
let customer = getCustomerSession(); // { phone, name } অথবা null

function loadItems() {
  if (mode === "buynow") {
    const bn = getBuyNow();
    if (bn) {
      orderItems = [bn];
      orderTotal = bn.price * bn.qty;
    }
  } else {
    orderItems = getCart();
    orderTotal = cartTotal();
  }
}

async function init() {
  loadItems();

  if (orderItems.length === 0) {
    content.innerHTML = `<div class="empty-state"><div class="emoji">🛒</div><p>কোনো প্রোডাক্ট নেই</p>
      <a href="../index.html" class="btn btn-primary mt-16" style="display:inline-flex;">শপিং করুন</a></div>`;
    return;
  }

  try {
    const snap = await get(ref(db, "settings"));
    if (snap.exists()) {
      const s = snap.val();
      paymentSettings = s.paymentMethods || { cod: true, online: true };
    }
  } catch (err) {
    console.error("Settings load error:", err);
  }

  if (!customer || !customer.phone) {
    renderAuth();
  } else {
    render();
  }
}

// ========================================================================
// STEP 1 — লগইন / রেজিস্ট্রেশন (ফোন + পাসওয়ার্ড)
// ========================================================================
function renderAuth() {
  content.innerHTML = `
    <div class="surface-card">
      <div style="font-weight:700; font-size:15px; margin-bottom:4px;">লগইন / রেজিস্ট্রেশন</div>
      <p class="text-muted" style="font-size:12.5px; margin-bottom:14px;">অর্ডার করতে ফোন নাম্বার ও পাসওয়ার্ড দিন। নতুন নাম্বার হলে স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট তৈরি হয়ে যাবে — পরবর্তীতে এই নাম্বার দিয়ে আপনার সব অর্ডার দেখতে পারবেন।</p>
      <form id="authForm">
        <div class="form-group">
          <label class="form-label">পুরো নাম *</label>
          <input type="text" class="form-input" id="authName" required placeholder="আপনার নাম">
        </div>
        <div class="form-group">
          <label class="form-label">ফোন নাম্বার *</label>
          <input type="tel" class="form-input" id="authPhone" required placeholder="01XXXXXXXXX" pattern="[0-9]{11}" maxlength="11">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">পাসওয়ার্ড *</label>
          <input type="password" class="form-input" id="authPassword" required placeholder="কমপক্ষে ৪ ডিজিট" minlength="4">
        </div>
        <div class="login-error" id="authError"></div>
        <button type="submit" class="btn btn-primary btn-block mt-16" id="authSubmitBtn">চালিয়ে যান</button>
      </form>
    </div>
  `;
  document.getElementById("authForm").addEventListener("submit", handleAuth);
}

async function handleAuth(e) {
  e.preventDefault();
  const name = document.getElementById("authName").value.trim();
  const phone = document.getElementById("authPhone").value.trim();
  const password = document.getElementById("authPassword").value;
  const errorEl = document.getElementById("authError");
  errorEl.textContent = "";

  if (!/^01[0-9]{9}$/.test(phone)) {
    errorEl.textContent = "সঠিক ফোন নাম্বার দিন (১১ ডিজিট)";
    return;
  }
  if (password.length < 4) {
    errorEl.textContent = "পাসওয়ার্ড কমপক্ষে ৪ ডিজিট হতে হবে";
    return;
  }

  const submitBtn = document.getElementById("authSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "যাচাই হচ্ছে...";

  try {
    const custRef = ref(db, `customers/${phone}`);
    const snap = await get(custRef);

    if (snap.exists()) {
      const existing = snap.val();
      if (existing.password !== password) {
        errorEl.textContent = "পাসওয়ার্ড ভুল হয়েছে, আবার চেষ্টা করুন";
        submitBtn.disabled = false;
        submitBtn.textContent = "চালিয়ে যান";
        return;
      }
      customer = { phone, name: existing.name || name };
    } else {
      await set(custRef, { phone, name, password, createdAt: Date.now() });
      customer = { phone, name };
    }

    setCustomerSession(customer);
    render();
  } catch (err) {
    console.error(err);
    errorEl.textContent = "সমস্যা হয়েছে, আবার চেষ্টা করুন";
    submitBtn.disabled = false;
    submitBtn.textContent = "চালিয়ে যান";
  }
}

// ========================================================================
// STEP 2 — অর্ডার ফর্ম
// ========================================================================
function render() {
  const noPaymentAvailable = !paymentSettings.cod && !paymentSettings.online;

  content.innerHTML = `
    <div class="surface-card">
      <div style="font-weight:700; font-size:14px; margin-bottom:10px;">অর্ডার সামারি</div>
      ${orderItems.map(i => `
        <div class="co-item-row"><span>${esc(i.name)} × ${i.qty}</span><span>${formatPrice(i.price * i.qty)}</span></div>
      `).join("")}
      <div class="co-item-row" style="border-top:1px solid var(--border); margin-top:6px; padding-top:10px; font-weight:800; font-size:15px;">
        <span>মোট</span><span>${formatPrice(orderTotal)}</span>
      </div>
    </div>

    <form id="checkoutForm" class="mt-16">
      <div class="surface-card">
        <div style="font-weight:700; font-size:14px; margin-bottom:12px;">ডেলিভারি তথ্য</div>
        <div class="form-group">
          <label class="form-label">পুরো নাম *</label>
          <input type="text" class="form-input" id="custName" required placeholder="আপনার নাম লিখুন" value="${esc(customer.name || '')}">
        </div>
        <div class="form-group">
          <label class="form-label flex items-center" style="justify-content:space-between;">
            <span>ফোন নাম্বার</span>
            <button type="button" id="changeNumberBtn" style="background:none;border:none;color:var(--primary-dark);font-size:11.5px;text-decoration:underline;font-weight:600;">নাম্বার পরিবর্তন করুন</button>
          </label>
          <input type="tel" class="form-input" id="custPhone" value="${esc(customer.phone)}" readonly style="background:var(--bg); color:var(--text-muted);">
        </div>
        <div class="form-group">
          <label class="form-label">এলাকা / জায়গা *</label>
          <input type="text" class="form-input" id="custArea" required placeholder="যেমন: ধানমন্ডি, ঢাকা">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">সম্পূর্ণ ঠিকানা *</label>
          <textarea class="form-textarea" id="custAddress" required placeholder="বাসা/হোল্ডিং নং, রোড, এলাকা বিস্তারিত"></textarea>
        </div>
      </div>

      <div class="surface-card mt-16">
        <div style="font-weight:700; font-size:14px; margin-bottom:12px;">পেমেন্ট পদ্ধতি</div>
        ${noPaymentAvailable ? `<p class="text-muted" style="font-size:13px;">এই মুহূর্তে কোনো পেমেন্ট পদ্ধতি চালু নেই। অনুগ্রহ করে পরে চেষ্টা করুন।</p>` : ""}
        ${paymentSettings.cod ? `
          <label class="payment-option" id="codOption">
            <input type="radio" name="paymentMethod" value="cod">
            <div><div style="font-weight:700; font-size:14px;">ক্যাশ অন ডেলিভারি (COD)</div>
            <div class="text-muted" style="font-size:12px;">প্রোডাক্ট হাতে পেয়ে টাকা পরিশোধ করুন</div></div>
          </label>` : ""}
        ${paymentSettings.online ? `
          <label class="payment-option" id="onlineOption">
            <input type="radio" name="paymentMethod" value="online">
            <div><div style="font-weight:700; font-size:14px;">অনলাইন পেমেন্ট</div>
            <div class="text-muted" style="font-size:12px;">বিকাশ/নগদ এর মাধ্যমে পেমেন্ট করুন</div></div>
          </label>
          <div class="trx-box" id="trxBox">
            <div class="payment-detail-note" id="paymentNumbersNote">লোড হচ্ছে...</div>
            <div class="form-group mt-8" style="margin-bottom:0;">
              <label class="form-label">ট্রানজেকশন আইডি *</label>
              <input type="text" class="form-input" id="trxId" placeholder="যেমন: 8N7A2K9X1P">
            </div>
          </div>` : ""}
      </div>

      <button type="submit" class="btn btn-primary btn-block mt-16" id="submitOrderBtn" ${noPaymentAvailable ? "disabled" : ""}>
        অর্ডার কনফার্ম করুন
      </button>
    </form>
  `;

  bindFormEvents();
  loadPaymentNumbers();
}

async function loadPaymentNumbers() {
  const note = document.getElementById("paymentNumbersNote");
  if (!note) return;
  try {
    const snap = await get(ref(db, "settings"));
    const s = snap.val() || {};
    note.textContent = `বিকাশ/নগদ নাম্বার: ${s.bkashNumber || "N/A"} — সেন্ড মানি করে ট্রানজেকশন আইডি নিচে লিখুন।`;
  } catch {
    note.textContent = "পেমেন্ট নাম্বার লোড করতে সমস্যা হয়েছে।";
  }
}

function bindFormEvents() {
  const codOpt = document.getElementById("codOption");
  const onlineOpt = document.getElementById("onlineOption");
  const trxBox = document.getElementById("trxBox");

  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener("change", () => {
      codOpt?.classList.toggle("selected", radio.value === "cod" && radio.checked);
      onlineOpt?.classList.toggle("selected", radio.value === "online" && radio.checked);
      if (trxBox) trxBox.classList.toggle("show", radio.value === "online" && radio.checked);
    });
  });

  document.getElementById("checkoutForm").addEventListener("submit", handleSubmit);

  document.getElementById("changeNumberBtn")?.addEventListener("click", () => {
    clearCustomerSession();
    customer = null;
    renderAuth();
  });
}

async function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("custName").value.trim();
  const phone = customer.phone;
  const area = document.getElementById("custArea").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

  if (!name || !area || !address) {
    showToast("সব ফিল্ড পূরণ করুন");
    return;
  }
  if (!paymentMethod) {
    showToast("একটি পেমেন্ট পদ্ধতি সিলেক্ট করুন");
    return;
  }

  let trxId = "";
  if (paymentMethod === "online") {
    trxId = document.getElementById("trxId").value.trim();
    if (!trxId) {
      showToast("ট্রানজেকশন আইডি লিখুন");
      return;
    }
  }

  const submitBtn = document.getElementById("submitOrderBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "অর্ডার হচ্ছে...";

  const order = {
    customerName: name,
    phone,
    area,
    address,
    items: orderItems,
    total: orderTotal,
    paymentMethod,
    transactionId: trxId || null,
    status: "pending",
    createdAt: Date.now()
  };

  try {
    const newOrderRef = push(ref(db, "orders"));
    await set(newOrderRef, order);

    // নাম পরিবর্তন হলে কাস্টমার প্রোফাইলেও আপডেট করে রাখি
    if (customer.name !== name) {
      customer.name = name;
      setCustomerSession(customer);
      update(ref(db, `customers/${phone}`), { name }).catch(() => {});
    }

    if (mode === "buynow") clearBuyNow();
    else clearCart();

    renderReceipt(newOrderRef.key, order);
  } catch (err) {
    console.error(err);
    showToast("অর্ডার করতে সমস্যা হয়েছে, আবার চেষ্টা করুন");
    submitBtn.disabled = false;
    submitBtn.textContent = "অর্ডার কনফার্ম করুন";
  }
}

// ========================================================================
// STEP 3 — অর্ডার রিসিট (শেয়ার / ডাউনলোড ইমেজ আকারে)
// ========================================================================
function renderReceipt(orderId, order) {
  const shortId = orderId.slice(-6).toUpperCase();
  const date = new Date(order.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
  const itemsHtml = order.items.map(i => `
    <div class="receipt-row"><span>${esc(i.name)} × ${i.qty}</span><span>${formatPrice(i.price * i.qty)}</span></div>
  `).join("");

  content.innerHTML = `
    <div class="empty-state">
      <div class="emoji">✅</div>
      <p style="font-weight:700; font-size:16px; color:var(--primary-dark);">অর্ডার সফল হয়েছে!</p>
      <p class="text-muted mt-8">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
    </div>

    <div class="receipt-card mt-16" id="receiptCard">
      <div class="receipt-header">
        <div style="font-weight:800; font-size:17px; color:var(--primary-dark);" id="receiptSiteName">ShopBD</div>
        <div class="text-muted" style="font-size:12px;">অর্ডার রিসিট</div>
      </div>
      <div class="receipt-row"><span>অর্ডার আইডি</span><span>#${shortId}</span></div>
      <div class="receipt-row"><span>তারিখ</span><span>${date}</span></div>
      <div class="receipt-row"><span>নাম</span><span>${esc(order.customerName)}</span></div>
      <div class="receipt-row"><span>ফোন</span><span>${esc(order.phone)}</span></div>
      <div class="receipt-row"><span>ঠিকানা</span><span>${esc(order.area)}</span></div>
      <div class="receipt-row"><span>পেমেন্ট</span><span>${order.paymentMethod === "cod" ? "COD" : "অনলাইন"}</span></div>
      <div style="border-top:1px solid var(--border); margin:10px 0; padding-top:8px;">${itemsHtml}</div>
      <div class="receipt-row receipt-total"><span>মোট</span><span>${formatPrice(order.total)}</span></div>
    </div>

    <div class="flex gap-8 mt-16">
      <button class="btn btn-outline btn-block" id="downloadReceiptBtn">⬇️ ডাউনলোড</button>
      <button class="btn btn-primary btn-block" id="shareReceiptBtn">📤 শেয়ার</button>
    </div>
    <a href="../index.html" class="btn btn-outline btn-block mt-8" style="display:flex;">হোমপেজে ফিরে যান</a>
  `;

  document.getElementById("downloadReceiptBtn").addEventListener("click", () => generateReceiptImage("download", shortId));
  document.getElementById("shareReceiptBtn").addEventListener("click", () => generateReceiptImage("share", shortId));

  // সাইটের নাম settings থেকে বসিয়ে দিচ্ছি (রিসিটে দেখানোর জন্য)
  get(ref(db, "settings/siteName")).then(snap => {
    const name = snap.val();
    if (name) document.getElementById("receiptSiteName").textContent = name;
  }).catch(() => {});
}

async function generateReceiptImage(action, shortId) {
  const node = document.getElementById("receiptCard");
  if (typeof html2canvas === "undefined") {
    showToast("রিসিট তৈরি করতে সমস্যা হয়েছে");
    return;
  }
  showToast("রিসিট তৈরি হচ্ছে...");
  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
    canvas.toBlob(async (blob) => {
      if (!blob) { showToast("রিসিট তৈরি করতে সমস্যা হয়েছে"); return; }
      const fileName = `ShopBD-Order-${shortId}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (action === "share" && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "অর্ডার রিসিট" });
        } catch (err) {
          if (err && err.name !== "AbortError") downloadBlob(blob, fileName);
        }
      } else {
        downloadBlob(blob, fileName);
      }
    }, "image/png");
  } catch (err) {
    console.error(err);
    showToast("রিসিট তৈরি করতে সমস্যা হয়েছে");
  }
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

init();
