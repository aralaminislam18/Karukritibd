/* ==========================================================================
   FIREBASE — নিচের কনফিগটা তোমার আসল firebase-config দিয়ে বদলে দাও
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCE7RDU3tixMPw7AwQDIH3gQqXDpb-KL1w",
  authDomain: "chat-ad63b.firebaseapp.com",
  databaseURL: "https://chat-ad63b-default-rtdb.firebaseio.com",
  projectId: "chat-ad63b",
  storageBucket: "chat-ad63b.firebasestorage.app",
  messagingSenderId: "983670261214",
  appId: "1:983670261214:web:3bc535bf836f743bcac94f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ==========================================================================
   TEXT (i18n)
   ========================================================================== */
const T = {
  bn: {
    welcome: "👋 আসসালামু আলাইকুম! কারুকৃতি চ্যাট বক্সে আপনাকে স্বাগতম!\nWelcome to Karukriti!",
    askLang: "আপনি কোন ভাষায় কথা বলতে চান?\nWhich language would you like to chat in?",
    greetAfterLang: "স্বাগতম! 😊 আমি কারুকৃতি সহায়ক। আমি আপনাকে প্রোডাক্টের তথ্য, দাম, স্টক জানাতে এবং অর্ডার করতে সাহায্য করতে পারি। কী জানতে চান?",
    quickSearch: "🔍 প্রোডাক্ট খুঁজুন",
    quickOrder: "🛒 অর্ডার করতে চাই",
    quickContact: "📞 যোগাযোগ করুন",
    quickFaq: "❓ সাধারণ প্রশ্ন",
    identity: "আমি কারুকৃতি সহায়ক 🤖 — কারুকৃতি শপের চ্যাট সহায়ক। প্রোডাক্টের দাম, স্টক, অর্ডার বা যেকোনো প্রশ্নে আমি আপনাকে সাহায্য করতে পারি।",
    askProductName: "কোন প্রোডাক্টের কথা বলছেন? প্রোডাক্টের নাম লিখুন 🙂",
    notFoundAskId: "দুঃখিত, নাম দিয়ে খুঁজে পাইনি। যে প্রোডাক্টটি আপনি জানতে চাচ্ছেন তার প্রোডাক্ট আইডি দিন।",
    foundIntro: "হ্যাঁ, আমাদের কাছে এটা আছে 👇",
    priceIs: (p) => `এর দাম ৳${p}`,
    inStock: "✅ এটি এখন স্টকে আছে।",
    outStock: "❌ দুঃখিত, এই মুহূর্তে এটি স্টকে নেই।",
    askQty: "কতটি নিতে চান?",
    askName: "আপনার নামটা বলবেন?",
    askPhone: "আপনার মোবাইল নাম্বারটা দিন।",
    askArea: "আপনার এলাকা/শহরের নাম লিখুন।",
    askAddress: "সম্পূর্ণ ঠিকানা লিখুন (বাসা/রোড নম্বরসহ)।",
    askPayment: "পেমেন্ট মেথড বেছে নিন:",
    codLabel: "ক্যাশ অন ডেলিভারি",
    onlineLabel: "বিকাশ/নগদ",
    askTxn: "ট্রানজেকশন আইডিটা দিন।",
    orderSummary: (o) => `একটু চেক করে নিই:\n\n🛍️ ${o.productName} × ${o.qty}\n👤 ${o.customerName}\n📱 ${o.phone}\n📍 ${o.area}, ${o.address}\n💳 ${o.paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'বিকাশ/নগদ (' + (o.transactionId||'') + ')'}\n💰 মোট: ৳${o.total}\n\nসব ঠিক আছে কি?`,
    confirmYes: "✅ হ্যাঁ, কনফার্ম করুন",
    confirmNo: "❌ বাতিল করুন",
    orderPlaced: (id) => `🎉 আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!\nঅর্ডার নাম্বার: ${id}\nশীঘ্রই আমরা আপনার সাথে যোগাযোগ করবো। কারুকৃতির সাথে থাকার জন্য ধন্যবাদ! 🙏`,
    orderCancelled: "ঠিক আছে, অর্ডারটি বাতিল করা হলো। অন্য কিছু জানতে চাইলে বলুন।",
    contactMsg: (num) => `আমাদের সাথে সরাসরি যোগাযোগ করতে চাইলে এই নাম্বারে হোয়াটসঅ্যাপ/কল করুন:\n📞 ${num}\n\nঅথবা এখানেই আপনার প্রশ্ন লিখুন, শীঘ্রই আমাদের টিম আপনার সাথে যোগাযোগ করবে। 😊`,
    deliveryTime: "সাধারণত ঢাকার মধ্যে ১-২ দিন এবং ঢাকার বাইরে ৩-৫ কার্যদিবস সময় লাগে।",
    returnPolicy: "প্রোডাক্ট হাতে পাওয়ার ৩ দিনের মধ্যে কোনো সমস্যা থাকলে জানালে আমরা রিটার্ন/এক্সচেঞ্জ ব্যবস্থা করে দিই।",
    deliveryArea: "আমরা সারা বাংলাদেশে ডেলিভারি দিয়ে থাকি।",
    minOrder: "কোনো নির্দিষ্ট মিনিমাম অর্ডার নেই, ইচ্ছেমতো অর্ডার করতে পারেন।",
    paymentMethods: "আমরা ক্যাশ অন ডেলিভারি (COD) এবং বিকাশ/নগদের মাধ্যমে পেমেন্ট গ্রহণ করি।",
    thanks: "আপনাকেও ধন্যবাদ! আর কিছু জানার থাকলে বলুন। 😊",
    fallback: "দুঃখিত, ঠিক বুঝতে পারিনি। প্রোডাক্টের নাম, দাম, স্টক, অর্ডার বা যোগাযোগ সম্পর্কে জিজ্ঞেস করতে পারেন।",
    langSetBn: "বাংলা", langSetEn: "English"
  },
  en: {
    welcome: "👋 Hello! Welcome to Karukriti's chat box!\nWelcome to Karukriti!",
    askLang: "Which language would you like to chat in?\nআপনি কোন ভাষায় কথা বলতে চান?",
    greetAfterLang: "Welcome! 😊 I'm Karukriti Sohayok. I can help you with product info, prices, stock, and placing orders. What would you like to know?",
    quickSearch: "🔍 Search a product",
    quickOrder: "🛒 I want to order",
    quickContact: "📞 Contact us",
    quickFaq: "❓ FAQ",
    identity: "I'm Karukriti Sohayok 🤖 — the chat assistant for Karukriti shop. I can help with prices, stock, orders, or any other questions.",
    askProductName: "Which product are you asking about? Please type the product name 🙂",
    notFoundAskId: "Sorry, I couldn't find that by name. Please give me the exact product ID.",
    foundIntro: "Yes, we have this 👇",
    priceIs: (p) => `The price is ৳${p}`,
    inStock: "✅ It's currently in stock.",
    outStock: "❌ Sorry, this is currently out of stock.",
    askQty: "How many would you like?",
    askName: "What's your name?",
    askPhone: "Please share your phone number.",
    askArea: "Which area/city are you in?",
    askAddress: "Please give your full address (house/road number).",
    askPayment: "Choose a payment method:",
    codLabel: "Cash on Delivery",
    onlineLabel: "bKash/Nagad",
    askTxn: "Please share the transaction ID.",
    orderSummary: (o) => `Let's double check:\n\n🛍️ ${o.productName} × ${o.qty}\n👤 ${o.customerName}\n📱 ${o.phone}\n📍 ${o.area}, ${o.address}\n💳 ${o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash/Nagad (' + (o.transactionId||'') + ')'}\n💰 Total: ৳${o.total}\n\nDoes everything look right?`,
    confirmYes: "✅ Yes, confirm",
    confirmNo: "❌ Cancel",
    orderPlaced: (id) => `🎉 Your order has been placed successfully!\nOrder ID: ${id}\nWe'll contact you shortly. Thanks for shopping with Karukriti! 🙏`,
    orderCancelled: "Okay, order cancelled. Let me know if you need anything else.",
    contactMsg: (num) => `To reach us directly, WhatsApp/call this number:\n📞 ${num}\n\nOr just type your question here — our team will get back to you shortly. 😊`,
    deliveryTime: "Usually 1-2 days within Dhaka, and 3-5 business days outside Dhaka.",
    returnPolicy: "If there's an issue, let us know within 3 days of delivery and we'll arrange a return/exchange.",
    deliveryArea: "We deliver all across Bangladesh.",
    minOrder: "There's no minimum order — order as much or as little as you like.",
    paymentMethods: "We accept Cash on Delivery (COD) and bKash/Nagad payments.",
    thanks: "Thank you too! Let me know if there's anything else. 😊",
    fallback: "Sorry, I didn't quite get that. You can ask about product name, price, stock, ordering, or contact info.",
    langSetBn: "বাংলা", langSetEn: "English"
  }
};

