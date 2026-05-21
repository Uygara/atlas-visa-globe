// Tiny i18n layer. No build step, no framework — just a dictionary keyed by
// short string identifiers. Look-ups fall back to English when a translation
// is missing, so we can ship one key at a time without breaking the site.
//
// Adding a language:
//   1. Add the two-letter code to LANGS below
//   2. Add a new top-level object under TRANSLATIONS with the same keys as `en`
//   3. Translate row-by-row — anything missing falls back to English.
//
// Adding a key:
//   - Pick a short, dotted path (e.g. "panel.your_passport")
//   - Add it under every language (or just `en` — missing langs fall back)
//   - Use `window.t("panel.your_passport")` at the call site.

window.LANGS = [
  { code: "en", label: "English",   native: "English"   },
  { code: "tr", label: "Turkish",   native: "Türkçe"    },
  { code: "es", label: "Spanish",   native: "Español"   },
  { code: "de", label: "German",    native: "Deutsch"   },
  { code: "fr", label: "French",    native: "Français"  },
  { code: "ar", label: "Arabic",    native: "العربية"   },
];

const T = {
  en: {
    "nav.atlas":         "Atlas",
    "nav.globe":         "Globe",
    "nav.schengen":      "Schengen calc",
    "nav.itinerary":     "Itinerary",
    "nav.nomad":         "Nomad visas",
    "nav.alerts":        "Alerts",
    "nav.about":         "About",
    "nav.settings":      "Settings",
    "nav.language":      "Language",

    "welcome.hint":      "Pick your passport to begin",
    "welcome.title_1":   "Where in the world",
    "welcome.title_2":   "can you go without a visa?",
    "welcome.body":      "Select the passport you hold. The globe will paint every other country by what you'd need to enter today: visa-free, eVisa, visa on arrival, or visa required.",
    "welcome.use_location": "Use my location",
    "welcome.detecting": "Detecting…",

    "panel.your_passport":   "Your passport",
    "panel.compare_with":    "Compare with",
    "panel.group":           "Group",
    "panel.add_passport":    "+ Add passport",
    "panel.direction":       "Direction",
    "panel.outgoing":        "Outgoing",
    "panel.incoming":        "Incoming",
    "panel.outgoing_hint":   "Where can I go?",
    "panel.incoming_hint":   "Who can visit me?",
    "panel.recently_changed":"Recently changed",
    "panel.no_changes":      "No policy changes detected in the last 24 hours.",
    "panel.no_changes_sub":  "Atlas re-scrapes every morning at 06:00 UTC. Real policy edits will appear here as they happen.",
    "panel.search_placeholder": "Search any country…",

    "status.vf":  "Visa-free",
    "status.ev":  "eVisa",
    "status.voa": "Visa on arrival",
    "status.vr":  "Visa required",
    "status.self":"Your passport",
    "status.na":  "No data",
    "status.short.vf":  "Visa-free",
    "status.short.ev":  "eVisa",
    "status.short.voa": "VoA",
    "status.short.vr":  "Visa req.",

    "tally.accessible":  "destinations accessible",
    "tally.group_label": "destinations the group can enter",
    "tally.of":          "of",
    "tally.worst_case":  "worst-case visa",
    "tally.filter_all":  "All",

    "detail.up_to_days":      "Up to {n} days",
    "detail.note.vf":         "No visa needed. Present a valid passport on arrival.",
    "detail.note.ev":         "Apply online before travel. Approval is typically issued in 24–72 hours.",
    "detail.note.voa":        "Obtain visa at the border. Carry passport photos, fee in USD, and proof of onward travel.",
    "detail.note.vr":         "Apply for a visa at an embassy or consulate before travel.",
    "detail.note.self":       "You are at home.",
    "detail.note.na":         "No data available for this passport / destination pair.",
    "detail.compare":         "Compare",
    "detail.per_group_member":"Per group member",
    "detail.visa_cost":       "Visa cost & timing",
    "detail.processing":      "Processing",
    "detail.type":            "Type",
    "detail.validity":        "Validity",
    "detail.duration_of_stay":"Duration of stay",
    "detail.official_source": "Official source ↗",
    "detail.reviewed":        "Reviewed {date}. Verify before applying — fees change.",
    "detail.get_alerts_for":  "Get alerts for {name}",
    "detail.get_alerts_sub":  "Free email when its visa policy changes.",
    "detail.plan_your_trip":  "Plan your trip",
    "detail.sponsored":       "Sponsored. Atlas may earn a commission.",

    "mode.3d":   "3D",
    "mode.2d":   "2D",
    "settings.theme":         "Theme",
    "settings.theme_dark":    "Dark",
    "settings.theme_light":   "Light",
    "settings.modes":         "Modes",
    "settings.compare_two":   "Compare two passports",
    "settings.group_travel":  "Group travel (multi-passport)",
    "settings.group_sub":     "Family / business trips — paint countries by the strictest visa in the group.",

    "footer.refresh":         "Daily refresh from public sources. Verify with the destination embassy before travel.",
    "footer.alerts":          "Alerts",
    "footer.schengen":        "Schengen calc",
    "footer.itinerary":       "Itinerary",
    "footer.nomad":           "Nomad visas",
    "footer.about":           "About",
    "footer.privacy":         "Privacy",
    "footer.all_passports":   "All passports",
    "footer.source":          "Source",
  },

  tr: {
    "nav.atlas":         "Atlas",
    "nav.globe":         "Küre",
    "nav.schengen":      "Schengen hesap.",
    "nav.itinerary":     "Rota planı",
    "nav.nomad":         "Nomad vizeleri",
    "nav.alerts":        "Uyarılar",
    "nav.about":         "Hakkında",
    "nav.settings":      "Ayarlar",
    "nav.language":      "Dil",

    "welcome.hint":      "Başlamak için pasaportunu seç",
    "welcome.title_1":   "Dünyanın hangi köşesine",
    "welcome.title_2":   "vizesiz gidebilirsin?",
    "welcome.body":      "Sahip olduğun pasaportu seç. Küre, her diğer ülkeyi bugünkü giriş ihtiyacına göre boyayacak: vizesiz, e-vize, varışta vize, veya vize gerekli.",
    "welcome.use_location": "Konumumu kullan",
    "welcome.detecting": "Tespit ediliyor…",

    "panel.your_passport":   "Pasaportun",
    "panel.compare_with":    "Karşılaştır",
    "panel.group":           "Grup",
    "panel.add_passport":    "+ Pasaport ekle",
    "panel.direction":       "Yön",
    "panel.outgoing":        "Giden",
    "panel.incoming":        "Gelen",
    "panel.outgoing_hint":   "Nereye gidebilirim?",
    "panel.incoming_hint":   "Kim beni ziyaret edebilir?",
    "panel.recently_changed":"Son değişiklikler",
    "panel.no_changes":      "Son 24 saatte vize politikası değişikliği saptanmadı.",
    "panel.no_changes_sub":  "Atlas her sabah 06:00 UTC'de yeniden tarıyor. Gerçek politika değişiklikleri burada görünür.",
    "panel.search_placeholder": "Herhangi bir ülkeyi ara…",

    "status.vf":  "Vizesiz",
    "status.ev":  "e-Vize",
    "status.voa": "Varışta vize",
    "status.vr":  "Vize gerekli",
    "status.self":"Pasaportun",
    "status.na":  "Veri yok",
    "status.short.vf":  "Vizesiz",
    "status.short.ev":  "e-Vize",
    "status.short.voa": "VoA",
    "status.short.vr":  "Vize gerek.",

    "tally.accessible":  "ulaşılabilir destinasyon",
    "tally.group_label": "grubun girebileceği destinasyon",
    "tally.of":          "/",
    "tally.worst_case":  "en katı vize",
    "tally.filter_all":  "Tümü",

    "detail.up_to_days":      "{n} güne kadar",
    "detail.note.vf":         "Vize gerekmez. Geçerli pasaportla giriş yeterli.",
    "detail.note.ev":         "Seyahatten önce online başvur. Onay tipik olarak 24–72 saatte.",
    "detail.note.voa":        "Vize sınırda alınır. Vesikalık fotoğraf, USD ücret ve dönüş kanıtı taşı.",
    "detail.note.vr":         "Seyahatten önce konsoloslukta vize başvurusu yap.",
    "detail.note.self":       "Evindesin.",
    "detail.note.na":         "Bu pasaport-destinasyon çifti için veri yok.",
    "detail.compare":         "Karşılaştır",
    "detail.per_group_member":"Grup üyesi başına",
    "detail.visa_cost":       "Vize ücreti ve süre",
    "detail.processing":      "İşlem süresi",
    "detail.type":            "Tür",
    "detail.validity":        "Geçerlilik",
    "detail.duration_of_stay":"Kalış süresi",
    "detail.official_source": "Resmi kaynak ↗",
    "detail.reviewed":        "{date} tarihinde gözden geçirildi. Başvurudan önce doğrula — ücretler değişir.",
    "detail.get_alerts_for":  "{name} için uyarı al",
    "detail.get_alerts_sub":  "Vize politikası değişince ücretsiz email.",
    "detail.plan_your_trip":  "Seyahatini planla",
    "detail.sponsored":       "Sponsorlu. Atlas komisyon kazanabilir.",

    "mode.3d":   "3B",
    "mode.2d":   "2B",
    "settings.theme":         "Tema",
    "settings.theme_dark":    "Koyu",
    "settings.theme_light":   "Açık",
    "settings.modes":         "Modlar",
    "settings.compare_two":   "İki pasaportu karşılaştır",
    "settings.group_travel":  "Grup seyahati (çoklu pasaport)",
    "settings.group_sub":     "Aile / iş seyahati — ülkeleri grubun en katı vizesine göre boya.",

    "footer.refresh":         "Halka açık kaynaklardan günlük güncelleme. Seyahatten önce hedef konsoloslukla doğrula.",
    "footer.alerts":          "Uyarılar",
    "footer.schengen":        "Schengen hesap.",
    "footer.itinerary":       "Rota planı",
    "footer.nomad":           "Nomad vizeleri",
    "footer.about":           "Hakkında",
    "footer.privacy":         "Gizlilik",
    "footer.all_passports":   "Tüm pasaportlar",
    "footer.source":          "Kaynak",
  },

  es: {
    "nav.globe":         "Globo",
    "nav.schengen":      "Calc. Schengen",
    "nav.itinerary":     "Itinerario",
    "nav.nomad":         "Visas nómada",
    "nav.alerts":        "Alertas",
    "nav.about":         "Acerca de",
    "nav.settings":      "Ajustes",
    "nav.language":      "Idioma",
    "welcome.hint":      "Elige tu pasaporte para empezar",
    "welcome.title_1":   "¿A dónde del mundo",
    "welcome.title_2":   "puedes ir sin visa?",
    "welcome.use_location": "Usar mi ubicación",
    "panel.your_passport":"Tu pasaporte",
    "panel.compare_with": "Comparar con",
    "panel.direction":    "Dirección",
    "panel.outgoing":     "Saliente",
    "panel.incoming":     "Entrante",
    "panel.outgoing_hint":"¿A dónde puedo ir?",
    "panel.incoming_hint":"¿Quién puede visitarme?",
    "panel.recently_changed":"Cambios recientes",
    "panel.search_placeholder": "Buscar cualquier país…",
    "status.vf":  "Sin visa",
    "status.ev":  "eVisa",
    "status.voa": "Visa al llegar",
    "status.vr":  "Visa requerida",
    "tally.accessible":  "destinos accesibles",
    "tally.of":          "de",
    "tally.filter_all":  "Todos",
    "mode.3d": "3D", "mode.2d": "2D",
    "footer.alerts": "Alertas", "footer.about": "Acerca de", "footer.privacy": "Privacidad",
  },

  de: {
    "nav.globe":         "Globus",
    "nav.schengen":      "Schengen-Rech.",
    "nav.itinerary":     "Reiseplan",
    "nav.nomad":         "Nomad-Visa",
    "nav.alerts":        "Hinweise",
    "nav.about":         "Über",
    "nav.settings":      "Einstellungen",
    "nav.language":      "Sprache",
    "welcome.hint":      "Wähle deinen Pass, um zu beginnen",
    "welcome.title_1":   "Wohin auf der Welt",
    "welcome.title_2":   "kannst du ohne Visum?",
    "welcome.use_location": "Standort verwenden",
    "panel.your_passport":"Dein Pass",
    "panel.compare_with": "Vergleichen mit",
    "panel.direction":    "Richtung",
    "panel.outgoing":     "Ausgehend",
    "panel.incoming":     "Eingehend",
    "panel.outgoing_hint":"Wohin kann ich reisen?",
    "panel.incoming_hint":"Wer darf mich besuchen?",
    "panel.recently_changed":"Letzte Änderungen",
    "panel.search_placeholder": "Land suchen…",
    "status.vf":  "Visumfrei",
    "status.ev":  "eVisa",
    "status.voa": "Visum bei Ankunft",
    "status.vr":  "Visum erforderlich",
    "tally.accessible":  "erreichbare Länder",
    "tally.of":          "von",
    "tally.filter_all":  "Alle",
    "mode.3d": "3D", "mode.2d": "2D",
    "footer.alerts": "Hinweise", "footer.about": "Über", "footer.privacy": "Datenschutz",
  },

  fr: {
    "nav.globe":         "Globe",
    "nav.schengen":      "Calc. Schengen",
    "nav.itinerary":     "Itinéraire",
    "nav.nomad":         "Visas nomades",
    "nav.alerts":        "Alertes",
    "nav.about":         "À propos",
    "nav.settings":      "Paramètres",
    "nav.language":      "Langue",
    "welcome.hint":      "Choisis ton passeport pour commencer",
    "welcome.title_1":   "Où dans le monde",
    "welcome.title_2":   "peux-tu aller sans visa ?",
    "welcome.use_location": "Utiliser ma position",
    "panel.your_passport":"Ton passeport",
    "panel.compare_with": "Comparer avec",
    "panel.direction":    "Direction",
    "panel.outgoing":     "Sortant",
    "panel.incoming":     "Entrant",
    "panel.outgoing_hint":"Où puis-je aller ?",
    "panel.incoming_hint":"Qui peut me visiter ?",
    "panel.recently_changed":"Changements récents",
    "panel.search_placeholder": "Rechercher un pays…",
    "status.vf":  "Sans visa",
    "status.ev":  "eVisa",
    "status.voa": "Visa à l'arrivée",
    "status.vr":  "Visa requis",
    "tally.accessible":  "destinations accessibles",
    "tally.of":          "sur",
    "tally.filter_all":  "Tous",
    "mode.3d": "3D", "mode.2d": "2D",
    "footer.alerts": "Alertes", "footer.about": "À propos", "footer.privacy": "Confidentialité",
  },

  ar: {
    "nav.globe":         "كرة أرضية",
    "nav.schengen":      "حاسبة شنغن",
    "nav.itinerary":     "خطة الرحلة",
    "nav.nomad":         "تأشيرات الرحالة",
    "nav.alerts":        "التنبيهات",
    "nav.about":         "حول",
    "nav.settings":      "الإعدادات",
    "nav.language":      "اللغة",
    "welcome.hint":      "اختر جواز سفرك للبدء",
    "welcome.title_1":   "إلى أين في العالم",
    "welcome.title_2":   "يمكنك الذهاب بدون تأشيرة؟",
    "welcome.use_location": "استخدم موقعي",
    "panel.your_passport":"جواز سفرك",
    "panel.compare_with": "قارن مع",
    "panel.direction":    "الاتجاه",
    "panel.outgoing":     "صادر",
    "panel.incoming":     "وارد",
    "panel.outgoing_hint":"إلى أين يمكنني الذهاب؟",
    "panel.incoming_hint":"من يمكنه زيارتي؟",
    "panel.recently_changed":"التغييرات الأخيرة",
    "panel.search_placeholder": "ابحث عن أي دولة…",
    "status.vf":  "بدون تأشيرة",
    "status.ev":  "تأشيرة إلكترونية",
    "status.voa": "تأشيرة عند الوصول",
    "status.vr":  "تأشيرة مطلوبة",
    "tally.accessible":  "وجهات يمكن الوصول إليها",
    "tally.of":          "من",
    "tally.filter_all":  "الكل",
    "mode.3d": "ثلاثي", "mode.2d": "ثنائي",
    "footer.alerts": "التنبيهات", "footer.about": "حول", "footer.privacy": "الخصوصية",
  },
};

// ── Runtime ─────────────────────────────────────────────────────────────
function detectLang() {
  try {
    const stored = localStorage.getItem("atlas.lang");
    if (stored && T[stored]) return stored;
  } catch (e) {}
  const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
  return T[browser] ? browser : "en";
}

window.ATLAS_LANG = detectLang();

window.t = function (key, vars) {
  let s = (T[window.ATLAS_LANG] && T[window.ATLAS_LANG][key]) || T.en[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return s;
};

window.setLang = function (code) {
  if (!T[code]) return;
  window.ATLAS_LANG = code;
  try { localStorage.setItem("atlas.lang", code); } catch (e) {}
  // Notify any subscribed React components / vanilla code.
  window.dispatchEvent(new CustomEvent("atlas:lang", { detail: { code } }));
  // Set html[lang] and dir=rtl for RTL languages
  document.documentElement.setAttribute("lang", code);
  document.documentElement.setAttribute("dir", code === "ar" ? "rtl" : "ltr");
};

// Apply current lang on load so html[lang] is right immediately
document.documentElement.setAttribute("lang", window.ATLAS_LANG);
document.documentElement.setAttribute("dir", window.ATLAS_LANG === "ar" ? "rtl" : "ltr");
