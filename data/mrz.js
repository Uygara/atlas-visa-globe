// Machine-readable zone (MRZ) for the passport card — shared by the map panel
// (components/panel.jsx) and the generated /passport/ pages (scripts/generate-seo.js,
// which loads this file in a Node vm), so a passport looks the same everywhere.
//
// Two 44-character lines built from real data: issuing state + country name, then
// the passport's status counts and the snapshot date. Load after countries.js and
// passports.js (needs window.byIso2, window.tally, window.SNAPSHOT_DATE).

(function () {
  // ICAO issuing-state codes. (Germany is "D" in real MRZs.) Unknown → ISO2 + filler.
  var ISO3 = {};
  ("AF:AFG,AL:ALB,DZ:DZA,AD:AND,AO:AGO,AG:ATG,AR:ARG,AM:ARM,AU:AUS,AT:AUT,AZ:AZE,BS:BHS,BH:BHR,BD:BGD,BB:BRB,BY:BLR,BE:BEL,BZ:BLZ,BJ:BEN,BT:BTN,BO:BOL,BA:BIH,BW:BWA,BR:BRA,BN:BRN,BG:BGR,BF:BFA,BI:BDI,CV:CPV,KH:KHM,CM:CMR,CA:CAN,CF:CAF,TD:TCD,CL:CHL,CN:CHN,CO:COL,KM:COM,CG:COG,CD:COD,CR:CRI,CI:CIV,HR:HRV,CU:CUB,CY:CYP,CZ:CZE,DK:DNK,DJ:DJI,DM:DMA,DO:DOM,EC:ECU,EG:EGY,SV:SLV,GQ:GNQ,ER:ERI,EE:EST,SZ:SWZ,ET:ETH,FJ:FJI,FI:FIN,FR:FRA,GA:GAB,GM:GMB,GE:GEO,DE:D<<,GH:GHA,GR:GRC,GD:GRD,GT:GTM,GN:GIN,GW:GNB,GY:GUY,HT:HTI,HN:HND,HU:HUN,IS:ISL,IN:IND,ID:IDN,IR:IRN,IQ:IRQ,IE:IRL,IL:ISR,IT:ITA,JM:JAM,JP:JPN,JO:JOR,KZ:KAZ,KE:KEN,KI:KIR,KP:PRK,KR:KOR,KW:KWT,KG:KGZ,LA:LAO,LV:LVA,LB:LBN,LS:LSO,LR:LBR,LY:LBY,LI:LIE,LT:LTU,LU:LUX,MG:MDG,MW:MWI,MY:MYS,MV:MDV,ML:MLI,MT:MLT,MH:MHL,MR:MRT,MU:MUS,MX:MEX,FM:FSM,MD:MDA,MC:MCO,MN:MNG,ME:MNE,MA:MAR,MZ:MOZ,MM:MMR,NA:NAM,NR:NRU,NP:NPL,NL:NLD,NZ:NZL,NI:NIC,NE:NER,NG:NGA,MK:MKD,NO:NOR,OM:OMN,PK:PAK,PW:PLW,PS:PSE,PA:PAN,PG:PNG,PY:PRY,PE:PER,PH:PHL,PL:POL,PT:PRT,QA:QAT,RO:ROU,RU:RUS,RW:RWA,KN:KNA,LC:LCA,VC:VCT,WS:WSM,SM:SMR,ST:STP,SA:SAU,SN:SEN,RS:SRB,XK:RKS,SC:SYC,SL:SLE,SG:SGP,SK:SVK,SI:SVN,SB:SLB,SO:SOM,ZA:ZAF,SS:SSD,ES:ESP,LK:LKA,SD:SDN,SR:SUR,SE:SWE,CH:CHE,SY:SYR,TW:TWN,TJ:TJK,TZ:TZA,TH:THA,TL:TLS,TG:TGO,TO:TON,TT:TTO,TN:TUN,TR:TUR,TM:TKM,TV:TUV,UG:UGA,UA:UKR,AE:ARE,GB:GBR,US:USA,UY:URY,UZ:UZB,VU:VUT,VA:VAT,VE:VEN,VN:VNM,YE:YEM,ZM:ZMB,ZW:ZWE,HK:HKG,MO:MAC")
    .split(",").forEach(function (p) { var kv = p.split(":"); ISO3[kv[0]] = kv[1]; });

  // Names as the issuing state writes them in the MRZ, where they differ from
  // the English display name (Türkiye's passports say TURKIYE since 2022).
  var MRZ_NAME = { TR: "TURKIYE" };

  window.mrzLines = function (iso2) {
    var c = window.byIso2 && window.byIso2[iso2];
    var raw = MRZ_NAME[iso2] || (c && c.name) || iso2;
    var name = String(raw)
      .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i")
      .toUpperCase().replace(/[^A-Z]+/g, "<");
    var code = ISO3[iso2] || (iso2 + "<");
    var l1 = ("P<" + code + name + "<<").padEnd(44, "<").slice(0, 44);
    var t = window.tally ? window.tally(iso2) : null;
    var pad = function (n) { return String(n || 0).padStart(3, "0"); };
    var body = t
      ? ["IDC" + pad(t.idc), "VF" + pad(t.vf), "ETA" + pad(t.eta), "EV" + pad(t.ev), "VOA" + pad(t.voa), "VR" + pad(t.vr)].join("<")
      : "";
    var date = String(window.SNAPSHOT_DATE || "").replace(/-/g, "").slice(2, 8);
    var l2 = (body + "<<").padEnd(38, "<").slice(0, 38) + date.padStart(6, "<");
    return [l1, l2];
  };
})();