/* ==========================================================================
   KEYWORD DICTIONARIES (বাংলা + বাংলিশ + English)
   ========================================================================== */
const KW = {
  greeting: ["হাই","হ্যালো","hi","hello","assalamu","আসসালামু","salam","সালাম","hey"],
  identity: ["তোমার নাম","tumar nam","who are you","tumi ke","apni ke","your name","bot naam","নাম কি"],
  price: ["দাম","মূল্য","dam","daam","price","koto taka","কত টাকা","koto"],
  stock: ["স্টক","stock","আছে কি","ache ki","আছে","available","আছে নাকি"],
  contact: ["যোগাযোগ","কন্টাক্ট","contact","number","নাম্বার","phone","hotline","whatsapp","হোয়াটসঅ্যাপ","jogajog"],
  order: ["অর্ডার","order","kinbo","kinte chai","কিনতে চাই","কিনব","buy","nite chai","নিতে চাই"],
  delivery_time: ["ডেলিভারি সময়","koydin","কয়দিন","koto din","কতদিন","delivery time","koidin lage"],
  return_policy: ["রিটার্ন","ফেরত","exchange","return","পরিবর্তন"],
  delivery_area: ["এলাকায় ডেলিভারি","kon elakay","কোন এলাকায়","delivery area","dhakar baire","ঢাকার বাইরে"],
  min_order: ["মিনিমাম অর্ডার","minimum order","min order"],
  payment_methods: ["পেমেন্ট মেথড","payment method","kivabe payment","পেমেন্ট কিভাবে","how to pay"],
  thanks: ["ধন্যবাদ","dhonnobad","thanks","thank you","thnx"],
  yes: ["হ্যাঁ","hae","হুম","hum","ji","জি","yes","ya","হয়েছে","ok","ঠিক আছে","thik ache"],
  no: ["না","na","no","nah","cancel","বাতিল"]
};

