// Static-page i18n — keeps the SPA's language choice on every standalone page
// (alerts / schengen-calculator / itinerary / digital-nomad-visa / about /
// privacy). Each static page just loads this script; it walks the DOM at
// startup, replaces known English strings with the active language, and
// injects a small lang switcher fixed to the top-right corner that updates
// localStorage and triggers a re-walk.
//
// Strategy: pure text-node matching keyed on the English original. No need to
// add data-i18n attributes per element — the dictionary IS the schema. If a
// string isn't in the dict for the current language, it stays English. Add to
// the dict as we ship coverage for more strings.

(function () {
  // Read lang from localStorage; same key the SPA uses.
  function currentLang() {
    try { return localStorage.getItem("atlas.lang") || "en"; }
    catch (e) { return "en"; }
  }

  // English-keyed translation dictionary. Add languages as needed; missing
  // language for a string → fallback to the original English text.
  // KEEP KEYS as the exact verbatim English from the source HTML (trimmed).
  const DICT = {
    "← Atlas":                            { tr:"← Atlas", es:"← Atlas", de:"← Atlas", fr:"← Atlas", ar:"← أطلس" },
    "← Atlas globe":                      { tr:"← Atlas küresi", es:"← Globo Atlas", de:"← Atlas-Globus", fr:"← Globe Atlas", ar:"← كرة أطلس" },
    "← Back to Atlas":                    { tr:"← Atlas'a dön", es:"← Volver a Atlas", de:"← Zurück zu Atlas", fr:"← Retour à Atlas", ar:"← العودة إلى أطلس" },
    "← Back to globe":                    { tr:"← Küreye dön", es:"← Volver al globo", de:"← Zurück zum Globus", fr:"← Retour au globe", ar:"← العودة إلى الكرة" },

    // Schengen calculator
    "Schengen 90/180 calculator":          { tr:"Schengen 90/180 hesaplayıcı", es:"Calculadora Schengen 90/180", de:"Schengen 90/180-Rechner", fr:"Calculateur Schengen 90/180", ar:"حاسبة شنغن 90/180" },
    "Schengen 90/180 Calculator":          { tr:"Schengen 90/180 Hesaplayıcı", es:"Calculadora Schengen 90/180", de:"Schengen 90/180-Rechner", fr:"Calculateur Schengen 90/180", ar:"حاسبة شنغن 90/180" },
    "Schengen 90 / 180 Day Calculator":    { tr:"Schengen 90 / 180 Gün Hesaplayıcı", es:"Calculadora Schengen 90 / 180 días", de:"Schengen 90 / 180-Tage-Rechner", fr:"Calculateur Schengen 90 / 180 jours", ar:"حاسبة شنغن 90 / 180 يومًا" },
    "Add a trip":                          { tr:"Seyahat ekle", es:"Añadir un viaje", de:"Reise hinzufügen", fr:"Ajouter un voyage", ar:"إضافة رحلة" },
    "+ Add trip":                          { tr:"+ Seyahat ekle", es:"+ Añadir viaje", de:"+ Reise hinzufügen", fr:"+ Ajouter un voyage", ar:"+ إضافة رحلة" },
    "Entry date":                          { tr:"Giriş tarihi", es:"Fecha de entrada", de:"Einreisedatum", fr:"Date d'entrée", ar:"تاريخ الدخول" },
    "Exit date":                           { tr:"Çıkış tarihi", es:"Fecha de salida", de:"Ausreisedatum", fr:"Date de sortie", ar:"تاريخ الخروج" },
    "Check a specific date":               { tr:"Belirli bir tarihi kontrol et", es:"Comprobar una fecha específica", de:"Bestimmtes Datum prüfen", fr:"Vérifier une date précise", ar:"تحقق من تاريخ محدد" },
    "Reference date:":                     { tr:"Referans tarih:", es:"Fecha de referencia:", de:"Referenzdatum:", fr:"Date de référence :", ar:"التاريخ المرجعي:" },
    "Today":                               { tr:"Bugün", es:"Hoy", de:"Heute", fr:"Aujourd'hui", ar:"اليوم" },

    "Your trips":                          { tr:"Seyahatlerin", es:"Tus viajes", de:"Deine Reisen", fr:"Tes voyages", ar:"رحلاتك" },
    "Need a Schengen visa application checklist?": { tr:"Schengen vize başvuru kontrol listesi lazım mı?", es:"¿Necesitas una lista para la solicitud de visado Schengen?", de:"Brauchst du eine Schengen-Visumantrags-Checkliste?", fr:"Besoin d'une check-list de demande de visa Schengen ?", ar:"هل تحتاج قائمة تحقّق لطلب تأشيرة شنغن؟" },

    // Schengen cascade card
    "Schengen multi-entry visa \"cascade\" check": { tr:"Schengen çok girişli vize \"kademe\" kontrolü", es:"Comprobación de visado Schengen de entradas múltiples (\"cascada\")", de:"Schengen-Mehrfachvisum-\"Kaskaden\"-Prüfung", fr:"Vérification du visa Schengen à entrées multiples (« cascade »)", ar:"فحص \"تدرّج\" تأشيرة شنغن متعددة الدخول" },
    "Prior visas used correctly":          { tr:"Doğru kullanılmış önceki vizeler", es:"Visados anteriores usados correctamente", de:"Frühere korrekt genutzte Visa", fr:"Visas précédents utilisés correctement", ar:"التأشيرات السابقة المستخدمة بشكل صحيح" },
    "Most recent visa was…":               { tr:"En son vize şuydu…", es:"El visado más reciente fue…", de:"Das letzte Visum war…", fr:"Le visa le plus récent était…", ar:"كانت آخر تأشيرة…" },
    "— None yet":                          { tr:"— Henüz yok", es:"— Ninguno aún", de:"— Noch keines", fr:"— Aucun encore", ar:"— لا يوجد بعد" },
    "Single-entry / short MEV (under 1 year)": { tr:"Tek girişli / kısa MEV (1 yıldan az)", es:"Entrada única / MEV corto (menos de 1 año)", de:"Einfache Einreise / kurzes MEV (unter 1 Jahr)", fr:"Entrée unique / MEV court (moins d'un an)", ar:"دخول واحد / MEV قصير (أقل من سنة)" },
    "1-year MEV":                          { tr:"1 yıllık MEV", es:"MEV de 1 año", de:"1-Jahres-MEV", fr:"MEV d'un an", ar:"MEV لمدة سنة" },
    "2-year MEV":                          { tr:"2 yıllık MEV", es:"MEV de 2 años", de:"2-Jahres-MEV", fr:"MEV de 2 ans", ar:"MEV لمدة سنتين" },
    "5-year MEV":                          { tr:"5 yıllık MEV", es:"MEV de 5 años", de:"5-Jahres-MEV", fr:"MEV de 5 ans", ar:"MEV لمدة 5 سنوات" },
    "Always exited Schengen on time (no overstays)": { tr:"Schengen'den her zaman zamanında çıktım (aşım yok)", es:"Siempre salí de Schengen a tiempo (sin excesos)", de:"Schengen immer pünktlich verlassen (keine Überschreitungen)", fr:"Toujours sorti de Schengen à temps (aucun dépassement)", ar:"غادرت شنغن دائمًا في الوقت المحدد (دون تجاوز)" },
    // Cascade verdict — badges
    "Cascade reset":                       { tr:"Kademe sıfırlandı", es:"Cascada reiniciada", de:"Kaskade zurückgesetzt", fr:"Cascade réinitialisée", ar:"إعادة ضبط التدرّج" },
    "Renew the 5-year MEV":                { tr:"5 yıllık MEV'i yenileyin", es:"Renueva el MEV de 5 años", de:"5-Jahres-MEV verlängern", fr:"Renouveler le MEV de 5 ans", ar:"جدّد MEV لمدة 5 سنوات" },
    "Request a 5-year multi-entry visa":   { tr:"5 yıllık çok girişli vize talep edin", es:"Solicita un visado de entradas múltiples de 5 años", de:"Beantrage ein 5-Jahres-Mehrfachvisum", fr:"Demander un visa à entrées multiples de 5 ans", ar:"اطلب تأشيرة متعددة الدخول لمدة 5 سنوات" },
    "Request a 2-year multi-entry visa":   { tr:"2 yıllık çok girişli vize talep edin", es:"Solicita un visado de entradas múltiples de 2 años", de:"Beantrage ein 2-Jahres-Mehrfachvisum", fr:"Demander un visa à entrées multiples de 2 ans", ar:"اطلب تأشيرة متعددة الدخول لمدة سنتين" },
    "Request a 1-year multi-entry visa":   { tr:"1 yıllık çok girişli vize talep edin", es:"Solicita un visado de entradas múltiples de 1 año", de:"Beantrage ein 1-Jahres-Mehrfachvisum", fr:"Demander un visa à entrées multiples d'un an", ar:"اطلب تأشيرة متعددة الدخول لمدة سنة" },
    "First-time applicant":                { tr:"İlk kez başvuran", es:"Solicitante por primera vez", de:"Erstantragsteller", fr:"Premier demandeur", ar:"متقدّم لأول مرة" },
    // Cascade intro paragraph (innerHTML block — keeps the <strong> markup)
    "schengen.cascade.intro": {
      tr: "<strong>Vize Kodu Madde 24</strong> uyarınca konsolosluklar, temiz seyahat geçmişi olan başvuru sahiplerine giderek daha uzun süreli çok girişli vizeler (MEV) verir. Çoğu yolcu bu kuralın varlığını bilmez, her seferinde tek girişli başvurur ve her birine €90 öder. Son 2 yılda kaç Schengen vizesini doğru kullandığını söyle, ne talep etmen gerektiğini önerelim.",
      es: "Según el <strong>Artículo 24 del Código de Visados</strong>, los consulados emiten visados de entradas múltiples (MEV) progresivamente más largos a solicitantes con un historial de viajes limpio. La mayoría no conoce esta regla y solicita entrada única cada vez, pagando €90. Dinos cuántos visados Schengen has usado correctamente en los últimos 2 años y te sugeriremos qué pedir.",
      de: "Nach <strong>Artikel 24 des Visakodex</strong> stellen Konsulate Antragstellern mit sauberer Reisehistorie zunehmend längere Mehrfachvisa (MEV) aus. Die meisten kennen diese Regel nicht, beantragen jedes Mal Einzeleinreise und zahlen je €90. Sag uns, wie viele Schengen-Visa du in den letzten 2 Jahren korrekt genutzt hast, und wir schlagen vor, was du beantragen solltest.",
      fr: "En vertu de l'<strong>article 24 du code des visas</strong>, les consulats délivrent des visas à entrées multiples (MEV) de plus en plus longs aux demandeurs ayant un historique de voyage irréprochable. La plupart l'ignorent et demandent une entrée unique à chaque fois, payant 90 € à chaque fois. Dis-nous combien de visas Schengen tu as utilisés correctement ces 2 dernières années et nous te suggérerons quoi demander.",
      ar: "بموجب <strong>المادة 24 من قانون التأشيرات</strong>، تصدر القنصليات تأشيرات متعددة الدخول (MEV) أطول تدريجيًا لمقدّمي الطلبات ذوي سجل سفر نظيف. لا يعرف معظم المسافرين هذه القاعدة فيتقدّمون بطلب دخول واحد في كل مرة ويدفعون €90. أخبرنا بعدد تأشيرات شنغن التي استخدمتها بشكل صحيح خلال آخر سنتين وسنقترح ما يجب طلبه."
    },
    // Cascade verdict — notes (TR; other langs fall back to EN until translated)
    "If any overstay, refusal, or rule breach occurred in the last 2 years, the cascade restarts. Consulates may also issue a single-entry visa as a probationary measure. Be especially clean with your next stay.": { tr:"Son 2 yılda herhangi bir vize aşımı, ret veya kural ihlali olduysa kademe sıfırlanır. Konsolosluklar deneme amaçlı tek girişli vize de verebilir. Bir sonraki kalışında özellikle kurallara uy." },
    "You already hold the top-tier MEV. On expiry, apply again — the same 5-year MEV should be granted as long as the cascade is clean. No downgrade unless your circumstances changed.": { tr:"Zaten en üst kademe MEV'e sahipsin. Süresi dolunca tekrar başvur — kademe temiz olduğu sürece aynı 5 yıllık MEV verilmeli. Koşulların değişmedikçe düşürme olmaz." },
    "You've successfully used a 2-year MEV. Article 24 entitles you to request a 5-year MEV on the next application. Mention 'cascade rule under VC Article 24' explicitly on the application form — consulates don't always volunteer it.": { tr:"2 yıllık bir MEV'i başarıyla kullandın. Madde 24, bir sonraki başvuruda 5 yıllık MEV talep etme hakkı verir. Başvuru formunda 'Vize Kodu Madde 24 kademe kuralı'nı açıkça belirt — konsolosluklar her zaman kendiliğinden sunmaz." },
    "Two or more correctly-used short-stay visas in the last 2 years qualify you for a 2-year MEV. Some consulates issue 3-year; either is fine. Request explicitly — single-entry should not be your default at this point.": { tr:"Son 2 yılda doğru kullanılmış iki veya daha fazla kısa süreli vize, 2 yıllık MEV için seni uygun kılar. Bazı konsolosluklar 3 yıllık verir; ikisi de olur. Açıkça talep et — bu noktada tek girişli vize varsayılanın olmamalı." },
    "One correctly-used short-stay visa qualifies you for a 1-year MEV under the cascade. Mention your prior visa numbers and 'cascade rule' on the application.": { tr:"Doğru kullanılmış bir kısa süreli vize, kademe kuralı kapsamında 1 yıllık MEV için seni uygun kılar. Başvuruda önceki vize numaralarını ve 'kademe kuralı'nı belirt." },
    "Most consulates issue a single-entry or short MEV (6 months) for first-time applicants. Use it within the validity, exit on time, and you'll be in the cascade for your next application.": { tr:"Çoğu konsolosluk ilk kez başvuranlara tek girişli veya kısa MEV (6 ay) verir. Geçerlilik içinde kullan, zamanında çık; bir sonraki başvurunda kademeye girmiş olursun." },

    // ── Tool-page page titles ──
    "Digital Nomad Visas — 38 countries compared": { tr:"Dijital Göçebe Vizeleri — 38 ülke karşılaştırması", es:"Visados de nómada digital — 38 países comparados", de:"Digital-Nomad-Visa — 38 Länder im Vergleich", fr:"Visas nomades numériques — 38 pays comparés", ar:"تأشيرات الرحّل الرقميين — مقارنة 38 دولة" },
    "Citizenship by Investment — 2026": { tr:"Yatırımla Vatandaşlık — 2026", es:"Ciudadanía por inversión — 2026", de:"Staatsbürgerschaft durch Investition — 2026", fr:"Citoyenneté par investissement — 2026", ar:"الجنسية عن طريق الاستثمار — 2026" },
    "ESTA Disqualifier Checker": { tr:"ESTA Engel Kontrolü", es:"Verificador de descalificación ESTA", de:"ESTA-Ausschluss-Prüfer", fr:"Vérificateur d'inéligibilité ESTA", ar:"فاحص موانع ESTA" },
    "Check your ESTA eligibility": { tr:"ESTA uygunluğunu kontrol et", es:"Comprueba tu elegibilidad para ESTA", de:"Prüfe deine ESTA-Berechtigung", fr:"Vérifie ton éligibilité ESTA", ar:"تحقق من أهليتك لـ ESTA" },
    "The 41 VWP countries": { tr:"41 VWP ülkesi", es:"Los 41 países del VWP", de:"Die 41 VWP-Länder", fr:"Les 41 pays du VWP", ar:"دول برنامج الإعفاء الـ41" },
    "What if I'm disqualified?": { tr:"Engellenirsem ne olur?", es:"¿Y si quedo descalificado?", de:"Was, wenn ich ausgeschlossen bin?", fr:"Et si je suis inéligible ?", ar:"ماذا لو كنت غير مؤهل؟" },
    "ETIAS — Europe's new travel authorization": { tr:"ETIAS — Avrupa'nın yeni seyahat izni", es:"ETIAS — la nueva autorización de viaje de Europa", de:"ETIAS — Europas neue Reisegenehmigung", fr:"ETIAS — la nouvelle autorisation de voyage de l'Europe", ar:"ETIAS — تصريح السفر الأوروبي الجديد" },
    "Do I need ETIAS?": { tr:"ETIAS'a ihtiyacım var mı?", es:"¿Necesito ETIAS?", de:"Brauche ich ETIAS?", fr:"Ai-je besoin d'ETIAS ?", ar:"هل أحتاج ETIAS؟" },
    "The key facts": { tr:"Temel bilgiler", es:"Datos clave", de:"Die wichtigsten Fakten", fr:"Les faits clés", ar:"الحقائق الأساسية" },
    "Who's affected": { tr:"Kimler etkileniyor", es:"A quién afecta", de:"Wer ist betroffen", fr:"Qui est concerné", ar:"من المتأثر" },
    "What's NOT covered by ETIAS": { tr:"ETIAS'ın KAPSAMADIĞI durumlar", es:"Lo que ETIAS NO cubre", de:"Was ETIAS NICHT abdeckt", fr:"Ce que l'ETIAS NE couvre PAS", ar:"ما لا يغطيه ETIAS" },
    "How to apply (when launched)": { tr:"Nasıl başvurulur (başladığında)", es:"Cómo solicitar (cuando se lance)", de:"Wie man sich bewirbt (nach Start)", fr:"Comment postuler (au lancement)", ar:"كيفية التقديم (عند الإطلاق)" },
    "Common questions": { tr:"Sık sorulan sorular", es:"Preguntas frecuentes", de:"Häufige Fragen", fr:"Questions fréquentes", ar:"أسئلة شائعة" },
    "Passport Validity Checker": { tr:"Pasaport Geçerlilik Kontrolü", es:"Verificador de validez del pasaporte", de:"Reisepass-Gültigkeitsprüfer", fr:"Vérificateur de validité du passeport", ar:"فاحص صلاحية جواز السفر" },
    "Check your passport against a destination": { tr:"Pasaportunu bir destinasyona göre kontrol et", es:"Comprueba tu pasaporte para un destino", de:"Prüfe deinen Pass für ein Reiseziel", fr:"Vérifie ton passeport pour une destination", ar:"تحقق من جوازك مقابل وجهة" },
    "The three rule tiers": { tr:"Üç kural kademesi", es:"Los tres niveles de reglas", de:"Die drei Regelstufen", fr:"Les trois niveaux de règles", ar:"المستويات الثلاثة للقواعد" },
    "Full list by destination": { tr:"Destinasyona göre tam liste", es:"Lista completa por destino", de:"Vollständige Liste nach Reiseziel", fr:"Liste complète par destination", ar:"القائمة الكاملة حسب الوجهة" },
    "Visa Shortcuts — easier entry with the visas you already hold": { tr:"Vize Kısayolları — elindeki vizelerle daha kolay giriş", es:"Atajos de visado — entrada más fácil con los visados que ya tienes", de:"Visa-Abkürzungen — leichtere Einreise mit vorhandenen Visa", fr:"Raccourcis de visa — entrée plus facile avec vos visas actuels", ar:"اختصارات التأشيرة — دخول أسهل بتأشيراتك الحالية" },

    // ── Table headers / shared labels (tool pages) ──
    "Country": { tr:"Ülke", es:"País", de:"Land", fr:"Pays", ar:"الدولة" },
    "Region": { tr:"Bölge", es:"Región", de:"Region", fr:"Région", ar:"المنطقة" },
    "Programme": { tr:"Program", es:"Programa", de:"Programm", fr:"Programme", ar:"البرنامج" },
    "Duration": { tr:"Süre", es:"Duración", de:"Dauer", fr:"Durée", ar:"المدة" },
    "Family": { tr:"Aile", es:"Familia", de:"Familie", fr:"Famille", ar:"العائلة" },
    "Min income / mo": { tr:"Min. gelir / ay", es:"Ingreso mín. / mes", de:"Min. Einkommen / Mon.", fr:"Revenu min. / mois", ar:"الحد الأدنى للدخل / شهر" },
    "Min invest": { tr:"Min. yatırım", es:"Inversión mín.", de:"Min. Investition", fr:"Investissement min.", ar:"الحد الأدنى للاستثمار" },
    "Timeline": { tr:"Süreç", es:"Plazo", de:"Zeitrahmen", fr:"Délai", ar:"الجدول الزمني" },
    "Status": { tr:"Durum", es:"Estado", de:"Status", fr:"Statut", ar:"الحالة" },
    "Visa-free": { tr:"Vizesiz", es:"Sin visado", de:"Visumfrei", fr:"Sans visa", ar:"بدون تأشيرة" },
    "Official source ↗": { tr:"Resmi kaynak ↗", es:"Fuente oficial ↗", de:"Offizielle Quelle ↗", fr:"Source officielle ↗", ar:"المصدر الرسمي ↗" },
    "Atlas link": { tr:"Atlas bağlantısı", es:"Enlace Atlas", de:"Atlas-Link", fr:"Lien Atlas", ar:"رابط أطلس" },
    "Your passport": { tr:"Pasaportun", es:"Tu pasaporte", de:"Dein Pass", fr:"Ton passeport", ar:"جواز سفرك" },
    "Destination": { tr:"Destinasyon", es:"Destino", de:"Reiseziel", fr:"Destination", ar:"الوجهة" },
    "Validity": { tr:"Geçerlilik", es:"Validez", de:"Gültigkeit", fr:"Validité", ar:"الصلاحية" },
    "No data": { tr:"Veri yok", es:"Sin datos", de:"Keine Daten", fr:"Aucune donnée", ar:"لا توجد بيانات" },

    // ── ESTA page ──
    "Tick anything that applies to you": { tr:"Sana uyan her şeyi işaretle", es:"Marca todo lo que te aplique", de:"Markiere alles, was auf dich zutrifft", fr:"Coche tout ce qui s'applique à toi", ar:"حدّد كل ما ينطبق عليك" },
    "Ever arrested or convicted of a crime (including DUI / minor charges)": { tr:"Daha önce bir suçtan tutuklandın/mahkûm oldun mu (DUI / küçük suçlar dahil)", es:"¿Alguna vez arrestado o condenado por un delito (incluido DUI / cargos menores)?", de:"Jemals wegen einer Straftat verhaftet/verurteilt (inkl. Trunkenheit am Steuer / Bagatelldelikte)", fr:"Déjà arrêté ou condamné pour un délit (y compris conduite en état d'ivresse / délits mineurs)", ar:"هل سبق اعتقالك أو إدانتك بجريمة (بما في ذلك القيادة تحت تأثير الكحول / تهم بسيطة)" },
    "Ever overstayed a previous US visit": { tr:"Önceki bir ABD ziyaretinde süreyi aştın mı", es:"¿Alguna vez excediste una estancia previa en EE. UU.?", de:"Jemals einen früheren US-Aufenthalt überzogen", fr:"Déjà dépassé la durée d'un précédent séjour aux États-Unis", ar:"هل تجاوزت مدة زيارة سابقة للولايات المتحدة" },
    "Previously refused a US visa, ESTA, or denied entry": { tr:"Daha önce ABD vizesi/ESTA reddedildi veya girişin engellendi mi", es:"¿Te denegaron antes un visado/ESTA de EE. UU. o la entrada?", de:"Früher ein US-Visum/ESTA verweigert oder Einreise verweigert", fr:"Déjà refusé un visa/ESTA américain ou refoulé à l'entrée", ar:"سبق رفض تأشيرة/ESTA أمريكية أو منعك من الدخول" },
    "Dual citizen of Iran, Iraq, Syria, Sudan, North Korea or Cuba": { tr:"İran, Irak, Suriye, Sudan, Kuzey Kore veya Küba çifte vatandaşı", es:"Doble nacional de Irán, Irak, Siria, Sudán, Corea del Norte o Cuba", de:"Doppelbürger von Iran, Irak, Syrien, Sudan, Nordkorea oder Kuba", fr:"Binational de l'Iran, l'Irak, la Syrie, le Soudan, la Corée du Nord ou Cuba", ar:"مزدوج الجنسية مع إيران أو العراق أو سوريا أو السودان أو كوريا الشمالية أو كوبا" },
    "My passport is not an e-passport (no chip)": { tr:"Pasaportum e-pasaport değil (çipsiz)", es:"Mi pasaporte no es electrónico (sin chip)", de:"Mein Pass ist kein E-Pass (kein Chip)", fr:"Mon passeport n'est pas électronique (sans puce)", ar:"جواز سفري ليس إلكترونيًا (بدون شريحة)" },
    "Likely ESTA-eligible": { tr:"Muhtemelen ESTA'ya uygun", es:"Probablemente elegible para ESTA", de:"Wahrscheinlich ESTA-berechtigt", fr:"Probablement éligible à l'ESTA", ar:"مؤهل على الأرجح لـ ESTA" },
    "ESTA disqualifier hit": { tr:"ESTA engeli tespit edildi", es:"Descalificador de ESTA detectado", de:"ESTA-Ausschlussgrund erkannt", fr:"Critère d'inéligibilité ESTA détecté", ar:"تم رصد مانع لـ ESTA" },
    "Not VWP-eligible": { tr:"VWP'ye uygun değil", es:"No elegible para el VWP", de:"Nicht VWP-berechtigt", fr:"Non éligible au VWP", ar:"غير مؤهل لبرنامج الإعفاء" },

    // ── ETIAS page ──
    "ETIAS required": { tr:"ETIAS gerekli", es:"ETIAS requerido", de:"ETIAS erforderlich", fr:"ETIAS requis", ar:"ETIAS مطلوب" },
    "No ETIAS needed": { tr:"ETIAS gerekmiyor", es:"No se necesita ETIAS", de:"Kein ETIAS nötig", fr:"Pas d'ETIAS nécessaire", ar:"لا حاجة لـ ETIAS" },
    "Exempt — EU / EEA / Swiss citizen": { tr:"Muaf — AB / AEA / İsviçre vatandaşı", es:"Exento — ciudadano UE / EEE / suizo", de:"Befreit — EU-/EWR-/Schweizer Bürger", fr:"Exempté — citoyen UE / EEE / suisse", ar:"معفى — مواطن الاتحاد الأوروبي / المنطقة الاقتصادية / سويسرا" },
    "You'll need a Schengen visa (not ETIAS)": { tr:"Schengen vizesi gerekecek (ETIAS değil)", es:"Necesitarás un visado Schengen (no ETIAS)", de:"Du brauchst ein Schengen-Visum (kein ETIAS)", fr:"Il te faudra un visa Schengen (pas l'ETIAS)", ar:"ستحتاج تأشيرة شنغن (وليس ETIAS)" },
    "Application fee": { tr:"Başvuru ücreti", es:"Tasa de solicitud", de:"Antragsgebühr", fr:"Frais de demande", ar:"رسوم الطلب" },
    "Approval time": { tr:"Onay süresi", es:"Tiempo de aprobación", de:"Genehmigungszeit", fr:"Délai d'approbation", ar:"وقت الموافقة" },
    "Schengen states covered": { tr:"Kapsanan Schengen ülkeleri", es:"Estados Schengen cubiertos", de:"Abgedeckte Schengen-Staaten", fr:"États Schengen couverts", ar:"دول شنغن المشمولة" },
    "Fee waived": { tr:"Ücret muaf", es:"Tasa exenta", de:"Gebühr erlassen", fr:"Frais exonérés", ar:"إعفاء من الرسوم" },

    // ── Passport validity page ──
    "Your passport expiry date": { tr:"Pasaport bitiş tarihin", es:"Fecha de caducidad de tu pasaporte", de:"Ablaufdatum deines Passes", fr:"Date d'expiration de ton passeport", ar:"تاريخ انتهاء جواز سفرك" },
    "Planned exit date (optional)": { tr:"Planlanan çıkış tarihi (opsiyonel)", es:"Fecha de salida prevista (opcional)", de:"Geplantes Ausreisedatum (optional)", fr:"Date de sortie prévue (facultatif)", ar:"تاريخ المغادرة المخطط (اختياري)" },
    "Validity required": { tr:"Gereken geçerlilik", es:"Validez requerida", de:"Erforderliche Gültigkeit", fr:"Validité requise", ar:"الصلاحية المطلوبة" },
    "Cleared": { tr:"Uygun", es:"Aprobado", de:"Bestanden", fr:"Validé", ar:"مجتاز" },
    "Will be refused boarding": { tr:"Uçağa alınmazsın", es:"Se te denegará el embarque", de:"Einsteigen wird verweigert", fr:"Embarquement refusé", ar:"سيُرفض صعودك" },

    // About headings
    "How the data is built":               { tr:"Veriler nasıl oluşuyor", es:"Cómo se construyen los datos", de:"Wie die Daten entstehen", fr:"Comment les données sont construites", ar:"كيف تُبنى البيانات" },
    "What Atlas is not":                   { tr:"Atlas ne değildir", es:"Lo que Atlas no es", de:"Was Atlas nicht ist", fr:"Ce qu'Atlas n'est pas", ar:"ما ليس عليه أطلس" },
    "Why it's free":                       { tr:"Neden ücretsiz", es:"Por qué es gratis", de:"Warum es kostenlos ist", fr:"Pourquoi c'est gratuit", ar:"لماذا هو مجاني" },
    "Legal":                               { tr:"Yasal", es:"Legal", de:"Rechtliches", fr:"Mentions légales", ar:"قانوني" },
    "Privacy Policy":                      { tr:"Gizlilik Politikası", es:"Política de privacidad", de:"Datenschutzerklärung", fr:"Politique de confidentialité", ar:"سياسة الخصوصية" },

    // Privacy headings
    "What this site is":                   { tr:"Bu site nedir", es:"Qué es este sitio", de:"Was diese Seite ist", fr:"Qu'est-ce que ce site", ar:"ما هذا الموقع" },
    "Information we collect ourselves":    { tr:"Bizzat topladığımız bilgiler", es:"Información que recopilamos", de:"Selbst erhobene Daten", fr:"Informations que nous collectons", ar:"المعلومات التي نجمعها بأنفسنا" },
    "If you subscribe to alerts":          { tr:"Uyarılara abone olursanız", es:"Si te suscribes a las alertas", de:"Wenn du Hinweise abonnierst", fr:"Si tu t'abonnes aux alertes", ar:"إذا اشتركت في التنبيهات" },
    "Information third parties collect":   { tr:"Üçüncü tarafların topladığı bilgiler", es:"Información de terceros", de:"Daten Dritter", fr:"Informations collectées par des tiers", ar:"المعلومات التي تجمعها أطراف ثالثة" },
    "Cookies":                             { tr:"Çerezler", es:"Cookies", de:"Cookies", fr:"Cookies", ar:"ملفات تعريف الارتباط" },
    "Children's privacy":                  { tr:"Çocukların gizliliği", es:"Privacidad de los menores", de:"Datenschutz für Kinder", fr:"Vie privée des enfants", ar:"خصوصية الأطفال" },
    "Your rights (GDPR / CCPA)":           { tr:"Haklarınız (GDPR / CCPA)", es:"Tus derechos (GDPR / CCPA)", de:"Deine Rechte (GDPR / CCPA)", fr:"Tes droits (RGPD / CCPA)", ar:"حقوقك (GDPR / CCPA)" },
    "Changes to this policy":              { tr:"Bu politikadaki değişiklikler", es:"Cambios a esta política", de:"Änderungen dieser Erklärung", fr:"Modifications de cette politique", ar:"تغييرات على هذه السياسة" },
    "Manage your ad settings":             { tr:"Reklam ayarlarınızı yönetin", es:"Gestiona tus anuncios", de:"Anzeigeneinstellungen verwalten", fr:"Gère tes annonces", ar:"إدارة إعدادات الإعلانات" },

    // Alerts page
    "Visa-change alerts":                  { tr:"Vize değişiklik uyarıları", es:"Alertas de cambio de visa", de:"Visa-Änderungshinweise", fr:"Alertes de changement de visa", ar:"تنبيهات تغيير التأشيرة" },
    "Countries to watch":                  { tr:"İzlenecek ülkeler", es:"Países a seguir", de:"Beobachtete Länder", fr:"Pays à surveiller", ar:"دول للمتابعة" },

    // Itinerary
    "Itinerary visa planner":              { tr:"Rota vize planlayıcı", es:"Planificador de visas por itinerario", de:"Reiseroute-Visumplaner", fr:"Planificateur de visa d'itinéraire", ar:"مخطط تأشيرات الرحلة" },
    "Your passport":                       { tr:"Pasaportun", es:"Tu pasaporte", de:"Dein Pass", fr:"Ton passeport", ar:"جواز سفرك" },
    "Pick your passport…":                 { tr:"Pasaportunu seç…", es:"Elige tu pasaporte…", de:"Wähle deinen Pass…", fr:"Choisis ton passeport…", ar:"اختر جواز سفرك…" },
    "Trip stops":                          { tr:"Seyahat durakları", es:"Paradas del viaje", de:"Reisestationen", fr:"Étapes du voyage", ar:"محطات الرحلة" },
    "+ Add a destination (pick a passport first)":
      { tr:"+ Destinasyon ekle (önce pasaport seç)", es:"+ Añadir destino (elige un pasaporte primero)", de:"+ Ziel hinzufügen (zuerst Pass wählen)", fr:"+ Ajouter une destination (choisis d'abord un passeport)", ar:"+ أضف وجهة (اختر جوازًا أولًا)" },
    "Departure date (optional — unlocks reminders)":
      { tr:"Kalkış tarihi (opsiyonel — hatırlatıcıları açar)", es:"Fecha de salida (opcional — activa recordatorios)", de:"Abreisedatum (optional — schaltet Erinnerungen frei)", fr:"Date de départ (optionnel — active les rappels)", ar:"تاريخ المغادرة (اختياري — يفعّل التذكيرات)" },
    "Clear":                               { tr:"Temizle", es:"Limpiar", de:"Löschen", fr:"Effacer", ar:"امسح" },
    "Recommended application order — longest first":
      { tr:"Önerilen başvuru sırası — en uzun süreli olan ilk", es:"Orden recomendado de solicitud — el más largo primero", de:"Empfohlene Antragsreihenfolge — längste zuerst", fr:"Ordre recommandé — la plus longue d'abord", ar:"ترتيب التقديم الموصى به — الأطول أولًا" },
    "Good news":                           { tr:"İyi haber", es:"Buenas noticias", de:"Gute Nachrichten", fr:"Bonne nouvelle", ar:"خبر جيد" },
    "Application reminders":               { tr:"Başvuru hatırlatmaları", es:"Recordatorios de solicitud", de:"Antrags-Erinnerungen", fr:"Rappels de demande", ar:"تذكيرات التقديم" },

    // Digital nomad
    "Digital Nomad Visas — 38 countries compared":
      { tr:"Dijital Göçebe Vizeleri — 38 ülke karşılaştırması", es:"Visas para nómadas digitales — 38 países comparados", de:"Digital-Nomad-Visa — 38 Länder im Vergleich", fr:"Visas nomades numériques — 38 pays comparés", ar:"تأشيرات الرحّالة الرقميين — مقارنة 38 دولة" },
    "Region":                              { tr:"Bölge", es:"Región", de:"Region", fr:"Région", ar:"المنطقة" },
    "Atlas link":                          { tr:"Atlas bağlantısı", es:"Enlace Atlas", de:"Atlas-Link", fr:"Lien Atlas", ar:"رابط أطلس" },
    "Track how many of your 90 short-stay days you've used in the last 180. Add past trips below, plan a future one to see if it fits.":
      { tr:"Son 180 gün içinde 90 kısa süreli kalış gününüzün ne kadarını kullandığınızı takip edin. Geçmiş seyahatlerinizi ekleyin, gelecekteki bir planı sığıp sığmadığını görmek için ekleyin." },
    "Your trips":                          { tr:"Seyahatlerin", es:"Tus viajes", de:"Deine Reisen", fr:"Tes voyages", ar:"رحلاتك" },
    "Add trip":                            { tr:"Seyahat ekle", es:"Añadir viaje", de:"Reise hinzufügen", fr:"Ajouter un voyage", ar:"إضافة رحلة" },
    "Plan a future trip":                  { tr:"Gelecek bir seyahat planla", es:"Planificar un viaje futuro", de:"Zukünftige Reise planen", fr:"Planifier un voyage", ar:"خطّط لرحلة قادمة" },
    "Entry":                               { tr:"Giriş", es:"Entrada", de:"Einreise", fr:"Entrée", ar:"الدخول" },
    "Exit":                                { tr:"Çıkış", es:"Salida", de:"Ausreise", fr:"Sortie", ar:"الخروج" },
    "Country":                             { tr:"Ülke", es:"País", de:"Land", fr:"Pays", ar:"الدولة" },
    "Add":                                 { tr:"Ekle", es:"Añadir", de:"Hinzufügen", fr:"Ajouter", ar:"إضافة" },
    "Remove":                              { tr:"Kaldır", es:"Quitar", de:"Entfernen", fr:"Retirer", ar:"إزالة" },
    "Days used":                           { tr:"Kullanılan gün", es:"Días usados", de:"Genutzte Tage", fr:"Jours utilisés", ar:"الأيام المستخدمة" },
    "Days remaining":                      { tr:"Kalan gün", es:"Días restantes", de:"Verbleibende Tage", fr:"Jours restants", ar:"الأيام المتبقية" },
    "of 90":                               { tr:"/ 90", es:"de 90", de:"von 90", fr:"sur 90", ar:"من 90" },
    "Within the rule":                     { tr:"Kural içinde", es:"Dentro de la regla", de:"Innerhalb der Regel", fr:"Dans la règle", ar:"ضمن القاعدة" },
    "Over the limit":                      { tr:"Limit aşıldı", es:"Sobre el límite", de:"Limit überschritten", fr:"Au-dessus de la limite", ar:"تجاوز الحد" },
    "Add to calendar":                     { tr:"Takvime ekle", es:"Añadir al calendario", de:"Zum Kalender", fr:"Ajouter au calendrier", ar:"أضف إلى التقويم" },
    "Reset all":                           { tr:"Tümünü sıfırla", es:"Restablecer todo", de:"Alles zurücksetzen", fr:"Tout réinitialiser", ar:"إعادة الكل" },
    "What is the 90/180 rule?":            { tr:"90/180 kuralı nedir?", es:"¿Qué es la regla 90/180?", de:"Was ist die 90/180-Regel?", fr:"Qu'est-ce que la règle 90/180 ?", ar:"ما هي قاعدة 90/180؟" },

    // Itinerary
    "Multi-stop visa planner":             { tr:"Çok duraklı vize planlayıcı", es:"Planificador de visados multi-destino", de:"Multi-Stopp-Visumplaner", fr:"Planificateur de visa multi-étapes", ar:"مخطط تأشيرات متعدد المحطات" },
    "Plan a trip with multiple destinations. Atlas checks each leg against your passport, surfaces which ones need a visa, and exports apply-by reminders to your calendar.":
      { tr:"Birden fazla destinasyonlu bir seyahat planla. Atlas her bacağı pasaportunuza göre kontrol eder, hangilerinin vize gerektirdiğini gösterir ve başvuru hatırlatmalarını takviminize aktarır." },
    "Your itinerary":                      { tr:"Rotanız", es:"Tu itinerario", de:"Deine Route", fr:"Ton itinéraire", ar:"خط رحلتك" },
    "Departure":                           { tr:"Kalkış", es:"Salida", de:"Abreise", fr:"Départ", ar:"المغادرة" },
    "Add destination":                     { tr:"Destinasyon ekle", es:"Añadir destino", de:"Ziel hinzufügen", fr:"Ajouter une destination", ar:"إضافة وجهة" },
    "Download .ics":                       { tr:".ics indir", es:"Descargar .ics", de:".ics herunterladen", fr:"Télécharger .ics", ar:"تنزيل .ics" },
    "Apply by":                            { tr:"Son başvuru", es:"Solicitar antes de", de:"Beantragen bis", fr:"Demander avant", ar:"قدّم قبل" },
    "Visa-free":                           { tr:"Vizesiz", es:"Sin visa", de:"Visumfrei", fr:"Sans visa", ar:"بدون تأشيرة" },
    "eVisa":                               { tr:"e-Vize", es:"eVisa", de:"eVisa", fr:"eVisa", ar:"تأشيرة إلكترونية" },
    "Visa on arrival":                     { tr:"Varışta vize", es:"Visa al llegar", de:"Visum bei Ankunft", fr:"Visa à l'arrivée", ar:"تأشيرة عند الوصول" },
    "Visa required":                       { tr:"Vize gerekli", es:"Visa requerida", de:"Visum erforderlich", fr:"Visa requis", ar:"تأشيرة مطلوبة" },

    // Alerts
    "Get an email when a country's visa policy changes":
      { tr:"Bir ülkenin vize politikası değişince e-posta al", es:"Recibe un correo cuando cambie la política de visa de un país", de:"E-Mail bei Visum-Änderung eines Landes", fr:"Reçois un e-mail quand la politique change", ar:"احصل على بريد عند تغيّر سياسة تأشيرة بلد" },
    "Visa change alerts":                  { tr:"Vize değişiklik uyarıları", es:"Alertas de cambio de visa", de:"Visa-Änderungshinweise", fr:"Alertes de changement de visa", ar:"تنبيهات تغيير التأشيرة" },
    "Your email":                          { tr:"E-postanız", es:"Tu correo", de:"Deine E-Mail", fr:"Ton e-mail", ar:"بريدك" },
    "Subscribe":                           { tr:"Abone ol", es:"Suscribirse", de:"Abonnieren", fr:"S'abonner", ar:"اشترك" },
    "Free":                                { tr:"Ücretsiz", es:"Gratis", de:"Kostenlos", fr:"Gratuit", ar:"مجاني" },
    "Pro":                                 { tr:"Pro", es:"Pro", de:"Pro", fr:"Pro", ar:"احترافي" },
    "1 country":                           { tr:"1 ülke", es:"1 país", de:"1 Land", fr:"1 pays", ar:"دولة واحدة" },
    "Unlimited countries":                 { tr:"Sınırsız ülke", es:"Países ilimitados", de:"Unbegrenzte Länder", fr:"Pays illimités", ar:"دول غير محدودة" },
    "per month":                           { tr:"aylık", es:"por mes", de:"pro Monat", fr:"par mois", ar:"شهريًا" },
    "Manage subscription":                 { tr:"Aboneliği yönet", es:"Gestionar suscripción", de:"Abo verwalten", fr:"Gérer l'abonnement", ar:"إدارة الاشتراك" },
    "Unsubscribe":                         { tr:"Aboneliği iptal et", es:"Cancelar suscripción", de:"Abmelden", fr:"Se désabonner", ar:"إلغاء الاشتراك" },

    // Digital nomad
    "Digital nomad visa explorer":         { tr:"Dijital göçebe vizesi gezgini", es:"Explorador de visas para nómadas digitales", de:"Digital-Nomad-Visum-Explorer", fr:"Explorateur de visas nomades numériques", ar:"مستكشف تأشيرات الرحالة الرقميين" },
    "Digital nomad visas":                 { tr:"Dijital göçebe vizeleri", es:"Visas para nómadas digitales", de:"Digital-Nomad-Visa", fr:"Visas nomades numériques", ar:"تأشيرات الرحالة الرقميين" },
    "38 countries that issue dedicated remote-work visas — sortable by income requirement, fee, duration, tax, and family inclusion.":
      { tr:"Uzaktan çalışma vizesi veren 38 ülke — gelir gereksinimi, ücret, süre, vergi ve aile dahil edilme durumuna göre sıralanabilir." },
    "Income requirement":                  { tr:"Gelir şartı", es:"Requisito de ingresos", de:"Einkommensanforderung", fr:"Exigence de revenu", ar:"شرط الدخل" },
    "Fee":                                 { tr:"Ücret", es:"Tarifa", de:"Gebühr", fr:"Frais", ar:"الرسوم" },
    "Duration":                            { tr:"Süre", es:"Duración", de:"Dauer", fr:"Durée", ar:"المدة" },
    "Tax":                                 { tr:"Vergi", es:"Impuestos", de:"Steuer", fr:"Impôt", ar:"الضريبة" },
    "Family":                              { tr:"Aile", es:"Familia", de:"Familie", fr:"Famille", ar:"العائلة" },
    "Apply":                               { tr:"Başvur", es:"Solicitar", de:"Antrag", fr:"Postuler", ar:"قدّم" },

    // About
    "About Atlas":                         { tr:"Atlas hakkında", es:"Acerca de Atlas", de:"Über Atlas", fr:"À propos d'Atlas", ar:"حول أطلس" },
    "Contact":                             { tr:"İletişim", es:"Contacto", de:"Kontakt", fr:"Contact", ar:"التواصل" },

    // Privacy
    "Privacy":                             { tr:"Gizlilik", es:"Privacidad", de:"Datenschutz", fr:"Confidentialité", ar:"الخصوصية" },
    "Privacy policy":                      { tr:"Gizlilik politikası", es:"Política de privacidad", de:"Datenschutzerklärung", fr:"Politique de confidentialité", ar:"سياسة الخصوصية" },

    // Common shared phrases
    "Loading…":                            { tr:"Yükleniyor…", es:"Cargando…", de:"Lädt…", fr:"Chargement…", ar:"جارٍ التحميل…" },
    "Back":                                { tr:"Geri", es:"Atrás", de:"Zurück", fr:"Retour", ar:"رجوع" },

    // ─── About page paragraphs ────────────────────────────────────────────
    "Free · Open data · Daily refresh":
      { tr:"Ücretsiz · Açık veri · Günlük güncelleme", es:"Gratis · Datos abiertos · Actualización diaria", de:"Kostenlos · Offene Daten · Tägliche Aktualisierung", fr:"Gratuit · Données ouvertes · Mise à jour quotidienne", ar:"مجاني · بيانات مفتوحة · تحديث يومي" },
    "Atlas is an interactive visa-requirements explorer. Pick your passport\n  and see at a glance which of the world's 200+ countries you can enter\n  visa-free, which need an eVisa, which issue a visa on arrival, and which\n  require a full embassy application. We do this for every passport — not\n  just the major ones.":
      { tr:"travelnow.info etkileşimli bir vize-gereklilikleri gezginidir. Pasaportunuzu seçin ve dünyanın 200+ ülkesinden hangilerine vizesiz, hangilerine e-vize, hangilerine varışta vize ile girebileceğinizi ve hangilerinin tam konsolosluk başvurusu gerektirdiğini bir bakışta görün. Bunu sadece büyük pasaportlar için değil, her pasaport için yapıyoruz.",
        es:"travelnow.info es un explorador interactivo de requisitos de visa. Elige tu pasaporte y descubre de un vistazo a cuáles de los más de 200 países del mundo puedes entrar sin visa, cuáles requieren eVisa, cuáles emiten visa al llegar y cuáles exigen una solicitud completa en la embajada.",
        de:"travelnow.info ist ein interaktiver Visa-Anforderungs-Explorer. Wähle deinen Pass und sieh auf einen Blick, in welche der 200+ Länder der Welt du visumfrei einreisen kannst, welche ein eVisa erfordern, welche ein Visum bei Ankunft ausstellen und welche einen vollständigen Botschaftsantrag verlangen.",
        fr:"travelnow.info est un explorateur interactif des exigences de visa. Choisis ton passeport et découvre d'un coup d'œil dans quels pays (parmi 200+) tu peux entrer sans visa, lesquels nécessitent un eVisa, lesquels délivrent un visa à l'arrivée et lesquels exigent une demande consulaire complète.",
        ar:"travelnow.info مستكشف تفاعلي لمتطلبات التأشيرة. اختر جواز سفرك واعرف بنظرة واحدة إلى أي من دول العالم الـ 200+ يمكنك الدخول بدون تأشيرة، وأيها يتطلب تأشيرة إلكترونية، وأيها يصدر تأشيرة عند الوصول، وأيها يحتاج طلبًا كاملاً من السفارة." },
    "Atlas aggregates visa-policy information from authoritative,\n  regularly-updated public sources covering every recognised passport. The\n  full dataset is rebuilt every 24 hours so the map you see is never more\n  than a day behind the latest announcements. The \"Recently changed\" feed\n  in the side panel surfaces the previous day's diff.":
      { tr:"travelnow.info, her tanınmış pasaportu kapsayan, otoriter ve düzenli olarak güncellenen kamu kaynaklarından vize politikası bilgilerini bir araya getirir. Tüm veri seti her 24 saatte yeniden oluşturulur, böylece gördüğünüz harita en son duyurulardan bir günden fazla geride değildir. Yan paneldeki \"Son değişiklikler\" akışı önceki günün değişikliklerini gösterir.",
        es:"travelnow.info agrega información sobre políticas de visa de fuentes públicas autorizadas y actualizadas regularmente que cubren todos los pasaportes reconocidos. El conjunto de datos completo se reconstruye cada 24 horas, por lo que el mapa que ves nunca está a más de un día de retraso respecto a los últimos anuncios.",
        de:"travelnow.info bündelt Informationen zur Visumpolitik aus autoritativen, regelmäßig aktualisierten öffentlichen Quellen, die jeden anerkannten Pass abdecken. Der gesamte Datensatz wird alle 24 Stunden neu erstellt, sodass die angezeigte Karte nie mehr als einen Tag hinter den neuesten Ankündigungen zurückbleibt.",
        fr:"travelnow.info agrège les informations de politique de visa à partir de sources publiques faisant autorité et régulièrement mises à jour, couvrant tous les passeports reconnus. L'ensemble du jeu de données est reconstruit toutes les 24 heures.",
        ar:"يجمع travelnow.info معلومات سياسة التأشيرات من مصادر عامة موثوقة ومحدثة بانتظام تغطي كل جواز سفر معترف به. يتم إعادة بناء مجموعة البيانات الكاملة كل 24 ساعة." },
    "If something on a country page looks off, get in touch — we'd like to\n  hear about it and fix it quickly.":
      { tr:"Bir ülke sayfasında bir şey yanlış görünüyorsa bize ulaşın — duymak ve hızla düzeltmek isteriz.",
        es:"Si algo en la página de un país parece incorrecto, ponte en contacto — nos gustaría saberlo y corregirlo rápidamente.",
        de:"Wenn auf einer Länderseite etwas falsch aussieht, melde dich — wir würden gerne davon erfahren und es schnell beheben.",
        fr:"Si quelque chose semble incorrect sur une page de pays, contacte-nous — nous aimerions le savoir et le corriger rapidement.",
        ar:"إذا بدا شيء غير صحيح في صفحة دولة، تواصل معنا — نود معرفته وإصلاحه بسرعة." },
    "Server costs are negligible (Cloudflare Pages free tier). We cover\n  them through unobtrusive ads served by Google AdSense and occasional\n  affiliate commissions when readers sign up for travel services we'd\n  recommend anyway (eSIMs, insurance, visa-application help).":
      { tr:"Sunucu maliyetleri ihmal edilebilir (Cloudflare Pages ücretsiz kademe). Bunları Google AdSense üzerinden gösterilen göze batmayan reklamlar ve okuyucuların zaten önereceğimiz seyahat hizmetlerine (eSIM, sigorta, vize başvuru yardımı) kaydolduğunda kazanılan ara sıra ortaklık komisyonları ile karşılıyoruz.",
        es:"Los costes de servidor son insignificantes (capa gratuita de Cloudflare Pages). Los cubrimos con anuncios discretos de Google AdSense y comisiones de afiliados ocasionales cuando los lectores contratan servicios de viaje que recomendaríamos de todos modos (eSIM, seguros, ayuda con visados).",
        de:"Serverkosten sind vernachlässigbar (Cloudflare Pages Free Tier). Wir decken sie durch dezente Google-AdSense-Anzeigen und gelegentliche Affiliate-Provisionen, wenn Leser Reise-Dienste buchen, die wir ohnehin empfehlen würden (eSIM, Versicherung, Visumshilfe).",
        fr:"Les coûts de serveur sont négligeables (offre gratuite Cloudflare Pages). Nous les couvrons via des annonces Google AdSense discrètes et des commissions d'affiliation occasionnelles lorsque les lecteurs souscrivent à des services de voyage que nous recommanderions de toute façon (eSIM, assurance, aide visa).",
        ar:"تكاليف الخادم لا تذكر (الفئة المجانية من Cloudflare Pages). نغطيها عبر إعلانات Google AdSense غير مزعجة وعمولات شراكة عرضية عند تسجيل القراء في خدمات سفر نوصي بها على أي حال." },
    "Country flags are Unicode emoji. All other content on this site is\n  provided as-is for reference; verify any visa requirement with the\n  destination embassy before booking.":
      { tr:"Ülke bayrakları Unicode emojilerdir. Bu sitedeki diğer tüm içerik referans amaçlı olarak \"olduğu gibi\" sağlanmıştır; herhangi bir vize gerekliliğini rezervasyon yapmadan önce hedef konsoloslukla doğrulayın.",
        es:"Las banderas de países son emojis Unicode. El resto del contenido se proporciona \"tal cual\" como referencia; verifica cualquier requisito de visa con la embajada antes de reservar.",
        de:"Länderflaggen sind Unicode-Emojis. Der gesamte andere Inhalt wird \"wie besehen\" zur Referenz bereitgestellt; bitte überprüfe jede Visumsanforderung bei der Botschaft, bevor du buchst.",
        fr:"Les drapeaux des pays sont des emojis Unicode. Tout autre contenu est fourni « tel quel » à titre de référence ; vérifie toute exigence de visa auprès de l'ambassade avant de réserver.",
        ar:"أعلام الدول هي رموز Unicode التعبيرية. جميع المحتويات الأخرى مقدمة كما هي للإشارة فقط؛ تحقق من أي متطلب تأشيرة مع سفارة الوجهة قبل الحجز." },

    // ─── Privacy page paragraphs ──────────────────────────────────────────
    "Last updated: 2026-05-21 · Operator: travelnow.info":
      { tr:"Son güncelleme: 2026-05-21 · İşletmeci: travelnow.info",
        es:"Última actualización: 2026-05-21 · Operador: travelnow.info",
        de:"Zuletzt aktualisiert: 2026-05-21 · Betreiber: travelnow.info",
        fr:"Dernière mise à jour : 2026-05-21 · Exploitant : travelnow.info",
        ar:"آخر تحديث: 2026-05-21 · المشغّل: travelnow.info" },
    "Atlas (travelnow.info) is a free reference tool that shows visa\n  requirements for travelers worldwide. The dataset is rebuilt every 24\n  hours from authoritative public sources. We do not require an account,\n  and we do not ask for personal information.":
      { tr:"travelnow.info, dünyadaki seyahatçilere vize gerekliliklerini gösteren ücretsiz bir referans aracıdır. Veri seti otoriter kamu kaynaklarından her 24 saatte yeniden oluşturulur. Hesap gerektirmiyoruz ve kişisel bilgi istemiyoruz.",
        es:"travelnow.info es una herramienta de referencia gratuita que muestra los requisitos de visa para viajeros de todo el mundo. El conjunto de datos se reconstruye cada 24 horas a partir de fuentes públicas autorizadas. No requerimos cuenta ni pedimos información personal.",
        de:"travelnow.info ist ein kostenloses Referenzwerkzeug, das Visumsanforderungen für Reisende weltweit zeigt. Der Datensatz wird alle 24 Stunden aus autoritativen öffentlichen Quellen neu erstellt. Wir verlangen kein Konto und keine persönlichen Daten.",
        fr:"travelnow.info est un outil de référence gratuit qui affiche les exigences de visa pour les voyageurs du monde entier. Le jeu de données est reconstruit toutes les 24 heures à partir de sources publiques officielles. Aucun compte ni information personnelle requis.",
        ar:"travelnow.info أداة مرجعية مجانية تعرض متطلبات التأشيرة للمسافرين حول العالم. يتم إعادة بناء البيانات كل 24 ساعة من مصادر عامة موثوقة. لا نطلب حسابًا ولا معلومات شخصية." },
    "Atlas is not directed at children under 13. We do not knowingly collect\n  data from anyone under 13.":
      { tr:"travelnow.info 13 yaş altı çocuklara yönelik değildir. 13 yaş altı kimseden bilerek veri toplamayız.",
        es:"travelnow.info no está dirigido a menores de 13 años. No recopilamos a sabiendas datos de menores de 13.",
        de:"travelnow.info richtet sich nicht an Kinder unter 13 Jahren. Wir erheben wissentlich keine Daten von Personen unter 13 Jahren.",
        fr:"travelnow.info ne s'adresse pas aux enfants de moins de 13 ans. Nous ne collectons pas sciemment de données auprès de personnes de moins de 13 ans.",
        ar:"travelnow.info غير موجه للأطفال دون 13 عامًا. لا نجمع بيانات عمدًا من أي شخص دون 13 عامًا." },
    "Since we don't store personal data, there is nothing for you to access,\n  rectify, or delete on our side. For data held by AdSense or our hosting\n  provider, please contact them directly using the policy links above.":
      { tr:"Kişisel veri saklamadığımız için bizim tarafımızda erişeceğiniz, düzelteceğiniz veya sileceğiniz bir şey yok. AdSense veya barındırma sağlayıcımızın tuttuğu veriler için lütfen yukarıdaki politika bağlantılarıyla doğrudan onlara başvurun.",
        es:"Como no almacenamos datos personales, no hay nada que puedas acceder, rectificar o eliminar de nuestro lado. Para datos en poder de AdSense o nuestro proveedor de hosting, contáctalos directamente.",
        de:"Da wir keine personenbezogenen Daten speichern, gibt es auf unserer Seite nichts zum Einsehen, Korrigieren oder Löschen. Für Daten von AdSense oder unserem Hosting-Anbieter wende dich bitte direkt an diese.",
        fr:"Puisque nous ne stockons pas de données personnelles, il n'y a rien à consulter, rectifier ou supprimer de notre côté. Pour les données détenues par AdSense ou notre hébergeur, contacte-les directement.",
        ar:"بما أننا لا نخزن بيانات شخصية، فلا يوجد شيء يمكنك الوصول إليه أو تصحيحه أو حذفه من جانبنا. للبيانات التي تحتفظ بها AdSense أو مزود الاستضافة، يرجى التواصل معهم مباشرة." },
    "If we change anything material we'll update the \"Last updated\" date at\n  the top. Substantial changes will be flagged on the site for at least 14\n  days before taking effect.":
      { tr:"Önemli bir şeyi değiştirirsek üstteki \"Son güncelleme\" tarihini güncelleriz. Esaslı değişiklikler yürürlüğe girmeden önce en az 14 gün sitede işaretlenir.",
        es:"Si cambiamos algo importante, actualizaremos la fecha \"Última actualización\" en la parte superior. Los cambios sustanciales se señalarán en el sitio al menos 14 días antes de entrar en vigor.",
        de:"Bei wesentlichen Änderungen aktualisieren wir oben das Datum \"Zuletzt aktualisiert\". Wesentliche Änderungen werden mindestens 14 Tage vor Inkrafttreten auf der Website angekündigt.",
        fr:"Si nous changeons quelque chose d'important, nous mettrons à jour la date « Dernière mise à jour » en haut. Les changements substantiels seront signalés au moins 14 jours avant leur entrée en vigueur.",
        ar:"إذا غيّرنا أي شيء جوهري، سنحدث تاريخ \"آخر تحديث\" في الأعلى. التغييرات الجوهرية ستُعلن على الموقع لمدة 14 يومًا على الأقل قبل التنفيذ." },

    // ─── CBI / nomad page footer paragraphs ──────────────────────────────
    "Spotted an outdated figure or a missing programme? Open an issue at":
      { tr:"Güncelliğini yitirmiş bir rakam veya eksik bir program mı gördünüz? Şu adreste sorun açın:",
        es:"¿Detectaste un dato desactualizado o un programa que falta? Abre un issue en:",
        de:"Veraltete Zahl oder fehlendes Programm entdeckt? Öffne ein Issue auf:",
        fr:"Repéré un chiffre obsolète ou un programme manquant ? Ouvre un ticket sur :",
        ar:"رأيت رقمًا قديمًا أو برنامجًا مفقودًا؟ افتح issue على:" },

    // ─── Transit Visa page ───────────────────────────────────────────────
    "Airport Transit Visa Checker": { tr:"Havalimanı Transit Vize Kontrolü", es:"Comprobador de visa de tránsito aeroportuario", de:"Flughafen-Transit-Visa-Checker", fr:"Vérificateur de visa de transit aéroportuaire", ar:"فاحص تأشيرة العبور بالمطار" },
    "Your trip": { tr:"Yolculuğunuz", es:"Tu viaje", de:"Deine Reise", fr:"Ton voyage", ar:"رحلتك" },
    "Transit through": { tr:"Aktarma yapılan yer", es:"Tránsito por", de:"Transit durch", fr:"Transit via", ar:"العبور عبر" },
    "Do you also hold any of these? (visa or residence permit)": { tr:"Aşağıdakilerden birine sahip misin? (vize veya oturum izni)", es:"¿También tienes alguno de estos? (visa o residencia)", de:"Hast du auch eines davon? (Visum oder Aufenthaltstitel)", fr:"Détiens-tu aussi l'un de ces visas / titres ?", ar:"هل لديك أي من هذه أيضًا؟ (تأشيرة أو إقامة)" },
    "Common transit hubs at a glance": { tr:"Yaygın aktarma noktalarına bakış", es:"Hubs de tránsito comunes de un vistazo", de:"Häufige Transit-Hubs auf einen Blick", fr:"Principaux hubs de transit en un coup d'œil", ar:"محطات العبور الشائعة بنظرة واحدة" },
    "Pick a hub above. Below are quick summaries of every hub's policy.":
      { tr:"Yukarıdan bir hub seç. Aşağıda her hub'ın politikası özetlenmiştir.", es:"Elige un hub arriba. Abajo verás un resumen rápido de cada política.", de:"Wähle oben einen Hub. Unten siehst du eine Kurzfassung der Politik jedes Hubs.", fr:"Choisis un hub ci-dessus. Ci-dessous, un résumé rapide de chaque politique.", ar:"اختر محطة أعلاه. أدناه ملخصات سريعة لسياسة كل محطة." },
    "Apply before you fly.": { tr:"Uçmadan önce başvur.", es:"Solicita antes de volar.", de:"Vor dem Flug beantragen.", fr:"Demande avant de voler.", ar:"قدّم قبل السفر." },
    "Official source ↗": { tr:"Resmi kaynak ↗", es:"Fuente oficial ↗", de:"Offizielle Quelle ↗", fr:"Source officielle ↗", ar:"المصدر الرسمي ↗" },

    // ─── ETIAS page ──────────────────────────────────────────────────────
    "ETIAS — Europe's new travel authorization": { tr:"ETIAS — Avrupa'nın yeni seyahat otorizasyonu", es:"ETIAS — La nueva autorización de viaje de Europa", de:"ETIAS — Europas neue Reisegenehmigung", fr:"ETIAS — la nouvelle autorisation de voyage de l'Europe", ar:"ETIAS — تصريح السفر الأوروبي الجديد" },
    "Days until ETIAS launch": { tr:"ETIAS başlangıcına kalan gün", es:"Días para el lanzamiento de ETIAS", de:"Tage bis zum ETIAS-Start", fr:"Jours avant le lancement d'ETIAS", ar:"أيام حتى انطلاق ETIAS" },
    "Do I need ETIAS?": { tr:"ETIAS gerekli mi?", es:"¿Necesito ETIAS?", de:"Brauche ich ETIAS?", fr:"Ai-je besoin d'ETIAS ?", ar:"هل أحتاج ETIAS؟" },
    "The key facts": { tr:"Önemli bilgiler", es:"Datos clave", de:"Die wichtigsten Fakten", fr:"Les faits clés", ar:"الحقائق الأساسية" },
    "Who's affected": { tr:"Kim etkileniyor", es:"A quién afecta", de:"Wer ist betroffen", fr:"Qui est concerné", ar:"من المتأثر" },
    "What's NOT covered by ETIAS": { tr:"ETIAS'ın kapsamadığı durumlar", es:"Lo que ETIAS NO cubre", de:"Was ETIAS NICHT abdeckt", fr:"Ce qu'ETIAS NE couvre PAS", ar:"ما لا تغطيه ETIAS" },
    "How to apply (when launched)": { tr:"Nasıl başvurulur (başladığında)", es:"Cómo solicitar (cuando se lance)", de:"Antragstellung (nach Start)", fr:"Comment postuler (au lancement)", ar:"كيفية التقديم (عند الإطلاق)" },
    "Common questions": { tr:"Sık sorulan sorular", es:"Preguntas comunes", de:"Häufige Fragen", fr:"Questions fréquentes", ar:"أسئلة شائعة" },
    "Application fee": { tr:"Başvuru ücreti", es:"Tarifa de solicitud", de:"Antragsgebühr", fr:"Frais de demande", ar:"رسوم الطلب" },
    "Validity": { tr:"Geçerlilik", es:"Validez", de:"Gültigkeit", fr:"Validité", ar:"الصلاحية" },
    "Days per stay": { tr:"Konaklama başına gün", es:"Días por estancia", de:"Tage pro Aufenthalt", fr:"Jours par séjour", ar:"أيام لكل إقامة" },
    "Approval time": { tr:"Onay süresi", es:"Tiempo de aprobación", de:"Genehmigungsdauer", fr:"Délai d'approbation", ar:"وقت الموافقة" },
    "Fee waived": { tr:"Ücretsiz", es:"Sin tarifa", de:"Gebührenfrei", fr:"Sans frais", ar:"معفى من الرسوم" },
    "Schengen states covered": { tr:"Kapsanan Schengen ülkesi", es:"Estados Schengen cubiertos", de:"Abgedeckte Schengen-Staaten", fr:"États Schengen couverts", ar:"دول شنغن المشمولة" },
    "Yes — you'll need ETIAS from late 2026": { tr:"Evet — 2026 sonundan itibaren ETIAS gerekecek", es:"Sí — necesitarás ETIAS desde finales de 2026", de:"Ja — ab Ende 2026 brauchst du ETIAS", fr:"Oui — tu auras besoin d'ETIAS dès fin 2026", ar:"نعم — ستحتاج ETIAS من أواخر 2026" },
    "ETIAS required": { tr:"ETIAS gerekli", es:"ETIAS requerido", de:"ETIAS erforderlich", fr:"ETIAS requis", ar:"ETIAS مطلوب" },
    "No ETIAS needed": { tr:"ETIAS gerekmiyor", es:"No necesita ETIAS", de:"Kein ETIAS nötig", fr:"Pas besoin d'ETIAS", ar:"لا حاجة لـ ETIAS" },
    "Exempt — EU / EEA / Swiss citizen": { tr:"Muaf — AB / EEA / İsviçre vatandaşı", es:"Exento — ciudadano UE / EEE / suizo", de:"Befreit — EU / EWR / Schweizer Bürger", fr:"Exempté — citoyen UE / EEE / suisse", ar:"معفى — مواطن الاتحاد الأوروبي / EEA / السويسري" },

    // ─── Passport Validity page ──────────────────────────────────────────
    "Passport Validity Checker": { tr:"Pasaport Geçerlilik Kontrolü", es:"Comprobador de validez del pasaporte", de:"Pass-Gültigkeitsprüfer", fr:"Vérificateur de validité du passeport", ar:"فاحص صلاحية جواز السفر" },
    "Check your passport against a destination": { tr:"Pasaportunu bir destinasyona karşı kontrol et", es:"Comprueba tu pasaporte contra un destino", de:"Pass gegen ein Ziel prüfen", fr:"Vérifie ton passeport contre une destination", ar:"تحقق من جواز سفرك مقابل وجهة" },
    "Destination": { tr:"Destinasyon", es:"Destino", de:"Ziel", fr:"Destination", ar:"الوجهة" },
    "Your passport expiry date": { tr:"Pasaport son kullanma tarihi", es:"Fecha de caducidad del pasaporte", de:"Pass-Ablaufdatum", fr:"Date d'expiration du passeport", ar:"تاريخ انتهاء جواز السفر" },
    "Planned exit date (optional)": { tr:"Planlanan çıkış tarihi (opsiyonel)", es:"Fecha de salida planeada (opcional)", de:"Geplantes Ausreisedatum (optional)", fr:"Date de sortie prévue (optionnel)", ar:"تاريخ المغادرة المخطط (اختياري)" },
    "The three rule tiers": { tr:"Üç kural seviyesi", es:"Los tres niveles de regla", de:"Die drei Regelstufen", fr:"Les trois paliers de règle", ar:"المستويات الثلاثة للقاعدة" },
    "Full list by destination": { tr:"Destinasyona göre tam liste", es:"Lista completa por destino", de:"Vollständige Liste nach Ziel", fr:"Liste complète par destination", ar:"القائمة الكاملة حسب الوجهة" },
    "Validity required": { tr:"Gerekli geçerlilik", es:"Validez requerida", de:"Erforderliche Gültigkeit", fr:"Validité requise", ar:"الصلاحية المطلوبة" },
    "Cleared": { tr:"Onaylandı", es:"Aprobado", de:"Bestanden", fr:"Validé", ar:"مقبول" },
    "Will be refused boarding": { tr:"Uçuşa kabul edilmeyecek", es:"Te denegarán el embarque", de:"Beförderung wird verweigert", fr:"Embarquement refusé", ar:"سيُرفض الصعود" },
    "Rule": { tr:"Kural", es:"Regla", de:"Regel", fr:"Règle", ar:"قاعدة" },

    // ─── Visa Shortcuts page ─────────────────────────────────────────────
    "Visa Shortcuts — easier entry with the visas you already hold": { tr:"Vize Kestirmeleri — elindeki vizelerle daha kolay giriş", es:"Atajos de visa — entrada más fácil con visas que ya tienes", de:"Visa-Abkürzungen — leichtere Einreise mit bereits vorhandenen Visa", fr:"Raccourcis visa — entrée facilitée avec les visas que tu détiens", ar:"اختصارات التأشيرة — دخول أسهل بتأشيراتك الحالية" },
    "Show shortcuts for": { tr:"Kestirmeleri göster", es:"Mostrar atajos para", de:"Abkürzungen zeigen für", fr:"Afficher les raccourcis pour", ar:"إظهار اختصارات لـ" },
    "All passports": { tr:"Tüm pasaportlar", es:"Todos los pasaportes", de:"Alle Pässe", fr:"Tous les passeports", ar:"جميع الجوازات" },
    "→ becomes": { tr:"→ olur", es:"→ se vuelve", de:"→ wird zu", fr:"→ devient", ar:"→ يصبح" },

    // ─── ESTA page ───────────────────────────────────────────────────────
    "ESTA Disqualifier Checker": { tr:"ESTA Diskalifiye Kontrolü", es:"Verificador de descalificadores ESTA", de:"ESTA-Disqualifikations-Checker", fr:"Vérificateur de disqualifications ESTA", ar:"فاحص موانع أهلية ESTA" },
    "Check your ESTA eligibility": { tr:"ESTA uygunluğunu kontrol et", es:"Comprueba tu elegibilidad ESTA", de:"ESTA-Berechtigung prüfen", fr:"Vérifie ton éligibilité ESTA", ar:"تحقق من أهليتك لـ ESTA" },
    "Tick anything that applies to you": { tr:"Sana uyan her şeyi işaretle", es:"Marca todo lo que se aplique a ti", de:"Markiere alles, was auf dich zutrifft", fr:"Coche tout ce qui te concerne", ar:"حدّد كل ما ينطبق عليك" },
    "The 41 VWP countries": { tr:"41 VWP ülkesi", es:"Los 41 países VWP", de:"Die 41 VWP-Länder", fr:"Les 41 pays VWP", ar:"41 دولة VWP" },
    "What if I'm disqualified?": { tr:"Diskalifiye olursam ne olur?", es:"¿Y si soy descalificado?", de:"Was, wenn ich disqualifiziert bin?", fr:"Et si je suis disqualifié ?", ar:"ماذا لو تم استبعادي؟" },
    "Likely ESTA-eligible": { tr:"Muhtemelen ESTA için uygun", es:"Probablemente elegible para ESTA", de:"Wahrscheinlich ESTA-berechtigt", fr:"Probablement éligible ESTA", ar:"على الأرجح مؤهل لـ ESTA" },
    "Not VWP-eligible": { tr:"VWP için uygun değil", es:"No elegible para VWP", de:"Nicht VWP-berechtigt", fr:"Pas éligible au VWP", ar:"غير مؤهل لـ VWP" },
    "ESTA disqualifier hit": { tr:"ESTA diskalifiye nedeni mevcut", es:"Descalificador ESTA detectado", de:"ESTA-Disqualifikation getroffen", fr:"Disqualification ESTA détectée", ar:"تم رصد مانع لأهلية ESTA" },
    "You'll need a full B1/B2 visa": { tr:"Tam B1/B2 vizesi gerekli", es:"Necesitas una visa B1/B2 completa", de:"Du brauchst ein volles B1/B2-Visum", fr:"Tu auras besoin d'un visa B1/B2 complet", ar:"ستحتاج تأشيرة B1/B2 كاملة" },
    "Apply for a B1/B2 visa instead": { tr:"Onun yerine B1/B2 vizesi için başvur", es:"Solicita una visa B1/B2 en su lugar", de:"Beantrage stattdessen ein B1/B2-Visum", fr:"Demande plutôt un visa B1/B2", ar:"تقدّم بطلب تأشيرة B1/B2 بدلاً من ذلك" },

    // ─── Visa Checklist page ─────────────────────────────────────────────
    "Your situation": { tr:"Durumun", es:"Tu situación", de:"Deine Situation", fr:"Ta situation", ar:"وضعك" },
    "Employed": { tr:"Çalışan", es:"Empleado", de:"Angestellt", fr:"Salarié", ar:"موظف" },
    "Self-employed": { tr:"Serbest meslek", es:"Autónomo", de:"Selbstständig", fr:"Indépendant", ar:"عمل حر" },
    "Student": { tr:"Öğrenci", es:"Estudiante", de:"Student", fr:"Étudiant", ar:"طالب" },
    "Retired": { tr:"Emekli", es:"Jubilado", de:"Rentner", fr:"Retraité", ar:"متقاعد" },
    "With minor child": { tr:"Reşit olmayan çocukla", es:"Con menor a cargo", de:"Mit minderjährigem Kind", fr:"Avec enfant mineur", ar:"مع طفل قاصر" },
    "🖨 Print / save PDF": { tr:"🖨 Yazdır / PDF kaydet", es:"🖨 Imprimir / guardar PDF", de:"🖨 Drucken / als PDF speichern", fr:"🖨 Imprimer / PDF", ar:"🖨 طباعة / حفظ PDF" },
    "↺ Reset ticks": { tr:"↺ İşaretleri temizle", es:"↺ Restablecer marcas", de:"↺ Häkchen zurücksetzen", fr:"↺ Réinitialiser cases", ar:"↺ إعادة العلامات" },
    "Sources": { tr:"Kaynaklar", es:"Fuentes", de:"Quellen", fr:"Sources", ar:"المصادر" },

    // ─── Cross-page UI common strings ────────────────────────────────────
    "Select…": { tr:"Seç…", es:"Selecciona…", de:"Auswählen…", fr:"Choisir…", ar:"اختر…" },
    "Search…": { tr:"Ara…", es:"Buscar…", de:"Suchen…", fr:"Rechercher…", ar:"بحث…" },
    "Today": { tr:"Bugün", es:"Hoy", de:"Heute", fr:"Aujourd'hui", ar:"اليوم" },
    "Type": { tr:"Tür", es:"Tipo", de:"Typ", fr:"Type", ar:"النوع" },
    "Region": { tr:"Bölge", es:"Región", de:"Region", fr:"Région", ar:"المنطقة" },
    "Status": { tr:"Durum", es:"Estado", de:"Status", fr:"Statut", ar:"الحالة" },
    "Open": { tr:"Açık", es:"Abierto", de:"Offen", fr:"Ouvert", ar:"مفتوح" },
    "Include closed": { tr:"Kapanmışları dahil et", es:"Incluir cerrados", de:"Geschlossene einschließen", fr:"Inclure les fermés", ar:"تضمين المغلقة" },
    "Family": { tr:"Aile", es:"Familia", de:"Familie", fr:"Famille", ar:"العائلة" },
    "Family OK": { tr:"Aile OK", es:"Familia OK", de:"Familie OK", fr:"Famille OK", ar:"العائلة مقبولة" },
    "Solo only": { tr:"Sadece tek başına", es:"Solo individual", de:"Nur Solo", fr:"Solo seulement", ar:"فردي فقط" },
    "Any": { tr:"Herhangi", es:"Cualquiera", de:"Beliebig", fr:"N'importe", ar:"أي" },
    "Free": { tr:"Ücretsiz", es:"Gratis", de:"Kostenlos", fr:"Gratuit", ar:"مجاني" },
    "Toggle theme": { tr:"Temayı değiştir", es:"Cambiar tema", de:"Theme wechseln", fr:"Changer thème", ar:"تبديل السمة" },
  };

  // Attribute-translation map: { selector: ["attr1", "attr2"] }
  const ATTR_TARGETS = [
    { sel: "[placeholder]", attr: "placeholder" },
    { sel: "[title]",       attr: "title" },
    { sel: "[aria-label]",  attr: "aria-label" },
    { sel: "input[type=button][value], input[type=submit][value]", attr: "value" },
  ];

  function lookup(en, lang) {
    if (lang === "en") return null;
    const entry = DICT[en];
    if (!entry) return null;
    return entry[lang] || null;
  }

  function translateTextNodes(root, lang) {
    // Walk text nodes. Skip script/style and elements with [data-no-i18n].
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest("[data-no-i18n]")) return NodeFilter.FILTER_REJECT;
        // data-i18n-html blocks are translated as a whole (innerHTML), so skip
        // their individual text nodes to avoid double / partial translation.
        if (p.closest && p.closest("[data-i18n-html]")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const dirty = [];
    while (walker.nextNode()) dirty.push(walker.currentNode);
    dirty.forEach(node => {
      const raw = node.nodeValue;
      const trimmed = raw.trim();
      const tr = lookup(trimmed, lang);
      if (tr != null) {
        // Preserve surrounding whitespace
        const leading  = raw.slice(0, raw.indexOf(trimmed));
        const trailing = raw.slice(raw.indexOf(trimmed) + trimmed.length);
        // Store the original on the node so we can restore on lang swap
        if (!node.__atlasOriginal) node.__atlasOriginal = raw;
        node.nodeValue = leading + tr + trailing;
      }
    });
  }

  function translateAttributes(root, lang) {
    ATTR_TARGETS.forEach(({ sel, attr }) => {
      root.querySelectorAll(sel).forEach(el => {
        if (el.closest("[data-no-i18n]")) return;
        const original = el.getAttribute("data-orig-" + attr) || el.getAttribute(attr);
        if (!original) return;
        const tr = lookup(original.trim(), lang);
        if (tr != null) {
          if (!el.getAttribute("data-orig-" + attr)) el.setAttribute("data-orig-" + attr, original);
          el.setAttribute(attr, tr);
        }
      });
    });
  }

  // Whole-block innerHTML translation for elements tagged data-i18n-html.
  // Lets us translate paragraphs that contain inline markup (<strong>, <a>)
  // which the text-node walker would otherwise split and miss. The attribute
  // value is the DICT key; the DICT value is the translated HTML.
  function translateHtmlBlocks(root, lang) {
    const els = root.querySelectorAll ? root.querySelectorAll("[data-i18n-html]") : [];
    els.forEach(el => {
      const key = el.getAttribute("data-i18n-html");
      const tr = lookup(key, lang);
      if (tr != null) {
        if (el.__atlasHtmlOrig == null) el.__atlasHtmlOrig = el.innerHTML;
        el.innerHTML = tr;
      }
    });
  }
  function restoreHtmlBlocks(root) {
    const els = root.querySelectorAll ? root.querySelectorAll("[data-i18n-html]") : [];
    els.forEach(el => {
      if (el.__atlasHtmlOrig != null) { el.innerHTML = el.__atlasHtmlOrig; el.__atlasHtmlOrig = null; }
    });
  }

  function restoreOriginal(root) {
    // Restore text nodes (uses __atlasOriginal)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.__atlasOriginal) { n.nodeValue = n.__atlasOriginal; n.__atlasOriginal = null; }
    }
    ATTR_TARGETS.forEach(({ sel, attr }) => {
      root.querySelectorAll("[data-orig-" + attr + "]").forEach(el => {
        const orig = el.getAttribute("data-orig-" + attr);
        if (orig != null) { el.setAttribute(attr, orig); el.removeAttribute("data-orig-" + attr); }
      });
    });
  }

  // Guard so the MutationObserver ignores the DOM writes WE make while
  // translating (otherwise translateTextNodes would re-trigger itself).
  let _applying = false;

  function applyLang(lang) {
    _applying = true;
    // Always restore first so re-applies don't double-translate.
    restoreHtmlBlocks(document.body);
    restoreOriginal(document.body);
    if (lang !== "en") {
      translateHtmlBlocks(document.body, lang);
      translateTextNodes(document.body, lang);
      translateAttributes(document.body, lang);
    }
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    _applying = false;
  }

  // Re-translate dynamically-inserted content (calculator verdicts, fetched
  // rows, JS-rendered cards, …). The one-shot walk at init can't catch these,
  // so we observe the body and translate freshly-added subtrees. This is what
  // makes JS-generated strings (e.g. the Schengen cascade verdict) localise.
  function setupObserver() {
    if (!("MutationObserver" in window)) return;
    const obs = new MutationObserver((mutations) => {
      if (_applying) return;
      const lang = currentLang();
      if (lang === "en") return;
      _applying = true;
      for (const m of mutations) {
        m.addedNodes && m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {            // element subtree
            translateHtmlBlocks(node, lang);
            translateTextNodes(node, lang);
            translateAttributes(node, lang);
          } else if (node.nodeType === 3) {     // bare text node
            const trimmed = (node.nodeValue || "").trim();
            const tr = lookup(trimmed, lang);
            if (tr != null) {
              if (!node.__atlasOriginal) node.__atlasOriginal = node.nodeValue;
              node.nodeValue = node.nodeValue.replace(trimmed, tr);
            }
          }
        });
      }
      _applying = false;
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ── Theme sync ────────────────────────────────────────────────────────
  // Mirrors the SPA's choice (stored in localStorage.atlas.tweaks under the
  // "background" key). Static pages traditionally shipped only a dark palette;
  // we inject a small CSS block that flips the standard set of CSS variables
  // (--bg, --panel, --bg3, --fg, etc.) when body.theme-light is present.
  function currentTheme() {
    try {
      const tw = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
      return tw.background === "dark" ? "dark" : "light"; // SPA default is light
    } catch (e) { return "light"; }
  }

  function injectThemeCSS() {
    if (document.getElementById("atlas-theme-css")) return;
    // Override the standard CSS variable set in BOTH directions so the
    // toggle works whether a page ships dark- or light-default.
    // Older static pages (alerts, schengen-calc, itinerary, etc.) default
    // dark and rely on theme-light to flip; the new Faz A pages default
    // light and need theme-dark to flip back. Both blocks shipped below.
    const css = `
      body.theme-light {
        --bg: #f5f7fb !important;
        --panel: #ffffff !important;
        --bg3: #eef2f8 !important;
        --fg: #0f1722 !important;
        --fg-dim: #3d4a5e !important;
        --fg-mute: #6b7791 !important;
        --fg-faint: #9aa3b5 !important;
        --border: rgba(30,40,60,0.10) !important;
        --border-strong: rgba(30,40,60,0.18) !important;
        --link: #1e60c4 !important;
        background: radial-gradient(ellipse 80% 60% at 70% 20%, rgba(96,165,250,0.08), transparent 70%), #f5f7fb !important;
      }
      body.theme-light h1, body.theme-light h2, body.theme-light h3 { color: #0f1722 !important; }
      body.theme-light table { background: #ffffff !important; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
      body.theme-light thead { background: #eef2f8 !important; }
      body.theme-light tr:hover td { background: rgba(96,165,250,0.05) !important; }

      body.theme-dark {
        --bg: #05070d !important;
        --panel: #111827 !important;
        --bg3: #1a2236 !important;
        --fg: #e7ecf5 !important;
        --fg-dim: #aab4c8 !important;
        --fg-mute: #6b7591 !important;
        --fg-faint: #4a5269 !important;
        --border: rgba(148,173,220,0.15) !important;
        --border-strong: rgba(148,173,220,0.28) !important;
        --link: #60a5fa !important;
        background: radial-gradient(ellipse 80% 60% at 70% 20%, rgba(40,80,150,0.18), transparent 70%), #05070d !important;
      }
      body.theme-dark h1, body.theme-dark h2, body.theme-dark h3 { color: #e7ecf5 !important; }
      body.theme-dark table { background: #111827 !important; box-shadow: 0 1px 3px rgba(0,0,0,0.30) !important; }
      body.theme-dark thead { background: #1a2236 !important; }
      body.theme-dark tr:hover td { background: rgba(96,165,250,0.04) !important; }
      body.theme-dark a { color: #60a5fa !important; }
    `;
    const style = document.createElement("style");
    style.id = "atlas-theme-css";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function applyTheme(theme) {
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add("theme-" + theme);
  }

  // Floating lang + theme switcher (fixed top-right). Stays out of layout.
  function injectSwitcher(lang, theme) {
    if (document.getElementById("atlas-lang-switcher")) return;
    const langs = [
      ["en", "English"], ["tr", "Türkçe"], ["es", "Español"],
      ["de", "Deutsch"], ["fr", "Français"], ["ar", "العربية"],
    ];
    const wrap = document.createElement("div");
    wrap.id = "atlas-lang-switcher";
    wrap.setAttribute("data-no-i18n", "");
    wrap.style.cssText =
      "position:fixed;top:14px;right:14px;z-index:9999;display:flex;gap:6px;" +
      "background:var(--panel,#ffffff);backdrop-filter:blur(10px);" +
      "border:1px solid var(--border-strong,rgba(30,40,60,0.18));border-radius:8px;" +
      "padding:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
      "box-shadow:0 4px 12px rgba(0,0,0,0.08);";
    const sel = document.createElement("select");
    sel.style.cssText =
      "background:transparent;color:var(--fg,#0f1722);border:none;outline:none;" +
      "font-size:12px;padding:4px 6px;cursor:pointer;";
    langs.forEach(([code, label]) => {
      const o = document.createElement("option");
      o.value = code; o.textContent = label;
      if (code === lang) o.selected = true;
      o.style.color = "#000";
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => {
      const newLang = sel.value;
      try { localStorage.setItem("atlas.lang", newLang); } catch (e) {}
      applyLang(newLang);
      window.dispatchEvent(new CustomEvent("atlas:lang", { detail: { code: newLang } }));
    });

    // Theme toggle button — flips the body class and persists in atlas.tweaks.
    // Icon shows the OPPOSITE of the current theme so users read it as
    // "click to switch to X" (the common convention on Twitter, GitHub, etc.).
    const themeBtn = document.createElement("button");
    themeBtn.type = "button";
    themeBtn.title = "Toggle theme";
    themeBtn.style.cssText =
      "background:transparent;border:none;cursor:pointer;font-size:14px;" +
      "color:var(--fg,#0f1722);padding:4px 8px;border-radius:6px;";
    const iconForCurrent = (t) => t === "light" ? "☾" : "☀";
    themeBtn.textContent = iconForCurrent(theme);
    themeBtn.addEventListener("click", () => {
      const cur = document.body.classList.contains("theme-dark") ? "dark" : "light";
      const next = cur === "light" ? "dark" : "light";
      try {
        const tw = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
        tw.background = next;
        localStorage.setItem("atlas.tweaks", JSON.stringify(tw));
      } catch (e) {}
      applyTheme(next);
      themeBtn.textContent = iconForCurrent(next);
    });

    wrap.appendChild(sel);
    wrap.appendChild(themeBtn);
    document.body.appendChild(wrap);
  }

  function init() {
    const lang = currentLang();
    const theme = currentTheme();
    injectThemeCSS();
    applyTheme(theme);
    injectSwitcher(lang, theme);
    applyLang(lang);
    setupObserver();
    // Listen for cross-tab theme changes (StorageEvent fires when another tab
    // writes to localStorage). Keeps theme synced if the SPA is open elsewhere.
    window.addEventListener("storage", (e) => {
      if (e.key === "atlas.tweaks") applyTheme(currentTheme());
      if (e.key === "atlas.lang")   applyLang(currentLang());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
