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

  function applyLang(lang) {
    // Always restore first so re-applies don't double-translate.
    restoreOriginal(document.body);
    if (lang !== "en") {
      translateTextNodes(document.body, lang);
      translateAttributes(document.body, lang);
    }
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
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
    const themeBtn = document.createElement("button");
    themeBtn.type = "button";
    themeBtn.title = "Toggle theme";
    themeBtn.style.cssText =
      "background:transparent;border:none;cursor:pointer;font-size:14px;" +
      "color:var(--fg,#0f1722);padding:4px 8px;border-radius:6px;";
    themeBtn.textContent = theme === "light" ? "☀" : "☾";
    themeBtn.addEventListener("click", () => {
      const cur = document.body.classList.contains("theme-dark") ? "dark" : "light";
      const next = cur === "light" ? "dark" : "light";
      try {
        const tw = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
        tw.background = next;
        localStorage.setItem("atlas.tweaks", JSON.stringify(tw));
      } catch (e) {}
      applyTheme(next);
      themeBtn.textContent = next === "light" ? "☀" : "☾";
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