function normalize(s){
  return (s||"").toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();
}

function matchesAny(text, list){
  const n = normalize(text);
  return list.some(k => n.includes(normalize(k)));
}

function detectIntent(text){
  if (matchesAny(text, KW.identity)) return "identity";
  if (matchesAny(text, KW.order)) return "order";
  if (matchesAny(text, KW.price)) return "price";
  if (matchesAny(text, KW.stock)) return "stock";
  if (matchesAny(text, KW.contact)) return "contact";
  if (matchesAny(text, KW.delivery_time)) return "delivery_time";
  if (matchesAny(text, KW.return_policy)) return "return_policy";
  if (matchesAny(text, KW.delivery_area)) return "delivery_area";
  if (matchesAny(text, KW.min_order)) return "min_order";
  if (matchesAny(text, KW.payment_methods)) return "payment_methods";
  if (matchesAny(text, KW.thanks)) return "thanks";
  if (matchesAny(text, KW.greeting)) return "greeting";
  return null;
}

/* ---------- ৭০%-এর কাছাকাছি ফাজি ম্যাচিং (bigram Dice coefficient) ---------- */
const MATCH_THRESHOLD = 0.5; // দরকার হলে বাড়িয়ে/কমিয়ে নাও (0-1 এর মধ্যে)

function bigrams(s){
  const clean = normalize(s).replace(/\s+/g,"");
  const set = new Set();
  for (let i = 0; i < clean.length - 1; i++) set.add(clean.substr(i, 2));
  return set;
}
function diceScore(a, b){
  const A = bigrams(a), B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return (2 * inter) / (A.size + B.size);
}

