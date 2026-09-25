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
    // A page generated as a Turkish twin (/tr/…) is Turkish whatever is stored;
    // this only keeps JS-inserted English strings (calculator verdicts…) in step.
    var pinned = document.documentElement.getAttribute("data-page-lang");
    if (pinned) return pinned;
    try { return localStorage.getItem("atlas.lang") || "en"; }
    catch (e) { return "en"; }
  }

  // English-keyed translation dictionary. Add languages as needed; missing
  // language for a string → fallback to the original English text.
  // KEEP KEYS as the exact verbatim English from the source HTML (trimmed).
  const DICT = {
    // ── Site masthead + footer (scripts/partials.js) ──
    "Visa map": { tr:"Vize haritası", es:"Mapa de visas", de:"Visakarte", fr:"Carte des visas", ar:"خريطة التأشيرات" },
    "Transit map": { tr:"Transit haritası", es:"Mapa de tránsito", de:"Transitkarte", fr:"Carte du transit", ar:"خريطة العبور" },
    "Safety map": { tr:"Güvenlik haritası", es:"Mapa de seguridad", de:"Sicherheitskarte", fr:"Carte de sécurité", ar:"خريطة السلامة" },
    "Travel planner": { tr:"Seyahat planlayıcı", es:"Planificador de viaje", de:"Reiseplaner", fr:"Planificateur de voyage", ar:"مخطّط الرحلة" },
    "Schengen calc": { tr:"Schengen hesaplayıcı", es:"Calc. Schengen", de:"Schengen-Rechner", fr:"Calcul Schengen", ar:"حاسبة شنغن" },
    "Passports": { tr:"Pasaportlar", es:"Pasaportes", de:"Pässe", fr:"Passeports", ar:"جوازات السفر" },
    "Guides": { tr:"Rehberler", es:"Guías", de:"Ratgeber", fr:"Guides", ar:"الأدلة" },
    "Nomad visas": { tr:"Dijital göçebe vizeleri", es:"Visas nómada", de:"Nomadenvisa", fr:"Visas nomades", ar:"تأشيرات الرحالة" },
    "Second passport": { tr:"İkinci pasaport", es:"Segundo pasaporte", de:"Zweitpass", fr:"Second passeport", ar:"جواز سفر ثانٍ" },
    "Alerts": { tr:"Uyarılar", es:"Alertas", de:"Benachrichtigungen", fr:"Alertes", ar:"التنبيهات" },
    "About": { tr:"Hakkında", es:"Acerca de", de:"Über uns", fr:"À propos", ar:"حول" },
    "More": { tr:"Daha fazla", es:"Más", de:"Mehr", fr:"Plus", ar:"المزيد" },
    "Skip to content": { tr:"İçeriğe geç", es:"Saltar al contenido", de:"Zum Inhalt springen", fr:"Aller au contenu", ar:"تخطَّ إلى المحتوى" },
    "Support": { tr:"Destek ol", es:"Apoyar", de:"Unterstützen", fr:"Soutenir", ar:"ادعمنا" },
    "Tools": { tr:"Araçlar", es:"Herramientas", de:"Werkzeuge", fr:"Outils", ar:"الأدوات" },
    "Read": { tr:"Okuma", es:"Lecturas", de:"Lesen", fr:"Lire", ar:"اقرأ" },
    "The project": { tr:"Proje", es:"El proyecto", de:"Das Projekt", fr:"Le projet", ar:"المشروع" },
    "Passport validity": { tr:"Pasaport geçerliliği", es:"Validez del pasaporte", de:"Passgültigkeit", fr:"Validité du passeport", ar:"صلاحية جواز السفر" },
    "Visa shortcuts": { tr:"Vize kısayolları", es:"Atajos de visa", de:"Visa-Abkürzungen", fr:"Raccourcis visa", ar:"اختصارات التأشيرة" },
    "Terms": { tr:"Kullanım koşulları", es:"Términos", de:"Nutzungsbedingungen", fr:"Conditions", ar:"الشروط" },
    "Source on GitHub": { tr:"GitHub'daki kaynak kod", es:"Código en GitHub", de:"Quellcode auf GitHub", fr:"Code source sur GitHub", ar:"الشيفرة على GitHub" },
    "An independent visa atlas, built and maintained by Uygar Atalay. Corrections and questions:": { tr:"Uygar Atalay tarafından geliştirilen ve bakımı yapılan bağımsız bir vize atlası. Düzeltme ve sorular için:", es:"Un atlas de visados independiente, creado y mantenido por Uygar Atalay. Correcciones y preguntas:", de:"Ein unabhängiger Visa-Atlas, entwickelt und gepflegt von Uygar Atalay. Korrekturen und Fragen:", fr:"Un atlas des visas indépendant, conçu et maintenu par Uygar Atalay. Corrections et questions :", ar:"أطلس تأشيرات مستقل، من تطوير وصيانة أوغار أتالاي. للتصحيحات والأسئلة:" },
    "Visa rules change often — always confirm with the destination's embassy or consulate before you book. Data is rebuilt every 24 hours from public visa-policy sources.": { tr:"Vize kuralları sık değişir — rezervasyon yapmadan önce mutlaka gideceğin ülkenin büyükelçiliği veya konsolosluğuyla teyit et. Veriler her 24 saatte bir açık vize politikası kaynaklarından yeniden oluşturulur.", es:"Las normas de visado cambian a menudo: confirma siempre con la embajada o el consulado del destino antes de reservar. Los datos se reconstruyen cada 24 horas a partir de fuentes públicas.", de:"Visaregeln ändern sich häufig – bestätige sie vor der Buchung immer bei der Botschaft oder dem Konsulat des Ziellandes. Die Daten werden alle 24 Stunden aus öffentlichen Quellen neu aufgebaut.", fr:"Les règles de visa changent souvent : vérifiez toujours auprès de l'ambassade ou du consulat de la destination avant de réserver. Les données sont reconstruites toutes les 24 heures à partir de sources publiques.", ar:"تتغير قواعد التأشيرات كثيرًا — تأكد دائمًا من سفارة بلد الوجهة أو قنصليتها قبل الحجز. يُعاد بناء البيانات كل 24 ساعة من مصادر عامة." },

    "← travelnow.info":                            { tr:"← travelnow.info", es:"← travelnow.info", de:"← travelnow.info", fr:"← travelnow.info", ar:"← أطلس" },
    "← travelnow.info globe":                      { tr:"← travelnow.info küresi", es:"← Globo travelnow.info", de:"← travelnow.info-Globus", fr:"← Globe travelnow.info", ar:"← كرة أطلس" },
    "← Back to travelnow.info":                    { tr:"← travelnow.info'a dön", es:"← Volver a travelnow.info", de:"← Zurück zu travelnow.info", fr:"← Retour à travelnow.info", ar:"← العودة إلى أطلس" },
    "← Back to globe":                    { tr:"← Küreye dön", es:"← Volver al globo", de:"← Zurück zum Globus", fr:"← Retour au globe", ar:"← العودة إلى الكرة" },

    // Schengen calculator
    "Schengen 90/180 calculator":          { tr:"Schengen 90/180 hesaplayıcı", es:"Calculadora Schengen 90/180", de:"Schengen 90/180-Rechner", fr:"Calculateur Schengen 90/180", ar:"حاسبة شنغن 90/180" },
    "Schengen 90/180 Calculator":          { tr:"Schengen 90/180 Hesaplayıcı", es:"Calculadora Schengen 90/180", de:"Schengen 90/180-Rechner", fr:"Calculateur Schengen 90/180", ar:"حاسبة شنغن 90/180" },
    "Schengen 90 / 180 Day Calculator":    { tr:"Schengen 90 / 180 Gün Hesaplayıcı", es:"Calculadora Schengen 90 / 180 días", de:"Schengen 90 / 180-Tage-Rechner", fr:"Calculateur Schengen 90 / 180 jours", ar:"حاسبة شنغن 90/180 يومًا" },
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
    "If any overstay, refusal, or rule breach occurred in the last 2 years, the cascade restarts. Consulates may also issue a single-entry visa as a probationary measure. Be especially clean with your next stay.": { tr:"Son 2 yılda herhangi bir vize aşımı, ret veya kural ihlali olduysa kademe sıfırlanır. Konsolosluklar deneme amaçlı tek girişli vize de verebilir. Bir sonraki kalışında özellikle kurallara uy.", es:"Si hubo un exceso de estancia, una denegación o un incumplimiento en los últimos 2 años, la cascada se reinicia. Los consulados también pueden emitir un visado de entrada única como medida de prueba. Sé especialmente impecable en tu próxima estancia.", de:"Bei einer Überschreitung, Ablehnung oder Regelverletzung in den letzten 2 Jahren beginnt die Kaskade neu. Konsulate können auch ein Einzeleinreise-Visum als Bewährungsmaßnahme ausstellen. Sei bei deinem nächsten Aufenthalt besonders korrekt.", fr:"En cas de dépassement, de refus ou d'infraction au cours des 2 dernières années, la cascade redémarre. Les consulats peuvent aussi délivrer un visa à entrée unique à titre probatoire. Sois particulièrement irréprochable lors de ton prochain séjour.", ar:"إذا حدث تجاوز للإقامة أو رفض أو مخالفة خلال آخر سنتين، يُعاد التدرّج من الصفر. وقد تُصدر القنصليات تأشيرة دخول واحد كإجراء تجريبي. التزم بالقواعد تمامًا في إقامتك القادمة." },
    "You already hold the top-tier MEV. On expiry, apply again — the same 5-year MEV should be granted as long as the cascade is clean. No downgrade unless your circumstances changed.": { tr:"Zaten en üst kademe MEV'e sahipsin. Süresi dolunca tekrar başvur — kademe temiz olduğu sürece aynı 5 yıllık MEV verilmeli. Koşulların değişmedikçe düşürme olmaz.", es:"Ya tienes el MEV de máximo nivel. Al caducar, vuelve a solicitarlo — debería concederse el mismo MEV de 5 años mientras la cascada esté limpia. Sin rebaja salvo que cambien tus circunstancias.", de:"Du hast bereits das MEV der höchsten Stufe. Beantrage es nach Ablauf erneut — dasselbe 5-Jahres-MEV sollte gewährt werden, solange die Kaskade sauber ist. Keine Herabstufung, sofern sich deine Umstände nicht geändert haben.", fr:"Tu détiens déjà le MEV de plus haut niveau. À son expiration, redemande-le — le même MEV de 5 ans devrait être accordé tant que la cascade reste propre. Pas de rétrogradation sauf changement de situation.", ar:"أنت تحمل بالفعل MEV من أعلى فئة. عند انتهائه، قدّم الطلب مجددًا — يُفترض منح نفس MEV لمدة 5 سنوات ما دام السجل نظيفًا. لا تخفيض ما لم تتغيّر ظروفك." },
    "You've successfully used a 2-year MEV. Article 24 entitles you to request a 5-year MEV on the next application. Mention 'cascade rule under VC Article 24' explicitly on the application form — consulates don't always volunteer it.": { tr:"2 yıllık bir MEV'i başarıyla kullandın. Madde 24, bir sonraki başvuruda 5 yıllık MEV talep etme hakkı verir. Başvuru formunda 'Vize Kodu Madde 24 kademe kuralı'nı açıkça belirt — konsolosluklar her zaman kendiliğinden sunmaz.", es:"Has usado correctamente un MEV de 2 años. El Artículo 24 te da derecho a solicitar un MEV de 5 años en la próxima solicitud. Menciona explícitamente 'regla de cascada del Artículo 24 del CV' en el formulario — los consulados no siempre lo ofrecen.", de:"Du hast erfolgreich ein 2-Jahres-MEV genutzt. Artikel 24 berechtigt dich, beim nächsten Antrag ein 5-Jahres-MEV zu beantragen. Erwähne ausdrücklich die 'Kaskadenregel nach Art. 24 Visakodex' im Formular — Konsulate weisen nicht immer von sich aus darauf hin.", fr:"Tu as utilisé correctement un MEV de 2 ans. L'article 24 te permet de demander un MEV de 5 ans à la prochaine demande. Mentionne explicitement « règle de cascade, article 24 du code des visas » sur le formulaire — les consulats ne le proposent pas toujours d'eux-mêmes.", ar:"استخدمت بنجاح MEV لمدة سنتين. تمنحك المادة 24 الحق في طلب MEV لمدة 5 سنوات في الطلب التالي. اذكر صراحةً 'قاعدة التدرّج بموجب المادة 24 من قانون التأشيرات' في النموذج — لا تعرضها القنصليات دائمًا تلقائيًا." },
    "Two or more correctly-used short-stay visas in the last 2 years qualify you for a 2-year MEV. Some consulates issue 3-year; either is fine. Request explicitly — single-entry should not be your default at this point.": { tr:"Son 2 yılda doğru kullanılmış iki veya daha fazla kısa süreli vize, 2 yıllık MEV için seni uygun kılar. Bazı konsolosluklar 3 yıllık verir; ikisi de olur. Açıkça talep et — bu noktada tek girişli vize varsayılanın olmamalı.", es:"Dos o más visados de corta estancia usados correctamente en los últimos 2 años te dan derecho a un MEV de 2 años. Algunos consulados emiten de 3 años; cualquiera vale. Solicítalo explícitamente — la entrada única no debería ser tu opción por defecto a estas alturas.", de:"Zwei oder mehr korrekt genutzte Kurzaufenthaltsvisa in den letzten 2 Jahren qualifizieren dich für ein 2-Jahres-MEV. Manche Konsulate stellen 3 Jahre aus; beides ist gut. Beantrage es ausdrücklich — Einzeleinreise sollte jetzt nicht mehr dein Standard sein.", fr:"Deux visas de court séjour ou plus correctement utilisés ces 2 dernières années te donnent droit à un MEV de 2 ans. Certains consulats en délivrent un de 3 ans ; l'un ou l'autre convient. Demande-le explicitement — l'entrée unique ne devrait plus être ton choix par défaut.", ar:"تأشيرتان قصيرتان أو أكثر استُخدمتا بشكل صحيح خلال آخر سنتين تؤهّلانك لـ MEV لمدة سنتين. بعض القنصليات تصدر 3 سنوات؛ كلاهما جيد. اطلبه صراحةً — لا ينبغي أن يكون الدخول الواحد خيارك الافتراضي الآن." },
    "One correctly-used short-stay visa qualifies you for a 1-year MEV under the cascade. Mention your prior visa numbers and 'cascade rule' on the application.": { tr:"Doğru kullanılmış bir kısa süreli vize, kademe kuralı kapsamında 1 yıllık MEV için seni uygun kılar. Başvuruda önceki vize numaralarını ve 'kademe kuralı'nı belirt.", es:"Un visado de corta estancia usado correctamente te da derecho a un MEV de 1 año dentro de la cascada. Menciona en la solicitud los números de tus visados anteriores y la 'regla de cascada'.", de:"Ein korrekt genutztes Kurzaufenthaltsvisum qualifiziert dich für ein 1-Jahres-MEV im Rahmen der Kaskade. Gib im Antrag deine früheren Visumnummern und die 'Kaskadenregel' an.", fr:"Un visa de court séjour correctement utilisé te donne droit à un MEV d'un an dans le cadre de la cascade. Indique sur la demande tes numéros de visas précédents et la « règle de cascade ».", ar:"تأشيرة قصيرة واحدة استُخدمت بشكل صحيح تؤهّلك لـ MEV لمدة سنة ضمن التدرّج. اذكر في الطلب أرقام تأشيراتك السابقة و'قاعدة التدرّج'." },
    "Most consulates issue a single-entry or short MEV (6 months) for first-time applicants. Use it within the validity, exit on time, and you'll be in the cascade for your next application.": { tr:"Çoğu konsolosluk ilk kez başvuranlara tek girişli veya kısa MEV (6 ay) verir. Geçerlilik içinde kullan, zamanında çık; bir sonraki başvurunda kademeye girmiş olursun.", es:"La mayoría de los consulados emiten un visado de entrada única o un MEV corto (6 meses) a los solicitantes primerizos. Úsalo dentro de la validez, sal a tiempo y entrarás en la cascada para tu próxima solicitud.", de:"Die meisten Konsulate stellen Erstantragstellern ein Einzeleinreise- oder kurzes MEV (6 Monate) aus. Nutze es innerhalb der Gültigkeit, reise pünktlich aus, und du bist bei deinem nächsten Antrag in der Kaskade.", fr:"La plupart des consulats délivrent aux primo-demandeurs un visa à entrée unique ou un MEV court (6 mois). Utilise-le pendant sa validité, sors à temps, et tu seras dans la cascade pour ta prochaine demande.", ar:"تُصدر معظم القنصليات للمتقدّمين لأول مرة تأشيرة دخول واحد أو MEV قصير (6 أشهر). استخدمها ضمن صلاحيتها، وغادر في الوقت المحدد، وستدخل التدرّج لطلبك التالي." },

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

    // ── Tool-page lead paragraphs ──
    "Every active digital-nomad / remote-worker visa programme in 2026, with the numbers that actually matter: monthly income floor, application fee, first-grant duration, tax break, and whether you can bring family.": { tr:"2026'daki tüm aktif dijital-göçebe / uzaktan-çalışan vize programları, gerçekten önemli rakamlarla: aylık asgari gelir, başvuru ücreti, ilk verilen süre, vergi avantajı ve aile getirebilme durumu.", es:"Todos los programas activos de visado de nómada digital / trabajo remoto en 2026, con las cifras que importan: ingreso mensual mínimo, tasa de solicitud, duración de la primera concesión, ventaja fiscal y si puedes traer a la familia.", de:"Alle aktiven Digital-Nomad-/Remote-Work-Visa-Programme 2026, mit den Zahlen, die zählen: monatliches Mindesteinkommen, Antragsgebühr, Erstbewilligungsdauer, Steuervorteil und ob die Familie mitkommen kann.", fr:"Tous les programmes de visa nomade numérique / télétravail actifs en 2026, avec les chiffres qui comptent : revenu mensuel minimum, frais de dossier, durée du premier octroi, avantage fiscal et possibilité d'amener la famille.", ar:"كل برامج تأشيرات الرحّل الرقميين / العمل عن بُعد الفعّالة في 2026، مع الأرقام المهمة: الحد الأدنى للدخل الشهري، رسوم الطلب، مدة المنح الأولى، الميزة الضريبية، وإمكانية اصطحاب العائلة." },
    "Every active citizenship-by-investment (CBI) and major residence-by-investment (RBI / Golden Visa) programme on a single page. Minimum investment, qualifying routes, realistic timeline, visa-free score of the resulting passport, and whether your spouse and children can be added.": { tr:"Tüm aktif yatırımla-vatandaşlık (CBI) ve başlıca yatırımla-oturum (RBI / Altın Vize) programları tek sayfada. Asgari yatırım, uygun yollar, gerçekçi süreç, elde edilen pasaportun vizesiz skoru ve eş/çocukların eklenip eklenemeyeceği.", es:"Todos los programas activos de ciudadanía por inversión (CBI) y residencia por inversión (RBI / Visado Dorado) en una sola página. Inversión mínima, vías válidas, plazo realista, puntuación sin visado del pasaporte resultante y si se pueden añadir cónyuge e hijos.", de:"Alle aktiven Programme für Staatsbürgerschaft durch Investition (CBI) und Aufenthalt durch Investition (RBI / Golden Visa) auf einer Seite. Mindestinvestition, gültige Wege, realistischer Zeitrahmen, visumfreier Wert des resultierenden Passes und ob Ehepartner und Kinder hinzugefügt werden können.", fr:"Tous les programmes actifs de citoyenneté par investissement (CBI) et de résidence par investissement (RBI / Golden Visa) sur une seule page. Investissement minimum, voies éligibles, délai réaliste, score sans visa du passeport obtenu et possibilité d'ajouter conjoint et enfants.", ar:"كل برامج الجنسية عن طريق الاستثمار (CBI) والإقامة عن طريق الاستثمار (RBI / التأشيرة الذهبية) الفعّالة في صفحة واحدة. الحد الأدنى للاستثمار، المسارات المؤهلة، الجدول الزمني الواقعي، درجة جواز السفر الناتج بدون تأشيرة، وإمكانية إضافة الزوج والأطفال." },
    "Many countries cut the visa-application red tape if you already hold a visa or residence permit for a major economy. Holders of a valid US, UK, Ireland, Canadian or Schengen visa can often get an eVisa, visa-on-arrival, or even visa-free entry to countries that would otherwise demand a full embassy application. Browse every shortcut we've documented, by your passport.": { tr:"Birçok ülke, büyük bir ekonomiye ait vize veya oturma izniniz varsa vize başvuru bürokrasisini azaltır. Geçerli ABD, İngiltere, İrlanda, Kanada veya Schengen vizesi olanlar, normalde tam elçilik başvurusu gereken ülkelere genelde e-vize, varışta vize, hatta vizesiz girebilir. Pasaportuna göre belgelediğimiz tüm kısayollara göz at.", es:"Muchos países reducen los trámites de visado si ya tienes un visado o permiso de residencia de una gran economía. Quienes tengan un visado válido de EE. UU., Reino Unido, Irlanda, Canadá o Schengen pueden a menudo obtener un eVisa, visado a la llegada o incluso entrada sin visado a países que de otro modo exigirían una solicitud completa en la embajada. Explora todos los atajos documentados, según tu pasaporte.", de:"Viele Länder reduzieren den Visa-Aufwand, wenn du bereits ein Visum oder einen Aufenthaltstitel einer großen Wirtschaft hast. Inhaber eines gültigen US-, UK-, irischen, kanadischen oder Schengen-Visums bekommen oft ein eVisa, Visum bei Ankunft oder sogar visumfreie Einreise in Länder, die sonst einen vollen Botschaftsantrag verlangen. Durchstöbere alle dokumentierten Abkürzungen nach deinem Pass.", fr:"De nombreux pays allègent les formalités de visa si tu détiens déjà un visa ou un titre de séjour d'une grande économie. Les titulaires d'un visa valide américain, britannique, irlandais, canadien ou Schengen peuvent souvent obtenir un eVisa, un visa à l'arrivée, voire une entrée sans visa dans des pays qui exigeraient autrement une demande complète à l'ambassade. Parcours tous les raccourcis documentés, selon ton passeport.", ar:"تخفّف دول كثيرة إجراءات التأشيرة إذا كنت تحمل بالفعل تأشيرة أو إقامة لاقتصاد كبير. غالبًا ما يحصل حاملو تأشيرة سارية أمريكية أو بريطانية أو أيرلندية أو كندية أو شنغن على تأشيرة إلكترونية أو تأشيرة عند الوصول أو حتى دخول بدون تأشيرة إلى دول تتطلب عادةً طلبًا كاملًا في السفارة. تصفّح كل الاختصارات الموثّقة حسب جواز سفرك." },
    "pv.lead": { tr:"Çoğu ülke pasaportunun planlanan kalışından <strong>6 ay sonrasına kadar</strong> geçerli olmasını ister. Schengen ülkeleri 3 ay ister. ABD ve Kanada yalnızca kalış süren boyunca geçerli pasaportları kabul eder. Uçağa alınmama riskine girme — uçmadan önce seyahatinin her ayağını kontrol et.", es:"La mayoría de los países exigen que tu pasaporte sea válido <strong>6 meses más allá de tu estancia prevista</strong>. Los Estados Schengen piden 3 meses. EE. UU. y Canadá aceptan pasaportes válidos solo durante tu estancia. No te quedes sin embarcar — revisa cada tramo antes de volar.", de:"Die meisten Länder verlangen, dass dein Pass <strong>6 Monate über deinen geplanten Aufenthalt hinaus</strong> gültig ist. Schengen-Staaten verlangen 3 Monate. USA und Kanada akzeptieren Pässe, die nur für die Dauer deines Aufenthalts gültig sind. Lass dir das Boarding nicht verweigern — prüfe jeden Abschnitt vor dem Abflug.", fr:"La plupart des pays exigent un passeport valide <strong>6 mois après la fin de ton séjour</strong>. Les États Schengen demandent 3 mois. Les États-Unis et le Canada acceptent un passeport valide seulement pour la durée du séjour. Ne te fais pas refuser l'embarquement — vérifie chaque étape avant de voler.", ar:"تشترط معظم الدول صلاحية جواز سفرك <strong>6 أشهر بعد نهاية إقامتك المخطط لها</strong>. دول شنغن تطلب 3 أشهر. تقبل الولايات المتحدة وكندا جوازات صالحة لمدة إقامتك فقط. لا تتعرّض لرفض الصعود — تحقق من كل مرحلة قبل السفر." },
    "esta.lead": { tr:"Vize Muafiyet Programı üyeleri, kısa ABD ziyaretlerinde tam B1/B2 vizesi yerine <strong>ESTA</strong> alır. Ama yalnızca VWP uygunluğu yetmez — pasaportun listede olsa bile birkaç engel seni programdan çıkarabilir. 21 dolarlık ESTA ücretini ödeyip sınırda geri çevrilme: önce kuralları burada kontrol et.", es:"Los miembros del Programa de Exención de Visado obtienen <strong>ESTA</strong> en lugar de un visado B1/B2 completo para visitas cortas a EE. UU. Pero la elegibilidad VWP no basta — varios descalificadores te sacan del programa aunque tu pasaporte esté en la lista. No pagues los 21 $ del ESTA solo para que te rechacen: revisa las reglas aquí primero.", de:"Mitglieder des Visa-Waiver-Programms erhalten <strong>ESTA</strong> statt eines vollen B1/B2-Visums für kurze US-Besuche. Aber VWP-Berechtigung allein reicht nicht — mehrere Ausschlussgründe werfen dich raus, auch wenn dein Pass auf der Liste steht. Zahl nicht 21 $ ESTA, nur um abgewiesen zu werden: prüfe zuerst die Regeln.", fr:"Les membres du programme d'exemption de visa obtiennent l'<strong>ESTA</strong> au lieu d'un visa B1/B2 complet pour de courts séjours aux États-Unis. Mais l'éligibilité VWP ne suffit pas — plusieurs critères t'excluent même si ton passeport est sur la liste. Ne paie pas les 21 $ d'ESTA pour être refoulé : vérifie d'abord les règles.", ar:"يحصل أعضاء برنامج الإعفاء من التأشيرة على <strong>ESTA</strong> بدلاً من تأشيرة B1/B2 كاملة للزيارات القصيرة. لكن الأهلية وحدها لا تكفي — عدة موانع تُخرجك من البرنامج حتى لو كان جوازك في القائمة. لا تدفع 21 دولارًا لتُرفض على الحدود: تحقق من القواعد هنا أولاً." },

    // ── ETIAS body + FAQ (fragments; <strong>/<a> split into separate nodes) ──
    "From late 2026, every non-EU visitor entering the Schengen Area without a visa will need an": { tr:"2026 sonundan itibaren, Schengen Bölgesi'ne vizesiz giren her AB-dışı ziyaretçinin şuna ihtiyacı olacak:", es:"A partir de finales de 2026, todo visitante de fuera de la UE que entre en el espacio Schengen sin visado necesitará una", de:"Ab Ende 2026 benötigt jeder Nicht-EU-Besucher, der ohne Visum in den Schengen-Raum einreist, eine", fr:"Dès fin 2026, tout visiteur non-UE entrant dans l'espace Schengen sans visa devra disposer d'une", ar:"اعتبارًا من أواخر عام 2026، سيحتاج كل زائر من خارج الاتحاد الأوروبي يدخل منطقة شنغن دون تأشيرة إلى" },
    "Application fee": { tr:"Başvuru ücreti", es:"Tasa de solicitud", de:"Antragsgebühr", fr:"Frais de dossier", ar:"رسوم الطلب" },
    "Days per stay": { tr:"Kalış başına gün", es:"Días por estancia", de:"Tage pro Aufenthalt", fr:"Jours par séjour", ar:"عدد الأيام لكل إقامة" },
    "Approval time": { tr:"Onay süresi", es:"Tiempo de aprobación", de:"Genehmigungsdauer", fr:"Délai d'approbation", ar:"مدة الموافقة" },
    "Schengen states covered": { tr:"Kapsanan Schengen ülkeleri", es:"Estados Schengen cubiertos", de:"Erfasste Schengen-Staaten", fr:"États Schengen couverts", ar:"دول شنغن المشمولة" },
    "If your country's passport currently lets you enter Schengen visa-free for short stays (and you're": { tr:"Ülkenin pasaportu şu an kısa kalışlar için Schengen'e vizesiz giriş sağlıyorsa (ve sen", es:"Si el pasaporte de tu país te permite actualmente entrar en Schengen sin visado para estancias cortas (y eres", de:"Wenn der Pass deines Landes dir derzeit einen visumfreien Kurzaufenthalt im Schengen-Raum erlaubt (und du", fr:"Si le passeport de ton pays te permet actuellement d'entrer dans l'espace Schengen sans visa pour des séjours courts (et que tu", ar:"إذا كان جواز سفر بلدك يسمح لك حاليًا بدخول شنغن دون تأشيرة للإقامات القصيرة (وأنت" },
    "EU / EEA / Swiss citizens": { tr:"AB / AEA / İsviçre vatandaşları", es:"Ciudadanos de la UE / el EEE / Suiza", de:"EU-/EWR-/Schweizer Staatsangehörige", fr:"Citoyens de l'UE / EEE / Suisse", ar:"مواطنو الاتحاد الأوروبي / المنطقة الاقتصادية الأوروبية / سويسرا" },
    "— freedom of movement applies; nothing changes.": { tr:"— serbest dolaşım geçerli; hiçbir şey değişmez.", es:": se aplica la libre circulación; no cambia nada.", de:": Freizügigkeit gilt, nichts ändert sich.", fr:": la libre circulation s'applique, rien ne change.", ar:"، فتنطبق عليهم حرية التنقل؛ لا يتغير شيء." },
    "Travellers who already need a Schengen visa": { tr:"Halihazırda Schengen vizesine ihtiyaç duyan yolcular", es:"Los viajeros que ya necesitan un visado Schengen", de:"Reisende, die bereits ein Schengen-Visum benötigen", fr:"Les voyageurs qui ont déjà besoin d'un visa Schengen", ar:"المسافرون الذين يحتاجون بالفعل إلى تأشيرة شنغن" },
    "(Turkey, India, China, Russia, most African and Middle-Eastern passports) — keep applying for visas as usual.": { tr:"(Türkiye, Hindistan, Çin, Rusya, çoğu Afrika ve Orta Doğu pasaportu) — her zamanki gibi vize başvurusu yapmaya devam edin.", es:"(Turquía, India, China, Rusia, la mayoría de los pasaportes africanos y de Oriente Medio): sigue solicitando el visado como de costumbre.", de:"(Türkei, Indien, China, Russland, die meisten afrikanischen und nahöstlichen Pässe): beantragen weiterhin wie gewohnt ein Visum.", fr:"(Turquie, Inde, Chine, Russie, la plupart des passeports africains et du Moyen-Orient) : continue à demander un visa comme d'habitude.", ar:"(تركيا، الهند، الصين، روسيا، ومعظم جوازات السفر الأفريقية والشرق أوسطية)، يستمرون في التقدم بطلبات التأشيرة كالمعتاد." },
    "Long-stay (more than 90 days)": { tr:"Uzun kalış (90 günden fazla)", es:"Estancia larga (más de 90 días)", de:"Langzeitaufenthalt (mehr als 90 Tage)", fr:"Séjour de longue durée (plus de 90 jours)", ar:"الإقامة الطويلة (أكثر من 90 يومًا)" },
    "— that's a national visa or residence permit, not ETIAS.": { tr:"— bu ulusal bir vize veya oturma izni, ETIAS değil.", es:": eso es un visado nacional o un permiso de residencia, no ETIAS.", de:": Das ist ein nationales Visum oder eine Aufenthaltserlaubnis, nicht ETIAS.", fr:": il s'agit d'un visa national ou d'un titre de séjour, pas de l'ETIAS.", ar:"، فهذه تأشيرة وطنية أو تصريح إقامة، وليست ETIAS." },
    "Work / study / family reunification": { tr:"Çalışma / eğitim / aile birleşimi", es:"Trabajo / estudios / reagrupación familiar", de:"Arbeit / Studium / Familienzusammenführung", fr:"Travail / études / regroupement familial", ar:"العمل / الدراسة / لم شمل الأسرة" },
    "— full visa categories, not touched by ETIAS.": { tr:"— tam vize kategorileri, ETIAS bunlara dokunmaz.", es:": son categorías de visado completas; ETIAS no las afecta.", de:": vollständige Visakategorien, von ETIAS nicht berührt.", fr:": ce sont des catégories de visa à part entière, non concernées par l'ETIAS.", ar:"، وهي فئات تأشيرة كاملة لا يشملها ETIAS." },
    "— not part of Schengen; no ETIAS needed for Ireland.": { tr:"— Schengen'in parçası değil; İrlanda için ETIAS gerekmez.", es:": no forma parte de Schengen; Irlanda no necesita ETIAS.", de:": nicht Teil des Schengen-Raums, für Irland ist kein ETIAS nötig.", fr:": ne fait pas partie de l'espace Schengen, aucun ETIAS n'est nécessaire pour l'Irlande.", ar:"، فهي ليست جزءًا من شنغن؛ لا حاجة إلى ETIAS لأيرلندا." },
    "Open the official ETIAS portal:": { tr:"Resmi ETIAS portalını aç:", es:"Abre el portal oficial de ETIAS:", de:"Öffne das offizielle ETIAS-Portal:", fr:"Ouvre le portail officiel ETIAS :", ar:"افتح البوابة الرسمية لـ ETIAS:" },
    ". Beware of scam sites — only use the .europa.eu domain.": { tr:". Dolandırıcı sitelere dikkat — yalnızca .europa.eu alan adını kullan.", es:". Ten cuidado con los sitios fraudulentos: usa solo el dominio .europa.eu.", de:". Achte auf Betrugsseiten, nutze ausschließlich die Domain .europa.eu.", fr:". Méfie-toi des sites frauduleux, utilise uniquement le domaine .europa.eu.", ar:". احذر من المواقع الاحتيالية، واستخدم فقط نطاق .europa.eu." },
    "Fill in passport details, travel plans, criminal history questions.": { tr:"Pasaport bilgileri, seyahat planları ve sabıka geçmişi sorularını doldur.", es:"Rellena los datos del pasaporte, los planes de viaje y las preguntas sobre antecedentes penales.", de:"Fülle Passdaten, Reisepläne und Fragen zum Vorstrafenregister aus.", fr:"Renseigne les données du passeport, les plans de voyage et les questions relatives au casier judiciaire.", ar:"املأ بيانات جواز السفر وخطط السفر وأسئلة السجل الجنائي." },
    "Pay the €7 fee with a credit/debit card.": { tr:"7 €'luk ücreti kredi/banka kartıyla öde.", es:"Paga la tasa de 7 € con tarjeta de crédito o débito.", de:"Bezahle die Gebühr von 7 € mit Kredit- oder Debitkarte.", fr:"Paie les 7 € de frais par carte bancaire.", ar:"ادفع رسوم 7 يورو ببطاقة ائتمان أو خصم." },
    "Most applicants get approval within 96 hours — keep your ETIAS number handy at the airport.": { tr:"Çoğu başvuru sahibi 96 saat içinde onay alır — ETIAS numaranı havalimanında elinin altında tut.", es:"La mayoría de los solicitantes reciben la aprobación en 96 horas: ten a mano tu número de ETIAS en el aeropuerto.", de:"Die meisten Antragsteller erhalten die Genehmigung innerhalb von 96 Stunden, halte deine ETIAS-Nummer am Flughafen bereit.", fr:"La plupart des demandes sont approuvées en 96 heures, garde ton numéro ETIAS à portée de main à l'aéroport.", ar:"يحصل معظم المتقدمين على الموافقة خلال 96 ساعة، فاحتفظ برقم ETIAS الخاص بك في متناول يدك في المطار." },
    "Authorization is tied to your passport. Renew when the passport expires.": { tr:"Yetkilendirme pasaportuna bağlıdır. Pasaport süresi dolduğunda yenile.", es:"La autorización está vinculada a tu pasaporte. Renuévala cuando el pasaporte caduque.", de:"Die Genehmigung ist an deinen Pass gebunden. Erneuere sie, wenn der Pass abläuft.", fr:"L'autorisation est liée à ton passeport. Renouvelle-la à l'expiration du passeport.", ar:"التصريح مرتبط بجواز سفرك. جدده عند انتهاء صلاحية الجواز." },
    "Is ETIAS a visa?": { tr:"ETIAS bir vize mi?", es:"¿Es ETIAS un visado?", de:"Ist ETIAS ein Visum?", fr:"L'ETIAS est-il un visa ?", ar:"هل ETIAS تأشيرة؟" },
    "No. It's a pre-travel security authorization, similar to the US ESTA. You still go through normal border control on arrival.": { tr:"Hayır. ABD ESTA'sına benzer, seyahat öncesi bir güvenlik yetkilendirmesidir. Varışta yine normal sınır kontrolünden geçersin.", es:"No. Es una autorización de seguridad previa al viaje, similar a la ESTA de Estados Unidos. Al llegar, igualmente pasas por el control fronterizo normal.", de:"Nein. Es ist eine Sicherheitsgenehmigung vor der Reise, ähnlich dem US-amerikanischen ESTA. Bei der Ankunft durchläufst du weiterhin die normale Grenzkontrolle.", fr:"Non. C'est une autorisation de sécurité préalable au voyage, similaire à l'ESTA américain. Tu passes tout de même par le contrôle aux frontières habituel à l'arrivée.", ar:"لا. إنه تصريح أمني مسبق للسفر، مشابه لنظام ESTA الأمريكي. ستظل تمر بإجراءات مراقبة الحدود المعتادة عند الوصول." },
    "What if I'm refused?": { tr:"Reddedilirsem ne olur?", es:"¿Qué pasa si me la deniegan?", de:"Was passiert, wenn ich abgelehnt werde?", fr:"Que se passe-t-il en cas de refus ?", ar:"ماذا لو رُفض طلبي؟" },
    "You'll get a reason (criminal record, prior overstay, security concern). You can appeal, or apply for a regular Schengen short-stay visa instead.": { tr:"Bir gerekçe verilir (sabıka kaydı, önceki süre aşımı, güvenlik endişesi). İtiraz edebilir veya bunun yerine normal Schengen kısa-kalış vizesine başvurabilirsin.", es:"Recibirás un motivo (antecedentes penales, una estancia previa excedida, un problema de seguridad). Puedes recurrir la decisión o solicitar en su lugar un visado Schengen de estancia corta normal.", de:"Du erhältst eine Begründung (Vorstrafen, frühere Überschreitung der Aufenthaltsdauer, Sicherheitsbedenken). Du kannst Einspruch einlegen oder stattdessen ein reguläres Schengen-Kurzzeitvisum beantragen.", fr:"Tu recevras un motif (casier judiciaire, dépassement de séjour antérieur, préoccupation de sécurité). Tu peux faire appel, ou demander un visa Schengen de court séjour classique à la place.", ar:"ستحصل على سبب الرفض (سجل جنائي، تجاوز سابق لمدة الإقامة، مخاوف أمنية). يمكنك الاستئناف أو التقدم بدلًا من ذلك بطلب تأشيرة شنغن العادية للإقامة القصيرة." },
    "What if I have dual citizenship?": { tr:"Çifte vatandaşsam ne olur?", es:"¿Qué pasa si tengo doble nacionalidad?", de:"Was, wenn ich die doppelte Staatsangehörigkeit habe?", fr:"Que se passe-t-il si j'ai une double nationalité ?", ar:"ماذا لو كنت أحمل جنسية مزدوجة؟" },
    "Apply with the passport you'll travel on. If one of your passports is EU/EEA, use that — no ETIAS needed.": { tr:"Seyahat edeceğin pasaportla başvur. Pasaportlarından biri AB/AEA ise onu kullan — ETIAS gerekmez.", es:"Solicítala con el pasaporte con el que vayas a viajar. Si uno de tus pasaportes es de la UE o el EEE, usa ese: no necesitas ETIAS.", de:"Beantrage es mit dem Pass, mit dem du reist. Ist einer deiner Pässe ein EU-/EWR-Pass, nutze diesen: dann ist kein ETIAS nötig.", fr:"Fais ta demande avec le passeport avec lequel tu voyageras. Si l'un de tes passeports est de l'UE/EEE, utilise-le, aucun ETIAS n'est nécessaire.", ar:"قدّم الطلب بجواز السفر الذي ستسافر به. إذا كان أحد جوازيك تابعًا للاتحاد الأوروبي أو المنطقة الاقتصادية الأوروبية، فاستخدمه؛ لا حاجة إلى ETIAS." },
    "What happens at the border?": { tr:"Sınırda ne olur?", es:"¿Qué pasa en la frontera?", de:"Was passiert an der Grenze?", fr:"Que se passe-t-il à la frontière ?", ar:"ماذا يحدث عند الحدود؟" },
    "The carrier checks ETIAS before boarding. Schengen border guards check on arrival. Without it, you can be refused boarding.": { tr:"Taşıyıcı, biniş öncesi ETIAS'ı kontrol eder. Schengen sınır görevlileri varışta kontrol eder. ETIAS olmadan uçağa alınmayabilirsin.", es:"La aerolínea comprueba tu ETIAS antes del embarque. Los agentes de frontera de Schengen lo comprueban a la llegada. Sin ella, pueden denegarte el embarque.", de:"Die Fluggesellschaft prüft ETIAS vor dem Einsteigen. Die Schengen-Grenzbeamten prüfen es bei der Ankunft. Ohne gültiges ETIAS kann dir das Boarding verweigert werden.", fr:"Le transporteur vérifie l'ETIAS avant l'embarquement. Les garde-frontières Schengen le vérifient à l'arrivée. Sans lui, l'embarquement peut t'être refusé.", ar:"تتحقق شركة النقل من ETIAS قبل الصعود إلى الطائرة، ويتحقق حرس حدود شنغن عند الوصول. بدونه، قد تُمنع من الصعود." },
    "Spotted something wrong? Open an issue at": { tr:"Bir hata mı fark ettin? Şuradan bildir:", es:"¿Has detectado algo incorrecto? Abre una incidencia en", de:"Etwas Falsches entdeckt? Melde es unter", fr:"Tu as repéré une erreur ? Ouvre un ticket sur", ar:"هل لاحظت خطأ؟ افتح بلاغًا على" },

    // ── About page body ──
    "Free · Open data · Daily refresh": { tr:"Ücretsiz · Açık veri · Günlük güncelleme", es:"Gratis · Datos abiertos · Actualización diaria", de:"Kostenlos · Offene Daten · Tägliche Aktualisierung", fr:"Gratuit · Données ouvertes · Mise à jour quotidienne", ar:"مجاني · بيانات مفتوحة · تحديث يومي" },
    "If something on a country page looks off, get in touch — we'd like to hear about it and fix it quickly.": { tr:"Bir ülke sayfasında bir şey yanlış görünüyorsa bize ulaş — duymak ve hızlıca düzeltmek isteriz.", es:"Si algo en la página de un país no te parece correcto, ponte en contacto con nosotros: nos gustaría saberlo y corregirlo cuanto antes.", de:"Wenn dir auf einer Länderseite etwas falsch vorkommt, melde dich bei uns. Wir möchten davon erfahren und es schnell beheben.", fr:"Si quelque chose sur une page pays semble incorrect, contacte-nous, nous aimerions le savoir et le corriger rapidement.", ar:"إذا بدا أن هناك خطأ ما في صفحة أحد البلدان، تواصل معنا، فنحن نود معرفة الأمر وإصلاحه بسرعة." },
    "Not an official source.": { tr:"Resmi bir kaynak değildir.", es:"No es una fuente oficial.", de:"Keine offizielle Quelle.", fr:"Ce n'est pas une source officielle.", ar:"ليس مصدرًا رسميًا." },
    "Visa policies change frequently and unevenly. Always confirm with the destination's embassy or consulate before booking.": { tr:"Vize politikaları sık ve düzensiz değişir. Rezervasyondan önce her zaman hedef ülkenin elçilik veya konsolosluğuyla teyit et.", es:"Las políticas de visado cambian con frecuencia y de forma desigual. Confirma siempre con la embajada o el consulado del destino antes de reservar.", de:"Visabestimmungen ändern sich häufig und uneinheitlich. Bestätige sie vor der Buchung immer bei der Botschaft oder dem Konsulat des Ziellandes.", fr:"Les politiques de visa changent fréquemment et de manière inégale. Confirme toujours auprès de l'ambassade ou du consulat de la destination avant de réserver.", ar:"تتغير سياسات التأشيرات بشكل متكرر وغير منتظم. تأكد دائمًا من سفارة أو قنصلية الوجهة قبل الحجز." },
    "Not a visa application service.": { tr:"Vize başvuru hizmeti değildir.", es:"No es un servicio de tramitación de visados.", de:"Kein Visumantragsservice.", fr:"Ce n'est pas un service de demande de visa.", ar:"ليست خدمة لتقديم طلبات التأشيرة." },
    "We don't apply on your behalf. When a destination needs an eVisa or VR, we may link to a trusted partner (iVisa, VisaHQ) who handles applications — those are clearly marked \"Sponsored\".": { tr:"Senin adına başvuru yapmayız. Bir destinasyon e-vize veya vize gerektirdiğinde, başvuruları yürüten güvenilir bir ortağa (iVisa, VisaHQ) bağlantı verebiliriz — bunlar açıkça \"Sponsorlu\" olarak işaretlenir.", es:"No tramitamos solicitudes en tu nombre. Cuando un destino requiere un eVisado o VR, podemos enlazar con un socio de confianza (iVisa, VisaHQ) que gestiona las solicitudes: esos enlaces están claramente marcados como \"Patrocinado\".", de:"Wir stellen keine Anträge in deinem Namen. Benötigt ein Ziel ein E-Visum oder VR, verlinken wir gegebenenfalls auf einen vertrauenswürdigen Partner (iVisa, VisaHQ), der Anträge bearbeitet. Diese sind deutlich als „Gesponsert“ gekennzeichnet.", fr:"Nous ne faisons pas la demande à ta place. Lorsqu'une destination nécessite un eVisa ou un VR, nous pouvons renvoyer vers un partenaire de confiance (iVisa, VisaHQ) qui traite les demandes : ces liens sont clairement marqués « Sponsorisé ».", ar:"لا نتقدم بالطلبات نيابة عنك. عندما تحتاج الوجهة إلى تأشيرة إلكترونية أو تأشيرة عادية، قد نضع رابطًا لشريك موثوق (iVisa أو VisaHQ) يتولى الطلبات، وتُوسَم هذه الروابط بوضوح بعبارة \"إعلان\"." },
    "A dedicated contact address is being set up. Until then, please open an issue at": { tr:"Özel bir iletişim adresi oluşturuluyor. O zamana kadar lütfen şuradan bir konu aç:", es:"Estamos preparando una dirección de contacto específica. Mientras tanto, abre una incidencia en", de:"Eine eigene Kontaktadresse wird gerade eingerichtet. Bitte melde dich bis dahin unter", fr:"Une adresse de contact dédiée est en cours de mise en place. En attendant, ouvre un ticket sur", ar:"يجري حاليًا إعداد عنوان تواصل مخصص. إلى أن يتم ذلك، يُرجى فتح بلاغ على" },
    "for feedback, data corrections, or partnership inquiries.": { tr:"geri bildirim, veri düzeltmeleri veya iş birliği talepleri için.", es:"para comentarios, correcciones de datos o consultas de colaboración.", de:"für Feedback, Datenkorrekturen oder Partnerschaftsanfragen.", fr:"pour tes retours, corrections de données ou demandes de partenariat.", ar:"للملاحظات أو تصحيحات البيانات أو استفسارات الشراكة." },
    "Country flags are Unicode emoji. All other content on this site is provided as-is for reference; verify any visa requirement with the destination embassy before booking.": { tr:"Ülke bayrakları Unicode emojidir. Bu sitedeki diğer tüm içerik referans amaçlı olduğu gibi sunulur; rezervasyondan önce her vize gereksinimini hedef elçilikle doğrula.", es:"Las banderas de los países son emojis Unicode. El resto del contenido de este sitio se ofrece tal cual, como referencia; verifica cualquier requisito de visado con la embajada del destino antes de reservar.", de:"Länderflaggen sind Unicode-Emojis. Alle übrigen Inhalte dieser Seite dienen nur als Referenz. Bestätige jede Visumanforderung vor der Buchung bei der Botschaft des Ziellandes.", fr:"Les drapeaux des pays sont des emojis Unicode. Tout autre contenu de ce site est fourni tel quel, à titre de référence ; vérifie toute exigence de visa auprès de l'ambassade de la destination avant de réserver.", ar:"أعلام الدول هي رموز يونيكود تعبيرية. يُقدَّم كل المحتوى الآخر في هذا الموقع كما هو لأغراض مرجعية؛ تحقق من أي شرط تأشيرة لدى سفارة الوجهة قبل الحجز." },

    // ── Privacy page body ──
    "Last updated: 2026-05-21 · Operator: travelnow.info": { tr:"Son güncelleme: 2026-05-21 · İşletmeci: travelnow.info", es:"Última actualización: 2026-05-21 · Operador: travelnow.info", de:"Zuletzt aktualisiert: 2026-05-21 · Betreiber: travelnow.info", fr:"Dernière mise à jour : 2026-05-21 · Exploitant : travelnow.info", ar:"آخر تحديث: 2026-05-21 · المشغل: travelnow.info" },
    "for the same purpose; that value is never sent to us.": { tr:"aynı amaçla; bu değer bize asla gönderilmez.", es:"con el mismo fin; ese valor nunca se nos envía.", de:"für denselben Zweck, dieser Wert wird niemals an uns gesendet.", fr:"dans le même but ; cette valeur ne nous est jamais transmise.", ar:"لنفس الغرض؛ لا تُرسَل هذه القيمة إلينا أبدًا." },
    "Every alert email contains a one-click unsubscribe link that deletes your record immediately and (if applicable) cancels your Stripe subscription.": { tr:"Her uyarı e-postası, kaydını anında silen ve (varsa) Stripe aboneliğini iptal eden tek tıklamalık bir abonelikten-çık bağlantısı içerir.", es:"Cada correo de alerta incluye un enlace de baja de un clic que elimina tu registro de inmediato y (si corresponde) cancela tu suscripción de Stripe.", de:"Jede Warn-E-Mail enthält einen Ein-Klick-Abmeldelink, der deinen Eintrag sofort löscht und (falls zutreffend) dein Stripe-Abonnement kündigt.", fr:"Chaque e-mail d'alerte contient un lien de désabonnement en un clic qui supprime immédiatement ton enregistrement et (le cas échéant) annule ton abonnement Stripe.", ar:"تحتوي كل رسالة تنبيه على رابط إلغاء اشتراك بنقرة واحدة يحذف سجلك فورًا، ويلغي (عند الاقتضاء) اشتراكك في Stripe." },
    "We use the following third-party services, each with their own privacy policy:": { tr:"Her biri kendi gizlilik politikasına sahip şu üçüncü-taraf hizmetleri kullanıyoruz:", es:"Usamos los siguientes servicios de terceros, cada uno con su propia política de privacidad:", de:"Wir nutzen die folgenden Drittanbieter-Dienste, jeder mit eigener Datenschutzerklärung:", fr:"Nous utilisons les services tiers suivants, chacun avec sa propre politique de confidentialité :", ar:"نستخدم خدمات الأطراف الثالثة التالية، ولكل منها سياسة خصوصية خاصة بها:" },
    "serves the ads on this site. AdSense may use cookies and similar technologies to personalize the ads you see and to measure performance.": { tr:"bu sitedeki reklamları sunar. AdSense, gördüğün reklamları kişiselleştirmek ve performansı ölçmek için çerezler ve benzer teknolojiler kullanabilir.", es:"sirve los anuncios de este sitio. AdSense puede usar cookies y tecnologías similares para personalizar los anuncios que ves y medir su rendimiento.", de:"liefert die Anzeigen auf dieser Seite aus. AdSense kann Cookies und ähnliche Technologien nutzen, um die angezeigte Werbung zu personalisieren und die Leistung zu messen.", fr:"diffuse les publicités de ce site. AdSense peut utiliser des cookies et des technologies similaires pour personnaliser les publicités que tu vois et mesurer leurs performances.", ar:"يقدّم الإعلانات على هذا الموقع. قد يستخدم AdSense ملفات تعريف الارتباط وتقنيات مشابهة لتخصيص الإعلانات التي تراها ولقياس الأداء." },
    "hosts and delivers the site. Cloudflare logs basic request data (IP, user-agent, referrer) for ~24 hours for security and performance.": { tr:"siteyi barındırır ve sunar. Cloudflare, güvenlik ve performans için temel istek verilerini (IP, tarayıcı, yönlendiren) ~24 saat loglar.", es:"aloja y sirve el sitio. Cloudflare registra datos básicos de las solicitudes (IP, user-agent, referente) durante ~24 horas por motivos de seguridad y rendimiento.", de:"hostet und liefert die Seite aus. Cloudflare protokolliert grundlegende Anfragedaten (IP, User-Agent, Referrer) für rund 24 Stunden zu Sicherheits- und Leistungszwecken.", fr:"héberge et sert le site. Cloudflare enregistre des données de requête basiques (IP, user-agent, référent) pendant environ 24 heures, pour la sécurité et la performance.", ar:"يستضيف الموقع ويقدّمه. يسجّل Cloudflare بيانات الطلب الأساسية (عنوان IP، وكيل المستخدم، المُحيل) لمدة نحو 24 ساعة لأغراض الأمان والأداء." },
    "handles Pro-tier billing. We never see card data. Stripe sets its own cookies on the Checkout and customer portal pages.": { tr:"Pro abonelik faturalandırmasını yürütür. Kart verilerini asla görmeyiz. Stripe, Ödeme ve müşteri portalı sayfalarında kendi çerezlerini ayarlar.", es:"gestiona la facturación del plan Pro. Nunca vemos los datos de tu tarjeta. Stripe establece sus propias cookies en las páginas de pago y del portal de clientes.", de:"übernimmt die Abrechnung der Pro-Stufe. Wir sehen niemals Kartendaten. Stripe setzt eigene Cookies auf den Checkout- und Kundenportalseiten.", fr:"gère la facturation de l'offre Pro. Nous ne voyons jamais les données de carte. Stripe place ses propres cookies sur les pages de paiement et le portail client.", ar:"يتولى فوترة الفئة Pro. لا نرى بيانات البطاقة إطلاقًا. يضع Stripe ملفات تعريف الارتباط الخاصة به في صفحتي الدفع وبوابة العملاء." },
    "delivers all transactional emails (confirmation, digests, unsubscribe receipts). They receive your address and the rendered message body.": { tr:"tüm işlemsel e-postaları (onay, özet, abonelikten-çık makbuzları) gönderir. Adresini ve oluşturulan mesaj gövdesini alırlar.", es:"envía todos los correos transaccionales (confirmación, resúmenes, avisos de baja). Reciben tu dirección y el cuerpo del mensaje generado.", de:"versendet alle transaktionalen E-Mails (Bestätigungen, Zusammenfassungen, Abmeldebestätigungen). Der Dienst erhält deine Adresse und den fertig erstellten Nachrichtentext.", fr:"envoie tous les e-mails transactionnels (confirmation, résumés, accusés de désabonnement). Ils reçoivent ton adresse et le corps du message généré.", ar:"يرسل جميع الرسائل الإلكترونية التشغيلية (التأكيد، الملخصات، إيصالات إلغاء الاشتراك). يستلمون عنوانك ونص الرسالة المُعد." },
    "travelnow.info is not directed at children under 13. We do not knowingly collect data from anyone under 13.": { tr:"travelnow.info 13 yaş altı çocuklara yönelik değildir. 13 yaş altından bilerek veri toplamayız.", es:"travelnow.info no está dirigido a menores de 13 años. No recopilamos a sabiendas datos de nadie menor de 13 años.", de:"travelnow.info richtet sich nicht an Kinder unter 13 Jahren. Wir erheben wissentlich keine Daten von Personen unter 13 Jahren.", fr:"travelnow.info ne s'adresse pas aux enfants de moins de 13 ans. Nous ne collectons sciemment aucune donnée d'une personne de moins de 13 ans.", ar:"لا يستهدف travelnow.info الأطفال دون سن 13 عامًا. لا نجمع بيانات عن قصد من أي شخص دون سن 13 عامًا." },
    "Questions about this policy: please open an issue at": { tr:"Bu politikayla ilgili sorular: lütfen şuradan bir konu aç:", es:"Preguntas sobre esta política: abre una incidencia en", de:"Fragen zu dieser Richtlinie: Bitte melde dich unter", fr:"Des questions sur cette politique : ouvre un ticket sur", ar:"لأي أسئلة حول هذه السياسة: يُرجى فتح بلاغ على" },
    "(a dedicated email address is being set up).": { tr:"(özel bir e-posta adresi oluşturuluyor).", es:"(estamos preparando una dirección de correo específica).", de:"(eine eigene E-Mail-Adresse wird gerade eingerichtet).", fr:"(une adresse e-mail dédiée est en cours de mise en place).", ar:"(يجري حاليًا إعداد عنوان بريد إلكتروني مخصص)." },
    "If we change anything material we'll update the \"Last updated\" date at the top. Substantial changes will be flagged on the site for at least 14 days before taking effect.": { tr:"Önemli bir değişiklik yaparsak üstteki \"Son güncelleme\" tarihini güncelleriz. Esaslı değişiklikler, yürürlüğe girmeden en az 14 gün önce sitede belirtilir.", es:"Si cambiamos algo sustancial, actualizaremos la fecha de \"Última actualización\" de arriba. Los cambios importantes se anunciarán en el sitio al menos 14 días antes de entrar en vigor.", de:"Wenn wir etwas Wesentliches ändern, aktualisieren wir das Datum „Zuletzt aktualisiert“ oben. Wesentliche Änderungen werden mindestens 14 Tage vor Inkrafttreten auf der Seite angekündigt.", fr:"Si nous changeons quelque chose d'important, nous mettrons à jour la date « Dernière mise à jour » en haut de page. Les changements substantiels seront signalés sur le site pendant au moins 14 jours avant d'entrer en vigueur.", ar:"إذا غيّرنا أي أمر جوهري، سنحدّث تاريخ \"آخر تحديث\" أعلى الصفحة. سيُشار إلى التغييرات الجوهرية على الموقع لمدة 14 يومًا على الأقل قبل دخولها حيز التنفيذ." },

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
    "Visa-free": { tr:"Vizesiz", es:"Sin visa", de:"Visumfrei", fr:"Sans visa", ar:"بدون تأشيرة" },
    "Official source ↗": { tr:"Resmi kaynak ↗", es:"Fuente oficial ↗", de:"Offizielle Quelle ↗", fr:"Source officielle ↗", ar:"المصدر الرسمي ↗" },
    "travelnow.info link": { tr:"travelnow.info bağlantısı", es:"Enlace travelnow.info", de:"travelnow.info-Link", fr:"Lien travelnow.info", ar:"رابط أطلس" },
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

    // ── Audit-gap fills (comprehensive TR pass; other langs fall back to EN) ──
    // ETIAS JS-rendered verdict strings (translated live by the MutationObserver)
    "Visa, not ETIAS": { tr:"Vize, ETIAS değil", es:"Visado, no ETIAS", de:"Visum, nicht ETIAS", fr:"Visa, pas ETIAS", ar:"تأشيرة، وليست ETIAS" },
    "We don't have ETIAS data for this passport yet.": { tr:"Bu pasaport için henüz ETIAS verimiz yok.", es:"Todavía no tenemos datos de ETIAS para este pasaporte.", de:"Für diesen Pass liegen uns noch keine ETIAS-Daten vor.", fr:"Nous n'avons pas encore de données ETIAS pour ce passeport.", ar:"لا تتوفر لدينا بعد بيانات ETIAS لهذا الجواز." },
    "Your passport is on the list of nationalities that currently enter Schengen visa-free. From the launch date you'll need a €7 online authorization, valid 3 years.": { tr:"Pasaportun, şu an Schengen'e vizesiz giren milletler listesinde. Başlangıç tarihinden itibaren 3 yıl geçerli, 7 €'luk çevrimiçi bir yetkilendirmeye ihtiyacın olacak.", es:"Tu pasaporte está en la lista de nacionalidades que actualmente entran en Schengen sin visado. A partir de la fecha de lanzamiento, necesitarás una autorización en línea de 7 €, válida durante 3 años.", de:"Dein Pass steht auf der Liste der Staatsangehörigkeiten, die derzeit visumfrei in den Schengen-Raum einreisen. Ab dem Starttermin benötigst du eine 3 Jahre gültige Online-Genehmigung für 7 €.", fr:"Ton passeport figure sur la liste des nationalités qui entrent actuellement dans l'espace Schengen sans visa. À partir de la date de lancement, tu auras besoin d'une autorisation en ligne de 7 €, valable 3 ans.", ar:"جواز سفرك مدرج ضمن قائمة الجنسيات التي تدخل شنغن حاليًا دون تأشيرة. اعتبارًا من تاريخ الإطلاق، ستحتاج إلى تصريح إلكتروني بقيمة 7 يورو، صالح لمدة 3 سنوات." },
    "the main map": { tr:"ana harita", es:"el mapa principal", de:"die Hauptkarte", fr:"la carte principale", ar:"الخريطة الرئيسية" },
    "to see which Schengen state to apply through.": { tr:"ile hangi Schengen ülkesinden başvuracağını gör.", es:"para ver a través de qué estado Schengen solicitarla.", de:"um zu sehen, über welchen Schengen-Staat du den Antrag stellst.", fr:"pour voir auprès de quel État Schengen faire ta demande.", ar:"لمعرفة الدولة التي ينبغي تقديم الطلب من خلالها ضمن شنغن." },
    // Whole-paragraph (data-i18n-html) entries — sentences split by <em>/<strong>
    "etias.affected": { tr:"Ülkenin pasaportu şu an kısa kalışlar için Schengen'e vizesiz giriş sağlıyorsa (ve bir AB / AEA / İsviçre vatandaşı <em>değilsen</em>), ETIAS sana uygulanacak. Etkilenen 60'tan fazla milletin tam listesinde şunlar var: ABD, İngiltere, Kanada, Avustralya, Yeni Zelanda, Japonya, Güney Kore, Brezilya, Arjantin, Şili, Meksika, İsrail, Singapur, Malezya, Hong Kong, Makao, Tayvan, BAE, Arnavutluk, Sırbistan, Karadağ, Kuzey Makedonya, Bosna-Hersek ve çoğu Karayip ile Güney Pasifik ülkesi. Kendi pasaportun için yukarıdaki denetleyiciyi kullan.", es:"Si el pasaporte de tu país te permite entrar actualmente en el espacio Schengen sin visado para estancias cortas (y <em>no</em> eres ciudadano de la UE, el EEE o Suiza), ETIAS se te aplicará. La lista completa de las más de 60 nacionalidades afectadas incluye: Estados Unidos, Reino Unido, Canadá, Australia, Nueva Zelanda, Japón, Corea del Sur, Brasil, Argentina, Chile, México, Israel, Singapur, Malasia, Hong Kong, Macao, Taiwán, EAU, Albania, Serbia, Montenegro, Macedonia del Norte, Bosnia y Herzegovina, y la mayoría de los países del Caribe y del Pacífico Sur. Usa el comprobador de arriba para tu propio pasaporte.", de:"Wenn der Pass deines Landes dir derzeit einen visumfreien Kurzaufenthalt im Schengen-Raum erlaubt (und du <em>kein</em> EU-, EWR- oder Schweizer Staatsangehöriger bist), gilt ETIAS für dich. Die vollständige Liste der mehr als 60 betroffenen Staatsangehörigkeiten umfasst unter anderem: die USA, das Vereinigte Königreich, Kanada, Australien, Neuseeland, Japan, Südkorea, Brasilien, Argentinien, Chile, Mexiko, Israel, Singapur, Malaysia, Hongkong, Macau, Taiwan, die VAE, Albanien, Serbien, Montenegro, Nordmazedonien, Bosnien und Herzegowina sowie die meisten karibischen und südpazifischen Länder. Nutze oben den Prüfer für deinen eigenen Pass.", fr:"Si le passeport de ton pays te permet actuellement d'entrer dans l'espace Schengen sans visa pour des séjours courts (et que tu n'es <em>pas</em> citoyen de l'UE / EEE / Suisse), l'ETIAS s'appliquera à toi. La liste complète des plus de 60 nationalités concernées comprend : les États-Unis, le Royaume-Uni, le Canada, l'Australie, la Nouvelle-Zélande, le Japon, la Corée du Sud, le Brésil, l'Argentine, le Chili, le Mexique, Israël, Singapour, la Malaisie, Hong Kong, Macao, Taïwan, les Émirats arabes unis, l'Albanie, la Serbie, le Monténégro, la Macédoine du Nord, la Bosnie-Herzégovine et la plupart des pays des Caraïbes et du Pacifique Sud. Utilise le vérificateur ci-dessus pour ton propre passeport.", ar:"إذا كان جواز سفر بلدك يسمح لك حاليًا بدخول شنغن دون تأشيرة للإقامات القصيرة (وأنت <em>لست</em> بالفعل من مواطني الاتحاد الأوروبي أو المنطقة الاقتصادية الأوروبية أو سويسرا)، فسيُطبَّق عليك نظام ETIAS. تشمل القائمة الكاملة لأكثر من 60 جنسية متأثرة: الولايات المتحدة، المملكة المتحدة، كندا، أستراليا، نيوزيلندا، اليابان، كوريا الجنوبية، البرازيل، الأرجنتين، تشيلي، المكسيك، إسرائيل، سنغافورة، ماليزيا، هونغ كونغ، ماكاو، تايوان، الإمارات، ألبانيا، صربيا، الجبل الأسود، مقدونيا الشمالية، البوسنة والهرسك، ومعظم دول منطقتي الكاريبي والمحيط الهادئ الجنوبي. استخدم أداة التحقق أعلاه لمعرفة حالة جواز سفرك تحديدًا." },
    "schengen.uk_ie": { tr:"İngiltere ve İrlanda Schengen'de <strong>değildir</strong> — orada geçirdiğin süre 90/180 limitine sayılmaz. Bir AB oturma kartına (örn. İspanya Non-Lucrative, Portekiz D7) sahip olmak, orada yasal olarak yaşadığın ve o ülke için kısa-kalış kuralına tabi olmadığın anlamına gelir, ama <em>diğer</em> Schengen ülkelerindeki günler yine sayılır.", es:"El Reino Unido e Irlanda <strong>no</strong> forman parte de Schengen: el tiempo que pases allí no cuenta para el límite de 90/180. Tener una tarjeta de residencia de la UE (por ejemplo, la no lucrativa de España o la D7 de Portugal) significa que vives allí legalmente y no estás sujeto a la norma de estancia corta de ese país, pero los días en <em>otros</em> países Schengen sí cuentan.", de:"Das Vereinigte Königreich und Irland sind <strong>nicht</strong> Teil des Schengen-Raums, die dort verbrachte Zeit zählt nicht auf das 90/180-Limit. Eine EU-Aufenthaltskarte (z. B. Spanien Non-Lucrative, Portugal D7) zu besitzen bedeutet, dass du dort legal lebst und für dieses Land nicht der Kurzaufenthaltsregel unterliegst, aber Tage in <em>anderen</em> Schengen-Ländern zählen weiterhin.", fr:"Le Royaume-Uni et l'Irlande ne font <strong>pas</strong> partie de l'espace Schengen : le temps que tu y passes ne compte pas dans la limite des 90/180 jours. Détenir une carte de séjour de l'UE (par ex. le Non-Lucrative espagnol, le D7 portugais) signifie que tu y résides légalement et n'es pas soumis à la règle du court séjour pour ce pays, mais les jours passés dans les <em>autres</em> pays Schengen comptent toujours.", ar:"المملكة المتحدة وأيرلندا <strong>ليستا</strong> ضمن شنغن، فالوقت الذي تقضيه فيهما لا يُحتسب ضمن حد 90/180 يومًا. حيازة بطاقة إقامة في الاتحاد الأوروبي (مثل الإقامة غير الربحية في إسبانيا أو تأشيرة D7 في البرتغال) تعني أنك تقيم هناك بشكل قانوني ولست خاضعًا لقاعدة الإقامة القصيرة في تلك الدولة، لكن الأيام التي تقضيها في دول شنغن <em>الأخرى</em> لا تزال تُحتسب." },
    // ETIAS
    "(European Travel Information & Authorization System) approval. US, UK, Canadian, Australian, Japanese, Korean, Brazilian and 60+ other passport holders are affected. €7, valid 3 years, applied online in minutes.": { tr:"(Avrupa Seyahat Bilgi ve İzin Sistemi) onayı. ABD, İngiltere, Kanada, Avustralya, Japonya, Kore, Brezilya ve 60'tan fazla diğer pasaport sahibi etkileniyor. 7 €, 3 yıl geçerli, dakikalar içinde çevrimiçi başvurulur.", es:"(Sistema Europeo de Información y Autorización de Viajes), aprobación. Afecta a los titulares de pasaporte de Estados Unidos, Reino Unido, Canadá, Australia, Japón, Corea, Brasil y a más de 60 otras nacionalidades. 7 €, válida 3 años, se solicita en línea en minutos.", de:"(Europäisches Reiseinformations- und -genehmigungssystem)-Genehmigung. US-amerikanische, britische, kanadische, australische, japanische, südkoreanische, brasilianische und über 60 weitere Passinhaber sind betroffen. 7 €, 3 Jahre gültig, in wenigen Minuten online beantragt.", fr:"(European Travel Information & Authorization System, système européen d'information et d'autorisation de voyage). Les détenteurs de passeports américains, britanniques, canadiens, australiens, japonais, coréens, brésiliens et de plus de 60 autres nationalités sont concernés. 7 €, valable 3 ans, demande en ligne en quelques minutes.", ar:"(نظام معلومات وتصريح السفر الأوروبي) الموافقة عليه. يتأثر بذلك حاملو الجوازات الأمريكية والبريطانية والكندية والأسترالية واليابانية والكورية والبرازيلية وأكثر من 60 جنسية أخرى. رسومه 7 يورو، صالح لمدة 3 سنوات، ويُقدَّم الطلب عبر الإنترنت في دقائق." },
    "Launch date has been pushed back several times — most recently to": { tr:"Başlangıç tarihi birkaç kez ertelendi — en son şu tarihe:", es:"La fecha de lanzamiento se ha retrasado varias veces, la más reciente hasta", de:"Der Starttermin wurde mehrfach verschoben, zuletzt auf", fr:"La date de lancement a été repoussée plusieurs fois, la dernière fois à", ar:"تأجل تاريخ الإطلاق عدة مرات، وكان آخرها إلى" },
    "October 2026": { tr:"Ekim 2026", es:"octubre de 2026", de:"Oktober 2026", fr:"octobre 2026", ar:"أكتوبر 2026" },
    ", with a 6-month grace period. The numbers above will be updated when the EU posts a final confirmation. Bookmark this page or": { tr:", 6 aylık geçiş süresiyle. Yukarıdaki rakamlar AB nihai onayı yayınladığında güncellenecek. Bu sayfayı yer imlerine ekle veya", es:", con un período de gracia de 6 meses. Las cifras de arriba se actualizarán cuando la UE publique la confirmación definitiva. Guarda esta página en tus favoritos o", de:", mit einer sechsmonatigen Übergangsfrist. Die obigen Angaben werden aktualisiert, sobald die EU eine endgültige Bestätigung veröffentlicht. Speichere diese Seite als Lesezeichen oder", fr:", avec une période de grâce de 6 mois. Les chiffres ci-dessus seront mis à jour lorsque l'UE publiera une confirmation définitive. Ajoute cette page à tes favoris ou", ar:"، مع فترة سماح مدتها 6 أشهر. ستُحدَّث الأرقام أعلاه عندما ينشر الاتحاد الأوروبي التأكيد النهائي. أضف هذه الصفحة إلى المفضلة أو" },
    "subscribe to alerts": { tr:"uyarılara abone ol", es:"suscríbete a las alertas", de:"abonniere Benachrichtigungen", fr:"abonne-toi aux alertes", ar:"اشترك في التنبيهات" },
    "for updates.": { tr:"güncellemeler için.", es:"para recibir novedades.", de:"für Updates.", fr:"pour les mises à jour.", ar:"لتصلك التحديثات." },
    "Ireland": { tr:"İrlanda", es:"Irlanda", de:"Irland", fr:"Irlande", ar:"أيرلندا" },
    "EU Commission": { tr:"AB Komisyonu", es:"Comisión Europea", de:"Europäische Kommission", fr:"Commission européenne", ar:"المفوضية الأوروبية" },
    // passport-validity
    "Why airlines care.": { tr:"Havayolları neden önemser.", es:"Por qué a las aerolíneas les importa.", de:"Warum Fluggesellschaften das interessiert.", fr:"Pourquoi les compagnies aériennes s'en soucient.", ar:"لماذا تهتم شركات الطيران بذلك." },
    "If you arrive at the destination with a passport that violates the rule, the airline has to fly you back at their cost — plus a fine in many jurisdictions. So they check at check-in and refuse boarding.": { tr:"Hedefe kuralı ihlal eden bir pasaportla varırsan, havayolu seni kendi masrafıyla geri uçurmak zorunda kalır — birçok ülkede ayrıca ceza öder. Bu yüzden check-in'de kontrol edip uçağa almazlar.", es:"Si llegas al destino con un pasaporte que incumple la norma, la aerolínea tiene que llevarte de vuelta a su costa, además de una multa en muchas jurisdicciones. Por eso lo comprueban en el check-in y pueden denegarte el embarque.", de:"Kommst du am Ziel mit einem Pass an, der gegen die Regel verstößt, muss dich die Fluggesellschaft auf eigene Kosten zurückfliegen, in vielen Ländern kommt zusätzlich eine Geldstrafe hinzu. Deshalb wird beim Check-in kontrolliert und das Boarding gegebenenfalls verweigert.", fr:"Si tu arrives à destination avec un passeport qui ne respecte pas la règle, la compagnie aérienne doit te rapatrier à ses frais, en plus d'une amende dans de nombreux pays. C'est pourquoi elle vérifie à l'enregistrement et peut refuser l'embarquement.", ar:"إذا وصلت إلى الوجهة بجواز سفر يخالف القاعدة، تضطر شركة الطيران إلى إعادتك على نفقتها، إضافة إلى غرامة في العديد من الدول. لذلك تتحقق من ذلك عند تسجيل الوصول وترفض صعودك إلى الطائرة." },
    "Renewal lead times.": { tr:"Yenileme süreleri.", es:"Plazos de renovación.", de:"Bearbeitungszeiten für die Erneuerung.", fr:"Délais de renouvellement.", ar:"المدد اللازمة للتجديد." },
    "US passport renewal: routine ~6 weeks, expedited ~3. UK: ~3 weeks. Türkiye: same day at PTT. India: 4-6 weeks. Plan accordingly — don't book the flight first.": { tr:"ABD pasaport yenileme: normal ~6 hafta, hızlandırılmış ~3. İngiltere: ~3 hafta. Türkiye: PTT'de aynı gün. Hindistan: 4-6 hafta. Buna göre planla — önce uçağı alma.", es:"Renovación del pasaporte de EE. UU.: normal ~6 semanas, urgente ~3. Reino Unido: ~3 semanas. Türkiye: el mismo día en la PTT. India: 4 a 6 semanas. Planifica en consecuencia: no reserves antes el vuelo.", de:"US-Passverlängerung: regulär etwa 6 Wochen, beschleunigt etwa 3. Vereinigtes Königreich: etwa 3 Wochen. Türkiye: am selben Tag bei der PTT. Indien: 4 bis 6 Wochen. Plane entsprechend, buche den Flug nicht zuerst.", fr:"Renouvellement du passeport américain : ~6 semaines en normal, ~3 en express. Royaume-Uni : ~3 semaines. Türkiye : le jour même au guichet PTT. Inde : 4-6 semaines. Planifie en conséquence, ne réserve pas le vol en premier.", ar:"تجديد الجواز الأمريكي: العادي نحو 6 أسابيع، والمستعجل نحو 3 أسابيع. المملكة المتحدة: نحو 3 أسابيع. تركيا: في اليوم نفسه لدى PTT. الهند: 4-6 أسابيع. خطط وفقًا لذلك، ولا تحجز الرحلة أولًا." },
    "Special cases.": { tr:"Özel durumlar.", es:"Casos especiales.", de:"Sonderfälle.", fr:"Cas particuliers.", ar:"حالات خاصة." },
    "Diplomatic, service, refugee travel documents have different rules per destination — always check with the embassy. Children's passports often have shorter validity (5 vs 10 years).": { tr:"Diplomatik, hizmet ve mülteci seyahat belgelerinin her ülkeye göre farklı kuralları vardır — her zaman elçilikle teyit et. Çocuk pasaportlarının geçerliliği genelde daha kısadır (10 yerine 5 yıl).", es:"Los documentos de viaje diplomáticos, de servicio o de refugiado tienen normas distintas según el destino: consulta siempre con la embajada. Los pasaportes infantiles suelen tener una validez más corta (5 años en vez de 10).", de:"Diplomaten-, Dienst- und Reiseausweise für Flüchtlinge unterliegen je nach Ziel unterschiedlichen Regeln, prüfe das immer bei der Botschaft. Kinderpässe haben oft eine kürzere Gültigkeit (5 statt 10 Jahre).", fr:"Les documents de voyage diplomatiques, de service ou pour réfugiés ont des règles différentes selon la destination : vérifie toujours auprès de l'ambassade. Les passeports d'enfants ont souvent une validité plus courte (5 ans contre 10).", ar:"وثائق السفر الدبلوماسية والخدمية ووثائق اللاجئين لها قواعد مختلفة بحسب الوجهة، فتحقق دائمًا لدى السفارة. غالبًا ما تكون مدة صلاحية جوازات الأطفال أقصر (5 سنوات بدلًا من 10)." },
    "Spot a wrong rule? Open an issue at": { tr:"Yanlış bir kural mı gördün? Şuradan bir konu aç:", es:"¿Has visto una norma incorrecta? Abre una incidencia en", de:"Eine falsche Regel entdeckt? Melde es unter", fr:"Tu as repéré une règle erronée ? Ouvre un ticket sur", ar:"هل لاحظت قاعدة خاطئة؟ افتح بلاغًا على" },
    "6 months past stay": { tr:"kalıştan 6 ay sonrasına kadar", es:"6 meses después de la estancia", de:"6 Monate über den Aufenthalt hinaus", fr:"6 mois après le séjour", ar:"6 أشهر بعد انتهاء الإقامة" },
    "— most of Asia, the Middle East, Africa, Latin America, plus several others (China, India, Indonesia, Türkiye, UAE, Saudi Arabia, Brazil, South Africa…).": { tr:"— Asya'nın çoğu, Orta Doğu, Afrika, Latin Amerika ve birçok başka ülke (Çin, Hindistan, Endonezya, Türkiye, BAE, Suudi Arabistan, Brezilya, Güney Afrika…).", es:": la mayor parte de Asia, Oriente Medio, África, América Latina y varios otros países (China, India, Indonesia, Türkiye, EAU, Arabia Saudí, Brasil, Sudáfrica...).", de:": der Großteil Asiens, der Nahe Osten, Afrika, Lateinamerika sowie mehrere weitere Länder (China, Indien, Indonesien, Türkiye, VAE, Saudi-Arabien, Brasilien, Südafrika…).", fr:": la majeure partie de l'Asie, le Moyen-Orient, l'Afrique, l'Amérique latine, ainsi que plusieurs autres pays (Chine, Inde, Indonésie, Türkiye, Émirats arabes unis, Arabie saoudite, Brésil, Afrique du Sud…).", ar:"، وتشمل معظم آسيا والشرق الأوسط وأفريقيا وأمريكا اللاتينية، إضافة إلى عدة دول أخرى (الصين، الهند، إندونيسيا، تركيا، الإمارات، السعودية، البرازيل، جنوب أفريقيا...)." },
    "3 months past stay": { tr:"kalıştan 3 ay sonrasına kadar", es:"3 meses después de la estancia", de:"3 Monate über den Aufenthalt hinaus", fr:"3 mois après le séjour", ar:"3 أشهر بعد انتهاء الإقامة" },
    "— the Schengen Area (all 29 states), plus most Balkan and North African states (Albania, Bosnia, Morocco, Tunisia, Algeria, South Korea).": { tr:"— Schengen Bölgesi (29 ülkenin tamamı) ve çoğu Balkan ile Kuzey Afrika ülkesi (Arnavutluk, Bosna, Fas, Tunus, Cezayir, Güney Kore).", es:": el espacio Schengen (los 29 estados), además de la mayoría de los estados balcánicos y del norte de África (Albania, Bosnia, Marruecos, Túnez, Argelia, Corea del Sur).", de:": der Schengen-Raum (alle 29 Staaten) sowie die meisten Balkan- und nordafrikanischen Staaten (Albanien, Bosnien, Marokko, Tunesien, Algerien, Südkorea).", fr:": l'espace Schengen (les 29 États), ainsi que la plupart des États des Balkans et d'Afrique du Nord (Albanie, Bosnie, Maroc, Tunisie, Algérie, Corée du Sud).", ar:"، وتشمل منطقة شنغن (جميع الدول الـ29)، إضافة إلى معظم دول البلقان وشمال أفريقيا (ألبانيا، البوسنة، المغرب، تونس، الجزائر، كوريا الجنوبية)." },
    "Valid for the duration of stay only": { tr:"Yalnızca kalış süresi boyunca geçerli", es:"Válido solo durante la estancia", de:"Nur für die Dauer des Aufenthalts gültig", fr:"Valable uniquement pour la durée du séjour", ar:"صالح لمدة الإقامة فقط" },
    "— the United States, Canada, Mexico, Ireland and the United Kingdom.": { tr:"— ABD, Kanada, Meksika, İrlanda ve İngiltere.", es:": Estados Unidos, Canadá, México, Irlanda y el Reino Unido.", de:": die Vereinigten Staaten, Kanada, Mexiko, Irland und das Vereinigte Königreich.", fr:": les États-Unis, le Canada, le Mexique, l'Irlande et le Royaume-Uni.", ar:"، وتشمل الولايات المتحدة وكندا والمكسيك وأيرلندا والمملكة المتحدة." },
    // visa-shortcuts
    "How to use a shortcut.": { tr:"Kısayol nasıl kullanılır.", es:"Cómo usar un atajo.", de:"So nutzt du eine Abkürzung.", fr:"Comment utiliser un raccourci.", ar:"كيفية استخدام أحد المسارات المختصرة." },
    "Carry the qualifying visa physically (or a printed copy) along with the passport that contains it. At eVisa application or border control you'll be asked to upload / show it. Most online portals walk you through proof submission.": { tr:"Uygun vizeyi (veya çıktısını) onu içeren pasaportla birlikte yanında taşı. E-vize başvurusunda veya sınır kontrolünde yüklemen/göstermen istenir. Çoğu çevrimiçi portal kanıt sunumunda sana yol gösterir.", es:"Lleva el visado que da acceso al atajo físicamente (o una copia impresa) junto con el pasaporte que lo contiene. En la solicitud del eVisado o en el control fronterizo te pedirán que lo subas o lo muestres. La mayoría de los portales en línea te guían en el envío de la prueba.", de:"Führe das berechtigende Visum physisch (oder als Ausdruck) zusammen mit dem Pass mit, in dem es enthalten ist. Beim E-Visum-Antrag oder an der Grenzkontrolle wirst du gebeten, es hochzuladen oder vorzuzeigen. Die meisten Online-Portale führen dich durch den Nachweis.", fr:"Emporte le visa éligible physiquement (ou une copie imprimée) avec le passeport qui le contient. Lors de la demande d'eVisa ou au contrôle frontalier, il te sera demandé de le téléverser ou de le présenter. La plupart des portails en ligne te guident dans la soumission des justificatifs.", ar:"احمل التأشيرة المؤهِّلة فعليًا (أو نسخة مطبوعة منها) مع جواز السفر الذي تحملها. عند التقدم للتأشيرة الإلكترونية أو عند مراقبة الحدود، سيُطلب منك تحميلها أو إظهارها. توجهك معظم البوابات الإلكترونية خلال خطوات تقديم الإثبات." },
    "The qualifying visa must be valid": { tr:"Uygun vize geçerli olmalı", es:"El visado que da acceso al atajo debe ser válido", de:"Das berechtigende Visum muss gültig sein", fr:"Le visa éligible doit être valable", ar:"يجب أن تكون التأشيرة المؤهِّلة سارية" },
    "on the day of entry. A US visa that expires next week won't unlock a Türkiye eVisa for a trip in 3 months.": { tr:"giriş günü itibarıyla. Önümüzdeki hafta dolacak bir ABD vizesi, 3 ay sonraki bir seyahat için Türkiye e-vizesini açmaz.", es:"el día de entrada. Un visado de EE. UU. que caduque la semana que viene no te dará acceso a un eVisado de Türkiye para un viaje dentro de 3 meses.", de:"am Tag der Einreise. Ein US-Visum, das nächste Woche abläuft, schaltet kein Türkiye-E-Visum für eine Reise in 3 Monaten frei.", fr:"le jour de l'entrée. Un visa américain qui expire la semaine prochaine ne débloquera pas un eVisa Türkiye pour un voyage dans 3 mois.", ar:"في يوم الدخول. فتأشيرة أمريكية تنتهي صلاحيتها الأسبوع المقبل لن تتيح لك الحصول على تأشيرة تركيا الإلكترونية لرحلة بعد 3 أشهر." },
    "Diplomatic / service / special passports": { tr:"Diplomatik / hizmet / hususi pasaportlar", es:"Pasaportes diplomáticos / de servicio / especiales", de:"Diplomaten-/Dienst-/Sonderpässe", fr:"Passeports diplomatiques / de service / spéciaux", ar:"الجوازات الدبلوماسية / الخدمية / الخاصة" },
    "have their own set of shortcuts — usually more generous. Holders should check the destination's MFA page for bilateral agreements specific to those passport types.": { tr:"kendi kısayol setlerine sahiptir — genelde daha cömert. Sahipleri, bu pasaport türlerine özel ikili anlaşmalar için hedef ülkenin Dışişleri sayfasını kontrol etmeli.", es:"tienen su propio conjunto de atajos, por lo general más generosos. Sus titulares deben consultar la página del Ministerio de Asuntos Exteriores del destino para ver los acuerdos bilaterales específicos de esos tipos de pasaporte.", de:"verfügen über eigene Abkürzungen, meist großzügiger. Inhaber sollten auf der Seite des Außenministeriums des Ziellandes nach bilateralen Abkommen für diese Passarten suchen.", fr:"disposent de leur propre jeu de raccourcis, généralement plus généreux. Les détenteurs doivent consulter la page du ministère des Affaires étrangères de la destination pour les accords bilatéraux propres à ces types de passeport.", ar:"لها مجموعتها الخاصة من المسارات المختصرة، وعادة ما تكون أكثر تيسيرًا. ينبغي على حامليها مراجعة صفحة وزارة خارجية الوجهة للاطلاع على الاتفاقيات الثنائية الخاصة بهذه الأنواع من الجوازات." },
    "Have a shortcut we should add? Open an issue at": { tr:"Eklememiz gereken bir kısayol mu var? Şuradan bir konu aç:", es:"¿Conoces un atajo que deberíamos añadir? Abre una incidencia en", de:"Kennst du eine Abkürzung, die wir ergänzen sollten? Melde es unter", fr:"Tu connais un raccourci que nous devrions ajouter ? Ouvre un ticket sur", ar:"هل لديك مسار مختصر ينبغي أن نضيفه؟ افتح بلاغًا على" },
    // digital-nomad
    "How to read the table.": { tr:"Tablo nasıl okunur.", es:"Cómo leer la tabla.", de:"So liest du die Tabelle.", fr:"Comment lire le tableau.", ar:"كيفية قراءة الجدول." },
    "Tax-break summaries are deliberately short — every programme has fine print, double-tax treaties, and residency-day thresholds that change the real outcome. Always run the numbers with a local accountant before deciding.": { tr:"Vergi avantajı özetleri bilinçli olarak kısadır — her programın ince yazısı, çifte vergilendirme anlaşmaları ve gerçek sonucu değiştiren ikamet-gün eşikleri vardır. Karar vermeden önce her zaman yerel bir muhasebeciyle hesapla.", es:"Los resúmenes de ventajas fiscales son deliberadamente breves: cada programa tiene letra pequeña, tratados de doble imposición y umbrales de días de residencia que cambian el resultado real. Haz siempre los cálculos con un asesor fiscal local antes de decidir.", de:"Die Zusammenfassungen der Steuervergünstigungen sind bewusst kurz gehalten: Jedes Programm hat Kleingedrucktes, Doppelbesteuerungsabkommen und Schwellenwerte für Aufenthaltstage, die das tatsächliche Ergebnis verändern. Rechne die Zahlen vor einer Entscheidung immer mit einem örtlichen Steuerberater durch.", fr:"Les résumés des avantages fiscaux sont volontairement courts : chaque programme comporte des clauses en petits caractères, des conventions de double imposition et des seuils de jours de résidence qui changent le résultat réel. Fais toujours tes calculs avec un comptable local avant de décider.", ar:"ملخصات الإعفاءات الضريبية مقتضبة عن قصد، فلكل برنامج شروط دقيقة واتفاقيات ازدواج ضريبي وحدود لأيام الإقامة تغيّر النتيجة الفعلية. احسب الأرقام دائمًا مع محاسب محلي قبل اتخاذ القرار." },
    "All regions": { tr:"Tüm bölgeler", es:"Todas las regiones", de:"Alle Regionen", fr:"Toutes les régions", ar:"جميع المناطق" },
    "Europe": { tr:"Avrupa", es:"Europa", de:"Europa", fr:"Europe", ar:"أوروبا" },
    "Asia / Oceania": { tr:"Asya / Okyanusya", es:"Asia / Oceanía", de:"Asien / Ozeanien", fr:"Asie / Océanie", ar:"آسيا / أوقيانوسيا" },
    "Americas": { tr:"Amerika kıtaları", es:"América", de:"Amerika", fr:"Amériques", ar:"الأمريكتان" },
    "Middle East / Africa": { tr:"Orta Doğu / Afrika", es:"Oriente Medio / África", de:"Naher Osten / Afrika", fr:"Moyen-Orient / Afrique", ar:"الشرق الأوسط / أفريقيا" },
    // CBI
    "CBI vs RBI.": { tr:"CBI ile RBI farkı.", es:"CBI frente a RBI.", de:"CBI im Vergleich zu RBI.", fr:"CBI et RBI : la différence.", ar:"CBI مقابل RBI." },
    "CBI grants a second": { tr:"CBI ikinci bir", es:"El CBI concede un segundo", de:"CBI verleiht einen zweiten", fr:"Le CBI accorde un second", ar:"يمنح CBI" },
    "passport": { tr:"pasaport", es:"pasaporte", de:"Pass", fr:"passeport", ar:"جواز سفر ثانٍ" },
    "directly, usually after a 4-12 month process. RBI (Golden Visa) grants a renewable": { tr:"doğrudan verir, genelde 4-12 aylık bir süreçten sonra. RBI (Altın Vize) yenilenebilir bir", es:"directamente, normalmente tras un proceso de 4 a 12 meses. El RBI (visado dorado) concede un", de:"direkt, meist nach einem 4-12-monatigen Verfahren. RBI (Goldenes Visum) verleiht eine verlängerbare", fr:"directement, généralement après un processus de 4 à 12 mois. Le RBI (Golden Visa) accorde, à titre renouvelable, un", ar:"مباشرة، عادة بعد عملية تستغرق من 4 إلى 12 شهرًا. أما RBI (التأشيرة الذهبية) فيمنح" },
    "residence permit": { tr:"oturma izni", es:"permiso de residencia", de:"Aufenthaltserlaubnis", fr:"titre de séjour", ar:"تصريح إقامة قابل للتجديد" },
    "; you can apply for citizenship later through the country's regular naturalisation timeline (typically 5-10 years of physical residency, depending on the jurisdiction).": { tr:" verir; vatandaşlık için daha sonra ülkenin normal vatandaşlığa geçiş süreciyle başvurabilirsin (genelde ülkeye göre 5-10 yıl fiili ikamet).", es:" renovable; puedes solicitar la nacionalidad más adelante mediante el proceso normal de naturalización del país (por lo general de 5 a 10 años de residencia física, según la jurisdicción).", de:"; die Staatsbürgerschaft kannst du später über den regulären Einbürgerungsweg des Landes beantragen (je nach Rechtsprechung meist 5-10 Jahre tatsächlicher Aufenthalt).", fr:" ; tu peux demander la nationalité plus tard via le parcours de naturalisation habituel du pays (généralement 5 à 10 ans de résidence effective, selon la juridiction).", ar:"؛ ويمكنك التقدم بطلب الحصول على الجنسية لاحقًا عبر المسار المعتاد للتجنس في ذلك البلد (يتراوح عادة بين 5 و10 سنوات من الإقامة الفعلية، حسب الدولة)." },
    "Minimum investment": { tr:"Asgari yatırım", es:"Inversión mínima", de:"Mindestinvestition", fr:"Investissement minimum", ar:"الحد الأدنى للاستثمار" },
    "Visa-free score": { tr:"Vizesiz skoru", es:"Puntuación sin visado", de:"Visumfrei-Score", fr:"Score d'accès sans visa", ar:"درجة الدخول دون تأشيرة" },
    "Tax planning.": { tr:"Vergi planlaması.", es:"Planificación fiscal.", de:"Steuerplanung.", fr:"Planification fiscale.", ar:"التخطيط الضريبي." },
    "Spotted an outdated figure, a closed programme we forgot to mark, or a new launch we missed? Open an issue at": { tr:"Eski bir rakam, kapanmış ama işaretlemediğimiz bir program ya da kaçırdığımız yeni bir başlangıç mı gördün? Şuradan bir konu aç:", es:"¿Has visto una cifra desactualizada, un programa cerrado que olvidamos marcar o un lanzamiento nuevo que se nos pasó? Abre una incidencia en", de:"Eine veraltete Zahl entdeckt, ein geschlossenes Programm, das wir zu markieren vergessen haben, oder einen neuen Start, den wir verpasst haben? Melde es unter", fr:"Tu as repéré un chiffre obsolète, un programme fermé que nous avons oublié de signaler, ou un nouveau lancement que nous avons manqué ? Ouvre un ticket sur", ar:"هل لاحظت رقمًا قديمًا، أو برنامجًا أُغلق ونسينا وضع علامة عليه، أو إطلاقًا جديدًا فاتنا؟ افتح بلاغًا على" },
    "All": { tr:"Tümü", es:"Todos", de:"Alle", fr:"Tous", ar:"الكل" },
    "CBI (passport)": { tr:"CBI (pasaport)", es:"CBI (pasaporte)", de:"CBI (Pass)", fr:"CBI (passeport)", ar:"CBI (جواز سفر)" },
    "RBI (residence)": { tr:"RBI (oturum)", es:"RBI (residencia)", de:"RBI (Aufenthalt)", fr:"RBI (résidence)", ar:"RBI (إقامة)" },
    // schengen-calculator
    "Free, instant, no signup. Enter your past trips into the Schengen Area — see exactly how many of your 90 days you've already used in the rolling 180-day window, and plan future visits without breaking the rule.": { tr:"Ücretsiz, anında, üyeliksiz. Schengen Bölgesi'ne geçmiş seyahatlerini gir — kayan 180 günlük pencerede 90 gününün ne kadarını kullandığını tam olarak gör ve kuralı çiğnemeden ileriki ziyaretleri planla.", es:"Gratis, al instante, sin registro. Introduce tus viajes anteriores al espacio Schengen: verás exactamente cuántos de tus 90 días ya has usado en la ventana móvil de 180 días, y podrás planear futuras visitas sin romper la regla.", de:"Kostenlos, sofort, ohne Anmeldung. Trage deine bisherigen Reisen in den Schengen-Raum ein und sieh genau, wie viele deiner 90 Tage du im gleitenden 180-Tage-Fenster bereits verbraucht hast, und plane künftige Aufenthalte, ohne die Regel zu brechen.", fr:"Gratuit, instantané, sans inscription. Entre tes voyages passés dans l'espace Schengen : vois exactement combien de tes 90 jours tu as déjà utilisés sur la fenêtre glissante de 180 jours, et planifie tes prochains voyages sans enfreindre la règle.", ar:"مجانية وفورية، بلا تسجيل. أدخل رحلاتك السابقة إلى منطقة شنغن لترى بالضبط كم يومًا من أيامك الـ90 استخدمته ضمن النافذة المتجددة البالغة 180 يومًا، وخطّط لزياراتك القادمة دون مخالفة القاعدة." },
    "Include both the day you crossed into Schengen and the day you crossed out — both count.": { tr:"Hem Schengen'e girdiğin günü hem çıktığın günü dahil et — ikisi de sayılır.", es:"Incluye tanto el día en que entraste a Schengen como el día en que saliste: ambos cuentan.", de:"Zähle sowohl den Tag der Einreise in den Schengen-Raum als auch den Tag der Ausreise mit, beide zählen.", fr:"Compte à la fois le jour où tu es entré dans l'espace Schengen et celui où tu en es sorti : les deux comptent.", ar:"احسب كلا اليومين: يوم الدخول إلى شنغن ويوم الخروج منها، كلاهما يُحتسب." },
    "Detailed document checklists for the most common pairs:": { tr:"En yaygın güzergahlar için ayrıntılı belge kontrol listeleri:", es:"Listas detalladas de documentos para las combinaciones más comunes:", de:"Ausführliche Dokumenten-Checklisten für die häufigsten Kombinationen:", fr:"Listes de documents détaillées pour les trajets les plus courants :", ar:"قوائم تحقّق مفصّلة بالمستندات لأكثر أزواج الجوازات/الوجهات شيوعًا:" },
    "Under": { tr:"Şu mevzuat uyarınca:", es:"En virtud del", de:"Gemäß", fr:"En vertu du", ar:"بموجب" },
    "Regulation (EU) 2018/1806": { tr:"Tüzük (AB) 2018/1806", es:"Reglamento (UE) 2018/1806", de:"Verordnung (EU) 2018/1806", fr:"Règlement (UE) 2018/1806", ar:"اللائحة (الاتحاد الأوروبي) 2018/1806" },
    ", short-stay travellers in the Schengen Area may stay a maximum of": { tr:", Schengen Bölgesi'ndeki kısa-kalış yolcuları en fazla şu kadar kalabilir:", es:", los viajeros de estancia corta en el espacio Schengen pueden permanecer un máximo de", de:" beträgt der maximale Aufenthalt für Kurzzeitreisende im Schengen-Raum", fr:", les voyageurs en court séjour dans l'espace Schengen peuvent rester au maximum", ar:"، يجوز لمسافري الإقامة القصيرة في منطقة شنغن البقاء لمدة أقصاها" },
    "90 days within any rolling 180-day window": { tr:"herhangi bir kayan 180 günlük pencere içinde 90 gün", de:"90 Tage innerhalb eines beliebigen gleitenden 180-Tage-Fensters", es:"90 días dentro de cualquier período móvil de 180 días", fr:"90 jours sur toute période glissante de 180 jours", ar:"90 يومًا ضمن أي فترة متحركة مدتها 180 يومًا" },
    ". The window is not a fixed calendar period: each day you are physically in Schengen you \"spend\" one of your 90 days; that day will be \"refunded\" exactly 180 days later.": { tr:". Pencere sabit bir takvim dönemi değildir: Schengen'de fiziksel olarak bulunduğun her gün 90 gününden birini \"harcarsın\"; o gün tam 180 gün sonra \"iade edilir\".", es:". Ese período no es un intervalo fijo del calendario: cada día que estás físicamente en Schengen \"gastas\" uno de tus 90 días; ese día se te \"devuelve\" exactamente 180 días después.", de:". Der Zeitraum ist kein fester Kalenderabschnitt: Jeden Tag, den du dich physisch im Schengen-Raum aufhältst, „verbrauchst“ du einen deiner 90 Tage; dieser Tag wird genau 180 Tage später wieder „gutgeschrieben“.", fr:". Cette période n'est pas un intervalle calendaire fixe : chaque jour où tu es physiquement dans l'espace Schengen, tu « dépenses » un de tes 90 jours ; ce jour te sera « remboursé » exactement 180 jours plus tard.", ar:". هذه الفترة ليست مدة تقويمية ثابتة: في كل يوم تتواجد فيه فعليًا في شنغن \"تُنفق\" يومًا من أيامك الـ90؛ ويُعاد \"احتساب\" ذلك اليوم بعد 180 يومًا بالضبط." },
    "The UK and Ireland are": { tr:"İngiltere ve İrlanda", es:"El Reino Unido e Irlanda", de:"Das Vereinigte Königreich und Irland sind", fr:"Le Royaume-Uni et l'Irlande", ar:"المملكة المتحدة وأيرلندا" },
    "in Schengen — time spent there doesn't count toward the 90/180 limit. Holding an EU residence card (e.g. Spain Non-Lucrative, Portugal D7) means you live there legally and aren't subject to the short-stay rule for that country, but days in": { tr:"Schengen'de değildir — orada geçirdiğin süre 90/180 limitine sayılmaz. Bir AB oturma kartına (örn. İspanya Non-Lucrative, Portekiz D7) sahip olmak, orada yasal olarak yaşadığın ve o ülke için kısa-kalış kuralına tabi olmadığın anlamına gelir, ancak şu ülkelerdeki günler:", es:"no forman parte de Schengen: el tiempo que pases allí no cuenta para el límite de 90/180. Tener una tarjeta de residencia de la UE (por ejemplo, la no lucrativa de España o la D7 de Portugal) significa que vives allí legalmente y no estás sujeto a la norma de estancia corta de ese país, pero los días en", de:"im Schengen-Raum, die dort verbrachte Zeit zählt nicht auf das 90/180-Limit. Eine EU-Aufenthaltskarte (z. B. Spanien Non-Lucrative, Portugal D7) zu besitzen bedeutet, dass du dort legal lebst und für dieses Land nicht der Kurzaufenthaltsregel unterliegst, aber Tage in", fr:"ne font pas partie de l'espace Schengen : le temps que tu y passes ne compte pas dans la limite des 90/180 jours. Détenir une carte de séjour de l'UE (par ex. le Non-Lucrative espagnol, le D7 portugais) signifie que tu y résides légalement et n'es pas soumis à la règle du court séjour pour ce pays, mais les jours passés dans les", ar:"ليستا ضمن شنغن، فالوقت الذي تقضيه فيهما لا يُحتسب ضمن حد 90/180 يومًا. حيازة بطاقة إقامة في الاتحاد الأوروبي (مثل الإقامة غير الربحية في إسبانيا أو تأشيرة D7 في البرتغال) تعني أنك تقيم هناك بشكل قانوني ولست خاضعًا لقاعدة الإقامة القصيرة في تلك الدولة، لكن الأيام في" },
    "other": { tr:"diğer", es:"otros", de:"anderen", fr:"autres", ar:"أخرى" },
    "Schengen countries still count.": { tr:"Schengen ülkelerindeki günler yine sayılır.", es:"países Schengen sí cuentan.", de:"Schengen-Ländern zählen weiterhin.", fr:"pays Schengen comptent quand même.", ar:"دول شنغن لا تزال تُحتسب." },
    "🇹🇷 Türkiye → Schengen": { tr:"🇹🇷 Türkiye → Schengen", ar:"🇹🇷 تركيا ← شنغن", es:"🇹🇷 Türkiye → Schengen", de:"🇹🇷 Türkiye → Schengen", fr:"🇹🇷 Türkiye → Schengen" },
    "How the 90 / 180 rule actually works": { tr:"90 / 180 kuralı gerçekte nasıl işler", de:"Wie die 90/180-Regel wirklich funktioniert", fr:"Comment fonctionne vraiment la règle des 90 / 180 jours", ar:"كيف تعمل قاعدة 90/180 فعليًا", es:"Cómo funciona realmente la regla de 90 / 180" },
    "What about UK, Ireland, EU residency cards?": { tr:"İngiltere, İrlanda, AB oturma kartları ne olacak?", de:"Was gilt für Großbritannien, Irland und EU-Aufenthaltskarten?", fr:"Qu'en est-il du Royaume-Uni, de l'Irlande, des cartes de résident UE ?", ar:"ماذا عن المملكة المتحدة وأيرلندا وبطاقات الإقامة الأوروبية؟", es:"¿Qué pasa con el Reino Unido, Irlanda y las tarjetas de residencia de la UE?" },
    // alerts
    "When a country in your watchlist changes its visa policy, you get one short email — usually within 24 hours of the announcement. No spam, one-click unsubscribe.": { tr:"İzleme listendeki bir ülke vize politikasını değiştirdiğinde kısa bir e-posta alırsın — genelde duyurudan sonraki 24 saat içinde. Spam yok, tek tıkla abonelikten çık.", es:"Cuando un país de tu lista de seguimiento cambia su política de visados, recibes un correo breve, normalmente en las 24 horas siguientes al anuncio. Sin spam, baja con un clic.", de:"Wenn ein Land auf deiner Beobachtungsliste seine Visumpolitik ändert, erhältst du eine kurze E-Mail, meist innerhalb von 24 Stunden nach der Ankündigung. Kein Spam, Abmeldung mit einem Klick.", fr:"Quand un pays de ta liste de suivi change sa politique de visa, tu reçois un court e-mail, généralement dans les 24 heures suivant l'annonce. Pas de spam, désabonnement en un clic.", ar:"عندما تغيّر إحدى الدول في قائمة متابعتك سياسة التأشيرات الخاصة بها، تصلك رسالة إلكترونية قصيرة واحدة، عادة خلال 24 ساعة من الإعلان. بلا رسائل مزعجة، وإلغاء الاشتراك بنقرة واحدة." },
    "By subscribing you agree to receive transactional emails about visa policy changes from travelnow.info. We never share your address.": { tr:"Abone olarak, travelnow.info'tan vize politikası değişiklikleri hakkında işlemsel e-postalar almayı kabul edersin. Adresini asla paylaşmayız.", es:"Al suscribirte, aceptas recibir correos transaccionales de travelnow.info sobre cambios en las políticas de visado. Nunca compartimos tu dirección.", de:"Mit der Anmeldung stimmst du zu, transaktionale E-Mails von travelnow.info über Änderungen der Visumpolitik zu erhalten. Wir geben deine Adresse niemals weiter.", fr:"En t'abonnant, tu acceptes de recevoir des e-mails transactionnels de travelnow.info concernant les changements de politique de visa. Nous ne partageons jamais ton adresse.", ar:"بالاشتراك، فإنك توافق على تلقي رسائل إلكترونية تشغيلية حول تغييرات سياسات التأشيرات من travelnow.info. لن نشارك عنوانك أبدًا مع أي جهة." },
    "Real-time tracking from authoritative public sources, refreshed every 24 hours": { tr:"Yetkili kamu kaynaklarından gerçek zamanlı takip, her 24 saatte bir yenilenir", es:"Seguimiento en tiempo real a partir de fuentes públicas oficiales, actualizado cada 24 horas", de:"Echtzeit-Tracking aus autoritativen öffentlichen Quellen, alle 24 Stunden aktualisiert", fr:"Suivi en temps réel à partir de sources publiques faisant autorité, actualisé toutes les 24 heures", ar:"تتبع فوري من مصادر عامة موثوقة، يُحدَّث كل 24 ساعة" },
    "One-click unsubscribe link in every email": { tr:"Her e-postada tek tıkla abonelikten-çık bağlantısı", es:"Enlace de baja de un clic en cada correo", de:"Ein-Klick-Abmeldelink in jeder E-Mail", fr:"Lien de désabonnement en un clic dans chaque e-mail", ar:"رابط إلغاء اشتراك بنقرة واحدة في كل رسالة إلكترونية" },
    "No account required — confirm with the link in your inbox": { tr:"Hesap gerekmez — gelen kutundaki bağlantıyla onayla", es:"No se necesita cuenta: confirma con el enlace de tu bandeja de entrada", de:"Kein Konto erforderlich, bestätige mit dem Link in deinem Posteingang", fr:"Aucun compte requis, confirme avec le lien reçu dans ta boîte de réception", ar:"لا حاجة إلى حساب، أكّد عبر الرابط في بريدك الوارد" },
    "Track up to 3 countries — completely free": { tr:"3 ülkeye kadar takip — tamamen ücretsiz", es:"Sigue hasta 3 países: totalmente gratis", de:"Bis zu 3 Länder verfolgen, vollständig kostenlos", fr:"Suis jusqu'à 3 pays, entièrement gratuit", ar:"تابع حتى 3 دول، مجانًا بالكامل" },
    "Free alerts cover up to 3 countries.": { tr:"Ücretsiz uyarılar en fazla 3 ülkeyi kapsar.", es:"Las alertas gratuitas cubren hasta 3 países.", de:"Kostenlose Benachrichtigungen decken bis zu 3 Länder ab.", fr:"Les alertes gratuites couvrent jusqu'à 3 pays.", ar:"تشمل التنبيهات المجانية حتى 3 دول." },
    "Pro users can manage countries + cancel from a self-serve portal": { tr:"Pro kullanıcılar ülkeleri yönetebilir + self-servis portaldan iptal edebilir", es:"Los usuarios Pro pueden gestionar países y cancelar desde un portal de autoservicio", de:"Pro-Nutzer können Länder verwalten und über ein Selbstbedienungsportal kündigen", fr:"Les utilisateurs Pro peuvent gérer leurs pays et annuler depuis un portail en libre-service", ar:"يمكن لمستخدمي Pro إدارة الدول والإلغاء من بوابة الخدمة الذاتية" },
    "Send confirmation email": { tr:"Onay e-postası gönder", es:"Enviar correo de confirmación", de:"Bestätigungs-E-Mail senden", fr:"Envoyer l'e-mail de confirmation", ar:"إرسال رسالة تأكيد" },
    // privacy
    "locally in your browser": { tr:"tarayıcında yerel olarak", es:"localmente en tu navegador", de:"lokal in deinem Browser", fr:"localement dans ton navigateur", ar:"محليًا في متصفحك" },
    "Google Privacy Policy": { tr:"Google Gizlilik Politikası", es:"Política de Privacidad de Google", de:"Google-Datenschutzerklärung", fr:"Politique de confidentialité de Google", ar:"سياسة خصوصية Google" },
    "Cloudflare Privacy Policy": { tr:"Cloudflare Gizlilik Politikası", es:"Política de Privacidad de Cloudflare", de:"Cloudflare-Datenschutzerklärung", fr:"Politique de confidentialité de Cloudflare", ar:"سياسة خصوصية Cloudflare" },
    "Stripe Privacy Policy": { tr:"Stripe Gizlilik Politikası", es:"Política de Privacidad de Stripe", de:"Stripe-Datenschutzerklärung", fr:"Politique de confidentialité de Stripe", ar:"سياسة خصوصية Stripe" },
    "Resend Privacy Policy": { tr:"Resend Gizlilik Politikası", es:"Política de Privacidad de Resend", de:"Resend-Datenschutzerklärung", fr:"Politique de confidentialité de Resend", ar:"سياسة خصوصية Resend" },
    "Affiliate partners": { tr:"Ortaklık iş ortakları", es:"Socios afiliados", de:"Partnerprogramme", fr:"Partenaires affiliés", ar:"شركاء تابعون" },

    // About headings
    "How the data is built":               { tr:"Veriler nasıl oluşuyor", es:"Cómo se construyen los datos", de:"Wie die Daten entstehen", fr:"Comment les données sont construites", ar:"كيف تُبنى البيانات" },
    "What travelnow.info is not":                   { tr:"travelnow.info ne değildir", es:"Lo que travelnow.info no es", de:"Was travelnow.info nicht ist", fr:"Ce qu'travelnow.info n'est pas", ar:"ما ليس عليه أطلس" },
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
    "travelnow.info link":                          { tr:"travelnow.info bağlantısı", es:"Enlace travelnow.info", de:"travelnow.info-Link", fr:"Lien travelnow.info", ar:"رابط أطلس" },
    "Track how many of your 90 short-stay days you've used in the last 180. Add past trips below, plan a future one to see if it fits.":
      { tr:"Son 180 gün içinde 90 kısa süreli kalış gününüzün ne kadarını kullandığınızı takip edin. Geçmiş seyahatlerinizi ekleyin, gelecekteki bir planı sığıp sığmadığını görmek için ekleyin.", de:"Behalte im Blick, wie viele deiner 90 Kurzaufenthaltstage du in den letzten 180 Tagen verbraucht hast. Trage unten vergangene Reisen ein oder plane eine künftige, um zu sehen, ob sie passt." },
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
    "Plan a trip with multiple destinations. travelnow.info checks each leg against your passport, surfaces which ones need a visa, and exports apply-by reminders to your calendar.":
      { tr:"Birden fazla destinasyonlu bir seyahat planla. travelnow.info her bacağı pasaportunuza göre kontrol eder, hangilerinin vize gerektirdiğini gösterir ve başvuru hatırlatmalarını takviminize aktarır." },
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
    "About travelnow.info":                         { tr:"travelnow.info hakkında", es:"Acerca de travelnow.info", de:"Über travelnow.info", fr:"À propos d'travelnow.info", ar:"حول أطلس" },
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
    "travelnow.info is an interactive visa-requirements explorer. Pick your passport\n  and see at a glance which of the world's 200+ countries you can enter\n  visa-free, which need an eVisa, which issue a visa on arrival, and which\n  require a full embassy application. We do this for every passport — not\n  just the major ones.":
      { tr:"travelnow.info etkileşimli bir vize-gereklilikleri gezginidir. Pasaportunuzu seçin ve dünyanın 200+ ülkesinden hangilerine vizesiz, hangilerine e-vize, hangilerine varışta vize ile girebileceğinizi ve hangilerinin tam konsolosluk başvurusu gerektirdiğini bir bakışta görün. Bunu sadece büyük pasaportlar için değil, her pasaport için yapıyoruz.",
        es:"travelnow.info es un explorador interactivo de requisitos de visa. Elige tu pasaporte y descubre de un vistazo a cuáles de los más de 200 países del mundo puedes entrar sin visa, cuáles requieren eVisa, cuáles emiten visa al llegar y cuáles exigen una solicitud completa en la embajada.",
        de:"travelnow.info ist ein interaktiver Visa-Anforderungs-Explorer. Wähle deinen Pass und sieh auf einen Blick, in welche der 200+ Länder der Welt du visumfrei einreisen kannst, welche ein eVisa erfordern, welche ein Visum bei Ankunft ausstellen und welche einen vollständigen Botschaftsantrag verlangen.",
        fr:"travelnow.info est un explorateur interactif des exigences de visa. Choisis ton passeport et découvre d'un coup d'œil dans quels pays (parmi 200+) tu peux entrer sans visa, lesquels nécessitent un eVisa, lesquels délivrent un visa à l'arrivée et lesquels exigent une demande consulaire complète.",
        ar:"travelnow.info مستكشف تفاعلي لمتطلبات التأشيرة. اختر جواز سفرك واعرف بنظرة واحدة إلى أي من دول العالم الـ 200+ يمكنك الدخول بدون تأشيرة، وأيها يتطلب تأشيرة إلكترونية، وأيها يصدر تأشيرة عند الوصول، وأيها يحتاج طلبًا كاملاً من السفارة." },
    "travelnow.info aggregates visa-policy information from authoritative,\n  regularly-updated public sources covering every recognised passport. The\n  full dataset is rebuilt every 24 hours so the map you see is never more\n  than a day behind the latest announcements. The \"Recently changed\" feed\n  in the side panel surfaces the previous day's diff.":
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
    "travelnow.info (travelnow.info) is a free reference tool that shows visa requirements for travelers worldwide. The dataset is rebuilt every 24 hours from authoritative public sources. An account is optional: everything works without one, and we only ask for an email address if you choose to create one.":
      { tr:"travelnow.info, dünyadaki seyahatçilere vize gerekliliklerini gösteren ücretsiz bir referans aracıdır. Veri seti otoriter kamu kaynaklarından her 24 saatte yeniden oluşturulur. Hesap isteğe bağlıdır: her şey hesapsız çalışır, e-posta adresini yalnızca hesap açmayı seçersen isteriz.",
        es:"travelnow.info es una herramienta de referencia gratuita que muestra los requisitos de visa para viajeros de todo el mundo. El conjunto de datos se reconstruye cada 24 horas a partir de fuentes públicas autorizadas. No requerimos cuenta ni pedimos información personal.",
        de:"travelnow.info ist ein kostenloses Referenzwerkzeug, das Visumsanforderungen für Reisende weltweit zeigt. Der Datensatz wird alle 24 Stunden aus autoritativen öffentlichen Quellen neu erstellt. Wir verlangen kein Konto und keine persönlichen Daten.",
        fr:"travelnow.info est un outil de référence gratuit qui affiche les exigences de visa pour les voyageurs du monde entier. Le jeu de données est reconstruit toutes les 24 heures à partir de sources publiques officielles. Aucun compte ni information personnelle requis.",
        ar:"travelnow.info أداة مرجعية مجانية تعرض متطلبات التأشيرة للمسافرين حول العالم. يتم إعادة بناء البيانات كل 24 ساعة من مصادر عامة موثوقة. لا نطلب حسابًا ولا معلومات شخصية." },
    "travelnow.info is not directed at children under 13. We do not knowingly collect\n  data from anyone under 13.":
      { tr:"travelnow.info 13 yaş altı çocuklara yönelik değildir. 13 yaş altı kimseden bilerek veri toplamayız.",
        es:"travelnow.info no está dirigido a menores de 13 años. No recopilamos a sabiendas datos de menores de 13.",
        de:"travelnow.info richtet sich nicht an Kinder unter 13 Jahren. Wir erheben wissentlich keine Daten von Personen unter 13 Jahren.",
        fr:"travelnow.info ne s'adresse pas aux enfants de moins de 13 ans. Nous ne collectons pas sciemment de données auprès de personnes de moins de 13 ans.",
        ar:"travelnow.info غير موجه للأطفال دون 13 عامًا. لا نجمع بيانات عمدًا من أي شخص دون 13 عامًا." },
    "Without an account we don't store personal data, so there is nothing for you to access, rectify, or delete on our side. With an account you can download or delete everything stored with it at any time on your account page. For data held by AdSense or our hosting provider, please contact them directly using the policy links above.":
      { tr:"Hesabın yoksa kişisel veri saklamayız; bu yüzden bizim tarafımızda erişeceğin, düzelteceğin ya da sileceğin bir şey yoktur. Hesabın varsa, onunla saklanan her şeyi hesap sayfandan istediğin zaman indirebilir ya da silebilirsin. AdSense veya barındırma sağlayıcımızın tuttuğu veriler için lütfen yukarıdaki politika bağlantılarıyla doğrudan onlara başvur.",
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
    "Print / save PDF": { tr:"Yazdır / PDF kaydet", es:"Imprimir / guardar PDF", de:"Drucken / als PDF speichern", fr:"Imprimer / PDF", ar:"طباعة / حفظ PDF" },
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
    // ── privacy: accounts ──
    "If you create an account": { tr:"Hesap açarsan", es:"Si creas una cuenta", de:"Wenn du ein Konto erstellst", fr:"Si tu crées un compte", ar:"إذا أنشأت حسابًا" },
    "For first-time visitors, the browser's time zone is used locally to guess a likely passport. It never leaves your browser, and we never ask for your location.": { tr:"İlk kez gelen ziyaretçilerde, olası pasaportu tahmin etmek için tarayıcının saat dilimi yalnızca tarayıcıda kullanılır. Bu bilgi tarayıcından hiç çıkmaz ve konumunu asla istemeyiz.", es:"Para quienes visitan el sitio por primera vez, la zona horaria del navegador se usa localmente para adivinar un pasaporte probable. Nunca sale de tu navegador, y nunca te pedimos tu ubicación.", de:"Bei Erstbesuchern wird die Zeitzone des Browsers lokal genutzt, um einen wahrscheinlichen Pass zu schätzen. Sie verlässt niemals deinen Browser, und wir fragen niemals nach deinem Standort.", fr:"Pour les nouveaux visiteurs, le fuseau horaire du navigateur est utilisé localement pour deviner un passeport probable. Il ne quitte jamais ton navigateur, et nous ne demandons jamais ta localisation.", ar:"بالنسبة إلى الزوار لأول مرة، تُستخدم المنطقة الزمنية للمتصفح محليًا لتخمين جواز السفر المحتمل. لا تغادر هذه البيانات متصفحك أبدًا، ولا نطلب موقعك الجغرافي أبدًا." },
    "Accounts are optional. If you sign in, we store your email address and the things you save on the site so they are available on your other devices: your passport and passport type, residence permits you added, watched destinations, your planned trip, Schengen calculator trips, and your language and theme. We never ask for passport numbers or documents.": { tr:"Hesap isteğe bağlıdır. Giriş yaparsan, diğer cihazlarında da kullanabilmen için e-posta adresini ve sitede kaydettiklerini saklarız: pasaportun ve pasaport türün, eklediğin oturum izinleri, izlediğin ülkeler, planladığın seyahat, Schengen hesaplayıcı seyahatleri, dil ve tema tercihin. Pasaport numarası ya da belge asla istemeyiz.", es:"Las cuentas son opcionales. Si inicias sesión, guardamos tu dirección de correo y lo que guardas en el sitio para que esté disponible en tus otros dispositivos: tu pasaporte y su tipo, los permisos de residencia que añadiste, los destinos que sigues, tu viaje planificado, los viajes de la calculadora Schengen, y tu idioma y tema. Nunca pedimos números de pasaporte ni documentos.", de:"Konten sind optional. Wenn du dich anmeldest, speichern wir deine E-Mail-Adresse und das, was du auf der Seite speicherst, damit es auf deinen anderen Geräten verfügbar ist: deinen Pass und Passtyp, hinzugefügte Aufenthaltserlaubnisse, beobachtete Reiseziele, deine geplante Reise, Reisen im Schengen-Rechner sowie deine Sprach- und Themeneinstellung. Wir fragen niemals nach Passnummern oder Dokumenten.", fr:"Les comptes sont optionnels. Si tu te connectes, nous stockons ton adresse e-mail et les éléments que tu enregistres sur le site afin qu'ils soient disponibles sur tes autres appareils : ton passeport et son type, les titres de séjour que tu as ajoutés, les destinations suivies, ton voyage planifié, les trajets du calculateur Schengen, ainsi que ta langue et ton thème. Nous ne demandons jamais de numéro de passeport ni de documents.", ar:"الحسابات اختيارية. إذا سجّلت الدخول، نخزّن عنوان بريدك الإلكتروني والعناصر التي تحفظها على الموقع لتكون متاحة على أجهزتك الأخرى: جواز سفرك ونوعه، تصاريح الإقامة التي أضفتها، الوجهات التي تتابعها، رحلتك المخططة، رحلات حاسبة شنغن، ولغتك وسمتك المفضلة. لا نطلب أبدًا أرقام جوازات السفر أو المستندات." },
    "Sign-in and storage are provided by Google Firebase (Firebase Authentication and Cloud Firestore, hosted in the EU). Only you can read or change your record. You can download everything or delete your account, together with all data stored with it, at any time on your account page (travelnow.info/account/).": { tr:"Giriş ve saklama Google Firebase tarafından sağlanır (Firebase Authentication ve Cloud Firestore, AB'de barındırılır). Kaydını yalnızca sen okuyabilir ya da değiştirebilirsin. Hesap sayfandan (travelnow.info/account/) istediğin zaman her şeyi indirebilir ya da hesabını, onunla saklanan tüm verilerle birlikte silebilirsin.", es:"El inicio de sesión y el almacenamiento los proporciona Google Firebase (Firebase Authentication y Cloud Firestore, alojados en la UE). Solo tú puedes leer o modificar tu registro. Puedes descargar todo o eliminar tu cuenta, junto con todos los datos guardados en ella, en cualquier momento desde tu página de cuenta (travelnow.info/account/).", de:"Anmeldung und Speicherung werden von Google Firebase bereitgestellt (Firebase Authentication und Cloud Firestore, gehostet in der EU). Nur du kannst deinen Eintrag lesen oder ändern. Du kannst jederzeit auf deiner Kontoseite (travelnow.info/account/) alles herunterladen oder dein Konto zusammen mit allen darin gespeicherten Daten löschen.", fr:"La connexion et le stockage sont assurés par Google Firebase (Firebase Authentication et Cloud Firestore, hébergés dans l'UE). Toi seul peux lire ou modifier ton enregistrement. Tu peux télécharger toutes tes données ou supprimer ton compte, ainsi que toutes les données qui y sont associées, à tout moment depuis ta page de compte (travelnow.info/account/).", ar:"يوفر تسجيل الدخول والتخزين خدمة Google Firebase (Firebase Authentication وCloud Firestore، المستضافة في الاتحاد الأوروبي). أنت وحدك من يمكنه قراءة سجلك أو تعديله. يمكنك في أي وقت تنزيل كل بياناتك أو حذف حسابك، مع جميع البيانات المخزنة معه، من صفحة حسابك (travelnow.info/account/)." },
    "handles sign-in and stores account data if you create an account.": { tr:"hesap açarsan girişi yönetir ve hesap verilerini saklar.", es:"gestiona el inicio de sesión y guarda los datos de la cuenta si creas una.", de:"übernimmt die Anmeldung und speichert Kontodaten, wenn du ein Konto erstellst.", fr:"gère la connexion et stocke les données de compte si tu crées un compte.", ar:"يتولى تسجيل الدخول ويخزّن بيانات الحساب إذا أنشأت حسابًا." },
    "Firebase privacy and security": { tr:"Firebase gizlilik ve güvenlik", es:"Privacidad y seguridad de Firebase", de:"Firebase-Datenschutz und -Sicherheit", fr:"Confidentialité et sécurité de Firebase", ar:"خصوصية Firebase وأمانه" },
    // ── /account/ (assets/account-page.js) ──
    "Account": { tr:"Hesap", es:"Cuenta", ar:"الحساب", de:"Konto", fr:"Compte" },
    "Your account": { tr:"Hesabın", es:"Tu cuenta", de:"Dein Konto", fr:"Ton compte", ar:"حسابك" },
    "Accounts aren't switched on yet. Everything you save — your passport, watched destinations, planned trip and Schengen calculator trips — stays in this browser only.": { tr:"Hesaplar henüz açık değil. Kaydettiğin her şey — pasaportun, izlediğin ülkeler, planladığın seyahat ve Schengen hesaplayıcısındaki seyahatler — yalnızca bu tarayıcıda kalır.", ar:"لم تُفعَّل الحسابات بعد. كل ما تحفظه، جواز سفرك، والوجهات المراقَبة، والرحلة المخطَّطة، ورحلات حاسبة شنغن، يبقى في هذا المتصفح فقط.", es:"Las cuentas todavía no están activadas. Todo lo que guardas (tu pasaporte, los destinos que sigues, tu viaje planificado y los viajes de la calculadora Schengen) permanece solo en este navegador.", de:"Konten sind noch nicht aktiviert. Alles, was du speicherst (dein Pass, beobachtete Reiseziele, geplante Reise und Reisen im Schengen-Rechner), bleibt ausschließlich in diesem Browser.", fr:"Les comptes ne sont pas encore activés. Tout ce que tu enregistres, ton passeport, les destinations suivies, le voyage planifié et les trajets du calculateur Schengen, reste uniquement dans ce navigateur." },
    "Saved in this browser": { tr:"Bu tarayıcıda kayıtlı", ar:"محفوظ في هذا المتصفح", es:"Guardado en este navegador", de:"In diesem Browser gespeichert", fr:"Enregistré dans ce navigateur" },
    "Passport": { tr:"Pasaport", es:"Pasaporte", de:"Pass", fr:"Passeport", ar:"جواز السفر" },
    "Watched destinations": { tr:"İzlenen ülkeler", es:"Destinos vigilados", de:"Beobachtete Ziele", fr:"Destinations suivies", ar:"الوجهات المراقَبة" },
    "Planned trip": { tr:"Planlanan seyahat", es:"Viaje planeado", de:"Geplante Reise", fr:"Voyage planifié", ar:"الرحلة المخطَّطة" },
    "Schengen calculator trips": { tr:"Schengen hesaplayıcı seyahatleri", es:"Viajes de la calculadora Schengen", de:"Schengen-Rechner-Reisen", fr:"Trajets du calculateur Schengen", ar:"رحلات حاسبة شنغن" },
    "Loading…": { tr:"Yükleniyor…", es:"Cargando…", de:"Wird geladen…", fr:"Chargement…", ar:"جارٍ التحميل…" },
    "Finish signing in": { tr:"Girişi tamamla", ar:"أكمل تسجيل الدخول", es:"Termina de iniciar sesión", de:"Anmeldung abschließen", fr:"Terminer la connexion" },
    "Enter the email address the sign-in link was sent to.": { tr:"Giriş bağlantısının gönderildiği e-posta adresini yaz.", ar:"أدخل عنوان البريد الإلكتروني الذي أُرسل إليه رابط تسجيل الدخول.", es:"Introduce la dirección de correo a la que se envió el enlace de inicio de sesión.", de:"Gib die E-Mail-Adresse ein, an die der Anmeldelink gesendet wurde.", fr:"Saisis l'adresse e-mail à laquelle le lien de connexion a été envoyé." },
    "Sign in": { tr:"Giriş yap", es:"Iniciar sesión", de:"Anmelden", fr:"Se connecter", ar:"تسجيل الدخول" },
    "Sign in to keep your passport, watched destinations, planned trip and Schengen calculator trips on every device. No password — use Google or a one-time link by email.": { tr:"Pasaportun, izlediğin ülkeler, planladığın seyahat ve Schengen hesaplayıcı seyahatlerin her cihazda seninle olsun diye giriş yap. Şifre yok — Google'ı ya da e-postayla gelen tek kullanımlık bağlantıyı kullan.", ar:"سجّل الدخول للاحتفاظ بجواز سفرك، والوجهات المراقَبة، والرحلة المخطَّطة، ورحلات حاسبة شنغن على كل أجهزتك. بلا كلمة مرور، استخدم Google أو رابطًا لمرة واحدة عبر البريد الإلكتروني.", es:"Inicia sesión para tener tu pasaporte, los destinos que sigues, tu viaje planificado y los viajes de la calculadora Schengen en todos tus dispositivos. Sin contraseña: usa Google o un enlace de un solo uso por correo.", de:"Melde dich an, damit dein Pass, beobachtete Reiseziele, geplante Reise und Reisen im Schengen-Rechner auf jedem Gerät verfügbar sind. Kein Passwort nötig: nutze Google oder einen einmaligen Link per E-Mail.", fr:"Connecte-toi pour retrouver ton passeport, tes destinations suivies, ton voyage planifié et tes trajets du calculateur Schengen sur tous tes appareils. Pas de mot de passe, utilise Google ou un lien à usage unique par e-mail." },
    "Continue with Google": { tr:"Google ile devam et", es:"Continuar con Google", de:"Mit Google fortfahren", fr:"Continuer avec Google", ar:"المتابعة عبر Google" },
    "Or get a sign-in link by email": { tr:"Ya da e-postayla giriş bağlantısı al", ar:"أو احصل على رابط تسجيل دخول عبر البريد الإلكتروني", es:"O recibe un enlace de inicio de sesión por correo", de:"Oder erhalte einen Anmeldelink per E-Mail", fr:"Ou reçois un lien de connexion par e-mail" },
    "Check your inbox — we sent a sign-in link. Open it on this device.": { tr:"Gelen kutuna bak — giriş bağlantısı gönderdik. Bu cihazda aç.", ar:"تحقّق من بريدك، أرسلنا رابط تسجيل دخول. افتحه على هذا الجهاز.", es:"Revisa tu bandeja de entrada: te hemos enviado un enlace de inicio de sesión. Ábrelo en este dispositivo.", de:"Sieh in deinem Posteingang nach, wir haben einen Anmeldelink gesendet. Öffne ihn auf diesem Gerät.", fr:"Regarde ta boîte de réception, nous avons envoyé un lien de connexion. Ouvre-le sur cet appareil." },
    "Email me a link": { tr:"Bağlantıyı gönder", ar:"أرسل لي رابطًا", es:"Envíame un enlace", de:"Link per E-Mail senden", fr:"M'envoyer un lien" },
    "What an account stores": { tr:"Hesapta neler saklanır", es:"Qué guarda una cuenta", de:"Was ein Konto speichert", fr:"Ce qu'un compte conserve", ar:"ما الذي يحفظه الحساب" },
    "Your email address and the items listed below — nothing else. No passport numbers or documents. You can download or delete it all at any time.": { tr:"E-posta adresin ve aşağıdaki öğeler — başka hiçbir şey. Pasaport numarası ya da belge yok. Hepsini istediğin zaman indirebilir ya da silebilirsin.", es:"Tu dirección de correo y los elementos que se indican abajo, nada más. Sin números de pasaporte ni documentos. Puedes descargarlo o eliminarlo todo cuando quieras.", de:"Deine E-Mail-Adresse und die unten aufgeführten Punkte, sonst nichts. Keine Passnummern oder Dokumente. Du kannst alles jederzeit herunterladen oder löschen.", fr:"Ton adresse e-mail et les éléments listés ci-dessous, rien d'autre. Aucun numéro de passeport ni document. Tu peux tout télécharger ou tout supprimer à tout moment.", ar:"عنوان بريدك الإلكتروني والعناصر المذكورة أدناه، لا شيء غير ذلك. لا أرقام جوازات سفر ولا مستندات. يمكنك تنزيل كل ذلك أو حذفه في أي وقت." },
    "Signed in as": { tr:"Giriş yapılan hesap:", ar:"مسجَّل الدخول باسم", es:"Sesión iniciada como", de:"Angemeldet als", fr:"Connecté en tant que" },
    "Syncing…": { tr:"Eşitleniyor…", ar:"جارٍ المزامنة…", es:"Sincronizando…", de:"Wird synchronisiert…", fr:"Synchronisation…" },
    "Couldn't sync — will retry when you change something.": { tr:"Eşitlenemedi — bir şeyi değiştirdiğinde tekrar denenecek.", ar:"تعذّرت المزامنة، ستُعاد المحاولة عند إجراء أي تغيير.", es:"No se pudo sincronizar: se reintentará cuando cambies algo.", de:"Synchronisierung fehlgeschlagen, wird erneut versucht, sobald du etwas änderst.", fr:"Impossible de synchroniser, nouvel essai dès que tu modifies quelque chose." },
    "Up to date on this device.": { tr:"Bu cihazda güncel.", ar:"محدَّث على هذا الجهاز.", es:"Al día en este dispositivo.", de:"Auf diesem Gerät aktuell.", fr:"À jour sur cet appareil." },
    "Saved to your account": { tr:"Hesabına kayıtlı", ar:"محفوظ في حسابك", es:"Guardado en tu cuenta", de:"In deinem Konto gespeichert", fr:"Enregistré sur ton compte" },
    "Sync now": { tr:"Şimdi eşitle", ar:"زامن الآن", es:"Sincronizar ahora", de:"Jetzt synchronisieren", fr:"Synchroniser maintenant" },
    "Download my data": { tr:"Verilerimi indir", ar:"تنزيل بياناتي", es:"Descargar mis datos", de:"Meine Daten herunterladen", fr:"Télécharger mes données" },
    "Sign out": { tr:"Çıkış yap", es:"Cerrar sesión", de:"Abmelden", ar:"تسجيل الخروج", fr:"Se déconnecter" },
    "Delete account": { tr:"Hesabı sil", es:"Eliminar cuenta", ar:"حذف الحساب", de:"Konto löschen", fr:"Supprimer le compte" },
    "Deletes your sign-in and everything stored with it. What's saved in this browser stays here.": { tr:"Girişini ve onunla saklanan her şeyi siler. Bu tarayıcıda kayıtlı olanlar burada kalır.", ar:"يحذف تسجيل دخولك وكل ما هو مخزَّن معه. ما هو محفوظ في هذا المتصفح يبقى هنا.", es:"Elimina tu inicio de sesión y todo lo guardado con él. Lo que está guardado en este navegador permanece aquí.", de:"Löscht deine Anmeldung und alles, was damit gespeichert wurde. Was in diesem Browser gespeichert ist, bleibt hier.", fr:"Supprime ta connexion et tout ce qui y est associé. Ce qui est enregistré dans ce navigateur y reste." },
    "Delete my account": { tr:"Hesabımı sil", ar:"حذف حسابي", es:"Eliminar mi cuenta", de:"Mein Konto löschen", fr:"Supprimer mon compte" },
    "Tap again to delete permanently": { tr:"Kalıcı olarak silmek için tekrar dokun", ar:"اضغط مرة أخرى للحذف نهائيًا", es:"Toca de nuevo para eliminar definitivamente", de:"Erneut tippen, um endgültig zu löschen", fr:"Appuie à nouveau pour supprimer définitivement" },
    "Your account has been deleted.": { tr:"Hesabın silindi.", ar:"تم حذف حسابك.", es:"Tu cuenta se ha eliminado.", de:"Dein Konto wurde gelöscht.", fr:"Ton compte a été supprimé." },
    "Sign-in was cancelled.": { tr:"Giriş iptal edildi.", ar:"تم إلغاء تسجيل الدخول.", es:"Se canceló el inicio de sesión.", de:"Die Anmeldung wurde abgebrochen.", fr:"La connexion a été annulée." },
    "That email address doesn't look right.": { tr:"Bu e-posta adresi doğru görünmüyor.", ar:"عنوان البريد الإلكتروني هذا لا يبدو صحيحًا.", es:"Esa dirección de correo no parece correcta.", de:"Diese E-Mail-Adresse scheint nicht korrekt zu sein.", fr:"Cette adresse e-mail ne semble pas correcte." },
    "This sign-in link has expired or was already used. Ask for a new one.": { tr:"Bu giriş bağlantısının süresi dolmuş ya da kullanılmış. Yenisini iste.", ar:"انتهت صلاحية رابط تسجيل الدخول هذا أو سبق استخدامه. اطلب رابطًا جديدًا.", es:"Este enlace de inicio de sesión ha caducado o ya se usó. Solicita uno nuevo.", de:"Dieser Anmeldelink ist abgelaufen oder wurde bereits verwendet. Fordere einen neuen an.", fr:"Ce lien de connexion a expiré ou a déjà été utilisé. Demande-en un nouveau." },
    "No connection — try again.": { tr:"Bağlantı yok — tekrar dene.", ar:"لا يوجد اتصال، حاول مرة أخرى.", es:"Sin conexión: inténtalo de nuevo.", de:"Keine Verbindung, versuche es erneut.", fr:"Aucune connexion, réessaie." },
    "For your security, sign out, sign in again, then delete.": { tr:"Güvenliğin için çıkış yap, tekrar giriş yap, sonra sil.", ar:"لأمانك، سجّل الخروج، ثم سجّل الدخول من جديد، ثم احذف الحساب.", es:"Por tu seguridad, cierra sesión, vuelve a iniciar sesión y después elimina la cuenta.", de:"Melde dich zu deiner Sicherheit ab, wieder an und lösche danach.", fr:"Pour ta sécurité, déconnecte-toi, reconnecte-toi, puis supprime." },
    "Sign-in isn't set up for this address yet.": { tr:"Bu adres için giriş henüz ayarlanmadı.", ar:"تسجيل الدخول غير مفعَّل لهذا العنوان بعد.", es:"El inicio de sesión aún no está configurado para esta dirección.", de:"Für diese Adresse ist die Anmeldung noch nicht eingerichtet.", fr:"La connexion n'est pas encore configurée pour cette adresse." },
    "Something went wrong. Please try again.": { tr:"Bir şeyler ters gitti. Lütfen tekrar dene.", ar:"حدث خطأ ما. يرجى المحاولة مرة أخرى.", es:"Algo salió mal. Inténtalo de nuevo.", de:"Etwas ist schiefgelaufen. Bitte versuche es erneut.", fr:"Une erreur s'est produite. Réessaie." },
    "Email address": { tr:"E-posta adresi", de:"E-Mail-Adresse", ar:"عنوان البريد الإلكتروني", es:"Dirección de correo", fr:"Adresse e-mail" },
    "Get a notification when a visa rule changes for your passport or for a country you watch, and when government safety advice changes for a country on your trip. Alerts are free and need no email address.": { tr:"Pasaportun ya da izlediğin bir ülke için vize kuralı değiştiğinde ve seyahatindeki bir ülke için resmi güvenlik uyarısı değiştiğinde bildirim al. Uyarılar ücretsizdir ve e-posta adresi gerektirmez.", es:"Recibe un aviso cuando cambie una norma de visado para tu pasaporte o para un país que sigues, y cuando cambie el aviso oficial de seguridad de un país de tu viaje. Los avisos son gratuitos y no necesitan correo electrónico.", de:"Werde benachrichtigt, wenn sich eine Visaregel für deinen Pass oder ein beobachtetes Land ändert, und wenn sich der amtliche Sicherheitshinweis für ein Land deiner Reise ändert. Die Hinweise sind kostenlos und brauchen keine E-Mail-Adresse.", fr:"Reçois une notification quand une règle de visa change pour ton passeport ou pour un pays que tu suis, et quand le conseil officiel de sécurité change pour un pays de ton voyage. Les alertes sont gratuites et ne demandent pas d'adresse e-mail.", ar:"احصل على إشعار عند تغيّر قاعدة تأشيرة لجواز سفرك أو لبلد تتابعه، وعند تغيّر تنبيه السلامة الرسمي لبلد ضمن رحلتك. التنبيهات مجانية ولا تحتاج إلى بريد إلكتروني." },
    "Sent only when something changes, at most once a day per device.": { tr:"Yalnızca bir şey değiştiğinde gönderilir, cihaz başına günde en fazla bir kez.", es:"Solo se envían cuando algo cambia, como máximo una vez al día por dispositivo.", de:"Nur wenn sich etwas ändert, höchstens einmal am Tag pro Gerät.", fr:"Envoyées seulement quand quelque chose change, au plus une fois par jour et par appareil.", ar:"تُرسل فقط عند حدوث تغيير، ومرة واحدة يوميًا على الأكثر لكل جهاز." },
    "Never during the night on your device's clock, and never marketing.": { tr:"Cihazının saatine göre asla gece gönderilmez ve asla reklam içermez.", es:"Nunca de noche según la hora de tu dispositivo, y nunca publicidad.", de:"Nie nachts nach der Uhr deines Geräts und nie Werbung.", fr:"Jamais la nuit selon l'heure de ton appareil, et jamais de publicité.", ar:"لا تُرسل ليلًا بحسب توقيت جهازك، ولا تحتوي على أي تسويق." },
    "Rules are checked every 24 hours against public sources.": { tr:"Kurallar her 24 saatte bir kamuya açık kaynaklarla karşılaştırılır.", es:"Las normas se comprueban cada 24 horas con fuentes públicas.", de:"Die Regeln werden alle 24 Stunden mit öffentlichen Quellen abgeglichen.", fr:"Les règles sont vérifiées toutes les 24 heures à partir de sources publiques.", ar:"تُراجع القواعد كل 24 ساعة مقابل مصادر عامة." },
    "You can turn them off at any time, here or in your browser settings.": { tr:"İstediğin zaman buradan ya da tarayıcı ayarlarından kapatabilirsin.", es:"Puedes desactivarlos cuando quieras, aquí o en los ajustes del navegador.", de:"Du kannst sie jederzeit hier oder in den Browsereinstellungen ausschalten.", fr:"Tu peux les désactiver à tout moment, ici ou dans les réglages du navigateur.", ar:"يمكنك إيقافها في أي وقت من هنا أو من إعدادات المتصفح." },
    "Alerts need JavaScript.": { tr:"Uyarılar için JavaScript gerekir.", es:"Los avisos necesitan JavaScript.", de:"Für die Hinweise wird JavaScript benötigt.", fr:"Les alertes nécessitent JavaScript.", ar:"تحتاج التنبيهات إلى JavaScript." },
    "Choose your passport": { tr:"Pasaportunu seç", es:"Elige tu pasaporte", de:"Wähle deinen Pass", fr:"Choisis ton passeport", ar:"اختر جواز سفرك" },
    "Countries you watch": { tr:"İzlediğin ülkeler", es:"Países que sigues", de:"Beobachtete Länder", fr:"Pays suivis", ar:"البلدان التي تتابعها" },
    "Add a country": { tr:"Ülke ekle", es:"Añadir un país", de:"Land hinzufügen", fr:"Ajouter un pays", ar:"أضف بلدًا" },
    "You're not watching any country yet. Add one here, or tap the star on a country's card on the map.": { tr:"Henüz hiçbir ülkeyi izlemiyorsun. Buradan ekle ya da haritada bir ülkenin kartındaki yıldıza dokun.", es:"Todavía no sigues ningún país. Añade uno aquí o toca la estrella en la ficha de un país en el mapa.", de:"Du beobachtest noch kein Land. Füge hier eins hinzu oder tippe auf der Karte auf den Stern in der Länderkarte.", fr:"Tu ne suis encore aucun pays. Ajoutes-en un ici ou touche l'étoile sur la fiche d'un pays sur la carte.", ar:"لا تتابع أي بلد بعد. أضف بلدًا هنا، أو المس النجمة في بطاقة البلد على الخريطة." },
    "You can watch up to 20 countries.": { tr:"En fazla 20 ülkeyi izleyebilirsin.", es:"Puedes seguir hasta 20 países.", de:"Du kannst bis zu 20 Länder beobachten.", fr:"Tu peux suivre jusqu'à 20 pays.", ar:"يمكنك متابعة 20 بلدًا كحد أقصى." },
    "Where to send alerts": { tr:"Uyarılar nereye gönderilsin", es:"Dónde enviar los avisos", de:"Wohin die Hinweise gehen", fr:"Où envoyer les alertes", ar:"إلى أين تُرسل التنبيهات" },
    "Alerts need an account, and accounts are not available right now.": { tr:"Uyarılar için hesap gerekir ve hesaplar şu anda kullanılamıyor.", es:"Los avisos necesitan una cuenta y ahora mismo las cuentas no están disponibles.", de:"Hinweise brauchen ein Konto, und Konten sind gerade nicht verfügbar.", fr:"Les alertes nécessitent un compte, et les comptes ne sont pas disponibles pour le moment.", ar:"تحتاج التنبيهات إلى حساب، والحسابات غير متاحة حاليًا." },
    "Alerts are tied to your account, so they reach every device where you turn them on.": { tr:"Uyarılar hesabına bağlıdır; böylece açtığın her cihaza ulaşır.", es:"Los avisos van ligados a tu cuenta, así que llegan a cada dispositivo donde los actives.", de:"Die Hinweise hängen an deinem Konto und erreichen jedes Gerät, auf dem du sie einschaltest.", fr:"Les alertes sont liées à ton compte : elles arrivent sur chaque appareil où tu les actives.", ar:"التنبيهات مرتبطة بحسابك، لذا تصل إلى كل جهاز تفعّلها عليه." },
    "Sign in or create an account": { tr:"Giriş yap ya da hesap oluştur", es:"Inicia sesión o crea una cuenta", de:"Anmelden oder Konto erstellen", fr:"Se connecter ou créer un compte", ar:"سجّل الدخول أو أنشئ حسابًا" },
    "Choose a passport or a country to watch first, otherwise there is nothing to alert you about.": { tr:"Önce bir pasaport ya da izlenecek bir ülke seç; yoksa sana haber verecek bir şey olmaz.", es:"Elige primero un pasaporte o un país que seguir; si no, no habrá nada de qué avisarte.", de:"Wähle zuerst einen Pass oder ein Land aus, sonst gibt es nichts, worüber wir dich informieren könnten.", fr:"Choisis d'abord un passeport ou un pays à suivre, sinon il n'y a rien à te signaler.", ar:"اختر أولًا جواز سفر أو بلدًا لتتابعه، وإلا فلا يوجد ما ننبهك إليه." },
    "Sign in to keep your passport, watched destinations, planned trip and Schengen calculator trips on every device. Use Google, your email and a password, or your phone number.": { tr:"Pasaportun, izlediğin ülkeler, planladığın seyahat ve Schengen hesaplayıcı seyahatlerin her cihazda seninle olsun diye giriş yap. Google'ı, e-postanı ve şifreni ya da telefon numaranı kullan.", es:"Inicia sesión para tener tu pasaporte, destinos vigilados, viaje planeado y viajes de la calculadora Schengen en todos tus dispositivos. Usa Google, tu correo y una contraseña, o tu número de teléfono.", de:"Melde dich an, damit dein Pass, deine beobachteten Ziele, dein geplanter Trip und deine Schengen-Rechner-Reisen auf jedem Gerät verfügbar bleiben. Nutze Google, deine E-Mail-Adresse und ein Passwort oder deine Telefonnummer.", fr:"Connecte-toi pour retrouver ton passeport, tes destinations suivies, ton voyage planifié et tes trajets du calculateur Schengen sur tous tes appareils. Utilise Google, ton e-mail et un mot de passe, ou ton numéro de téléphone.", ar:"سجّل الدخول للاحتفاظ بجواز سفرك، والوجهات المراقَبة، والرحلة المخطَّطة، ورحلات حاسبة شنغن على كل أجهزتك. استخدم Google أو بريدك الإلكتروني وكلمة مرور أو رقم هاتفك." },
    "Email and password": { tr:"E-posta ve şifre", es:"Correo y contraseña", de:"E-Mail und Passwort", fr:"E-mail et mot de passe", ar:"البريد الإلكتروني وكلمة المرور" },
    "Password": { tr:"Şifre", es:"Contraseña", de:"Passwort", ar:"كلمة المرور", fr:"Mot de passe" },
    "Create account": { tr:"Hesap oluştur", es:"Crear cuenta", de:"Konto erstellen", fr:"Créer un compte", ar:"إنشاء حساب" },
    "Forgot password?": { tr:"Şifreni mi unuttun?", es:"¿Olvidaste tu contraseña?", de:"Passwort vergessen?", fr:"Mot de passe oublié ?", ar:"نسيت كلمة المرور؟" },
    "Account created.": { tr:"Hesap oluşturuldu.", ar:"تم إنشاء الحساب.", es:"Cuenta creada.", de:"Konto erstellt.", fr:"Compte créé." },
    "Enter your email above, then tap “Forgot password?”.": { tr:"Yukarıya e-postanı yaz, sonra “Şifreni mi unuttun?”a dokun.", ar:"أدخل بريدك الإلكتروني أعلاه، ثم اضغط على «نسيت كلمة المرور؟».", es:"Introduce tu correo arriba y luego toca “¿Olvidaste tu contraseña?”.", de:"Gib oben deine E-Mail-Adresse ein und tippe dann auf „Passwort vergessen?“.", fr:"Saisis ton e-mail ci-dessus, puis appuie sur « Mot de passe oublié ? »." },
    "We sent a password reset link — check your inbox.": { tr:"Şifre sıfırlama bağlantısı gönderdik — gelen kutuna bak.", ar:"أرسلنا رابط إعادة تعيين كلمة المرور، تحقّق من بريدك الوارد.", es:"Te hemos enviado un enlace para restablecer la contraseña: revisa tu bandeja de entrada.", de:"Wir haben einen Link zum Zurücksetzen des Passworts gesendet, sieh in deinem Posteingang nach.", fr:"Nous avons envoyé un lien de réinitialisation du mot de passe, regarde ta boîte de réception." },
    "Phone number": { tr:"Telefon numarası", es:"Número de teléfono", de:"Telefonnummer", fr:"Numéro de téléphone", ar:"رقم الهاتف" },
    "Send code": { tr:"Kod gönder", es:"Enviar código", de:"Code senden", fr:"Envoyer le code", ar:"إرسال الرمز" },
    "We sent a code by SMS.": { tr:"SMS ile bir kod gönderdik.", ar:"أرسلنا رمزًا عبر رسالة نصية.", es:"Te hemos enviado un código por SMS.", de:"Wir haben dir einen Code per SMS gesendet.", fr:"Nous avons envoyé un code par SMS." },
    "Enter the 6-digit code": { tr:"6 haneli kodu gir", ar:"أدخل الرمز المكوَّن من 6 أرقام", es:"Introduce el código de 6 dígitos", de:"Gib den 6-stelligen Code ein", fr:"Saisis le code à 6 chiffres" },
    "Verify": { tr:"Doğrula", ar:"تحقّق", es:"Verificar", de:"Bestätigen", fr:"Vérifier" },
    "Use another number": { tr:"Başka numara kullan", ar:"استخدم رقمًا آخر", es:"Usar otro número", de:"Andere Nummer verwenden", fr:"Utiliser un autre numéro" },
    "That email and password don't match.": { tr:"Bu e-posta ve şifre eşleşmiyor.", ar:"هذا البريد الإلكتروني وكلمة المرور غير متطابقين.", es:"Ese correo y esa contraseña no coinciden.", de:"Diese E-Mail-Adresse und das Passwort passen nicht zusammen.", fr:"Cet e-mail et ce mot de passe ne correspondent pas." },
    "There is already an account with that email — sign in instead.": { tr:"Bu e-postayla zaten bir hesap var — giriş yap.", ar:"يوجد حساب بالفعل بهذا البريد الإلكتروني، سجّل الدخول بدلاً من ذلك.", es:"Ya existe una cuenta con ese correo: inicia sesión en su lugar.", de:"Es gibt bereits ein Konto mit dieser E-Mail-Adresse, melde dich stattdessen an.", fr:"Un compte existe déjà avec cet e-mail, connecte-toi plutôt." },
    "Use a password of at least 6 characters.": { tr:"En az 6 karakterlik bir şifre kullan.", ar:"استخدم كلمة مرور من 6 أحرف على الأقل.", es:"Usa una contraseña de al menos 6 caracteres.", de:"Verwende ein Passwort mit mindestens 6 Zeichen.", fr:"Utilise un mot de passe d'au moins 6 caractères." },
    "Enter your password.": { tr:"Şifreni yaz.", ar:"أدخل كلمة مرورك.", es:"Introduce tu contraseña.", de:"Gib dein Passwort ein.", fr:"Saisis ton mot de passe." },
    "Too many attempts. Wait a few minutes and try again.": { tr:"Çok fazla deneme. Birkaç dakika bekleyip tekrar dene.", ar:"محاولات كثيرة جدًا. انتظر بضع دقائق ثم حاول مرة أخرى.", es:"Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", de:"Zu viele Versuche. Warte ein paar Minuten und versuche es erneut.", fr:"Trop de tentatives. Attends quelques minutes et réessaie." },
    "That phone number doesn't look right. Include the country code, like +90 5xx xxx xx xx.": { tr:"Bu telefon numarası doğru görünmüyor. Ülke kodunu ekle, örneğin +90 5xx xxx xx xx.", ar:"رقم الهاتف هذا لا يبدو صحيحًا. أدرج رمز الدولة، مثل ‎+90 5xx xxx xx xx.", es:"Ese número de teléfono no parece correcto. Incluye el código de país, como +90 5xx xxx xx xx.", de:"Diese Telefonnummer scheint nicht korrekt zu sein. Gib die Ländervorwahl an, zum Beispiel +90 5xx xxx xx xx.", fr:"Ce numéro de téléphone ne semble pas correct. Inclus l'indicatif du pays, par exemple +90 5xx xxx xx xx." },
    "That code isn't right.": { tr:"Bu kod doğru değil.", ar:"هذا الرمز غير صحيح.", es:"Ese código no es correcto.", de:"Dieser Code ist nicht richtig.", fr:"Ce code n'est pas correct." },
    "That code has expired. Ask for a new one.": { tr:"Bu kodun süresi doldu. Yenisini iste.", ar:"انتهت صلاحية هذا الرمز. اطلب رمزًا جديدًا.", es:"Ese código ha caducado. Solicita uno nuevo.", de:"Dieser Code ist abgelaufen. Fordere einen neuen an.", fr:"Ce code a expiré. Demande-en un nouveau." },
    "We can't send a code right now. Try another sign-in method or try again later.": { tr:"Şu an kod gönderemiyoruz. Başka bir giriş yöntemi dene ya da sonra tekrar dene.", ar:"لا يمكننا إرسال رمز الآن. جرّب طريقة تسجيل دخول أخرى أو حاول لاحقًا.", es:"No podemos enviar un código ahora mismo. Prueba otro método de inicio de sesión o inténtalo más tarde.", de:"Wir können gerade keinen Code senden. Versuche eine andere Anmeldemethode oder versuche es später erneut.", fr:"Nous ne pouvons pas envoyer de code pour le moment. Essaie une autre méthode de connexion ou réessaie plus tard." },
    "This sign-in method isn't switched on yet.": { tr:"Bu giriş yöntemi henüz açık değil.", ar:"طريقة تسجيل الدخول هذه غير مفعَّلة بعد.", es:"Este método de inicio de sesión aún no está activado.", de:"Diese Anmeldemethode ist noch nicht aktiviert.", fr:"Cette méthode de connexion n'est pas encore activée." },
  };

  // Attribute-translation map: { selector: ["attr1", "attr2"] }
  const ATTR_TARGETS = [
    { sel: "[placeholder]", attr: "placeholder" },
    { sel: "[title]",       attr: "title" },
    { sel: "[aria-label]",  attr: "aria-label" },
    { sel: "input[type=button][value], input[type=submit][value]", attr: "value" },
  ];

  // Normalised dictionary: collapse internal whitespace in keys once, so a
  // multi-line HTML paragraph (with newlines + indentation in its text node)
  // still matches a single-spaced dictionary key. Built lazily.
  let _normDict = null;
  function normDict() {
    if (_normDict) return _normDict;
    _normDict = {};
    for (const k in DICT) _normDict[k.replace(/\s+/g, " ").trim()] = DICT[k];
    return _normDict;
  }
  function lookup(en, lang) {
    if (lang === "en") return null;
    let entry = DICT[en];
    if (!entry) entry = normDict()[en.replace(/\s+/g, " ").trim()];
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

  // In a right-to-left page, a block that is still English must not be laid out
  // right-to-left: its full stop lands on the wrong end and it hugs the wrong
  // edge. Blocks with no Arabic in them get their own direction; blocks that
  // carry Arabic (even with an English brand name in them) inherit rtl.
  var BLOCKS = "p, li, h1, h2, h3, h4, h5, h6, td, th, summary, dt, dd, figcaption, label, .callout, .fine, .sub, .meta, .lead";
  function fixMixedDirection(lang) {
    document.querySelectorAll("[data-atlas-dir]").forEach(function (el) {
      el.removeAttribute("dir"); el.removeAttribute("data-atlas-dir");
    });
    if (lang !== "ar") return;
    document.body.querySelectorAll(BLOCKS).forEach(function (el) {
      if (el.closest("[data-no-i18n]") || el.querySelector(BLOCKS)) return; // innermost block decides
      var text = el.textContent || "";
      if (/[\u0600-\u06FF]/.test(text) || !/[A-Za-z]{3}/.test(text)) return;
      el.setAttribute("dir", "ltr");
      el.setAttribute("data-atlas-dir", "");
    });
  }

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
    fixMixedDirection(lang);
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

  // Public hook for the masthead language select (assets/site-chrome.js).
  window.ATLAS_STATIC_I18N = { apply: (code) => applyLang(code) };

  function init() {
    const lang = currentLang();
    // Pages stamped with the shared masthead get theme + language controls
    // from assets/site-chrome.js and their colours from tokens.css. Only an
    // un-stamped legacy page still needs the injected palette + switcher.
    if (!document.querySelector("[data-lang-select]")) {
      const theme = currentTheme();
      injectThemeCSS();
      applyTheme(theme);
      injectSwitcher(lang, theme);
    }
    applyLang(lang);
    setupObserver();
    // Listen for cross-tab theme changes (StorageEvent fires when another tab
    // writes to localStorage). Keeps theme synced if the SPA is open elsewhere.
    window.addEventListener("storage", (e) => {
      if (e.key === "atlas.tweaks" && !document.querySelector("[data-lang-select]")) applyTheme(currentTheme());
      if (e.key === "atlas.lang")   applyLang(currentLang());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
