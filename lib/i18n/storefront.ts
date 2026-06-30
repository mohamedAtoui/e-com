export type Lang = "fr" | "ar";

export interface StorefrontDict {
  dir: "ltr" | "rtl";
  langLabel: string;
  nav: { collections: string; story: string; ambiance: string; cart: string };
  trustStrip: string;
  hero: {
    kicker: string;
    titleA: string;
    titleB: string;
    lede: string;
    cta: string;
    cta2: string;
    scrollHint: string;
  };
  story: { kicker: string; title: string; body: string; crafts: string[] };
  col: { kicker: string; title: string; cta: string; addToCart: string; empty: string };
  amb: { kicker: string; title: string; body: string; tags: string[] };
  val: { kicker: string; title: string; items: { t: string; d: string }[] };
  cta: { title: string; body: string; btn: string };
  foot: { nav: string[]; note: string };
  colPage: {
    kicker: string;
    title: string;
    lede: string;
    back: string;
    inStock: string;
    countOne: string;
    countMany: string;
    filters: { all: string; lampe: string; suspension: string; applique: string; lanterne: string };
  };
  product: {
    order: string;
    home: string;
    homeSub: string;
    stopdesk: string;
    stopdeskSub: string;
    name: string;
    phone: string;
    wilaya: string;
    commune: string;
    address: string;
    quantity: string;
    deliveryMode: string;
    choose: string;
    subtotal: string;
    delivery: string;
    total: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    orderRef: string;
    inStock: string;
    outOfStock: string;
    outOfStockMsg: string;
    lowStock: string;
    viewOrder: string;
    promos: string;
    promoUnit: string;
    promoEach: string;
    promoSave: string;
    promoBest: string;
    thankTitle: string;
    thankBody: string;
    backHome: string;
  };
}