function findProduct(query){
  const q = normalize(query);
  if (!q) return null;
  if (allProducts[query.trim()]) return { id: query.trim(), data: allProducts[query.trim()], score: 1 };

  let best = null;
  for (const [id, p] of Object.entries(allProducts)) {
    const candidates = [p.name, ...(p.searchTags || [])];
    let score = 0;
    for (const c of candidates) score = Math.max(score, diceScore(q, c));
    if (normalize(p.name).includes(q) || q.includes(normalize(p.name))) score = Math.max(score, 0.75);
    if (!best || score > best.score) best = { id, data: p, score };
  }
  return best && best.score >= MATCH_THRESHOLD ? best : null;
}

/* ==========================================================================
   STATE
   ========================================================================== */
let allProducts = {};
let bkashNumber = "";
let lang = null;
let lastProduct = null;
let order = null; // { step, productId, productName, price, qty, customerName, phone, area, address, paymentMethod, transactionId }

const messagesEl = document.getElementById("cbMessages");
const quickRepliesEl = document.getElementById("cbQuickReplies");
const inputEl = document.getElementById("cbInput");
const sendBtn = document.getElementById("cbSend");
const titleEl = document.getElementById("cbTitle");

/* ==========================================================================
   RENDER HELPERS
   ========================================================================== */
function esc(s){
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}
function scrollDown(){
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function addMsg(text, who){
  const div = document.createElement("div");
  div.className = "cb-msg " + who;
  div.innerHTML = esc(text).replace(/\n/g, "<br>");
  messagesEl.appendChild(div);
  scrollDown();
}
function addProductCard(p){
  const img = (p.images && p.images[0]) || "";
  const card = document.createElement("div");
  card.className = "cb-product-card";
  card.innerHTML = `
    ${img ? `<img src="${esc(img)}" alt="">` : ""}
    <div class="cb-product-card-body">
      <div class="cb-product-card-name">${esc(p.name)}</div>
      <div class="cb-product-card-price">৳${esc(p.price)}</div>
      <div class="cb-product-card-stock ${p.stock === false ? 'out' : 'in'}">${p.stock === false ? '❌' : '✅'} ${p.stock === false ? (lang==='bn'?'স্টক নেই':'Out of stock') : (lang==='bn'?'স্টকে আছে':'In stock')}</div>
    </div>`;
  messagesEl.appendChild(card);
  scrollDown();
}
function showTyping(){
  const div = document.createElement("div");
  div.className = "cb-typing";
  div.id = "cbTypingIndicator";
  div.innerHTML = "<span></span><span></span><span></span>";
  messagesEl.appendChild(div);
  scrollDown();
}
function hideTyping(){
  const t = document.getElementById("cbTypingIndicator");
  if (t) t.remove();
}
function botSay(text, delay = 500){
  showTyping();
  return new Promise(resolve => {
    setTimeout(() => {
      hideTyping();
      addMsg(text, "bot");
      resolve();
    }, delay);
  });
}
function setQuickReplies(options){
  quickRepliesEl.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "cb-quick-btn";
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      quickRepliesEl.innerHTML = "";
      addMsg(opt.label, "user");
      opt.action();
    });
    quickRepliesEl.appendChild(btn);
  });
}
function clearQuickReplies(){ quickRepliesEl.innerHTML = ""; }

/* ==========================================================================
   FIREBASE LOAD
   ========================================================================== */
