// Visa application checklists, per (passport, destination) pair.
// Pilot: Turkish → Schengen tourist visa (Type C, short stay).
//
// Schema:
//   sections: [{
//     name:        section heading (e.g. "Identity & passport")
//     items: [{
//       label:     required document name
//       desc:      short explainer (why, what counts)
//       conditional: if set, only required when condition met
//                    (e.g. "employed", "self-employed", "minor")
//     }]
//   }]
//
// Designed to support more pilots over time without schema change.

window.VISA_CHECKLISTS = {
  "TR-SCHENGEN": {
    title: "Schengen Tourist Visa — Turkish citizens",
    titleTr: "Schengen Turist Vizesi — Türkiye Cumhuriyeti vatandaşları",
    intro: "Schengen short-stay (Type C) visa, tourist purpose, valid for any of the 29 Schengen Area states. Apply at the consulate of the country where you'll spend the most days. This list reflects the documentation a Turkish citizen typically needs in 2026.",
    introTr: "Schengen kısa süreli (Tip C) turist vizesi, 29 Schengen üyesi ülkesinin herhangi birinde geçerlidir. Başvuru, en çok zaman geçireceğin ülkenin konsolosluğuna yapılır. Aşağıdaki liste 2026'da Türk vatandaşlarının tipik olarak ihtiyaç duyduğu belgeleri yansıtır.",
    sections: [
      {
        name: "Identity & passport",
        nameTr: "Kimlik & pasaport",
        items: [
          { label: "Schengen visa application form, completed and signed",
            labelTr: "Doldurulmuş ve imzalanmış Schengen vize başvuru formu",
            desc: "Download from the consulate's site or VFS. Every Schengen state uses the same form." },
          { label: "Passport, valid 3+ months past return, 2+ blank pages, issued in last 10 years",
            labelTr: "Pasaport: dönüş tarihinden sonra en az 3 ay geçerli, en az 2 boş sayfa, son 10 yılda düzenlenmiş",
            desc: "If your passport is older than 10 years, renew it first." },
          { label: "Copy of passport's data page + previous Schengen visa pages",
            labelTr: "Pasaport kimlik sayfası fotokopisi + önceki Schengen vize sayfaları" },
          { label: "Old passports (if any) with previous Schengen visas",
            labelTr: "Önceki Schengen vizelerin olduğu eski pasaportlar (varsa)" },
          { label: "2 biometric passport-size photos (ICAO standard, recent)",
            labelTr: "2 adet biyometrik vesikalık (ICAO standardı, son 6 ay içinde çekilmiş)",
            desc: "35×45 mm, white background, no glasses." },
          { label: "Turkish ID card (Nüfus cüzdanı) + photocopy",
            labelTr: "Nüfus cüzdanı + fotokopi" },
        ],
      },
      {
        name: "Travel insurance",
        nameTr: "Seyahat sigortası",
        items: [
          { label: "Travel medical insurance — €30,000 minimum coverage, valid in all Schengen",
            labelTr: "Seyahat sağlık sigortası — en az €30.000 teminat, tüm Schengen'de geçerli",
            desc: "Must cover repatriation. Buy from a Turkish insurer (Aksigorta, Anadolu Sigorta) or via VFS — €25-40 typical." },
        ],
      },
      {
        name: "Itinerary & accommodation",
        nameTr: "Rota & konaklama",
        items: [
          { label: "Flight reservation (round-trip) — reservation only, not paid ticket",
            labelTr: "Uçak rezervasyonu (gidiş-dönüş) — sadece rezervasyon, ödenmiş bilet değil",
            desc: "Travel agency or services like onwardticket.com provide refundable reservations for €15-30. Don't buy the actual ticket before approval." },
          { label: "Hotel reservations for full stay, OR rental contract, OR friend/family invitation",
            labelTr: "Tüm konaklama süresince otel rezervasyonu, VEYA kira sözleşmesi, VEYA arkadaş/aile davetiyesi",
            desc: "Booking.com 'free cancellation' reservations work for the visa stage." },
          { label: "Detailed day-by-day itinerary",
            labelTr: "Günlük detaylı seyahat planı",
            desc: "Cities, dates, transport between them. A simple table is fine." },
        ],
      },
      {
        name: "Financial proof",
        nameTr: "Mali durum belgeleri",
        items: [
          { label: "Bank statements — last 3 months, stamped by the bank",
            labelTr: "Banka hesap dökümü — son 3 ay, banka mühürlü",
            desc: "Minimum €50/day in your account is a common benchmark; check the specific consulate." },
          { label: "Salary slips — last 3 months",
            labelTr: "Maaş bordroları — son 3 ay",
            conditional: "employed" },
          { label: "Title deeds, vehicle registration (optional financial strength evidence)",
            labelTr: "Tapu, araç ruhsatı (opsiyonel mali güç kanıtı)" },
        ],
      },
      {
        name: "Employment / profession",
        nameTr: "İş & meslek",
        items: [
          { label: "Employer letter — confirming employment, salary, position, leave dates, signed/stamped",
            labelTr: "İşveren yazısı — istihdam, maaş, pozisyon, izin tarihleri; imzalı/mühürlü",
            conditional: "employed" },
          { label: "SGK service breakdown (SGK Hizmet Dökümü) from e-Devlet",
            labelTr: "e-Devlet'ten SGK Hizmet Dökümü",
            conditional: "employed" },
          { label: "Trade registry gazette, tax records, signature circular",
            labelTr: "Ticaret sicil gazetesi, vergi levhası, imza sirküleri",
            conditional: "self-employed" },
          { label: "Student certificate (öğrenci belgesi) + parent's documents",
            labelTr: "Öğrenci belgesi + ebeveyn belgeleri",
            conditional: "student" },
          { label: "Pension statement (SGK emekli belgesi)",
            labelTr: "SGK emekli belgesi",
            conditional: "retired" },
        ],
      },
      {
        name: "If travelling with minors",
        nameTr: "Reşit olmayan ile seyahatte",
        items: [
          { label: "Birth certificate (apostilled if required)",
            labelTr: "Doğum belgesi (gerekirse apostilli)",
            conditional: "minor" },
          { label: "Notarised parental consent (if travelling with only one parent or alone)",
            labelTr: "Noter onaylı veli muvafakati (tek ebeveyn veya yalnız seyahatte)",
            conditional: "minor" },
        ],
      },
      {
        name: "Application & fees",
        nameTr: "Başvuru & ücretler",
        items: [
          { label: "Visa fee — €90 adult / €45 children 6-12 / free under 6",
            labelTr: "Vize ücreti — yetişkin €90 / 6-12 yaş €45 / 6 yaş altı ücretsiz",
            desc: "Plus a VFS service fee €30-40 depending on the country." },
          { label: "Biometric appointment at VFS / consulate (fingerprints, photo)",
            labelTr: "VFS / konsoloslukta biyometrik randevu (parmak izi, fotoğraf)",
            desc: "Required every 59 months. If you've given biometrics in the last 5 years for any Schengen visa, you may be exempt." },
          { label: "Cover letter explaining purpose of trip",
            labelTr: "Seyahat amacını açıklayan başvuru mektubu",
            desc: "1 page, your story: who you are, where you're going, why, with what proof of return." },
        ],
      },
    ],
    sources: [
      { label: "EU Visa Code (Regulation 810/2009)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R0810" },
      { label: "Germany consulate Türkiye", url: "https://tuerkei.diplo.de/" },
      { label: "France visas TR", url: "https://france-visas.gouv.fr/" },
      { label: "VFS Global Türkiye", url: "https://www.vfsglobal.com/en/individuals/index.html" },
    ],
    lastReviewed: "2026-05-24",
  },
};