export const DICT: Record<Lang, StorefrontDict> = {
  fr: {
    dir: "ltr",
    langLabel: "العربية",
    nav: { collections: "Collections", story: "Notre histoire", ambiance: "Ambiance", cart: "Panier" },
    trustStrip: "Paiement à la livraison · Livraison partout en Algérie",
    hero: {
      kicker: "Atelier · Alger",
      titleA: "La lumière,",
      titleB: "faite main.",
      lede: "Luminaires et objets façonnés à la main dans notre atelier — pour réchauffer chaque pièce d'une lueur douce.",
      cta: "Découvrir la collection",
      cta2: "Notre histoire",
      scrollHint: "Faites défiler",
    },
    story: {
      kicker: "Fait main",
      title: "Façonné par des mains, allumé par la lumière.",
      body: "Chaque pièce est soufflée, martelée et assemblée à la main. Le laiton patiné, le verre ambré, la lumière qui respire — rien n'est pressé, tout est ressenti.",
      crafts: ["Laiton martelé", "Verre soufflé", "Rotin tressé", "Patine naturelle"],
    },
    col: { kicker: "La collection", title: "Des pièces qui s'allument.", cta: "Voir tout", addToCart: "Voir le produit", empty: "Aucun produit disponible pour le moment." },
    amb: {
      kicker: "Ambiance",
      title: "Une lumière qui s'allume avec vous.",
      body: "Posée sur une console, suspendue au-dessus d'une table partagée — la lumière de Lighty s'installe dans le quotidien et l'adoucit.",
      tags: ["Salon", "Table", "Entrée"],
    },
    val: {
      kicker: "Pourquoi Lighty",
      title: "Pensé pour vous, jusque chez vous.",
      items: [
        { t: "Paiement à la livraison", d: "Payez en espèces quand votre commande arrive. Sans avance, sans risque." },
        { t: "Livraison partout en Algérie", d: "Expédié avec soin depuis Alger, emballé pour voyager sans une rayure." },
        { t: "Vraiment fait main", d: "Chaque pièce est unique, signée par l'artisan qui l'a façonnée." },
        { t: "Garantie 2 ans", d: "Un savoir-faire qui dure. On répare, on remplace, on s'engage." },
      ],
    },
    cta: { title: "Apportez la lumière chez vous.", body: "Une pièce, une lueur, une atmosphère. Commencez votre collection dès aujourd'hui.", btn: "Commander maintenant" },
    foot: { nav: ["Collections", "Notre histoire", "Ambiance", "Contact"], note: "© 2026 Lighty · Atelier d'Alger · Fait main en Algérie" },
    colPage: {
      kicker: "Toute la collection",
      title: "La lumière, pièce par pièce.",
      lede: "Chaque luminaire s'allume au survol.",
      back: "Retour à l'accueil",
      inStock: "En stock",
      countOne: "pièce",
      countMany: "pièces",
      filters: { all: "Tout", lampe: "Lampes", suspension: "Suspensions", applique: "Appliques", lanterne: "Lanternes" },
    },
    product: {
      order: "Commander",
      home: "À domicile",
      homeSub: "Livraison à votre adresse",
      stopdesk: "Au bureau (Stop Desk)",
      stopdeskSub: "Retrait au bureau",
      name: "Nom complet",
      phone: "Téléphone",
      wilaya: "Wilaya",
      commune: "Commune",
      address: "Adresse",
      quantity: "Quantité",
      deliveryMode: "Mode de livraison",
      choose: "Choisir…",
      subtotal: "Sous-total",
      delivery: "Livraison",
      total: "Total",
      submit: "Confirmer la commande",
      submitting: "Envoi…",
      successTitle: "Commande confirmée",
      successBody: "Nous vous appellerons pour confirmer la livraison.",
      orderRef: "Commande",
      inStock: "En stock",
      outOfStock: "Rupture de stock",
      outOfStockMsg: "Ce produit est actuellement en rupture de stock.",
      lowStock: "Plus que {n} en stock",
      viewOrder: "Voir ma commande",
      promos: "Offres spéciales",
      promoUnit: "pièces",
      promoEach: "soit {n} / pièce",
      promoSave: "Économisez {n}",
      promoBest: "Meilleure offre",
      thankTitle: "Merci pour votre commande !",
      thankBody: "Votre commande a bien été enregistrée. Nous vous appellerons très bientôt pour confirmer la livraison.",
      backHome: "Continuer mes achats",
    },
  },
  ar: {
    dir: "rtl",
    langLabel: "Français",
    nav: { collections: "المجموعات", story: "قصّتنا", ambiance: "الأجواء", cart: "السلّة" },
    trustStrip: "الدفع عند الاستلام · توصيل لكل الجزائر",
    hero: {
      kicker: "الورشة · الجزائر",
      titleA: "الضوء،",
      titleB: "مصنوع باليد.",
      lede: "مصابيح وقطع تُصنع يدويًا في ورشتنا — لتغمر كل غرفة بدفءٍ هادئ.",
      cta: "اكتشف المجموعة",
      cta2: "قصّتنا",
      scrollHint: "مرّر للأسفل",
    },
    story: {
      kicker: "صناعة يدوية",
      title: "تُشكّله الأيادي، ويُضيئه النور.",
      body: "كل قطعة تُنفخ وتُطرق وتُجمع يدويًا. نحاسٌ بباتينا، زجاجٌ كهرماني، وضوءٌ يتنفّس — لا شيء على عجل، كل شيء بإحساس.",
      crafts: ["نحاس مطروق", "زجاج منفوخ", "روطان مضفور", "باتينا طبيعية"],
    },
    col: { kicker: "المجموعة", title: "قطعٌ تُضيء.", cta: "عرض الكل", addToCart: "عرض المنتج", empty: "لا توجد منتجات متاحة حاليًا." },
    amb: {
      kicker: "الأجواء",
      title: "ضوءٌ يُضيء معك.",
      body: "فوق طاولة جانبية، أو معلّقًا فوق مائدةٍ تجمع الأحبّة — ضوء Lighty يسكن التفاصيل اليومية ويُلطّفها.",
      tags: ["الصالون", "المائدة", "المدخل"],
    },
    val: {
      kicker: "لماذا Lighty",
      title: "مصنوعٌ لأجلك، حتى باب بيتك.",
      items: [
        { t: "الدفع عند الاستلام", d: "ادفع نقدًا حين تصل طلبيتك. دون مقدّم، دون مخاطرة." },
        { t: "توصيل لكل الجزائر", d: "يُشحن بعناية من الجزائر، مغلّفًا ليصل دون خدش." },
        { t: "صناعة يدوية حقًا", d: "كل قطعة فريدة، موقّعة من الحرفيّ الذي صنعها." },
        { t: "ضمان سنتان", d: "حِرفةٌ تدوم. نُصلح، نستبدل، ونلتزم." },
      ],
    },
    cta: { title: "أدخِل الضوء إلى بيتك.", body: "قطعةٌ واحدة، وميضٌ واحد، أجواءٌ كاملة. ابدأ مجموعتك اليوم.", btn: "اطلب الآن" },
    foot: { nav: ["المجموعات", "قصّتنا", "الأجواء", "تواصل"], note: "© 2026 Lighty · ورشة الجزائر · صناعة يدوية في الجزائر" },
    colPage: {
      kicker: "كل المجموعة",
      title: "الضوء، قطعةً قطعة.",
      lede: "كل مصباح يُضيء عند المرور.",
      back: "العودة للرئيسية",
      inStock: "متوفّر",
      countOne: "قطعة",
      countMany: "قطع",
      filters: { all: "الكل", lampe: "مصابيح", suspension: "تعليقات", applique: "إضاءات", lanterne: "فوانيس" },
    },
    product: {
      order: "اطلب الآن",
      home: "إلى المنزل",
      homeSub: "التوصيل إلى عنوانك",
      stopdesk: "إلى المكتب",
      stopdeskSub: "الاستلام من المكتب",
      name: "الاسم الكامل",
      phone: "رقم الهاتف",
      wilaya: "الولاية",
      commune: "البلدية",
      address: "العنوان",
      quantity: "الكمية",
      deliveryMode: "طريقة التوصيل",
      choose: "اختر…",
      subtotal: "المجموع الفرعي",
      delivery: "التوصيل",
      total: "المجموع",
      submit: "تأكيد الطلب",
      submitting: "جارٍ الإرسال…",
      successTitle: "تم تأكيد الطلب",
      successBody: "سنتصل بك لتأكيد التوصيل.",
      orderRef: "الطلب",
      inStock: "متوفّر",
      outOfStock: "نفد المخزون",
      outOfStockMsg: "هذا المنتج غير متوفّر حاليًا.",
      lowStock: "بقي {n} فقط",
      viewOrder: "عرض طلبي",
      promos: "عروض خاصة",
      promoUnit: "قطع",
      promoEach: "أي {n} / للقطعة",
      promoSave: "وفّر {n}",
      promoBest: "أفضل عرض",
      thankTitle: "شكرًا على طلبك !",
      thankBody: "تم تسجيل طلبك بنجاح. سنتصل بك قريبًا جدًا لتأكيد التوصيل.",
      backHome: "مواصلة التسوّق",
    },
  },
};