async function loadData(){
  try {
    const [prodSnap, settingsSnap] = await Promise.all([
      get(ref(db, "products")),
      get(ref(db, "settings"))
    ]);
    allProducts = prodSnap.val() || {};
    const settings = settingsSnap.val() || {};
    bkashNumber = settings.bkashNumber || "";
  } catch (err) {
    console.error("Chatbot data load error:", err);
  }
}

/* ==========================================================================
   MAIN INTENT HANDLER
   ========================================================================== */
async function handleMessage(raw){
  const text = raw.trim();
  if (!text) return;

  // ---- ভাষা নির্বাচন পর্যায়ে ----
  if (!lang) {
    if (matchesAny(text, ["bangla","বাংলা","bn"])) return selectLang("bn");
    if (matchesAny(text, ["english","ইংরেজি","en"])) return selectLang("en");
    await botSay(T.bn.askLang + "\n" + T.en.askLang, 400);
    setLangQuickReplies();
    return;
  }

  const t = T[lang];

  // ---- অর্ডার ফ্লো চলাকালীন ----
  if (order) return handleOrderStep(text);

  const intent = detectIntent(text);

  if (intent === "greeting") { await botSay(t.greetAfterLang); setMainQuickReplies(); return; }
  if (intent === "identity") { await botSay(t.identity); return; }
  if (intent === "contact")  { await botSay(t.contactMsg(bkashNumber || "—")); return; }
  if (intent === "delivery_time")   { await botSay(t.deliveryTime); return; }
  if (intent === "return_policy")   { await botSay(t.returnPolicy); return; }
  if (intent === "delivery_area")   { await botSay(t.deliveryArea); return; }
  if (intent === "min_order")       { await botSay(t.minOrder); return; }
  if (intent === "payment_methods") { await botSay(t.paymentMethods); return; }
  if (intent === "thanks")          { await botSay(t.thanks); return; }

  if (intent === "order") {
    const found = findProduct(text) || lastProduct;
    if (found) return startOrder(found);
    await botSay(t.askProductName);
    return;
  }

  // ---- প্রোডাক্ট খোঁজা (price/stock/info/general) ----
  const found = findProduct(text);
  if (found) {
    lastProduct = found;
    if (intent === "price") {
      await botSay(t.priceIs(found.data.price));
    } else if (intent === "stock") {
      await botSay(found.data.stock === false ? t.outStock : t.inStock);
    } else {
      await botSay(t.foundIntro);
      addProductCard(found.data);
    }
    return;
  }

  // যদি ইনটেন্ট price/stock/order টাইপের হয় কিন্তু প্রোডাক্ট না পাওয়া যায়
  if (intent === "price" || intent === "stock") {
    await botSay(t.notFoundAskId);
    return;
  }

  // কোনো কিছুই না মিললে, এটা কি প্রোডাক্ট নাম খোঁজার চেষ্টা মনে হচ্ছে?
  if (text.length >= 2 && !intent) {
    await botSay(t.notFoundAskId);
    return;
  }

  await botSay(t.fallback);
}

function selectLang(code){
  lang = code;
  clearQuickReplies();
  titleEl.textContent = "কারুকৃতি সহায়ক";
  botSay(T[lang].greetAfterLang, 400).then(setMainQuickReplies);
}
function setLangQuickReplies(){
  setQuickReplies([
    { label: "বাংলা", action: () => selectLang("bn") },
    { label: "English", action: () => selectLang("en") }
  ]);
}
function setMainQuickReplies(){
  const t = T[lang];
  setQuickReplies([
    { label: t.quickSearch, action: () => botSay(t.askProductName) },
    { label: t.quickOrder, action: () => botSay(t.askProductName).then(() => order = { step: "await_product" }) },
    { label: t.quickContact, action: () => botSay(t.contactMsg(bkashNumber || "—")) },
    { label: t.quickFaq, action: () => botSay(t.deliveryTime + "\n\n" + t.paymentMethods) }
  ]);
}

/* ==========================================================================
   ORDER FLOW
   ========================================================================== */
