// ==========================================================================
// DEMO ডেটা সিডিং — প্রথমবার সাইট লোড হলে Firebase খালি থাকলে ডেমো ডেটা বসাবে
// ==========================================================================
import { db, ref, get, set } from "./firebase-config.js?v=2";

const demoCategories = [
  { id: "cat_electronics", name: "ইলেকট্রনিক্স", icon: "📱" },
  { id: "cat_fashion", name: "ফ্যাশন", icon: "👕" },
  { id: "cat_home", name: "হোম অ্যান্ড লিভিং", icon: "🏠" },
  { id: "cat_beauty", name: "বিউটি অ্যান্ড কেয়ার", icon: "💄" }
];

const demoProducts = [
  {
    id: "prod_1",
    name: "ওয়্যারলেস ব্লুটুথ হেডফোন",
    price: 1450,
    oldPrice: 1900,
    category: "cat_electronics",
    description: "প্রিমিয়াম সাউন্ড কোয়ালিটি, ৩০ ঘন্টা ব্যাটারি ব্যাকআপ, নয়েজ ক্যান্সেলেশন ফিচার সহ। দৈনন্দিন ব্যবহারের জন্য আরামদায়ক ও টেকসই।",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600"
    ],
    stock: true
  },
  {
    id: "prod_2",
    name: "স্মার্ট ওয়াচ প্রো সিরিজ",
    price: 2890,
    oldPrice: 3500,
    category: "cat_electronics",
    description: "হার্ট রেট মনিটর, স্লিপ ট্র্যাকিং, ওয়াটারপ্রুফ ডিজাইন। ৭ দিনের ব্যাটারি ব্যাকআপ এবং স্মার্টফোন নোটিফিকেশন সাপোর্ট।",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600"
    ],
    stock: true
  },
  {
    id: "prod_3",
    name: "প্রিমিয়াম কটন পাঞ্জাবি",
    price: 990,
    oldPrice: 1300,
    category: "cat_fashion",
    description: "১০০% খাঁটি কটন কাপড়ে তৈরি, আরামদায়ক ফিটিং, সব উপলক্ষ্যে মানানসই। সহজে ইস্ত্রি করা যায়, দীর্ঘস্থায়ী রঙ।",
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600"
    ],
    stock: true
  },
  {
    id: "prod_4",
    name: "লেডিস হ্যান্ডব্যাগ - লেদার",
    price: 1650,
    oldPrice: 2100,
    category: "cat_fashion",
    description: "উন্নত মানের লেদার দিয়ে তৈরি, স্পেসিয়াস কম্পার্টমেন্ট, স্টাইলিশ ডিজাইন। অফিস কিংবা ক্যাজুয়াল যেকোনো লুকে মানানসই।",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"
    ],
    stock: true
  },
  {
    id: "prod_5",
    name: "সিরামিক ডিনার সেট (১৬ পিস)",
    price: 2250,
    oldPrice: 2800,
    category: "cat_home",
    description: "প্রিমিয়াম কোয়ালিটি সিরামিক ডিনার সেট, মাইক্রোওয়েভ ও ডিশওয়াশার সেফ। এলিগ্যান্ট ডিজাইন যা যেকোনো ডাইনিং টেবিলে সৌন্দর্য বৃদ্ধি করে।",
    images: [
      "https://images.unsplash.com/photo-1584346133934-a3afd2a33caa?w=600",
      "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?w=600"
    ],
    stock: true
  },
  {
    id: "prod_6",
    name: "অ্যারোমা সেন্টেড ক্যান্ডেল সেট",
    price: 550,
    oldPrice: 750,
    category: "cat_home",
    description: "রিল্যাক্সিং সুগন্ধযুক্ত ৩টি ক্যান্ডেলের সেট, ৪০+ ঘন্টা বার্নিং টাইম। ঘরের পরিবেশ প্রশান্ত ও সুবাসিত রাখতে আদর্শ।",
    images: [
      "https://images.unsplash.com/photo-1602874801007-bd36c356fcd6?w=600",
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600"
    ],
    stock: true
  },
  {
    id: "prod_7",
    name: "অর্গানিক ফেসিয়াল সিরাম",
    price: 780,
    oldPrice: 950,
    category: "cat_beauty",
    description: "ভিটামিন সি সমৃদ্ধ, ত্বক উজ্জ্বল ও দাগমুক্ত রাখতে সহায়ক। সব ধরনের ত্বকের জন্য উপযোগী, প্যারাবেন-মুক্ত ফর্মুলা।",
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"
    ],
    stock: true
  },
  {
    id: "prod_8",
    name: "মেকআপ ব্রাশ কিট (১২ পিস)",
    price: 620,
    oldPrice: 850,
    category: "cat_beauty",
    description: "সফট ব্রিসল, প্রফেশনাল মানের মেকআপ ব্রাশ সেট, সুন্দর স্টোরেজ ব্যাগসহ। বিগিনার থেকে প্রো সবার জন্য উপযুক্ত।",
    images: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600",
      "https://images.unsplash.com/photo-1583241800698-9c2e0c1b8b1c?w=600"
    ],
    stock: false
  }
];

const demoBanners = [
  { id: "banner_1", image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=675&fit=crop", order: 1 },
  { id: "banner_2", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=675&fit=crop", order: 2 },
  { id: "banner_3", image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=675&fit=crop", order: 3 }
];

const demoSettings = {
  siteName: "ShopBD",
  paymentMethods: { cod: true, online: true },
  bkashNumber: "01700-000000",
  nagadNumber: "01700-000000"
};

export async function seedDemoData() {
  try {
    const catSnap = await get(ref(db, "categories"));
    if (!catSnap.exists()) {
      const catObj = {};
      demoCategories.forEach(c => catObj[c.id] = c);
      await set(ref(db, "categories"), catObj);
    }

    const prodSnap = await get(ref(db, "products"));
    if (!prodSnap.exists()) {
      const prodObj = {};
      demoProducts.forEach(p => prodObj[p.id] = p);
      await set(ref(db, "products"), prodObj);
    }

    const bannerSnap = await get(ref(db, "banners"));
    if (!bannerSnap.exists()) {
      const bannerObj = {};
      demoBanners.forEach(b => bannerObj[b.id] = b);
      await set(ref(db, "banners"), bannerObj);
    }

    const settingsSnap = await get(ref(db, "settings"));
    if (!settingsSnap.exists()) {
      await set(ref(db, "settings"), demoSettings);
    }
  } catch (err) {
    console.error("ডেমো ডেটা সিড করতে সমস্যা হয়েছে:", err);
  }
}