function startOrder(found){
  order = { step: "qty", productId: found.id, productName: found.data.name, price: found.data.price };
  lastProduct = found;
  botSay(T[lang].askQty);
}

async function handleOrderStep(text){
  const t = T[lang];

  if (order.step === "await_product") {
    const found = findProduct(text);
    if (!found) { await botSay(t.notFoundAskId); return; }
    order = { step: "qty", productId: found.id, productName: found.data.name, price: found.data.price };
    lastProduct = found;
    await botSay(t.askQty);
    return;
  }

  if (order.step === "qty") {
    const qty = parseInt(text.replace(/[^\d]/g, "")) || 1;
    order.qty = qty;
    order.step = "name";
    await botSay(t.askName);
    return;
  }

  if (order.step === "name") {
    order.customerName = text;
    order.step = "phone";
    await botSay(t.askPhone);
    return;
  }

  if (order.step === "phone") {
    order.phone = text;
    order.step = "area";
    await botSay(t.askArea);
    return;
  }

  if (order.step === "area") {
    order.area = text;
    order.step = "address";
    await botSay(t.askAddress);
    return;
  }

  if (order.step === "address") {
    order.address = text;
    order.step = "payment";
    await botSay(t.askPayment);
    setQuickReplies([
      { label: t.codLabel, action: () => selectPayment("cod") },
      { label: t.onlineLabel, action: () => selectPayment("online") }
    ]);
    return;
  }

  if (order.step === "txn") {
    order.transactionId = text;
    order.step = "confirm";
    await showSummary();
    return;
  }

  if (order.step === "confirm") {
    if (matchesAny(text, KW.yes)) return placeOrder();
    if (matchesAny(text, KW.no)) return cancelOrder();
    await botSay(t.fallback);
  }
}

function selectPayment(method){
  clearQuickReplies();
  addMsg(method === "cod" ? T[lang].codLabel : T[lang].onlineLabel, "user");
  order.paymentMethod = method;
  if (method === "online") {
    order.step = "txn";
    botSay(T[lang].askTxn);
  } else {
    order.step = "confirm";
    showSummary();
  }
}

async function showSummary(){
  const t = T[lang];
  order.total = order.price * order.qty;
  await botSay(t.orderSummary(order));
  setQuickReplies([
    { label: t.confirmYes, action: placeOrder },
    { label: t.confirmNo, action: cancelOrder }
  ]);
}

async function placeOrder(){
  clearQuickReplies();
  const t = T[lang];
  try {
    const newRef = push(ref(db, "orders"));
    await set(newRef, {
      id: newRef.key,
      customerName: order.customerName,
      phone: order.phone,
      area: order.area,
      address: order.address,
      paymentMethod: order.paymentMethod,
      transactionId: order.transactionId || null,
      items: [{ id: order.productId, name: order.productName, price: order.price, qty: order.qty }],
      total: order.total,
      status: "pending",
      createdAt: Date.now(),
      source: "chatbot"
    });
    await botSay(t.orderPlaced(newRef.key));
  } catch (err) {
    console.error(err);
    await botSay(lang === "bn" ? "দুঃখিত, অর্ডার সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "Sorry, something went wrong placing the order. Please try again.");
  }
  order = null;
  setMainQuickReplies();
}

async function cancelOrder(){
  clearQuickReplies();
  await botSay(T[lang].orderCancelled);
  order = null;
  setMainQuickReplies();
}

/* ==========================================================================
   INPUT HANDLERS
   ========================================================================== */
function send(){
  const val = inputEl.value.trim();
  if (!val) return;
  addMsg(val, "user");
  inputEl.value = "";
  handleMessage(val);
}
sendBtn.addEventListener("click", send);
inputEl.addEventListener("keydown", e => { if (e.key === "Enter") send(); });

/* ==========================================================================
   INIT
   ========================================================================== */
(async function init(){
  await loadData();
  await botSay(T.bn.welcome, 400);
  await botSay(T.bn.askLang, 500);
  setLangQuickReplies();
})();
