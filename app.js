/* ═══════════════════════════════════════════
   HUKUK PRO — app.js  (Düzeltilmiş Sürüm)
═══════════════════════════════════════════ */
'use strict';

/* ── Yardımcılar ── */
const fmt = n => (parseFloat(n)||0).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' TL';
const gv  = id => { const e=document.getElementById(id); return e ? e.value : ''; };
const sv  = (id,v) => { const e=document.getElementById(id); if(e) e.innerHTML=v; };
const st  = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
const tarihFmt = s => {
  if (!s) return '…';
  try { return new Date(s).toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric'}); }
  catch { return s; }
};
const esc = s => String(s || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const dosyaAdi = s => String(s || 'belge').toLowerCase()
  .replace(/[çğıöşü]/g, ch => ({ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u'}[ch]))
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'belge';

let aktifBelge = { baslik:'Belge', html:'', tip:'belge' };

function belgeSayfasiHTML(baslik, html, toolbar=false) {
  const araclar = toolbar ? `
    <div class="print-toolbar">
      <button onclick="window.print()">PDF / Yazdır</button>
      <button onclick="const b=new Blob([document.documentElement.outerHTML],{type:'application/msword;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='${dosyaAdi(baslik)}.doc';a.click();">Word</button>
    </div>` : '';
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(baslik)}</title>
  <style>
    body{margin:0;background:#f5f0e0;color:#111;font-family:"Times New Roman",serif}
    .print-toolbar{position:sticky;top:0;z-index:5;background:#0c1f3f;padding:10px;display:flex;gap:8px;justify-content:flex-end}
    .print-toolbar button{border:1px solid #c9a84c;background:#c9a84c;color:#0c1f3f;border-radius:4px;padding:8px 12px;font:700 13px sans-serif}
    .paper{max-width:800px;margin:18px auto;background:#fff;padding:2cm;font-size:13px;line-height:1.9;box-shadow:0 8px 30px rgba(0,0,0,.15)}
    pre{white-space:pre-wrap;font-family:inherit;font-size:inherit;line-height:inherit}
    @media print{body{background:#fff}.print-toolbar{display:none}.paper{box-shadow:none;margin:0;padding:0}}
  </style></head><body>${araclar}<div class="paper">${html}</div></body></html>`;
}

function belgeModalAc(baslik, html, tip='belge') {
  aktifBelge = { baslik, html, tip };
  st('doc-title', baslik);
  sv('doc-paper', html);
  const modal = document.getElementById('doc-modal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden','false');
  }
}

function belgeModalKapat() {
  const modal = document.getElementById('doc-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden','true');
  }
}

function belgePencereAc(baslik=aktifBelge.baslik, html=aktifBelge.html) {
  if (!html) { toast('Önce bir belge seçin.','hata'); return; }
  const w = window.open('', '_blank');
  if (!w) { belgeModalAc(baslik, html); toast('Ayrı pencere engellendi; önizleme açıldı.','bilgi'); return; }
  w.document.open();
  w.document.write(belgeSayfasiHTML(baslik, html, true));
  w.document.close();
}

function belgeWordIndir(baslik=aktifBelge.baslik, html=aktifBelge.html) {
  if (!html) { toast('Word için önce bir belge seçin.','hata'); return; }
  const blob = new Blob([belgeSayfasiHTML(baslik, html, false)], {type:'application/msword;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dosyaAdi(baslik) + '.doc';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1500);
  toast('Word dosyası hazırlandı.','basari');
}

function belgePdfYazdir(baslik=aktifBelge.baslik, html=aktifBelge.html) {
  if (!html) { toast('PDF/Yazdır için önce bir belge seçin.','hata'); return; }
  const w = window.open('', '_blank');
  if (!w) { toast('Safari açılır pencereyi engelledi. Önce Pencere butonunu deneyin.','hata'); return; }
  w.document.open();
  w.document.write(belgeSayfasiHTML(baslik, html, false));
  w.document.close();
  setTimeout(()=>w.print(), 350);
}

function suruklenebilirOnizleme() {
  const card = document.getElementById('doc-card');
  const drag = document.getElementById('doc-drag');
  if (!card || !drag) return;
  let aktif=false, sx=0, sy=0, ox=0, oy=0;
  drag.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    aktif = true; sx = e.clientX; sy = e.clientY;
    const r = card.getBoundingClientRect(); ox = r.left; oy = r.top;
    card.style.position = 'fixed'; card.style.left = ox + 'px'; card.style.top = oy + 'px'; card.style.margin = '0';
    drag.setPointerCapture(e.pointerId);
  });
  drag.addEventListener('pointermove', e => {
    if (!aktif) return;
    card.style.left = Math.max(0, ox + e.clientX - sx) + 'px';
    card.style.top = Math.max(0, oy + e.clientY - sy) + 'px';
  });
  drag.addEventListener('pointerup', e => { aktif = false; try { drag.releasePointerCapture(e.pointerId); } catch {} });
}

/* ── Toast bildirim ── */
function toast(msg, tip='bilgi') {
  const el = document.createElement('div');
  const renkler = {bilgi:'#1e3c72',basari:'#1e5c3a',hata:'#7a1a1a'};
  Object.assign(el.style, {
    position:'fixed',bottom:'30px',right:'20px',zIndex:'9999',
    background: renkler[tip]||renkler.bilgi,
    color:'#fff',padding:'10px 18px',borderRadius:'5px',
    fontSize:'12px',fontFamily:'sans-serif',fontWeight:'600',
    boxShadow:'0 4px 16px rgba(0,0,0,.3)',transition:'opacity .3s'
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 2800);
}

/* ══════════════════════════════════════════
   BÖLÜM 0 — KARAR ÖRNEKLERİ HTML ÜRETİCİLERİ
   (ORNEKLER nesnesinden ÖNCE tanımlanmalı!)
══════════════════════════════════════════ */
function kararSargi(mhk,esas,kno,hakim,davaci,davali,dava,deger,iddia,savunma,gerekce,kanun,hukumHTML,katip,tarih,hakimImza) {
  return `<div style="background:#fff;border:1px solid #d4c5a0;border-radius:4px;box-shadow:0 4px 20px rgba(12,31,63,.12);padding:36px 44px;font-family:'Times New Roman',serif;font-size:12.5px;line-height:1.9;max-width:800px;margin:0 auto">
    <div style="text-align:center;font-weight:bold;font-size:14px;letter-spacing:4px;margin-bottom:3px">T.C.</div>
    <div style="text-align:center;font-weight:bold;font-size:13px;border-bottom:2.5px solid #000;padding-bottom:9px;margin-bottom:16px">${mhk}</div>
    <div style="display:grid;grid-template-columns:130px 1fr;gap:2px 6px;font-size:12px;margin-bottom:12px;line-height:1.7">
      <span style="font-weight:700">ESAS NO</span><span>: ${esas}</span>
      <span style="font-weight:700">KARAR NO</span><span>: ${kno}</span>
      <span style="font-weight:700">HÂKİM</span><span>: ${hakim}</span>
    </div>
    <hr style="border:none;border-top:1px solid #ccc;margin:12px 0">
    <div style="display:grid;grid-template-columns:130px 1fr;gap:2px 6px;font-size:12px;margin-bottom:12px;line-height:1.7">
      <span style="font-weight:700">DAVACI</span><span>: ${davaci}</span>
      <span style="font-weight:700">DAVALI</span><span>: ${davali}</span>
      <span style="font-weight:700">DAVA</span><span>: ${dava}</span>
      <span style="font-weight:700">DEĞER</span><span>: ${deger}</span>
    </div>
    <hr style="border:none;border-top:1px solid #ccc;margin:12px 0">
    <div style="font-weight:bold;font-size:11px;text-decoration:underline;text-transform:uppercase;letter-spacing:.4px;margin:14px 0 7px">TARAFLARIN İDDİA VE SAVUNMALARININ ÖZETİ</div>
    <p style="text-align:justify;margin-bottom:7px;text-indent:20px">${iddia}</p>
    <p style="text-align:justify;margin-bottom:7px;text-indent:20px">${savunma}</p>
    <div style="font-weight:bold;font-size:11px;text-decoration:underline;text-transform:uppercase;letter-spacing:.4px;margin:14px 0 7px">DELİLLERİN DEĞERLENDİRİLMESİ VE GEREKÇE</div>
    <p style="text-align:justify;margin-bottom:7px;text-indent:20px">${gerekce}</p>
    <div style="background:#f0f4ff;border-left:4px solid #1a3a8a;padding:7px 10px;font-size:11px;font-family:sans-serif;margin:8px 0;border-radius:0 3px 3px 0"><strong>Kanuni Dayanak:</strong> ${kanun}</div>
    <div style="border:2.5px solid #000;border-radius:3px;padding:16px 20px;margin:16px 0;background:#fafaf7">
      <div style="text-align:center;font-weight:bold;font-size:14px;letter-spacing:3px;border-bottom:2px solid #000;padding-bottom:9px;margin-bottom:11px">H Ü K Ü M</div>
      <p style="text-align:center;font-size:10px;color:#888;margin-bottom:10px;font-family:sans-serif">Yukarıda açıklanan gerekçe ile;</p>
      ${hukumHTML}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px;padding-top:14px;border-top:1px solid #ccc">
      <div style="text-align:center;font-size:11px"><div style="border-top:1px solid #000;width:130px;margin:0 auto 4px"></div><small>KÂTİP<br>${katip}</small></div>
      <div style="text-align:center;font-size:12px;font-weight:700">${tarih}</div>
      <div style="text-align:center;font-size:11px"><div style="border-top:1px solid #000;width:130px;margin:0 auto 4px"></div><small>HÂKİM<br>${hakimImza}</small></div>
    </div>
  </div>`;
}

function hItem(n, cls, html) {
  return `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n}.</strong> <span style="color:${cls};font-weight:700">${html}</span></div>`;
}
const KC='#1e5c3a', RC='#7a1a1a', TC='#1a3a8a', YC='#1e5c3a';

/* ── Karar Örnekleri Üreticiler ── */
function buildKabul() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KABULÜNE</strong>'),
    hItem(n++,TC,'<strong>320.000,00 TL</strong> tazminatın dava tarihi 03.01.2023\'den yasal faiziyle davalıdan tahsiline'),
    hItem(n++,TC,'<strong>21.859,20 TL</strong> yargılama harcının davalıdan tahsiline'),
    hItem(n++,TC,'<strong>8.430,00 TL</strong> yargılama giderinin davalıdan alınarak davacıya verilmesine'),
    hItem(n++,TC,'<strong>32.000,00 TL</strong> vekâlet ücretinin davalıdan alınarak davacıya verilmesine'),
    hItem(n++,YC,'Tebliğden itibaren <strong>2 hafta</strong> içinde İstanbul BAM nezdinde <strong>İSTİNAF YOLU AÇIK</strong> olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">18/09/2024</span></div>`
  ].join('');
  return kararSargi('İSTANBUL ANADOLU 5. ASLİYE HUKUK MAHKEMESİ','2023/1456 Esas','2024/892 Karar',
    'Zeynep ARSLAN (47521)','Ahmet YILMAZ','MEGA İNŞAAT A.Ş.','Sözleşmeden Doğan Tazminat','320.000,00 TL',
    'Davacı vekili dava dilekçesinde; müvekkili ile davalı şirket arasında 15.03.2021 tarihinde akdedilen inşaat sözleşmesi uyarınca 350.000 TL ödeme yapıldığını, sözleşme gereği 31.12.2022 tarihine kadar teslim edilmesi gereken konutun teslim edilmediğini, bu nedenle 320.000 TL tazminat talep etmiştir.',
    'Davalı vekili; teslim gecikmesinin mücbir sebepten kaynaklandığını ileri sürerek davanın reddini talep etmiştir.',
    'Bilirkişi raporu (27.06.2024) incelendiğinde gecikmede davalı kusuru bulunduğu, mücbir sebebin şartlarının oluşmadığı anlaşılmıştır.',
    'TBK m.112, m.117-126, HMK m.26, m.326', h, 'Murat KAYA','18/09/2024','Zeynep ARSLAN — 47521');
}
function buildRed() {
  let n=1;
  const h = [
    hItem(n++,RC,'Davanın <strong>REDDİNE</strong>'),
    hItem(n++,TC,'<strong>5.812,40 TL</strong> yargılama harcının davacıdan tahsiline'),
    hItem(n++,TC,'<strong>12.750,00 TL</strong> vekâlet ücretinin davacıdan alınarak davalıya verilmesine'),
    hItem(n++,YC,'Tebliğden itibaren <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">22/04/2024</span></div>`
  ].join('');
  return kararSargi('ANKARA 3. ASLİYE HUKUK MAHKEMESİ','2022/3245','2024/1102',
    'Hasan ÇELİK (52341)','Selma DEMİR','TÜKETİM MAĞAZACILIK A.Ş.','Ayıplı Mal Tazminatı','85.000,00 TL',
    'Davacı; satın aldığı buzdolabının 3 ay içinde arızalandığını, garanti kapsamı dışında tutulduğunu ileri sürerek tazminat talep etmiştir.',
    'Davalı; arızanın kullanıcı hatasından kaynaklandığını savunmuştur.',
    'Bilirkişi incelemesi sonucunda arızanın üretim hatasından değil kullanıcı hatasından kaynaklandığı tespit edilmiştir.',
    'TBK m.219, m.227, 6502 K. m.56', h, 'Ayşe NUR','22/04/2024','Hasan ÇELİK — 52341');
}
function buildKismen() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KISMİ KABULÜNE</strong>'),
    hItem(n++,RC,'Maddi tazminat talebinin <strong>REDDİNE</strong>'),
    hItem(n++,TC,'<strong>75.000,00 TL</strong> manevi tazminatın karar tarihinden yasal faiziyle tahsiline (Kabul: <strong>%37,5</strong>)'),
    hItem(n++,TC,'Harç ve giderlerin kabul-red oranında paylaştırılmasına'),
    hItem(n++,TC,'Kabul için <strong>11.250,00 TL</strong> vekâlet ücreti davalıdan; red için <strong>17.500,00 TL</strong> vekâlet ücreti davacıdan'),
    hItem(n++,YC,'Tebliğden <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">14/11/2024</span></div>`
  ].join('');
  return kararSargi('İZMİR 2. ASLİYE HUKUK MAHKEMESİ','2023/567','2024/334',
    'Selin ÖZTÜRK (63214)','Burak KARA','MEDYA YAYINCILIK A.Ş.','Kişilik Hakkı İhlali — Manevi Tazminat','250.000,00 TL (Talep)',
    'Davacı; davalı yayın organının yayımladığı haberin kişilik haklarını ihlal ettiğini, 50.000 TL maddi + 200.000 TL manevi tazminat talep etmiştir.',
    'Davalı; yayının gerçek ve kamu yararına ilişkin olduğunu savunmuştur.',
    'Kişilik hakkı ihlali sabit olmakla birlikte maddi zarar için yeterli delil sunulamamıştır. Manevi tazminat hakkaniyet ilkesi çerçevesinde 75.000 TL olarak takdir edilmiştir.',
    'TMK m.24-25, TBK m.58, HMK m.327', h, 'Kâtip','14/11/2024','Selin ÖZTÜRK — 63214');
}
function buildNafaka() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KABULÜNE</strong>'),
    hItem(n++,TC,'Müşterek çocuk <strong>Defne ŞAHIN</strong> için aylık <strong>8.500,00 TL İŞTİRAK NAFAKASINA</strong>'),
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Her yılın Ocak ayında TÜFE artış oranında artırılmasına</div>`,
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Her ayın 1. günü banka havalesi ile ödenmesine</div>`,
    hItem(n++,TC,'Maktu harç <strong>680,00 TL</strong> davacıdan tahsiline; <strong>5.100,00 TL</strong> vekâlet ücreti davalıdan davacıya'),
    hItem(n++,YC,'Tebliğden <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">08/10/2024</span></div>`
  ].join('');
  return kararSargi('BURSA 4. AİLE MAHKEMESİ','2024/234','2024/456',
    'Gül ACAR (31456)','Elif ŞAHIN','Tarık ŞAHIN','İştirak Nafakası','—',
    'Davacı vekili; müşterek çocuk Defne için aylık 8.500 TL iştirak nafakası talep etmiştir.',
    'Davalı; talep edilen tutarın fazla olduğunu savunmuştur.',
    'Tarafların ekonomik durumları ve çocuğun ihtiyaçları gözetilerek nafaka miktarı belirlenmiştir.',
    'TMK m.182/2, m.176', h, 'Kâtip','08/10/2024','Gül ACAR — 31456');
}
function buildTapuIptal() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KABULÜNE</strong>'),
    hItem(n++,RC,'<strong>Konya/Selçuklu 1234 Ada, 45 Parsel</strong> taşınmazın davalı adına olan tapu kaydının <strong>İPTALİNE</strong>'),
    hItem(n++,KC,'Taşınmazın davacı <strong>Zeynep KAYA</strong> adına <strong>TESCİLİNE</strong>'),
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Konya Tapu Sicil Müdürlüğü\'ne tescil müzekkeresi yazılmasına</div>`,
    hItem(n++,TC,'<strong>38.720,00 TL</strong> yargılama harcı davalıdan tahsiline'),
    hItem(n++,TC,'<strong>28.500,00 TL</strong> vekâlet ücreti davalıdan alınarak davacıya verilmesine'),
    hItem(n++,YC,'Tebliğden <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">07/08/2024</span></div>`
  ].join('');
  return kararSargi('KONYA 2. ASLİYE HUKUK MAHKEMESİ','2022/1890','2024/654',
    'Mehmet TOPRAK (41236)','Zeynep KAYA','Mustafa YILMAZ','Tapu İptali ve Tescil','2.200.000,00 TL',
    'Davacı vekili; davalının hile ile vekâletnameyi kullanarak taşınmazı kendi adına tescil ettirdiğini ileri sürmüştür.',
    'Davalı vekili; devrin yasal yollarla gerçekleştiğini, iyiniyetli iktisabın korunması gerektiğini savunmuştur.',
    'Grafoloji bilirkişi raporu imzanın davacıya ait olmadığını ortaya koymuştur; TMK m.1023 uygulama imkânı bulunmamaktadır.',
    'TMK m.705, m.1023, TBK m.36, Tapu K. m.26', h, 'Kâtip','07/08/2024','Mehmet TOPRAK — 41236');
}
function buildZamanasiimi() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KABULÜNE</strong>'),
    hItem(n++,KC,'<strong>Trabzon/Akçaabat, 567 Ada, 12 Parsel</strong> 2.200 m² taşınmazın davacı <strong>Ali KARADENİZ</strong> adına <strong>TESCİLİNE</strong>'),
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Trabzon Tapu Müdürlüğü\'ne tescil müzekkeresi yazılmasına</div>`,
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Yargılama gideri Hazine üzerinde bırakılmasına</div>`,
    hItem(n++,YC,'Tebliğden <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">29/05/2024</span></div>`
  ].join('');
  return kararSargi('TRABZON 1. ASLİYE HUKUK MAHKEMESİ','2020/456','2024/210',
    'Hüseyin DEMİR (33567)','Ali KARADENİZ','Hazine','Kazandırıcı Zamanaşımı (MK m.713)','—',
    'Davacı; tapusuz taşınmazı 20 yılı aşan süre boyunca kesintisiz malik sıfatıyla kullandığını ispatlayarak tescil talep etmiştir.',
    'Hazine vekili; taşınmazın orman sayılan yer olduğunu ileri sürerek itiraz etmiştir.',
    'Keşif ve bilirkişi incelemesi sonucunda taşınmazın orman sayılan yer olmadığı, davacının 20 yılı aşkın süredir zilyedi olduğu saptanmıştır.',
    'TMK m.713/1, Kadastro K. m.14', h, 'Kâtip','29/05/2024','Hüseyin DEMİR — 33567');
}
function buildGecit() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KABULÜNE</strong>'),
    hItem(n++,KC,'Bilirkişi krokisinde gösterilen güzergâhta <strong>2,5 m genişlik</strong> geçit hakkı tesisine'),
    hItem(n++,TC,'Geçit bedeli <strong>95.000,00 TL</strong>\'nin davacıdan alınarak davalıya ödenmesine'),
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Tapu Müdürlüğü\'ne tescil müzekkeresi yazılmasına</div>`,
    hItem(n++,YC,'Tebliğden <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">12/12/2024</span></div>`
  ].join('');
  return kararSargi('BURSA 7. ASLİYE HUKUK MAHKEMESİ','2023/890','2024/445',
    'Fatih ÖZTÜRK (52109)','İbrahim KAYA','Halil ASAN','Geçit Hakkı (İrtifak) Tesisi — TMK m.747','—',
    'Davacı; taşınmazının herhangi bir yola çıkışı bulunmadığını, davalıya ait taşınmazdan geçit hakkı tesis edilmesini talep etmiştir.',
    'Davalı; geçit güzergâhının zararlı olduğunu öne sürerek itiraz etmiştir.',
    'Keşif ve bilirkişi incelemesi sonucunda taşınmazın çevrili olduğu saptanmış, geçit en az zarar verecek şekilde belirlendi.',
    'TMK m.747, m.780-795', h, 'Kâtip','12/12/2024','Fatih ÖZTÜRK — 52109');
}
function buildAdSoyad() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KABULÜNE</strong>'),
    hItem(n++,KC,'Davacının nüfus kaydındaki <strong>"Mehmet ALİ"</strong> isminin silinerek <strong>"Mehmet Alp"</strong> olarak DÜZELTİLMESİNE'),
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Gaziantep Nüfus Müdürlüğü\'ne müzekkere yazılmasına</div>`,
    hItem(n++,TC,'Maktu harç <strong>680,00 TL</strong> davacıdan tahsiline'),
    hItem(n++,YC,'Tebliğden <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">16/04/2024</span></div>`
  ].join('');
  return kararSargi('GAZİANTEP 3. ASLİYE HUKUK MAHKEMESİ','2024/345','2024/567',
    'Leyla YILMAZ (28934)','Mehmet Alp ÖZKAN','Gaziantep Nüfus Müdürlüğü','Ad Soyad Düzeltimi (TMK m.27)','—',
    'Davacı; nüfus kaydında "Mehmet ALİ" yazılı isminin "Mehmet Alp" olarak düzeltilmesini talep etmiştir.',
    'Nüfus Müdürlüğü; düzeltmenin mahkeme kararıyla yapılabileceğini bildirmiştir.',
    'Okul, banka ve SGK kayıtlarında ismin "Mehmet Alp" şeklinde yer aldığı, hatalı kaydın yazım hatasından kaynaklandığı tespit edilmiştir.',
    'TMK m.27, 5490 NHK m.36', h, 'Kâtip','16/04/2024','Leyla YILMAZ — 28934');
}
function buildYas() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KABULÜNE</strong>'),
    hItem(n++,KC,'Doğum tarihinin <strong>"01.01.1975"</strong>\'ten <strong>"14.09.1974"</strong> olarak DÜZELTİLMESİNE'),
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Adana Nüfus Müdürlüğü ve SGK\'ya bildirim yapılmasına</div>`,
    hItem(n++,TC,'Maktu harç <strong>680,00 TL</strong> tahsiline'),
    hItem(n++,YC,'Tebliğden <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">03/07/2024</span></div>`
  ].join('');
  return kararSargi('ADANA 5. ASLİYE HUKUK MAHKEMESİ','2023/890','2024/320',
    'Can AYDOĞAN (44213)','Fatma KILIÇ','Adana Nüfus Müdürlüğü','Doğum Tarihi Düzeltimi','—',
    'Davacı; "01.01.1975" olarak kayıtlı doğum tarihinin "14.09.1974" şeklinde düzeltilmesini talep etmiştir.',
    'Nüfus Müdürlüğü; mahkeme kararı gerektiğini bildirmiştir.',
    'Radyolojik kemik yaşı raporu ve tanık beyanları ışığında gerçek doğum tarihinin 14.09.1974 olduğu tespit edilmiştir.',
    'TMK m.35, 5490 NHK m.36', h, 'Kâtip','03/07/2024','Can AYDOĞAN — 44213');
}
function buildBabalik() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KABULÜNE</strong>'),
    hItem(n++,KC,'Davacının nüfus kaydında "baba" hanesinin <strong>Hasan YILMAZ</strong> olarak TESCİLİNE ve soybağının kurulmasına'),
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Nüfus Müdürlüğü\'ne müzekkere yazılmasına</div>`,
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Yargılama gideri davalıdan alınarak davacıya verilmesine</div>`,
    hItem(n++,YC,'Tebliğden <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">22/08/2024</span></div>`
  ].join('');
  return kararSargi('ANKARA 8. ASLİYE HUKUK MAHKEMESİ','2022/1234','2024/780',
    'Sibel KARA (56712)','Emre YILMAZ','Hasan YILMAZ','Babalık Davası (TMK m.301)','—',
    'Davacı; nüfus kaydında "baba: bilinmiyor" hanesinin davalı Hasan YILMAZ adına düzeltilmesini talep etmiştir.',
    'Davalı; biyolojik baba olmadığını savunmuştur.',
    'Adli Tıp Kurumu DNA analizi (ATK No: 2023-AT-4567) biyolojik babalık olasılığını %99,998 olarak belirlemiştir.',
    'TMK m.301, m.303', h, 'Kâtip','22/08/2024','Sibel KARA — 56712');
}
function buildInkar() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KABULÜNE</strong>'),
    hItem(n++,RC,'İcra takibine yapılan itirazın <strong>İPTALİNE</strong> ve takibin devamına'),
    hItem(n++,TC,'Asıl alacak <strong>120.000,00 TL</strong> üzerinden takip tarihinden yasal faize'),
    hItem(n++,RC,'İİK m.67/2 uyarınca %20 = <strong>24.000,00 TL İNKAR TAZMİNATINA</strong>'),
    hItem(n++,TC,'<strong>8.208,00 TL</strong> yargılama harcı + <strong>18.000,00 TL</strong> vekâlet ücreti davalıdan tahsiline'),
    hItem(n++,YC,'Tebliğden <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">25/10/2024</span></div>`
  ].join('');
  return kararSargi('İSTANBUL ANADOLU 12. ASLİYE HUKUK MAHKEMESİ','2023/2341','2024/1567',
    'Kerim ÜNAL (67823)','Eda TEKİN','Serhan KAYA','İtirazın İptali (İİK m.67)','120.000,00 TL',
    'Davacı; 120.000 TL kira alacağı için başlattığı icra takibine haksız itiraz yapıldığını ileri sürerek itirazın iptali ve inkar tazminatı talep etmiştir.',
    'Davalı; kira alacağının ödenmediğini, sözleşmenin sona erdiğini savunmuştur.',
    'Kira sözleşmesi ve banka kayıtları incelenmiş; alacağın gerçek ve muaccel olduğu, itirazın kötüniyetle yapıldığı anlaşılmıştır.',
    'İİK m.67/1, m.67/2, HMK m.326', h, 'Kâtip','25/10/2024','Kerim ÜNAL — 67823');
}
function buildManevi() {
  let n=1;
  const h = [
    hItem(n++,KC,'Davanın <strong>KISMİ KABULÜNE</strong>'),
    hItem(n++,TC,'<strong>90.000,00 TL</strong> manevi tazminat (Talep: 500.000 — Kabul: <strong>%18</strong>)'),
    `<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>${n++}.</strong> Yargılama giderleri kabul-red oranında paylaştırılmasına</div>`,
    hItem(n++,TC,'Kabul için <strong>9.000,00 TL</strong> vekâlet ücreti davalıdan; red için <strong>41.000,00 TL</strong> davacıdan'),
    hItem(n++,YC,'Tebliğden <strong>2 hafta</strong> İstinaf yolu açık olmak üzere'),
    `<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px">Karar verildi. <span style="float:right;font-weight:400;color:#888">19/11/2024</span></div>`
  ].join('');
  return kararSargi('ANKARA 15. ASLİYE HUKUK MAHKEMESİ','2023/3456','2024/2100',
    'Nesrin ÇAKIR (78934)','Davacı A','Davalı B','Manevi Tazminat — Kişilik Hakkı İhlali','500.000,00 TL (Talep)',
    'Davacı; kamuya açık platformda yayımlanan haksız haber nedeniyle kişilik haklarının ihlal edildiğini ileri sürerek 500.000 TL manevi tazminat talep etmiştir.',
    'Davalı; yayının doğru ve kamuya açık bilgilere dayalı olduğunu savunmuştur.',
    'Kişilik hakkı ihlali sabit olmakla birlikte tazminat; olay ağırlığı, sosyal konum ve hakkaniyet ilkesi çerçevesinde 90.000 TL olarak takdir edilmiştir.',
    'TMK m.24-25, TBK m.58', h, 'Kâtip','19/11/2024','Nesrin ÇAKIR — 78934');
}

/* ── ORNEKLER nesnesi — buildXxx fonksiyonlarından SONRA ── */
const ORNEKLER = {
  'Hüküm Türleri': {
    'Davanın Kabulü': buildKabul,
    'Davanın Reddi': buildRed,
    'Kısmen Kabul/Red': buildKismen,
    'Nafaka Kararı': buildNafaka,
  },
  'Taşınmaz Davaları': {
    'Tapu İptali ve Tescil': buildTapuIptal,
    'Kazandırıcı Zamanaşımı': buildZamanasiimi,
    'Geçit Hakkı Tesisi': buildGecit,
  },
  'Nüfus Davaları': {
    'Ad Soyad Düzeltimi': buildAdSoyad,
    'Yaş Düzeltimi': buildYas,
    'Babalık Davası': buildBabalik,
  
    'Ergin Kılınma Talebi': `NÖBETÇİ SULH HUKUK MAHKEMESİNE
                                                                                    ………….

DAVACILAR: 1- M.T., adres, TC Kimlik No: ……………
     2- S.T., adres, TC Kimlik No:………………
DAVACILAR VEKİLİ: Av. Y.S., adres,
DAVALI : Hasımsız
ERGİN KILINMASI
İSTENEN: C.T.
DAVA KONUSU : Ergin Kılınma 

OLAYLAR :
Müvekkillerimin çocukları olan C.T. 15 yaşını doldurmuştur. Müvekkillerimin çocukları olan C.T. … Devlet Hastanesine sağlık memuru olarak atanmıştır. Ancak kendisinin fiil ehliyeti bulunmadığından ergin kılınmasına karar verilmesi gerekmektedir. Yaptığını anlayacak ve makul surette hareket edecek akli dengeye sahip olan müvekkillerim çocuğu C.T.’nin kendisinin ve velileri olan müvekkillerimin ergin kılınmaya rızaları vardır. 
Bu nedenle müvekkillerimin çocuğu olan C.T.’nin ergin kılınmasına karar verilmesini talep etmek zarureti doğmuştur.

İDDİAMIZIN DAYANAĞI OLAN VAKALAR:
1- Müvekkillerimin çocukları olan C.T. 15 yaşını doldurmuştur.
2- Müvekkillerimin çocukları olan C.T. … Devlet Hastanesine sağlık memuru olarak atanmıştır..
3- Yaptığını anlayacak ve makul surette hareket edecek akli dengeye sahip olan müvekkillerim çocuğu C.T.’nin kendisinin ve velileri olan müvekkillerimin ergin kılınmaya rızaları vardır

İDDİA ETTİĞİMİZ VAKIALARIN İSPATI OLAN DELİLLER :
1- Müvekkillerime ait Vukuatlı Nüfus Kayıt Örneği,
2- Devlet Hastanesi kayıtları,
3-A) Tanık Beyanları, 
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
B) İlgili Kolluk kuvvetine yaptırılacak araştırma,
C) Gerekirse hastaneden alınacak rapor,

HUKUKİ SEBEPLER: 
Türk Medeni Kanunu m. 12, m. 470 vd., Hukuk Muhakemeleri Kanunu ve ilgili sair mevzuat.

SONUÇ ve TALEP : 
Açıkladığımız sebeplerle davamızın kabulü ile müvekkillerimin çocukları olan C.T.’nin TMK m. 12 hükmü uyarınca ergin kılınmasına karar verilmesini müvekkiller adına saygıyla arz ve talep ederim…./…/…

                                                                     Davacı Vekili Av. Y.S.
                                                                                  İmza 

EK:1- Usulüne uygun düzenlenmiş vekaletname`,
  },
  'İcra & Tazminat': {
    'İtirazın İptali + İnkar': buildInkar,
    'Manevi Tazminat Takdiri': buildManevi,
  },
};

/* ══════════════════════════════════════════
   BÖLÜM 1 — NAVIGASYON
══════════════════════════════════════════ */
function showPage(id, el) {
  try {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
    const pg = document.getElementById('page-' + id);
    if (pg) pg.classList.add('active');
    if (el) { el.classList.add('active'); }
    else {
      const found = document.querySelector('[data-page="' + id + '"]');
      if (found) found.classList.add('active');
    }
    const isimler = {anasayfa:'Ana Sayfa',dilekce:'Dilekçe Yazma',hakim:'Hâkim Karar Yazım',
      ornekler:'Karar Örnekleri',hesaplama:'Hesaplama',ustyargi:'Üst Yargı',kayitli:'Kayıtlı Belgeler'};
    st('sb-aktif', isimler[id] || id);
  } catch(e) { console.error('showPage hatası:', e); }
}

/* ══════════════════════════════════════════
   BÖLÜM 2 — DİLEKÇE YAZMA
══════════════════════════════════════════ */
const SABLONLAR = {
  'Medeni Hukuk': {
    'Davaya Cevap': `DİLEÇE — DAVAYA CEVAP\n\nDavacı: [Adı Soyadı]\nDavalı: [Adı Soyadı]\nMahkeme: [Mahkeme Adı]\nDosya No: [No]\n\nI. DAVANIN KONUSU:\n[Açıklama]\n\nII. SAVUNMA:\n[Detaylı savunma]\n\nIII. KANUNİ DAYANAKLAR:\nTürk Medeni Kanunu, Medeni Usul Kanunu\n\nIV. TALEP:\nDavanın reddedilmesi talep olunur.\n\nSaygılarımla,\n________________________\nTarih: .…/.…/20…`,
    'İtiraz Dilekçesi': `DİLEÇE — İTİRAZ\n\nKarara İtiraz Eden: [Adı Soyadı]\nKarar No: [No]\n\nI. İTİRAZ SEBEPLERİ:\n[Gerekçeler]\n\nII. KANUNİ DAYANAKLAR:\nMedeni Usul Kanunu\n\nIII. TALEP:\nİtirazın kabulü talep olunur.\n\nSaygılarımla,\n________________________`,
    'Temyiz Dilekçesi': `DİLEÇE — TEMYİZ\n\nTemyiz Eden: [Adı Soyadı]\nBAM Karar No: [No]\n\nI. TEMYIZ SEBEPLERİ:\na) Kanun Hatası:\n[Açıklama]\n\nb) Delil Değerlendirmesi Hatası:\n[Açıklama]\n\nII. KANUNLAR:\nHMK m.361-374\n\nIII. TALEP:\nKararın bozulması talep olunur.\n\n________________________`,
  },
  'Gayri Menkul': {
    'Tapu İptal ve Tescil': `DİLEÇE — TAPU İPTALİ VE TESCİL\n\nDavacı: [Adı Soyadı — TC No — Adres]\nDavalı: [Adı Soyadı — TC No — Adres]\n3. Kişi: [İl] Tapu Sicil Müdürlüğü\n\nTAŞINMAZ:\nAda/Parsel: [No]\nYüzölçüm: [m²]\n\nDAVANIN KONUSU:\n[Hile/Hata/Muvazaa nedeniyle tapu iptali]\n\nOLAY ÖZETİ:\n[Detaylı açıklama]\n\nKANUNİ DAYANAKLAR:\nTMK m.705, TMK m.1023, TBK m.36\n\nTALEP:\n1. Tapu kaydının İPTALİ\n2. Davacı adına TESCİL\n\n________________________`,
    'Tapu Düzeltme': `DİLEÇE — TAPU KAYDININ DÜZELTİLMESİ\n\nDavacı: [Adı Soyadı]\nDavalı: Tapu ve Kadastro Genel Müdürlüğü\n\nGAYRİMENKUL:\nTapu No: [No]\nMevcut Alan: [m²] (Hatalı)\nGerçek Alan: [m²]\n\nHATA AÇIKLAMASI:\n[Hata nedeni ve kanıtlar]\n\nKANUNİ DAYANAKLAR:\nTapu Kanunu m.29, TMK m.705\n\nTALEP:\nTapu kaydının düzeltilmesi talep olunur.\n\n________________________`,
    'Kazandırıcı Zamanaşımı': `DİLEÇE — KAZANDIRICI ZAMANAŞIMI (MK m.713)\n\nDavacı: [Adı Soyadı]\nDavalı: Hazine / Orman İdaresi\n\nTAŞINMAZ:\n[Konum — m² — Cinsi — Tapusuz]\n\nOLAY:\nDavacı ve atalarının söz konusu tapusuz taşınmazı [XX] yılı aşan süre,\nkesintisiz ve malik sıfatıyla kullandığı ispat edilecektir.\n\nKANUNİ DAYANAKLAR:\nTMK m.713/1 (20 yıl zilyetlik), Kadastro K. m.14\n\nTALEP:\nTaşınmazın davacı adına TESCİLİ talep olunur.\n\n________________________`,
  
    'Ölünceye Kadar Bakma - Tapu İptali Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR

DAVACI: M.R., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALILAR: 1) M.M. Adı Soyad, Adres,
  2) K.K. Adı Soyadı, Adres,
DAVA KONUSU : Ölünceye Kadar Bakma Söz. Day. Tapu İptali Ve Tescil
DAVA KON. DEĞERİ: … TL 

I. AÇIKLAMALAR :
1- Müvekkilim M.R. ile davalıların murisi İ.İ. arasında …. Noterliğinin …/…/… tarih ve … yevmiye numaralı ölünceye kadar bakma sözleşmesi düzenlenmiştir. Sözleşmenin bir suretini dilekçemiz ekinde sunuyoruz (EK-1).
2- Sözleşme kapsamında müvekkilim davalıların murisine ölünceye kadar bakacaktır. Bunun karşılığında, muris İ.İ. adına kayıtlı bulunan … ili … ilçesi … köyü …. Parsel sayılı tarla vasfındaki taşınmazın tamamı müvekkil adına kayıt ve tescil edilecektir. 
3- Sözleşme kapsamında müvekkilim 8,5 yıl boyunca davalıların murisinin bakımını üstlenmiş ve sözleşme kapsamındaki tüm yükümlülüklerini yerine getirmiştir. Murisin İ.İ. müvekkilimden her daim memnun kalmıştır. Müvekkilimin murisin rızası dahilinde çektiği videolar bunu açık bir şekilde göstermektedir. Söz konusu videolar CD içerisinde dilekçemiz ekinde sunulmuştur (EK-2).
4- Davalılar da müvekkilimin bakım yükümlülüğünü yerine getirdiğini inkar etmemektedirler. Ancak sözleşme kapsamında müvekkilime vaat edilen taşınmazın değerlenmesini bahane göstererek temlike yanaşmamaktadırlar.
5- Muris İ.İ.’nin geriye iki mirasçısı olan davalılar kalmış olup, taşınmazın devrine yanaşmamaları nedeniyle işbu davanın açılması zarureti doğmuştur.

II. DELİLLER:
- Ölünceye kadar bakma sözleşmesi,
- Tapu kayıtları,
- CD içeriği,
- Keşif ve bilirkişi incelemesi,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 704, 705 ve 706. Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 611 vd. ve 237 Maddeleri
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
5-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçüncü kişilere satılmasının engellenmesi için dava konusu … kayıtlı taşınmazın üzerine, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına,
2) Dava konusu … taşınmazın tapu kaydının iptali ile müvekkilim adına tapuya kayıt ve tesciline,
3) Mahkeme tapu iptal ve tescil talebimizi kabul etmediği takdirde, müvekkilimin davalıların murisine bakmasından dolayı uygun bir tazminatın yasal faiziyle birlikte davalılardan tahsil edilerek müvekkilime verilmesine,
4) Yargılama gideri ve vekalet ücretinin davalılara yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. ……………..
                               İmza


EKİ:
1- Ölünceye kadar bakma sözleşmesi
2- CD
3- Vekaletname örneği`,
    'Tapu Kaydında İsim Düzeltme': `NÖBETÇİ SULH HUKUK MAHKEMESİNE
                                                                       ……………….

 
DAVACI: ...., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: A.V., adres, T.C. kimlik no:…….
DAVALI: … Tapu Sicil Müdürlüğü
DAVA KONUSU : Tapu Kaydında Düzeltim 
DAVA DEĞERİ: … TL

I. AÇIKLAMALAR:
1- Müvekkilimin … ili … ilçesi … köyü … parsel sayılı taşınmazı bulunmaktadır. 
2- Müvekkilimin kimlikteki adı BAKIR olmasına rağmen, tapu sicilinde BEKİR olarak geçmektedir. Müvekkilim bunu daha sonradan öğrenmiştir. Resmi işlemlerde bu hatanın çeşitli sorunlara neden olması nedeniyle, söz konusu hatanın kimlik kaydına göre düzeltilmesini talep etme zarureti doğmuştur.

II. DELİLLER:
- Tapu kayıtları,
- Keşif ve bilirkişi raporları,
- Tanık beyanları
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Mahkemece re’sen seçilecek mahalli bilirkişi beyanları,
- Yemin delili: Yukarıda belirttiğimiz vakıaların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 1027. maddesi
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
3-Sair ilgili mevzuat

SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Müvekkilime ait … ili … ilçesi … köyü … parsel sayılı taşınmazın tapu kütüğünde BEKİR olarak geçen ismin BAKIR olarak düzeltilmesine, 
2) Davanın niteliği gereği yargılama gideri ve vekalet ücretinin üzerimizde bırakılmasına,
Karar verilmesini vekaleten saygılarımızla arz ve talep ederiz. …./…./…..

DAVACI VEKİLİ
Av. ……………..
                   imza


EKİ:
- Vekaletname
- Nüfus kayıt örneği`,
    'Yönetim Planı Değişikliği - Yok Hükmünde': `….. SULH HUKUK MAHKEMESİ'NE


DAVACI: Ad-Soyad-TC Kimlik No:-Adres 
VEKİLİ                      : Av. …
DAVALI                     :
KONU                  : Yönetim Planı Değişikliğinin Yok Hükmünde Olduğunun 
 Tespiti

AÇIKLAMALAR :
1-) Davacı müvekkil, … İli, … İlçesi, … Mahallesi …. Cad. … Sk. … Sitesinde bulunan A/11 blok, 8 numaralı bağımsız bölümün malikidir. Tapu kaydı ekte sunulmuştur (EK-1). 

2-) Davalı … Site Yönetimi'nin … yılı olağan genel kurul toplantısı …. tarihinde yapılmış bu toplantıda, yönetim planında yer alan ve 8. maddeyi oluşturan “Bağımsız bölümlerde kedi, köpek ve kümes hayvanlarının beslenmesi yasaktır” şeklindeki hüküm, “Bağımsız bölümlerde kedi ve köpek beslenmesi mümkündür” şeklinde değiştirilmiştir. Toplantı karar tutanağı ekte sunulmuştur  (EK-2). Müvekkilim bu toplantıya katılmamıştır.

3-) KMK m. 28/3 hükmüne göre, “Yönetim planının değiştirilmesi için bütün kat maliklerinin beşte dördünün oyu şarttır. Kat maliklerinin 33 üncü maddeye göre mahkemeye başvurma hakları saklıdır.” Buna göre, yönetim planının değişikliği beşte dört çoğunlukla yapılabilecektir. Burada sayı çoğunluğu aranmış, ayrıca arsa payı olarak beşte dört çoğunluk aranmamıştır. Ancak buna rağmen, yönetim planı değişikliğine dair alınan karar sayı ve arsa payı çoğunluğu ile alınmış, beşte dörtlük orana riayet edilmemiştir. Bu çoğunlukla alınmamış kararlar yok hükmündedir. Yargıtay’a göre de, Kat Mülkiyeti Yasası'nın 28. maddesi gereğince yönetim planı tüm kat maliklerinin 4/5 çoğunluğu ile değiştirilebileceği, maddede belirtilen nitelikli çoğunlukla alınmamış kararın yok hükmünde bir karar olacağı, bu nedenle bu tür kararların iptalinde süre koşulu aranmayacağı dikkate alınmalıdır (Y5.HD, 18/04/2022 T., 2022/1086 E., 2022/6865 K.)

4-) Yukarıda belirtilen oy çoğunluğu ile alınmamış ve bu nedenle yok hükmünde olan yönetim planı değişikliğine dair kararın yok hükmünde olduğunun tespitini talep etme zarureti doğmuştur.

HUKUKİ SEBEPLER     : KMK m. 28, 33 ve diğer ilgili maddeleri ile, HMK ve diğer yasal tüm mevzuat.

HUKUKİ DELİLLER     : Yönetim planı, tapu kayıtları, …/…/…  tarihli ve … sayılı kat malikleri kurulu kararı, tanık, yemin, noter ihtarnamesi ve yasal her türlü delil.

SONUÇ ve İSTEM        : 
Yukarıda arz ve izah edilen nedenlerden dolayı,
Davamızın kabulü ile,
1-) Usulüne ve kanunun emredici kurallarına aykırı şekilde alınan dava konusu toplantı ve karar tutanağındaki (8) numaralı kararın  yok hükmünde olduğunun tespitine, 
2-) Yargılama gideri ve vekalet ücretinin davalı tarafa yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

DAVACI VEKİLİ
Av. …………….


EKİ: 
1) Tapu kaydı
2) Yönetim planı
3) Kat malikleri kurulu toplantı ve karar tutanağı
4) Vekaletname`,
  
    'Muris Muvazaası - Tapu İptali ve Tescil': `
NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR


DAVACI: A.B.., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI: C.D. ADI SOYAD, ADRES,
DAVA KONUSU : Muris Muvazaası Nedenine Dayalı Tapu İptali Ve Tescil
DAVA KON. DEĞERİ: … TL (Bilirkişi tespitinden sonra ıslah edilmek üzere şimdilik)

I. AÇIKLAMALAR :
1- Müvekkilim, M.R.…’nün yasal mirasçısıdır. Bunu gösteren veraset ilamı ektedir (Ek-1)
2- Dava konusu olan ve tapu sicilinde kayıtlı … köyü … ve … parsel sayılı …  taşınmazların tamamı miras bırakan M.R.’ye ait iken daha sonra davalı C.D.’ye muvazaalı bir şekilde satılmıştır. Tapu kayıtlarından bu durum net bir şekilde anlaşılmaktadır.
3- Muris M.R.’nün dava konusu taşınmazları satmasını gerektirir bir durum olmadığı gibi, sosyal ve ekonomik durumu yerinde olduğundan satmaya ihtiyacı da yoktur. Mahkemece yargılama sırasında temin edilecek olan murise ait maaş bordrosu, kolluk tarafından yaptırılacak sosyal ve ekonomik durum araştırması sonuçları ile aşağıda sunduğumuz tanık listesinde belirtilen tanıkların beyanlarıyla bu durum net bir şekilde açığa çıkacaktır.
4- Somut olayda muris M.R.’nün muvazaalı satış yaptığı C.D., M.R.nin eşi olup, M.R.’nün muvazaalı satış yaptığı C.D. sosyal ekonomik durumu yerinde olmadığı için dava konusu taşınmazı alacak maddi imkâna sahip bulunmamaktadır. Bu durum C.D.’nin vukuatlı nüfus kayıt örneği ile, C.D.’ye ait maaş bordrosu, sosyal ve ekonomik durum tespit raporu ve tanık beyanlarıyla ortaya çıkacaktır.
5- Muvazaalı satışa konu taşınmazların devir tarihindeki gerçek değeri ile muvazaalı satış arasında çok ciddi fark vardır. Dava konusu taşınmazlara ait satış sözleşmesi ile dava konusu taşınmazlara emsal olabilecek emsal satış sözleşmeleri, keşif ve bilirkişi incelemesi ile bu husus net bir şekilde açıklığa kavuşacaktır. Bu bağlamda, ilgili kurumdan emsal satış sözleşmelerinin temini, taşınmaz başında keşif yapılması ve bilirkişiden rapor alınması talebimiz mevcuttur.
6- Dava konusu olayda muris M.R., malvarlığının tamamı veya bir kısmını mirasçılar arasında hoşgörü ile karşılanabilecek makul ölçüler içerisinde bir paylaştırmadığı gibi, herhangi bir denkleştirme de yapmayarak mal kaçırma iradesi ile hareket etmiştir. Yöremizde insanların, özellikle kendilerine karşı mesafeli olduğu bazı çocuklarından mal kaçırma olgusu çok yaygındır. Somut olayda dava konusu taşınmazın önemli bir kısmı tarla vasfında olup gelir getirmekte ve bu gelir de M.R. tarafından kullanılmaktaydı. Sözleşmeden önce ve sonra dava konusu taşınmaz M.R. ölünceye kadar M.R.’nün tasarrufunda bulunmakta idi. Miras bırakan temlikten önce ve sonra dava konusu taşınmazda yaşamış ve ölünceye kadar burada yaşamaya devam etmiştir. Murisin tüm mirasçılarına intikal eden, taşınır, taşınmaz ve hakların tespiti için Tapu Sicil Müdürlüklerine ve banka şubelerine yazılacak müzekkerelere verilecek cevabi yazılar ile her bir mirasçıya geçirilen malların ve hakların nitelikleri ve değerleri hakkında ve paylaştırmanın mı, yoksa mal kaçırma amacının mı üstün tutulduğunun tespiti için uzman bilirkişilerden alınacak bilirkişi raporu ile somut gerçeklik ortaya çıkacaktır.

II. DELİLLER
- Veraset ilamı,
- Tapu kayıtları,
- Murisin sosyal ve ekonomik durum araştırması,
- Murisin maaş bordrosu,
- Davalının sosyal ve ekonomik durum araştırması,
- Davalının maaş bordrosu,
- Keşif ve bilirkişi incelemesi,
- Banka hesap kayıtları,
- SGK kayıtları,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 704, 705 ve 706. Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 19, 237 ve 288. Maddeleri
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
5- Yargıtay İçtihatları Birleştirme Büyük Genel Kurulunun 1.4.1974 tarihli 1/2 sayılı içtihadı.
6-İlgili sair mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Öncelikle dava sonuçlanıncaya kadar tapu sicilinde kayıtlı … köyü … ve … parsel sayılı dava konusu taşınmazların üçüncü kişilere satılmasının önlenmesi için, öncelikle teminatsız olarak; mahkeme aksi kanaatte ise uygun bir teminat karşılığı, DAVA KONUSU TAŞINMAZA İHTİYATİ TEDBİR KONULMASINA,
2) Miras bırakan M.R., gerçekte bağışlamak istediği tapu sicilinde kayıtlı … köyü … ve … parsel sayılı dava konusu taşınmaz mallar hakkında tapu sicil memuru önünde iradesini satış doğrultusunda açıklamış olduğu halde, gerçekte bağış sözleşmesi yaptığından, satış sözleşmesi Yargıtay İçtihatları Birleştirme Büyük Genel Kurulunun 1.4.1974 tarihli 1/2 sayılı içtihadı ve 6098 sayılı TBK’nun 19. maddesi gereğince muvazaaya bağlı olarak geçersiz olup, gizli bağış sözleşmesi de yukarıda belirtilen kanun maddeleri kapsamında şekil koşulundan yoksun bulunduğu için geçersiz olduğundan dava konusu taşınmazların tapusunun müvekkilimin MİRAS PAYI ORANINDA İPTALİ İLE MÜVEKKİL ADINA TAPUYA KAYIT VE TESCİLİNE,
3) Yargılama gideri ve vekalet ücretinin davalı tarafa yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. ……………..
                               İmza
EKİ:
- Vekaletname örneği
- Veraset ilamı
- Nüfus kayıt tablosu`,
  
    'Kazandırıcı Zamanaşımıyla Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

DAVACI: A.B.., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI: 1) … Mal Müdürlüğü
    2) … Köyü Tüzel Kişiliği
DAVA KONUSU : Kazandırıcı Zamanaşımı Nedeniyle Tescil
DAVA KON. DEĞERİ: … TL 

I. AÇIKLAMALAR :
1- … ili … ilçesi …… Köyü sınırları içerisinde …… mevkiinde yaklaşık … dekar büyüklüğündeki tarla vasfındaki arazi müvekkil A.B. tarafından yaklaşık 25 yıldan beri malik sıfatıyla ekilip biçilmektedir. Söz konusu arazi müvekkilden önce üst soyları olan babası ve dedesi tarafından da ekilip biçilmiş ve bu şekildeki kullanım devam ederek müvekkilime intikal etmiştir. Mahallinde yapılacak araştırmalar ve dinlenecek mahalli bilirkişilerin beyanlarıyla bu durum açıklığa çıkacaktır.
2. Söz konusu tarla üzerinde gerek müvekkilimin dedesi ve babası gerekse müvekkilimin kendisinin zilyetliği hiçbir niza ve fasılaya uğramaksızın çok eskiden beridir devam etmektedir. Tarla bilindiği kadarıyla yaklaşık 25 yıldan beridir müvekkilimin ataları ve müvekkilimin kendisi tarafından kullanılmakta olup tarlaya ilişkin her türlü vergiler müvekkilim ve onun dedesi ile babası tarafından eksiksiz olarak ödenmiştir. Buna dair belgeleri dilekçemiz ekinde sunuyoruz (EK-1).
3- Söz konusu taşınmaz tapu kütüğüne kayıtlı olmayıp tapusuz bir taşınmazdır. TMK m. 713/1 hükmüne göre “Tapu kütüğünde kayıtlı olmayan bir taşınmazı davasız ve aralıksız olarak yirmi yıl süreyle ve malik sıfatıyla zilyetliğinde bulunduran kişi, o taşınmazın tamamı, bir parçası veya bir payı üzerindeki mülkiyet hakkının tapu kütüğüne tesciline karar verilmesini isteyebilir.”  Müvekkil atalarından kalan bu araziyi yaklaşık 25 yıldır kullanmaktadırlar. Zilyetlik hiç kesintiye uğramamış ve dava konusu olmamıştır. Taşınmazın üzerinde kullanımdan kaynaklanan bir ihtilaf da bulunmamaktadır. TMK m. 713/4 vd. fıkralarına göre yapılacak ilan ile de bu durum net bir şekilde anlaşılacaktır.
4- Söz konusu tarlada zeytin ağaçları ekili olup, yapılacak keşif sonucunda bu arazinin 25 yılı aşkın süredir kullanıldığı anlaşılacaktır. Bu kullanım, malik sıfatıyla gerçekleşmiştir.
5- Somut olayda kazandırıcı zamanaşımı yoluyla kazanmayı sağlayan TMK m. 713 hükmündeki tüm koşullar eksiksiz bir şekilde sağlanmıştır. Bu nedenle, söz konusu arazinin müvekkil adına tescil edilmesini talep etme zarureti doğmuştur.

II. DELİLLER
- Tapuya yazılacak yazı sonucunda alınacak cevabi yazı,
- Mahalli bilirkişi beyanları,
- Vergi kayıtları,
- Keşif ve bilirkişi incelemesi,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 713. Maddeleri.
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) TMK m. 713 hükmünün tüm şartları gerçekleşmiş olduğundan … ili ……. ilçesi ….. köyü sınırları içerisinde …… mevkiinde bulunan yaklaşık … dekar büyüklüğündeki tarlanın müvekkilim …… adına Türk Medeni Kanunu’nun 713. maddesi gereğince KAYIT ve TESCİLİNE,
2) Davalıların yasal hasım olması nedeniyle yargılama giderlerinin üzerimizde bırakılmasına,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. …………
                           
EKİ:
- Vekaletname örneği
- Nüfus kayıt tablosu
- Vergi kayıtları
`,
  
    'Yüklenicinin Temlikine Dayanan Tapu İptali ve Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
(TÜKETİCİ MAHKEMESİ SIFATIYLA)
                                                          ……………….
 
İHTİYATİ TEDBİR TALEPLİDİR


DAVACI: A.B..., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: A.V., adres, T.C. kimlik no:…….
DAVALILAR: 1-S…..Adı Soyad, Adres,
  2-R.….. İnşaat Taah. Nak. Paz. Ltd. Şti
DAVA KONUSU : Yüklenicinin Temlikine Dayanan Tapu İptal ve Tescil Dav.
DAVA KON. DEĞERİ: … TL

OLAYLAR :
1- Davalı S.. ile davalı R. arasında yapılan arsa payı karşılığı inşaat sözleşmesi gereğince R., S.’a ait taşınmaz üzerine iki ayrı bina inşaatı yapılması hususunda anlaşmışlardır (EK-1).
2- Anlaşma üzerine R.’ın … Ağustos ayında 44 nolu parsel üzerine inşaata başlanmış, sözleşme hazırlanmış ve bu sözleşme noter huzurunda imzalanmıştır. İnşaatın devam ettiği sırada da inşaatı yapan yüklenici kendisine isabet edecek olan dairelerden bir kısmını üçüncü kişilere satışına ilişkin istisna sözleşmesi yapmış, böylece finansman temin etmiş, ayrıca arsa malikinin yükleniciye kendi dairelerini satması ve satış parasını kendisine göndermesi için vekâletname göndermiş, bu sırada yüklenici R. 45 nolu parseldeki inşaata da başlamış, paylaşım şekli hükümlerine göre 45 nolu parseldeki binanın bodrum kat 1 nolu ve normal kat 3 nolu dairelerinin arsa maliki olan davalı S.’e, diğer bağımsız bölümler ise R.’a ait olacağını, R. kendisine isabet edecek olan zemin kat 3 nolu meskeni müvekkilim M.N.Y.’a 30.11.2004 tarihli yazılı temlik sözleşmesi ile konut amaçlı satmıştır. Müvekkilim dava konusu yeri konut amacıyla davalı şirketten satın almıştır (EK-2).
3-Daire müvekkilime teslim edilmiş ve müvekkilim bu daireye yerleşmiştir. Fakat tapuda devir aşamasında ise davalı S.’in bu konuda davalı R.’a vekâletname vermemesi nedeni ile devir gerçekleşememektedir. Tapu kayıtlarından bu durum net bir şekilde anlaşılacaktır.
4-Müvekkilim taşınmazı yükleniciden ona isabet eden dairelerden olması nedeni ile satın almış, davalılar arasında kat karşılığı inşaat sözleşmesinin paylaşım şekli ve kat irtifakının kurulmasına ilişkin hükmü uyarınca dava konusu yer davalı yüklenici T…’ye düşmüş, 45 nolu parseldeki binanın tamamı bitirilmiş, yüklenici kendisine ait edimini yerine getirmiş, bu nedenle yüklenici kendisine bırakılan bağımsız bölümleri adına tescili talep edebilecek hale gelmiştir.
5-Müvekkilim davalı R. dan satın alınan daire edimini yerine getirerek kişisel hak kazanmıştır. Buna dair ödemeye ilişkin dekontları dilekçemiz ekinde sunuyoruz (EK-3).
6-Bu nedenlerle O… ili merkez S… mah. Pafta 34, ada 349, parsel 45 de tapuya kayıtlı zemin kat 1 nolu bağımsız bölümün davalı arsa maliki olan S.Ş. adına olan tapusunun iptali ile, müvekkilim adına tapuya tesciline, Mahkeme tapu iptal ve tescil talebimizi kabul etmediği takdirde, müvekkilimin uğramış olduğu zararların yasal faiziye birlikte davalılardan tahsil edilerek müvekkilime verilmesini talep etme zarureti doğmuştur.

DELİLLER:
- Dava konusu taşınmaza ait tapu kaydı,
- ….. Noterliğince düzenlenen … yevmiye numaralı davalılar arasında yapılan kat karşılığı inşaat sözleşmesi,
- Davalı yüklenici T… ile müvekkilim A.B. arasında yapılan ../../… tarihli yazılı satış sözleşmesi,
- Dava konusu taşınmazın müvekkilime teslim edildiğine dair taraflar arasında yapılan yazılı sözleşme (EK-6),
-  Dava konusu taşınmazın tüm vergileri ile apartman aidatlarının müvekkilim tarafından ödendiğine dair makbuz örnekleri,
- Tanık beyanları,
Tanık listesi
-  ………., Adres…
-  ………., Adres….
- ……….., Adres….
- Dava konusu taşınmaza ilişkin tapu kaydı,
-  Dava konusu taşınmazın bulunduğu yerde yapılacak keşif,
-  Dalı uzman bilirkişiler tarafından düzenlenecek rapor,
-  Yukarıda ismini belirttiğimiz tanıklar, 
- Dava konusu taşınmaz ile diğer taşınmazlar üç yıldır tamamlanmış olmasına rağmen, Davalı N….’nin herhangi bir itirazı olmamasına rağmen henüz dava konusu taşınmazı müvekkilime devretmemesi davalı N…’nin kötüniyetli olduğunu gösterir. 
-  Yukarıda ismini belirttiğimiz tanıklar,
-  İlgili kolluk birimince yapılacak araştırma,
-  Dava konusu taşınmazın ruhsatının alındığına ve kat mülkiyetine geçtiğine dair ilgili Kuruma yazılacak müzekkereye verilecek cevabi yazı,
-  Müvekkilim tarafından davalı yükleniciye verilen …. TL’ye ilişkin banka makbuzları, 
- Yemin delili: Yukarıda belirttiğimiz vakıaların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

HUKUKİ SEBEPLER: 
1-4721 Sayılı Türk Medeni Kanunu: 704, 705 ve 706. Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 183 vd. ve 237. Maddesi
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
5-Sair ilgili mevzuat

SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1- Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçüncü kişilere satılmasının engellenmesi için dava konusu ………. taşınmazın üzerine, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına, 
2- Dava konusu ………… taşınmazın tapu kaydının iptaline, iptal edilen bu  tapu kaydının müvekkilim adına tapuya kayıt ve tesciline,
3- Mahkeme tapu iptal ve tescil talebimizi kabul etmediği takdirde, müvekkilimin uğramış olduğu zararların yasal faiziyle birlikte davalılardan tahsil edilerek müvekkilime verilmesini,
4- Yargılama gideri ve vekâlet ücretinin davalılara yükletilmesine,
Karar verilmesini vekâleten saygılarımızla arz ve talep ederiz. …./…./…..

DAVACI VEKİLİ
Av. ……………..
                   imza

EKİ:
1-Kat karşılığı inşaat yapım sözleşmesi
2- Teslim sözleşmesi
3- Ödeme dekontları ve ödeme makbuzları
4- Vekâletname
5- Satış sözleşmesi
6- Teslim sözleşmesi
`,
  
    'Yasal Önalım Hakkı - Tapu İptali ve Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR

DAVACI: A.B.., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: A.V., adres, T.C. kimlik no:…….
DAVALI: D.D. Adı Soyad, Adres,
DAVA KONUSU : Yasal Önalım Hakkı Nedeniyle Tapu İptal Ve Tescil
DAVA DEĞERİ: … TL

I. AÇIKLAMALAR:
1) Müvekkilimin A.B., .... İli ... İlçesi, … Köyü, … parsel sayılı taşınmazda ½ oranında hisse sahibidir. Tapu kayıtlarından bu durum net bir şekilde görülecektir.
2) Diğer 1/2 oranındaki hisse müvekkilimin kardeşi M.M.’ye ait iken, …/…/… tarihinde taşınmazda herhangi bir hisse sahibi olmayan davalı D.D.’ye 430.000,00 TL bedelle satılmıştır. Bu durum tapu kayıtlarıyla sabittir.
3) Türk Medeni Kanunu’nun 732. maddesine göre, “Paylı mülkiyette bir paydaşın taşınmaz üzerindeki payını tamamen veya kısmen üçüncü kişiye satması halinde, diğer paydaşlar önalım hakkını kullanabilirler.” Müvekkilim A.B. söz konusu taşınmazda hisse sahibi olduğundan önalım hakkına sahiptir. Buna mukabil davalı D.D. kendisine karşı önalım hakkı kullanılamayacak kişilerden değildir. Zira taşınmazda öncesinde hisse sahibi olmadığı gibi, pay sahibi olan M.M. ile arasında Yargıtay kararlarında belirtilen akrabalık ilişkisi de bulunmamaktadır. Nüfus kayıtları bunu ortaya koyacaktır.
4) Müvekkilimin kardeşi M.M. taşınmaz hissesini D.D.’ye satarken müvekkilime herhangi bir ihbarda bulunmamıştır. Müvekkilim bunu satış işleminin gerçekleşmesinden yaklaşık 10 gün sonra öğrenmiştir. Müvekkilime yapılmış bir tebligat yoktur. 
5) Müvekkilim işbu davayı hak düşürücü süre içinde açmıştır.
6) Taşınmazda fiili taksim durumu söz konusu değildir. Keşif ve bilirkişi incelemesi ile bu durum net bir şekilde anlaşılacaktır.
7) Müvekkilim dava konusu taşınmaz hisselerinin gerçek satış bedeli ile davalı tarafından ödenen harç ve masrafları davalıya ödemeye hazırdır. 
8) Dava konusu taşınmazda, davalının aldığı hisselerin gerçek değeri tapuda gösterilen miktar değildir. Bedelde muvazaa durumu söz konusudur. Davalı diğer paydaş olan müvekkilimin önalım hakkımı engellemek için tapudaki satış değerini yüksek göstermişlerdir. Dava konusu taşınmazda davalının aldığı hisselerin değeri daha azdır. Emsal satış sözleşmeleri ve yapılacak keşif sonucunda bu durum net bir şekilde ortaya çıkacaktır. Yine bunun gibi, müvekkilim satış sözleşmesinin tarafı olmadığından Y14.HD, 23/12/2020 T., 2017/2818 E., 2020/8783 K. kararı doğrultusunda tanıklar aracılığıyla da bu hususu ispatlayacağız.
9) Satış bedelini karşılığında önalım hakkının tanınması suretiyle dava konusu taşınmazda davalının hissesinin iptaline, dava konusu taşınmazda davalının hisselerinin müvekkilim adına tapuya tesciline karar verilmesini, dava kesinleşinceye kadar üçüncü kişilere dava konusu taşınmazdaki davalı hisselerinin devrinin önlenmesi için tapu kaydı üzerine davalının hissesine tedbir şerhi konulmasına ve yargılama giderleri ile vekalet ücretinin davalıdan alınarak müvekkilime verilmesini talep etme zarureti doğmuştur. 

II. DELİLLER:
- Tapu kayıtları,
- Dava konusu taşınmazın tapu memuru huzurunda yapılan satış sözleşmesi,
-Tanık beyanları
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Keşif,
- Dava konusu taşınmazlara emsal satış sözleşmeleri
- Bilirkişi,
- Mahkemece re’sen seçilecek mahalli bilirkişi beyanları,
- Yemin delili: Yukarıda belirttiğimiz vakıaların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 732-734. maddeleri arası
2-2644 Sayılı Tapu Kanunu: 26. Maddesi.
3-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
4-Sair ilgili mevzuat

SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçünçü kişilere satılmasının engellenmesi için dava konusu ………. taşınmazın üzerine, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına, 
2) Dava konusu ………… taşınmazda davalının hak sahibi olduğu hissenin iptali ile iptal edilen bu hisselerin müvekkilim adına tapuya kayıt ve tesciline,
3) Dava konusu ….. taşınmaz hissesinin gerçek satış bedeli ile davalı tarafından ödenen harç ve masrafları davalıya ödememiz için depo kararı verilmesine,
4) Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,
Karar verilmesini vekaleten saygılarımızla arz ve talep ederiz. …./…./…..

DAVACI VEKİLİ
Av. ……………..
                   imza

EKİ:
- Vekaletname
`,
  
    'Sahtecilik Nedenine Dayalı Tapu İptali ve Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR

DAVACI: M.R., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI: M.M. Adı Soyad, Adres,
DAVA KONUSU : Sahtecilik Nedenine Dayalı Tapu İptali Ve Tescil
DAVA KON. DEĞERİ: … TL 

I. AÇIKLAMALAR :
1- Müvekkilim M.R.’nın … ili … ilçesi … köyü … ada … parselde kayıtlı tarla vasfında … m2’lik arazisi bulunmakta iken, müvekkil bir süre önce tapuda yaptığı araştırmada söz konusu tarlanın vekaletnameye istinaden davalı M.M.’ye satıldığını öğrenmiştir.
2- Yaptığımız kapsamlı araştırma neticesinde müvekkilimin başka bir işlem için vekaletname verdiği dava dışı A.C.’nin sahte bir vekaletname tanzim ederek söz konusu taşınmazı vekaleten devretme yetkisini sahtecilik suretiyle aldığını, bu sahte vekaletnameye istinaden …/…/… tarihinde söz konusu taşınmazın davalı M.M.’ye … bedelle sattığını ve temlik ettiğini öğrenmiş bulunmaktayız. Tapu kayıtları incelendiğinde bu husus net bir şekilde anlaşılacaktır.
3- Söz konusu taşınmaz müvekkilime ait olup, dava dışı A.C. isimli kişi hakkında üretmiş olduğu sahte vekaletname nedeniyle … Cumhuriyet Başsavcılığına suç duyurusunda bulunulmuştur. Soruşturma kapsamında sahte olduğu tespit edilen vekaletname nedeniyle A.C. hakkında sahtecilik suçundan … ceza mahkemesine kamu davası açılmıştır. Dava mahkemenin …/… esas sayılı dosyası ile derdest durumdadır. Yapılan sahtecilik nedeniyle A.C.’nin ceza alması kuvvetle muhtemeldir.
4- Temlikin dayanağı olan vekaletname sahtedir. Altındaki imza müvekkilime ait değildir. Bu durum Adli Tıp Kurumu’nun ilgili ihtisas dairesinden alınacak raporla ortaya konulacaktır. Söz konusu sahte vekaletnameden bir suret dilekçemiz ekinde sunulmuştur (EK-1)
5- Temlik işleminin dayanağı olan evrak sahte olduğu için, temlik işlemi dayanaksız kalmış olup, tescil yolsuz hale gelmiştir.
6- Davalı M.M. müvekkilimin eski köylüsüdür. Müvekkilimin bu taşınmazı satmaya ihtiyacının olmadığını bilen birisidir. Satış işlemleri yapılırken müvekkilimle hiç görüşmemiştir. Bu da onun kötüniyetli olduğunu göstermektedir.
7- Tüm bu nedenlerle, sahteciliğe dayanılarak yapılan yolsuz tescil nedeniyle tapu iptali ve tescil davası açılması zarureti doğmuştur.

II. DELİLLER:
- Tapu kayıtları,
- Sahte vekaletname sureti,
- Sahte vekâletnamedeki imzanın müvekkilime ait olmadığına Adli Tıp Kurumundan alınacak rapor,
- A.C. hakkında … ağır ceza mahkemesinde görülen … sayılı dava dosyası
- Keşif ve bilirkişi incelemesi,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 704, 705 ve 706. Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 29 ve 237. Maddeleri
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-Noterlik Kanunu 60/3. Maddesi
5-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
6-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçüncü kişilere satılmasının engellenmesi için, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına,
2- Dava konusu taşınmazın müvekkilim adına tapuya kayıt ve tesciline,
3- Mahkeme tapu iptal ve tescil talebimizi kabul etmediği takdirde, dava konusu taşınmazın bedelinin yasal faizi ile birlikte davalılardan alınarak müvekkilime verilmesine, 
4) Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. ……………..
                               İmza
EKİ:
1- Sahte vekaletname sureti
2- Vekaletname örneği
`,
  
    'Korkutma Nedenine Dayalı Tapu İptali ve Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR

DAVACI: M.R., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI: M.M. Adı Soyad, Adres,
DAVA KONUSU : Korkutma Nedeniyle Tapu İptali Ve Tescil
DAVA KON. DEĞERİ: … TL 

I. AÇIKLAMALAR :
1- Müvekkilim, M.R. ile davalı M.M. arasında belli bir süredir devam eden ticari ilişki bulunmaktadır. Müvekkilim davalıdan mal alıp satmakta; zaman zaman borçlu kalmaktadır. Ülke ekonomisinin zor durumda olmasından dolayı müvekkilim belli bir süre borçlarını ödemekte zorluk yaşamaya başlamıştır. Ancak gecikmeli de olsa borçlarını ödemektedir. 2020 yılı Şubat ayı itibariyle müvekkilimin davalıya 148.330 TL borcu bulunmaktadır. Davalı bu borç nedeniyle sürekli sıkıştırmış ve bunaltmıştır. 
2- Davalı daha ileri giderek müvekkilimi tehdit etmeye başlamıştır. Bu tehditler kapsamında davalı şahıs M.M. kendisinin aşiretinin bulunduğunu, borcunu ödemek için üç gün süre verdiğini, üç gün içinde borcunu ödememesi halinde üzerine kayıtlı evin tapusunu devretmesi gerektiğini, aksi halde başına büyük işler geleceğini, kendisini ve ailesini yok edeceğini belirtmek suretiyle tehdit etmiştir. Davalının müvekkilime yönelik tehdit içeren yazışmaları dilekçemiz ekinde sunulmuştur (EK-1).
3- Müvekkilim davalının belalı bir kişiliğe sahip olduğunu bildiğinden korku içerisinde kalmış ve …/…/… tarihinde kendi üzerine kayıtlı … ili … ilçesi … mahallesi … sokak … numarada kayıtlı müstakil evin tapusunu davalı üzerine geçirmiştir. Tapu kayıtları ile bu durum net bir şekilde anlaşılacaktır.
4- Yapılan işlemin verdiği huzursuzluğu bir türlü üzerinden atamayan müvekkilim, ailesinin desteğiyle yaşanan tehdit ve korkutma olaylarıyla ilgili savcılığa suç duyurusunda bulunmuştur. … Cumhuriyet Başsavcılığının …/…/… tarih ve …/… soruşturma sayılı iddianamesi ile davalı hakkında … asliye ceza mahkemesine tehdit suçundan kamu davası açılmıştır. Söz konusu dava mahkemenin …/… esas numarasına kayıtlı olarak derdest vaziyettedir. Yine bunun gibi, Yargıtay kararları uyarınca korkutma iddiası her türlü delille kanıtlanabileceğinden, listesini sunduğumuz tanıklar da bu olguyu doğrulayacaktır.
5- Müvekkilim dava konusu taşınmazı tamamen korku altında davalıya temlik etmiştir. Üstelik taşınmazın temlik tarihindeki rayiç bedeli 180.000 TL olmasına rağmen alacak miktarına denk gelecek şekilde 148.000 TL gösterilmeye zorlanmıştır.
6- Müvekkilimin taşınmazı korkutma altında devir ve temlik ettiği ceza dosyası ve ekte sunduğumuz mesaj kayıtlarından net bir şekilde anlaşılmaktadır. 
7- Müvekkilim üzerindeki korkuyu attıktan sonra şikayette bulunmuş ve ardından taşınmaza dair temlik işleminin iptali için işbu davayı açma yönünde irade göstermiştir. Davamız bu bakımdan hak düşürücü süre içinde açılmıştır. Zaten temlik üzerinden de 1 yıllık süre henüz geçmemiştir.
8- Yukarıda açıkladığımız sebeplerden dolayı davalı adına kayıtlı bulunan … ili … ilçesi … mahallesi .. parsel numaralı taşınmazın tapusunun iptali ile müvekkilimin adına kayıt ve tesciline karar verilmesini talep etme zarureti doğmuştur.

II. DELİLLER
- Satış sözleşmesi,
- Tapu kayıtları,
- Whatsapp yazışmaları
- Ceza davası dosyası,
- Keşif ve bilirkişi incelemesi,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 704, 705 ve 706. Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 37, 38, 39 ve 237 Maddeleri
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
5-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçüncü kişilere satılmasının engellenmesi için dava konusu … kayıtlı taşınmazın üzerine, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına,
2) Dava konusu … taşınmazın müvekkilim adına tapuya kayıt ve tesciline,
3) Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. ……………..
                               İmza
EKİ:
1- Whatsapp yazışmaları
2- Vekaletname örneği
`,
  
    'Ölünceye Kadar Bakma Söz. - Tapu İptali ve Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR

DAVACI: M.R., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALILAR: 1) M.M. Adı Soyad, Adres,
  2) K.K. Adı Soyadı, Adres,
DAVA KONUSU : Ölünceye Kadar Bakma Söz. Day. Tapu İptali Ve Tescil
DAVA KON. DEĞERİ: … TL 

I. AÇIKLAMALAR :
1- Müvekkilim M.R. ile davalıların murisi İ.İ. arasında …. Noterliğinin …/…/… tarih ve … yevmiye numaralı ölünceye kadar bakma sözleşmesi düzenlenmiştir. Sözleşmenin bir suretini dilekçemiz ekinde sunuyoruz (EK-1).
2- Sözleşme kapsamında müvekkilim davalıların murisine ölünceye kadar bakacaktır. Bunun karşılığında, muris İ.İ. adına kayıtlı bulunan … ili … ilçesi … köyü …. Parsel sayılı tarla vasfındaki taşınmazın tamamı müvekkil adına kayıt ve tescil edilecektir. 
3- Sözleşme kapsamında müvekkilim 8,5 yıl boyunca davalıların murisinin bakımını üstlenmiş ve sözleşme kapsamındaki tüm yükümlülüklerini yerine getirmiştir. Murisin İ.İ. müvekkilimden her daim memnun kalmıştır. Müvekkilimin murisin rızası dahilinde çektiği videolar bunu açık bir şekilde göstermektedir. Söz konusu videolar CD içerisinde dilekçemiz ekinde sunulmuştur (EK-2).
4- Davalılar da müvekkilimin bakım yükümlülüğünü yerine getirdiğini inkar etmemektedirler. Ancak sözleşme kapsamında müvekkilime vaat edilen taşınmazın değerlenmesini bahane göstererek temlike yanaşmamaktadırlar.
5- Muris İ.İ.’nin geriye iki mirasçısı olan davalılar kalmış olup, taşınmazın devrine yanaşmamaları nedeniyle işbu davanın açılması zarureti doğmuştur.

II. DELİLLER:
- Ölünceye kadar bakma sözleşmesi,
- Tapu kayıtları,
- CD içeriği,
- Keşif ve bilirkişi incelemesi,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 704, 705 ve 706. Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 611 vd. ve 237 Maddeleri
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
5-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçüncü kişilere satılmasının engellenmesi için dava konusu … kayıtlı taşınmazın üzerine, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına,
2) Dava konusu … taşınmazın tapu kaydının iptali ile müvekkilim adına tapuya kayıt ve tesciline,
3) Mahkeme tapu iptal ve tescil talebimizi kabul etmediği takdirde, müvekkilimin davalıların murisine bakmasından dolayı uygun bir tazminatın yasal faiziyle birlikte davalılardan tahsil edilerek müvekkilime verilmesine,
4) Yargılama gideri ve vekalet ücretinin davalılara yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. ……………..
                               İmza


EKİ:
1- Ölünceye kadar bakma sözleşmesi
2- CD
3- Vekaletname örneği
`,
  
    'İnançlı İşlem - Tapu İptali ve Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                    ……………….

 İHTİYATİ TEDBİR TALEPLİDİR


DAVACI: M.R., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALILAR: M.M. Adı Soyad, Adres, 
DAVA KONUSU : İnançlı İşlem Nedeniyle Tapu İptali Ve Tescil
DAVA KON. DEĞERİ: … TL 

I. AÇIKLAMALAR :
1- Müvekkilim M.R. ile davalı arasında tekstil malzemesi alımından kaynaklanan ticari ilişki bulunmaktadır ve bu ilişki 12 yıldır devam etmektedir. Müvekkilimin yaşadığı ekonomik sıkıntı nedeniyle borçlarında bir takım aksamalar olduğu için, davalıya olan 132.000, 00 TL’lik borcun teminatı olmak üzere, müvekkilim adına tapuda kayıtlı bulunan … ili … ilçesi … köyü … parsel sayılı taşınmaz davalıya …/…/… devir ve temlik edilmiştir. Tapu kayıtlarından bu durum net bir şekilde anlaşılacaktır.
2- Her iki taraf temlikin bu borcun teminatını oluşturmak üzere yapıldığı ve borç ödendiğinde tapunun müvekkilime iade edileceği hususunda sözlü olarak anlaşmışlardır. Burada Yargıtay İçtihatları Birleştirme Büyük Genel Kurulunun 05/02/1947 T, 1945/20 E, 1947/6 K sayılı içtihadı kapsamında “inançlı işlem” bulunduğu açıktır.
3- Dava konusu taşınmazın temlik edilmesi için müvekkilimle davalı arasında herhangi bir yazılı sözleşme yapılmamış ise de, söz konusu temlikin inançlı işleme dayanılarak yapıldığı hususunda bir tereddüt bulunmamaktadır. Zira her müvekkilimle davalının ticari defterlerinde müvekkilimin ne kadarlık borç olduğu net bir şekilde anlaşılacaktır. Müvekkilim bu borcu davalının …. ve …. İban numaralı hesaplarına yaptığı eft ve havaleler ile ödeyerek kapatmıştır. Buna dair dekontlar dilekçemiz ekindedir (EK-1).
4- Müvekkilim yaklaşık 800.000, 00 TL rayiç değere sahip bu taşınmazı davalıya temlik etmesine rağmen, bu tarihten kısa bir süre sonra davalının hesabına ödemeler yapmaya başlamıştır. Bu ödeme dekontları, taraflar arasındaki ilişkinin inançlı işleme dayandığının açık göstergesidir. Yargıtay uygulamalarına göre 05.02.1947 tarihli 20/6 sayılı İnançları Birleştirme kararı uyarınca, inançlı işleme dayalı iddianın, şekle bağlı olmayan yazılı delille kanıtlanması gerekir. Şayet, ispat külfeti kendisinde olan tarafın yazılı bir belgesi yok ise ancak taraflar arasında gerçekleştirilen mektup, banka dekontu, yazışmalar gibi birtakım belgeler var ise bunların yazılı delil başlangıcı sayılacağı ve iddianın her türlü delille kanıtlanmasının olanaklı hale geleceği gözden uzak tutulmamalıdır.
5- Kaldı ki, davalının söz konusu taşınmazı alabilecek maddi gücü de bulunmamaktadır. Yaptırılacak araştırma ile bu husus net bir şekilde anlaşılacaktır.
6- Bunun yanı sıra, temlik işlemine rağmen taşınmazın vergi borçlarının müvekkilim tarafından ödenmesi de işlemin inanç sözleşmesine dayandığını göstermektedir. Bu hususta belediye ve vergi dairesine yazılacak yazılara verilecek cevaplar da bunun göstergesi olacaktır.
7- Müvekkilim ile davalı arasındaki ilişkinin 132.000, 00 TL’lik borcun teminatı olan inançlı işlem olduğu aşağıda isimlerini sunduğumuz tanıklarca da doğrulanacaktır.
8- Tüm bunlara rağmen davalı inanç sözleşmesinin gereğini tüm taleplerimize rağmen yerine getirmemiş olduğundan, işbu tapu iptal ve tescil davasının açılması zaruri hale gelmiştir.

II. DELİLLER:
- Tapu kayıtları, 
- Banka dekontları, 
- Belediye ve vergi kayıtları, 
- Her iki tarafın ticari defterleri, 
- Keşif ve bilirkişi incelemesi, 
- Davalının sosyal ve ekonomik durum araştırması, 
- Tanık beyanları, 
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 704, 705 ve 706. Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 237 Maddesi
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
5- Yargıtay İçtihatları Birleştirme Büyük Genel Kurulunun 05/02/1947 T, 1945/20 E, 1947/6 K sayılı kararı
6-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile, 
1) Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçüncü kişilere satılmasının engellenmesi için dava konusu … parselde bulunan taşınmazın üzerine, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına, 
2) Dava konusu ………… parselde bulunan taşınmazda davalının adına yapılan kaydın iptali ile iptal edilen dava konusu taşınmazın müvekkilim adına tapuya kayıt ve tesciline, 
3) Mahkeme tapu iptal ve tescil talebimizi kabul etmediği takdirde, inançlı işlemin davalı tarafından gereğinin yerine getirilmemesi nedeniyle, müvekkilimin uğramış olduğu tüm zararların yasal faizi ile birlikte davalıdan alınarak müvekkilime verilmesine, 
4) Yargılama gideri ve vekâlet ücretinin davalıya yükletilmesine, 
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                              DAVACI VEKİLİ
                             Av. ……………..
                İmza

EKİ:
1- 28 adet dekont
2- Azilname ve tebligat evrakı
3- Vekaletname örneği
`,
  
    'Ketm-i Verese - Tapu İptali ve Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR

DAVACI: M.R., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALILAR: 1-A.R. Adı Soyad, Adres,
2-B.R.. Adı Soyad, Adres,
3-C.R. Adı Soyad, Adres,
4-D.R.. Adı Soyad, Adres,
5-E.R. Adı Soyad, Adres,
DAVA KONUSU : Ketm-i Verese Nedenine Dayalı Tapu İptali Ve Tescil
DAVA KON. DEĞERİ: … TL 

I. AÇIKLAMALAR :
1- Müvekkilim ile davalılar üvey kardeştir. Müvekkilim M.R., mirasbırakan İ.R.’nin ikinci eşi …’den doğmuştur. Nüfus kayıtları bunu doğrulamaktadır.
2- Davalılar murisin ilk eşinden olan çocuklarıdır. Muris …/…/… tarihinde öldükten sonra davalılar veraset ilamı çıkarmış ve muris adına kayıtlı bulunan … ili … ilçesi … köyü … ada … parselde kayıtlı tarla vasfında … m2’lik araziyi bu veraset ilamı doğrultusunda her birine 1/5 düşecek şekilde pay etmişlerdir. Tapu kayıtları incelendiğinde durum anlaşılacaktır.
3- Müvekkilim murisin yasal mirasçısı olmasına rağmen davalılar temin ettikleri veraset ilamında müvekkilimin mirasçılığını gizlemişlerdir (ketmetmişlerdir).
4- Dava konusu taşınmazda müvekkilim 1/6 pay sahibi olmasına rağmen mirasçılığının gizlenmesi suretiyle pay almasının önüne geçilmiştir.
5- Müvekkilim bu durumu öğrendiğinde … Sulh Hukuk Mahkemesinin …/… esas ve …/… karar sayılı kararıyla verilen veraset ilamının iptali için … Asliye Hukuk Mahkemesinde dava açmıştır. Dava müvekkilim lehine sonuçlanmış ve kesinleşmiştir (EK-1).
6- Müvekkilim bunun üzerine … Sulh Hukuk Mahkemesinde hasımlı veraset ilamı verilmesi davası açmıştır. Yapılan yargılama sonucunda müvekkilimin 1/6 hissesinin bulunduğunu gösteren … tarih, …/… esas ve …/… karar sayılı veraset ilamı alınmıştır. Bu veraset ilamına dair karar kesinleşmiştir (EK-2).
7- Müvekkilim davalılardan söz konusu taşınmazdaki payını talep etmesine rağmen davalılar buna yanaşmamıştır. Bu nedenle işbu tapu iptali ve tescil davasının açılması zaruri hale gelmiştir.

II. DELİLLER:
- Tapu kayıtları,
- Veraset ilamı,
- … Sulh Hukuk Mahkemesinin hasımlı veraset ilamı
- Keşif ve bilirkişi incelemesi,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 704, 705 ve 706. Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 237. Maddesi
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
5-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçüncü kişilere satılmasının engellenmesi için, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına,
2- Dava konusu … taşınmazın müvekkilime düşen … hissesinin tapu kaydının iptaline, iptal edilen bu hisselerin tapu kaydının müvekkilimin miras payına göre adına tapuya kayıt ve tesciline,
3- Mahkeme tapu iptal ve tescil talebimizi kabul etmediği takdirde, müvekkilimin hissesi oranında dava konusu taşınmazın bedelinin davalılardan yasal faizi ile tahsil edilerek müvekkilime verilmesini,
4) Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. ……………..
                               İmza
EKİ:
1- Veraset ilamının iptali kararı
2- Sulh hukuk mahkemesinden alınan veraset ilamı
3- Vekaletname örneği
`,
  
    'İyiniyetli Yapı (TMK m.724) - Tapu İptali ve Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR

DAVACI: M.R., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI: M.M. Adı Soyad, Adres,
DAVA KONUSU : TMK m. 724 Hükmüne Dayanan Tapu İptali Ve Tescil
DAVA KON. DEĞERİ: … TL 

I. AÇIKLAMALAR :
1- Müvekkilim M.R. … ili … ilçesi … köyü … parsel sayılı taşınmazda kadastro tespitinden uzunca bir süre önce kendisine ait olduğu düşüncesiyle iki katlı ev yapmış ve fıstık ağaçları ekmiştir. Yapılacak keşif sonucunda bu durum net bir şekilde görülecektir.
2- Söz konusu yerde kadastro çalışmaları sonucunda dava konusu taşınmaz davalı M.M. adına tespit edilmiş ve tespit tutanakları …/…/… tarihinde kesinleşmiştir. Halihazırda dava konusu taşınmaz davalı adına kayıtlıdır. Tapu kayıtları ile bu durum anlaşılacaktır.
3- Müvekkilimin dava konusu taşınmazda ev yapması ve ağaç dikmesi tamamen iyiniyetli olarak yapılmıştır. Zira söz konusu taşınmaz ev yapımı ve ağaç dikimi esnasında tapusuz taşınmaz konumunda bulunuyordu. Müvekkilimin bilerek ve isteyerek başkasının arazisine  yapı yapması gibi bir durum söz konusu değildir. Taşınmazı uzun yıllardır müvekkilim kullandığından iyiniyetli olduğu ortadadır. Aşağıda listesini sunduğumuz tanıklar da bu doğrultuda beyanda bulunacaklardır. Bu bakımdan, TMK m. 724 hükmüne dayanan tapu iptal ve tescil davasının ön koşulu olan iyiniyetli olma hali müvekkilim açısından sübut bulmuştur.
4- Dava konusu taşınmazın üzerine yapılan bina taşınmazın arsa değerinden bariz bir şekilde fazladır. Keşif sonucu düzenlenecek rapor ve bölgedeki emsal satış sözleşmeleri de celbedildiğinde taşınmaza müvekkilim tarafından yapılan yapının taşınmazdan daha değerli olduğu anlaşılacaktır. Bu bakımdan TMK m. 724 hükmünde aranan bu koşul da somut olayımızda sağlanmıştır.
5- Taşınmaz üzerinde müvekkilim tarafından yapılan yapının sökülmesi aşırı zarara yol açacağından, tek yol TMK m. 724 hükmüne istinaden taşınmazın mülkiyetinin müvekkilim adına geçirilmesidir.
6- TMK m. 724 hükmüne göre “Yapının değeri açıkça arazinin değerinden fazlaysa, iyiniyetli taraf uygun bir bedel karşılığında yapının ve arazinin tamamının veya yeterli bir kısmının mülkiyetinin malzeme sahibine verilmesini isteyebilir.” İyiniyetli olan müvekkilim mahkemece belirlenecek uygun bir bedel karşılığında taşınmazın mülkiyetinin kendi adına geçirilmesi hususunda bedeli yatırmaya hazırdır.
7- Taşınmazın ifrazı ile ilgili bir sorun bulunmamaktadır. Keşif ve bilirkişi raporları ve Tapu Sicil Müdürlüğüne yazılacak yazıya verilecek cevaptan bu durum net bir şekilde görülecektir.
8- Yukarıda açıkladığımız sebeplerden dolayı davalı adına kayıtlı bulunan … ili … ilçesi … köyü .. parsel numaralı taşınmazın tapusunun iptali ile müvekkilimin adına kayıt ve tesciline karar verilmesini talep etme zarureti doğmuştur.

II. DELİLLER:
- Tapu kayıtları,
- Emsal satış sözleşmeleri,
- Keşif ve bilirkişi incelemesi,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 724, 704, 705 ve 706. Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 237 Maddeleri
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
5-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçüncü kişilere satılmasının engellenmesi için dava konusu … kayıtlı taşınmazın üzerine, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına,
2) Dava konusu … taşınmazın tapu kaydının iptali ile müvekkilim adına tapuya kayıt ve tesciline,
3) Mahkeme tapu iptal ve tescil talebimizi kabul etmediği takdirde, müvekkilimin uğradığı zararların yasal faizi ile birlikte davalıdan alınarak müvekkilime verilmesine,
4) Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. ……………..
                               İmza

EKİ:
- Vekaletname örneği
`,
  
    'Taşkın Yapı - Tapu İptali ve Tescil': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR


DAVACI: M.R., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI: M.M. Adı Soyad, Adres,
DAVA KONUSU : Taşkın Yapı Nedeniyle Tapu İptali Ve Tescil
DAVA KON. DEĞERİ: … TL 


I. AÇIKLAMALAR :
1- Müvekkilim M.R. … ili … ilçesi … köyü … parsel sayılı taşınmazda kadastro tespitinden uzunca bir süre önce kendisine ait olduğu düşüncesiyle iki katlı ev yapmıştır. Yapılacak keşif sonucunda bu durum net bir şekilde görülecektir.
2- Söz konusu yerde kadastro çalışmaları sonucunda, müvekkilimin yaptığı evin belli bir kısmı (…m2’lik alan) davalı üzerine tescil edilen … ada … parsel sayılı taşınmaza taşmıştır. Tapu kayıtları ile bu durum anlaşılacaktır.
3- Müvekkilimin dava konusu taşınmazda ev yapması tamamen iyiniyetli olarak yapılmıştır. Zira söz konusu taşınmaza belirtilen ev yapıldığı sırada taşınmaz çapa bağlı olmayan bir taşınmazdı. Müvekkilimin yaptığı ev … m2 olmasına rağmen taşan kısım … m2 olup, müvekkilimin iyi niyetli olduğu anlaşılmaktadır. Zira ortada tipik olarak TMK m. 725 hükmünde düzenlenen taşkın yapı söz konusudur.
4- TMK m. 725/2 hükmü uyarınca taşkın yapıyı iyiniyetle yapan kimse, uygun bir bedel karşılığında taşan kısım için bir irtifak hakkı kurulmasını veya bu kısmın bulunduğu arazi parçasının mülkiyetinin kendisine devredilmesini isteyebilir.
5- Müvekkilimin binayı yaparken çapa bağlı olmadığını, binanın küçük bir bölümünün taştığını, bu nedenle müvekkilimin iyiniyetli olduğunu yukarıda da ifade etmiş bulunmaktayız. Bu bakımdan, tapu iptal ve tescil davasının ana koşulu sağlanmış bulunmaktadır.
6- Bu davada ikinci koşul, yapı kıymetinin taşılan arazi parçasının değerinden açıkça fazla olmasıdır. Somut olayımızda yapının kıymetinin taşılan arazinin kıymetinden çok çok daha değerli olduğu keşif ve bilirkişi incelemesi sonucunda anlaşılacaktır.
7- Müvekkilim taşkın yapı nedeniyle taşan kısmın bedelini davalıya ödemeye hazırdır.
8- Dava konusu taşılan kısmın ifrazının önünde bir engel bulunmamaktadır. Tapu sicil müdürlüğüne yazılacak yazıya verilecek cevaptan bu durum net bir şekilde anlaşılacaktır.

II. DELİLLER
- Tapu kayıtları,
- Emsal satış sözleşmeleri,
- Keşif ve bilirkişi incelemesi,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 725, 704, 705 ve 706. Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 237 Maddeleri
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
5-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçüncü kişilere satılmasının engellenmesi için dava konusu … kayıtlı taşınmazın üzerine, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına,
2) Dava konusu … taşınmazın tapu kaydının iptali ile müvekkilim adına tapuya kayıt ve tesciline,
3) Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. ……………..
                               İmza


EKİ:
- Vekaletname örneği
`,
  
    'Yolsuz Tescil - Tapu İptali ve Tescil': `
NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR


DAVACI: A.B.., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALILAR: C.B. Adı Soyadı, Adres,
  İ.B. Adı Soyadı, Adres
DAVA KONUSU : Yolsuz Tescil Nedenine Dayalı Tapu İptali Ve Tescil
DAVA KON. DEĞERİ: … TL (Bilirkişi tespitinden sonra ıslah edilmek üzere şimdilik)

I. AÇIKLAMALAR :
1- Müvekkilim A.B, davalılardan C.B.’nin öz kardeşidir. Davalı İ.B. ise, davalı C.B.’nin resmî nikahlı eşidir.
2- Müvekkilim yaklaşık 10 yıldır Almanya’nın Disburg kentinde dönercilik işiyle uğraşmaktadır. Türkiye’de yaptığı ticaretin iyi gitmemesi nedeniyle, Almanya’daki akrabalarının da teşvikiyle Almanya’ya gitmiş ve orada kendine bir düzen kurmuştur. 
3- Almanya’da yaptığı ticaretten kazandığı parayı babaocağı olan …. İli … İlçesi … Mahallesinde bir ev almak suretiyle değerlendirmek istemiştir. Bu kapsamda, belirtilen mahallede … adresinde kain bulunan dava konusu apartman dairesini satın almak istemiştir. Ancak o dönemde yeni doğan küçük çocuğunun … hastalığının bulunması nedeniyle (EK-1), yerinden kıpırdayamamıştır. Bunun yanısıra, Türkiye’de çeşitli kişilere haciz aşamasında bulunan borçları olduğu için taşınmazı ilk planda kendi üzerine almak istememiştir. Bu nedenle, taşınmazın kardeşi olan C.B. üzerine alınması ve daha sonra devredilmesi konusunda kardeşiyle anlaşmıştır.
4- Müvekkilim, yapılacak bu satış işlemi ile ilgili taşınmazın devir öncesindeki maliki Z.T. ile defalarca görüşmüştür ve bunlardan bir çok yazışma whatsapp kayıtlarında mevcuttur. Bunları dilekçemiz ekinde sunuyoruz (EK-2). Bu yazışmalar incelendiğinde, görüşmelerin konusunun dava konusu taşınmazın devriyle ilgili pazarlık ve diğer hususları içerdiği açıkça görülecektir. Kendisi de tanık olarak dinlendiğinde gerçek ortaya çıkacaktır.
5- Süreç içinde müvekkilim davalı C.B.’ye …. tarihinde …. Euro, …. tarihinde …. Euro, …. tarihinde … euro olmak üzere toplamda … euro göndermiş olup, bu husus ekte sunduğumuz gönderi evraklarıyla sabittir (EK-3).
6- Taşınmaza ilişkin tüm bedel tamamlandıktan sonra dava konusu taşınmaz …. tarihinde …. Tapu Müdürlüğünde yapılan devir ile davalı C.B. üzerine tescil ettirilmiş ve taşınmazın bedeli dava dışı tanık Z.T.’ye ödenmiştir.
7- Aradan yaklaşık 3-4 ay geçtikten sonra müvekkilim Türkiye’ye gelmiş ve Türkiye’deki icralık borçlarını da ödemek suretiyle taşınmazın kendi üzerine devredilmesini davalı C.B.’den istemiştir. Ancak davalı C.B. buna yanaşmamış ve müvekkilim yaptığı araştırmada taşınmazın …. tarihinde diğer davalı olan İ.B. üzerine devredildiğini tespit etmiştir. Tapu kayıtları incelendiğinde bu husus açık ve net olarak görülecektir.
8- Dava konusu taşınmazın, ekte ve yargılama sürecinde sunacağımız belgeler, dinlenecek tanıklar ve tüm dosya kapsamı incelendiğinde müvekkilim tarafından satın alındığı ve elde olmayan ve yukarıda özetlediğimiz bazı nedenlerden dolayı davalı C.B. üzerine tescil edildiği anlaşılacaktır. Davalı C.B. aradan kısa bir süre geçtikten sonra taşınmazı resmî nikahlı eşine devretmek suretiyle taşınmazı mal edineceğini düşünmüştür. Oysa bu işlem, açık bir şekilde yolsuz tescile dayanmaktadır ve iptali gerekir.
9- Kural olarak tescil edilmiş olan her ayni hakkın geçerli olarak varlık kazandığı kabul edilir. Bu hüküm, tescilin olumlu hükmü olarak kabul edilmektedir. Ancak, bazı durumlarda, tescil geçerli bir hukuki sebebe dayanmayabilir, tescil geçerli olmayabilir veya tescil isteğinde bulunan kişinin hak üstünde tasarruf yetkisi bulunmayabilir. Bu gibi durumlarda tescil, yolsuz tescil olarak adlandırılır. Tescilin yolsuz olmaması için TMK m. 1023’teki tüm şartların bulunması gerekir. TMK m. 1023 hükmünün uygulanması için bazı şartların varlığı aranmaktadır. Bunlar;
-Kazananın üçüncü bir kişi olması gerekir
-Üçüncü kişinin sicildeki yolsuz tescile dayanmış olması gerekir
-Üçüncü kişinin bir ayni hak kazanmış olması gerekir
-Üçüncü kişinin kazanımında tasarruf yetkisi dışında diğer geçerlilik unsurlarının mevcut olması gerekir.
-Üçüncü kişinin kazanımının iyiniyetle olması gerekir.
Yargıtay’a ve öğretiye göre de, TMK’nın 1023. maddesi uyarınca, üçüncü kişinin iyi niyetinin varlığı tek başına kazanımın korunması için yeterli olmayıp, yasadaki diğer koşulların da bulunması gerekmektedir. TMK'nın 1023. maddesinin uygulanabilmesi için "kazananın üçüncü kişi olması", "üçüncü kişinin sicildeki yolsuz bir tescile dayanmış olması", "üçüncü kişinin bir aynî hak kazanmış olması", "üçüncü kişinin aynî hakkı iyi niyetle kazanmış olması" ve "üçüncü kişinin kazanımında tasarruf yetkisi dışında diğer geçerlilik unsurlarının mevcut olması" şartlarının varlığı aranır (Sirmen. A.L., Eşya Hukuku, Ankara 2017, s.196-201). (YHGK, 28/11/2019 T., 2019/2-318 E., 2019/1238 K.)
10- Somut olayda her iki davalı kötüniyetlidir. Zira birbirlerinin eşidirler ve ortalama rayici …. TL olan bir taşınmazın kendilerine ait olmadığını bilmektedirler. Kaldı ki, her ikisi de taşınmazın müvekkilime ait olduğunu, zorunlu nedenlerle davalı C.B. adına tescil edildiğini bilmektedirler. Bu nedenle, her ikisi de kötüniyetli olup, tescil yolsuzdur ve iptali gerekir.
11- Yukarıda açıklanan nedenlerle, yolsuz olarak önce davalı C.B. üzerine sonra da İ.B. üzerine tescil edilen dava konusu taşınmazın tapusunun iptali ile, müvekkilim adına kayıt ve tescilini, iyiniyetli üçüncü bir şahsa devrinin engellenmesi için de ihtiyatî tedbir konulmasını talep etme zarureti doğmuştur.

II. DELİLLER
- Nüfus kayıtları,
- Tapu kayıtları,
- Hastane raporları
- Davalıların sosyal ve ekonomik durum araştırması,
- Davalıların maaş bordrosu,
- Keşif ve bilirkişi incelemesi,
- Whatsapp kayıtları,
- Havale gönderileri
- Banka hesap kayıtları,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.
- Sair her türlü delil

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 704, 705 ve 706., 1022, 1023 Maddeleri.
2-6098 Sayılı Türk Borçlar Kanunu: 19, 237 ve 288. Maddeleri
3-2644 Sayılı Tapu Kanunu: 26. Maddesi.
4-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
5- Yargıtay İçtihatları Birleştirme Büyük Genel Kurulunun 1.4.1974 tarihli 1/2 sayılı içtihadı.
6-İlgili sair mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Öncelikle dava sonuçlanıncaya kadar tapu sicilinde kayıtlı … mahallesi … ve … parsel sayılı dava konusu taşınmazın üçüncü kişilere satılmasının önlenmesi için, öncelikle teminatsız olarak; mahkeme aksi kanaatte ise uygun bir teminat karşılığı, DAVA KONUSU TAŞINMAZA İHTİYATİ TEDBİR KONULMASINA,
2) Yolsuz olarak davalı İ.B. adına tescil edilen dava konusu taşınmazın tapusunun iptali ile, müvekkilim A.B. adına TAPUYA KAYIT VE TESCİLİNE,
3) Yargılama gideri ve vekalet ücretinin davalı tarafa yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. ……………..
                               İmza
EKİ:
1-Hastane raporları
2-Whatsapp yazışma görüntüleri
3-Havale gönderileri
4-Vekaletname örneği
`,
  
    'Çaplı Taşınmaza Elatmanın Önlenmesi': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 
DAVACI: A.B.., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: A.V., adres, T.C. kimlik no:…….
DAVALI: D.D. Adı Soyad, Adres,
DAVA KONUSU : Çaplı Taşınmaza Elatmanın Önlenmesi
DAVA DEĞERİ: … TL

I. AÇIKLAMALAR:
1- Müvekkilimin A.B., .... İli ... İlçesi, … Köyü, … parsel sayılı tarla vasfındaki taşınmazın kayıt maliki ve sahibidir. Tapu kayıtları bu doğrultudadır.
2- Davalı D.D. ise, müvekkilime ait … parsel sayılı taşınmaza komşu olan … parsel sayılı taşınmazın malikidir.
3- Davalı, ekim mevsimine kısa bir süre kala ekim işleminde kullanılacak alet, gereç ve malzemeleri sürekli şekilde müvekkilimin … parsel sayılı tarlasına yığmaktadır. Sunulan fotoğraflar bunu doğrulamaktadır (EK-1).
4- Daha önce müvekkilim tarafından uyarılmasına rağmen davalı eylemini sürdürmeye devam etmiştir. Bunun üzerine müvekkilim … asliye hukuk mahkemesinden delil tespiti isteğinde bulunmuş ve dava konusu taşınmaza yönelik elatma hususu fotoğraf ve tutanaklarla tespit edilmiştir. Delil tespiti dosyasının bir sureti dilekçemiz ekinde sunulmuştur (EK-2).
5- Davalı, dava tarihi itibariyle elatma olgusunu gidermemiştir. 
6- Davalının bu eylemi nedeniyle müvekkilim önümüzdeki ekim döneminde tarlasını ekerken zorlanacaktır. Bu nedenle, TMK m. 683 hükmü kapsamında müvekkilimin taşınmazına yapılan elatmanın önlenmesine karar verilmesini talep etme zarureti doğmuştur.

II. DELİLLER:
- Tapu kayıtları,
- Keşif ve bilirkişi raporları,
- Fotoğraflar,
- Delil tespiti dosyası,
- Mahalli bilirkişi ifadeleri,
-Tanık beyanları
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz vakıaların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 683. maddesi
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
3-08.03.1950 tarih, 22/4  sayılı YİBK.
4-Sair ilgili mevzuat

SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1- Müvekkilime ait olan dava konusu … parsel sayılı taşınmaza, davalı tarafından yapılan  ELATMANIN ÖNLENMESİNE,
2- Müvekkilime ait taşınmaza yapılan elatmanın önlenmesi için gerekli masrafların davalıya yükletilmesine, 
3- Yargılama gideri ve vekalet ücretinin davalılara yükletilmesine,


DAVACI VEKİLİ
Av. ……………..
                   imza


EKİ:
1-Fotoğraflar
2-Delil tespiti dosyası,
3- Vekaletname
`,
  
    'Paydaşlar Arasında Elatmanın Önlenmesi': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 
DAVACI: A.B.., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: A.V., adres, T.C. kimlik no:…….
DAVALI: D.D. Adı Soyad, Adres,
DAVA KONUSU : Paydaşlar Arasında Elatmanın Önlenmesi
DAVA DEĞERİ: … TL

I. AÇIKLAMALAR:
1- Müvekkilimin A.B., .... İli ... İlçesi, … Köyü, … parsel sayılı tarla vasfındaki taşınmazda davalı ile birlikte ½ oranında kayıt paylı maliktir. Tapu kayıtları bu doğrultudadır.
2- Davalı ile müvekkilim arasında kimin nereyi kullanacağına dair fiili taksim anlaşması yapılmıştır. Buna göre, taşınmazın güney kısmı müvekkilimin, kuzey kısmı davalının kullanımındadır. Taraflar arasında bu hususta ihtilaf bulunmamaktadır.
3- Müvekkil ile davalı arasında komşu olmalarından dolayı aralarında bir takım geçimsizlikler baş göstermeye başlamıştır. Bu geçimsizlik kapsamda davalı D.D., müvekkilime rahatsızlık verecek davranışlarda bulunmaktadır.
4- Davalı, ekim mevsimine kısa bir süre kala ekim işleminde kullanılacak alet, gereç ve malzemeleri sürekli şekilde müvekkilimin … parsel sayılı tarlasına yığmaktadır. Sunulan fotoğraflar bunu doğrulamaktadır (EK-1).
5- Daha önce müvekkilim tarafından uyarılmasına rağmen davalı eylemini sürdürmeye devam etmiştir. Bunun üzerine müvekkilim … asliye hukuk mahkemesinden delil tespiti isteğinde bulunmuş ve dava konusu taşınmaza yönelik elatma hususu fotoğraf ve tutanaklarla tespit edilmiştir. Delil tespiti dosyasının bir sureti dilekçemiz ekinde sunulmuştur (EK-2).
6- Davalı, dava tarihi itibariyle elatma olgusunu gidermemiştir. 
7- Davalının bu eylemi nedeniyle müvekkilim önümüzdeki ekim döneminde tarlasını ekerken zorlanacaktır. Bu nedenle, TMK m. 693 hükmü kapsamında müvekkilimin taşınmazına yapılan elatmanın önlenmesine karar verilmesini talep etme zarureti doğmuştur.

II. DELİLLER:
- Tapu kayıtları,
- Keşif ve bilirkişi raporları,
- Fotoğraflar,
- Delil tespiti dosyası,
- Mahalli bilirkişi ifadeleri,
-Tanık beyanları
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz vakıaların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 688-700. Maddeleri arası
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
3-Sair ilgili mevzuat

SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1- Müvekkilime ait olan dava konusu … parsel sayılı taşınmaza, davalı tarafından yapılan  ELATMANIN ÖNLENMESİNE,
2- Müvekkilime ait taşınmaza yapılan elatmanın önlenmesi için gerekli masrafların davalıya yükletilmesine, 
3- Yargılama gideri ve vekalet ücretinin davalılara yükletilmesine,


DAVACI VEKİLİ
Av. ……………..
                   imza

EKİ:
1-Fotoğraflar
2-Delil tespiti dosyası,
3- Vekaletname`,
  
    'Komşuluk Hukukundan Kaynaklanan Elatmanın Önlenmesi': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 
DAVACI: A.B.., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: A.V., adres, T.C. kimlik no:…….
DAVALI: D.D. Adı Soyad, Adres,
DAVA KONUSU : Komşuluk Hukukundan Kay. Elatmanın Önlenmesi
DAVA DEĞERİ: … TL

I. AÇIKLAMALAR:
1- Müvekkilimin A.B., .... İli ... İlçesi, … Köyü, … parsel sayılı taşınmazda müstakil evde oturmaktadır. 
2- Davalı D.D. ise, müvekkilimin yan komşusu olmaktadır. 
3- Davalı D.D., belli bir süredir lavabo atıklarının tahliye edildiği gideri tamir etmediği için, davalının taşınmazının pis suları müvekkilimin avlusuna gelmekte, kötü kokular yaymakta ve avludaki bitkilere zarar vermektedir. Dilekçe ekinde sunduğumuz fotoğraflardan bu durum net bir şekilde anlaşılmaktadır (EK-1).
4- Müvekkilim davalıyı defalarca uyardığı halde davalı buna bir çözüm bulmamıştır. Söz konusu tahliye borusunun uzatılarak kanala verilmesi gerekmektedir. Davalı, masraftan kaçındığı için bunu yapmamaktadır.
5- TMK m. 737/1. ve 2. fıkra hükmüne göre “Herkes, taşınmaz mülkiyetinden doğan yetkileri kullanırken ve özellikle işletme faaliyetini sürdürürken, komşularını olumsuz şekilde etkileyecek taşkınlıktan kaçınmakla yükümlüdür. Özellikle, taşınmazın durumuna, niteliğine ve yerel âdete göre komşular arasında hoş görülebilecek dereceyi aşan duman, buğu, kurum, toz, koku çıkartarak, gürültü veya sarsıntı yaparak rahatsızlık vermek yasaktır.”  Davalının eylemi bu maddede belirlenen yükümlülüğe aykırılık oluşturmaktadır.
6- Tüm taleplerimize rağmen davalının söz konusu olumsuzluğu gidermediği için dava açma zarureti doğmuştur.

II. DELİLLER:
- Tapu kayıtları,
- Keşif ve bilirkişi raporları,
- Fotoğraflar,
- Mahalli bilirkişi ifadeleri,
-Tanık beyanları
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz vakıaların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 737. Maddeleri arası
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
3-Sair ilgili mevzuat

SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1- Müvekkilime ait olan dava konusu … parsel sayılı taşınmaza, davalı tarafından yapılan  ELATMANIN ÖNLENMESİNE,
2- Müvekkilime ait taşınmaza yapılan elatmanın önlenmesi için gerekli masrafların davalıya yükletilmesine, 
3- Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,


DAVACI VEKİLİ
Av. ……………..
                   imza

EKİ:
1-Fotoğraflar
2- Vekaletname`,
  
    'Müdahalenin Meni': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….

 
DAVACI: … Köy Tüzel Kişiliği
DAVACI VEKİLİ: A.V., adres, T.C. kimlik no:…….
DAVALI: D.D. Adı Soyad, Adres,
DAVA KONUSU : Meraya Elatmanın Önlenmesi 
DAVA DEĞERİ: … TL

I. AÇIKLAMALAR:
1- Davalı D.D., müvekkil köyde oturan bir köylü olup, devletin hüküm ve tasarrufu altında bulunan ve mera vasfıyla özel sicile kaydedilmiş bulunan … parsel sayılı taşınmaza prefabrik ev inşa etmek meraya elatmış vaziyettedir. Dilekçemiz ekinde sunduğumuz fotoğraflardan bu durum net bir şekilde anlaşılacaktır.
2- Davalının prefabrik bina inşa ettiği yer mera vasfında olup sicil kayıtlarından bu durum net bir şekilde anlaşılacaktır. 
3- Mera Kanunu’na göre meraların kullanımı köy halkının tamamına aittir. Davalının yaptığı gibi köy halkının sabit bir şekilde meraya prefabrik yapı yapması kanuna ve mera vasfına uygun değildir.
4- Mera Kanunu’nun 19/1 hükmüne göre “Muhtarlar ve belediye başkanları; mera, yaylak ve kışlakların ve sınır işaretlerinin korunmasından ve ayrıca tahsis amacına göre en iyi şekilde kullanılmasının sağlanmasından sorumludur. Muhtarlar ve belediye başkanları ayrıca, geliştirme projelerinde öngörülen hususların yerine getirilmesinde, kamu görevlilerine yardımcı olmakla görevli ve sorumludurlar.”
5- Davalının diğer köy halkının kullanımını engelleyecek şekilde gerçekleştirdiği eylemin sonlandırılması için kendisine defalarca uyarıda bulunulmuştur. Buna rağmen davalı bu uyarılara kulak vermemiştir. Bu nedenle, davalının yaptığı bu müdahalenin önlenmesini talep etme zarureti doğmuştur.

II. DELİLLER:
- Tapu kayıtları,
- Keşif ve bilirkişi raporları,
- Fotoğraflar,
- Mahalli bilirkişi ifadeleri,
-Tanık beyanları
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz vakıaların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

HUKUKİ NEDENLER: 
1- Mera Kanunu’nun ilgili hükümleri,
2- Kadastro Kanunu m. 16,
3-4721 Sayılı Türk Medeni Kanunu: 712. Maddeleri arası
4-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.

SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1- Davalı tarafından meraya yapılan ELATMANIN ÖNLENMESİNE,
2- Elatmanın önlenmesi için gerekli masrafların davalıya yükletilmesine, 
3- Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,


DAVACI VEKİLİ
Av. ……………..
                   imza


EKİ:
1-Fotoğraflar
2- Vekaletname`,
  
    'Ortaklığın Satış Suretiyle Giderilmesi': `…….. SULH HUKUK MAHKEMESİ’NE

DAVACI : Ad-Soyad-TC Kimlik No-Adres
VEKİLİ : Av.  …
DAVALILAR :1- Ad-Soyad-Adres
  2- Ad-Soyad-Adres
  3- Ad-Soyad-Adres
KONU : Ortaklığın satış suretiyle giderilmesi talebidir.

I. AÇIKLAMALAR :
1- Muris Ahmet EKER müvekkilim ve davalıların murisi olup …. tarihinde vefat etmiştir. Muristen yasal mirasçılarına intikal eden Ankara İli Mamak İlçesi … Mahallesi 111 Ada 11 Parselde kain 5 nolu bağımsız bölüm üzerinde, müvekkilim ve davalılar arasında iştirak halinde mülkiyet söz konusudur.
2- Davalılarla yapılan şifahi görüşmelerde, taşınmaz üzerindeki iştirak halinde mülkiyetin müşterek mülkiyete çevrilmesi mümkün olmadığı gibi, davalılar, gayrimenkulün satışına da yanaşmamaktadırlar.
3- Fiili durumu itibarı ile paylaştırma da mümkün olmadığından, taşınmaz üzerindeki ortaklığın satış suretiyle giderilmesini talep etme zarureti hasıl doğmuştur.

II. HUKUKİ NEDENLER : 4721 s. TMK m. 642, HMK ve diğer yasal nedenler.

III. HUKUKİ DELİLLER : 
- Mirasçılık Belgesi, 
- Tapu kayıtları, 
- Aile nüfus kayıt tablosu, 
- Keşif, 
- Bilirkişi incelemesi diğer her türlü yasal delil.

IV. SONUÇ VE İSTEM : Yukarıda arz ve izah olunan nedenlerle;
1- Ankara İli Mamak İlçesi … Mahallesi 111 Ada 11 Parselde kain 5 nolu bağımsız bölüm üzerindeki ortaklığın satış suretiyle giderilmesini,

2-Yargılama giderleri ve vekalet ücretinin payları oranında hissedarlara yükletilmesini vekaleten saygılarımla arz ve talep ederim. ../../…

Davacı Vekili
Av. ............
EKİ:
1-Veraset ilamı
2-Nüfus kayıt tablosu
3-Tapu sureti`,
  
    'Ortaklığın Giderilmesi - Paydaşlık': `…….. SULH HUKUK MAHKEMESİ’NE

DAVACI : Ad-Soyad-TC Kimlik No-Adres
VEKİLİ : Av.  …
DAVALI: Ad-Soyad-Adres
KONU : Ortaklığın giderilmesi talebidir.

I. AÇIKLAMALAR :
1- Müvekkilim ile davalı, ekte sunulan tapu kaydından anlaşılacağı üzere …. İli … ilçesi … mevkii …. ada …. pafta …. parselde bulunan arsa vasfındaki taşınmaza paylı olarak maliktirler. Müvekkilimin pay oranı … olup, davalının pay oranı da ….’dır.
2- Davalı ile müşterek mülkiyette olan dava konusu taşınmaz üzerinde yapılacak inşaat ile ilgili müvekkil ile davalı arasında anlaşma yapılamamakta olup, her iki taraf için yararlı şekilde kullanma imkanı ortadan kalkmıştır. 
3- Yapılan tüm çabalara rağmen davalı taraf anlaşma yolunu kabul etmemiştir. Müvekkilim ile davalı, anlaşmak suretiyle paydaşlığı gideremediğinden iş bu ortaklığın giderilmesi davasının açılması zarureti doğmuştur.
3- Bu nedenlerle, öncelikle dava konusu taşınmazın aynen taksim suretiyle ortaklığının giderilmesini, mümkün değil ise satış suretiyle ortaklığın giderilmesini talep etmekteyiz.

II. HUKUKİ NEDENLER : 4721 s. TMK m. 642, HMK ve diğer yasal nedenler.

III. HUKUKİ DELİLLER : 
- Tapu kayıtları, 
- Tanık beyanları, 
- Keşif,  
- Bilirkişi incelemesi diğer her türlü yasal delil.

IV. SONUÇ VE İSTEM : Yukarıda arz ve izah olunan nedenlerle;
1- …. İli … ilçesi … mevkii …. ada …. pafta …. parselde bulunan arsa vasfındaki taşınmaza dair ortaklığın mümkün ise aynen taksim suretiyle giderilmesini,
2- Mümkün değilse sadece paydaşlar arasında yapılacak satış yoluyla ortaklığın giderilmesini,
3- Bu da mümkün değilse, umuma açık artırma suretiyle satılarak satış bedelinin ve yargılama giderlerinin ortakların payları oranında paylaştırılmasına,
Karar verilmesini vekaleten arz ve talep ederiz. ../../…

Davacı Vekili
Av. ............
EKİ:
1-Tapu kaydı
2-Tanık listesi`,
  
    'Paydaşlığın Giderilmesi': `…….. SULH HUKUK MAHKEMESİ’NE

DAVACI : Ad-Soyad-TC Kimlik No-Adres
VEKİLİ : Av.  …
DAVALILAR :1- Ad-Soyad-Adres
  2- Ad-Soyad-Adres
  3- Ad-Soyad-Adres
KONU : Paydaşlığın giderilmesi talebidir.

I. AÇIKLAMALAR :
1- Müvekkilim davalılarla birlikte paydaş oldukları dava konusu …. İli … ilçesi 198 Ada, 29 parsel üzerine iki katlı yazlık bir ev yapmıştır. Taşınmazın üzerinde ayrıca limon bahçesi bulunmakta, müvekkilin bina inşa ettiği alan ve diğer kısımlar paydaşlar arasında fiilen bölünmüş gibi kullanılmaktadır. Taşınmaz yıllardır tüm paydaşlarca hiçbir sorun olmaksızın kullanılmaktayken, evin yapımı tamamlandıktan sonra diğer paydaşlar kullanım konusunda sorunlar çıkarmaya başlamışlardır. Bunun sonucu olarak paydaşlığın devamı müvekkil açısından çekilmez hale gelmiştir. 
2- Taşınmazın taraflar arasında rızaen paylaşımı binanın değerinin ödenmek istenmemesi nedeniyle mümkün olmamıştır. Zira taşınmaz üzerindeki betonarme bina tamamen müvekkilimin kişisel malvarlığından yapılan harcamalar ve kişisel emeğiyle inşa edilmiş bulunmaktadır. Öte yandan binanın müvekkilimize ait olduğu konusunda tapuda şerh bulunmakta ve bu hususta tüm paydaşlar ittifak etmektedirler.
3- Bu nedenlerle, taşınmazın mümkünse aynen taksimine, olmazsa muhdesatın bedeli müvekkile bırakılmak kaydıyla satış yoluyla ortaklığın giderilmesine karar verilmesini sağlamak için mahkemenize başvurmak zorunluluğu hasıl olmuştur.

II. HUKUKİ NEDENLER : 4721 TMK m. 698, 699, HMK ve ilgili mevzuat.

III. HUKUKİ DELİLLER : Tapu kayıtları, tanık beyanları ve diğer deliller.

IV. SONUÇ VE İSTEM : Yukarıda açıklanan nedenlerle taşınmaz maldaki paydaşlığın öncelikle aynen taksim, mümkün olmadığı takdirde bina değeri müvekkile bırakılmak kaydıyla satış yoluyla giderilmesine karar verilmesini müvekkil adına vekaleten saygıyla arz ve talep ederim. .../…/…

                                                                     Davacı Vekili
                          Av……………
`,
  
    'Ortaklığın Giderilmesi - Elbirliği Mülkü': `… … İCRA HUKUK MAHKEMESİ HAKİMLİĞİ’NE


TALEPTE BULUNAN/ 
ALACAKLI : Ad-Soyad-TC Kimlik No-Adres
VEKİLİ : Av….
BORÇLU : Ad-Soyad-Adres
KONU : Borçlunun iştirak (elbirliği) halinde maliki olduğu arazinin paylaştırılması amacıyla ortaklığın giderilmesi davası açmak için yetki belgesi verilmesi istemidir.

I. AÇIKLAMALAR :
1) Müvekkilim … …’in, borçlu …’den olan … TL. alacağını tahsil edememesi nedeniyle başlattığı icra takibi dolayısıyla … İcra Müdürlüğü’nün …/…E. sayılı takip dosyasından gönderilen ödeme emrine borçlu tarafından itiraz edilmemiş ve takip kesinleşmiştir. Bunun üzerine müvekkilim de borçlunun elbirliği ile malik olduğu …İli, … İlçesi, … mevkiinde tapunun … Ada …/… parselinde kayıtlı bulunan tarla üzerine haciz koydurmuştur.
2) Borçlu …, borcunu ödemediği gibi iştirak halinde maliki olduğu tarlayla ilgili olarak ortaklığın giderilmesi davası da açmamaktadır. Bu durum müvekkilimin alacağının tahsilini geciktirmektedir.
3) Bu nedenle yukarıda tapu kaydı verilen ve müvekkilim tarafından haciz konulan iştirak halinde mülkiyete konu tarla üzerinde borçlu …’ye düşecek paydan alacağın tahsilini sağlamak üzere ortaklığın giderilmesi davası açmak için yetki belgesi almak üzere işbu istemi sunma zorunluluğu doğmuştur.

II. HUKUKİ NEDENLER  : 2004 S. K. m. 121 ve ilgili mevzuat.

III. HUKUKİ DELİLLER : 
- Takip dosyası, 
- Tapu kayıtları, 
- Borçlunun payını gösteren veraset ilamı, 
- Tanık beyanları ve diğer deliller.

IV. SONUÇ VE İSTEM : Yukarıda açıkladığımız nedenlerle, borçlunun elbirliği ile maliki olduğu tarlanın ortaklığın giderilmesi davası yoluyla sattırılabilmesi için dava açmaya yetki belgesi verilmesini Mahkemenizden saygıyla talep ederim. …/…/…

                                                                Davacı Vekili
 Av.
`,
  
    'Ortaklığın Giderilmesi (İİK m.121)': `…….. SULH HUKUK MAHKEMESİ’NE

DAVACI : Ad-Soyad-TC Kimlik No-Adres
VEKİLİ : Av.  …
DAVALILAR :1- Ad-Soyad-Adres
  2- Ad-Soyad-Adres
  3- Ad-Soyad-Adres
 4- Ad-Soyad-Adres
KONU : Ortaklığın giderilmesi talebidir (İİK 121’e İstinaden).

I. AÇIKLAMALAR :
1- Davalılardan … İcra Müdürlüğünün ……… Esas sayılı icra takip dosyasında müvekkilimiz ………….’ne borçludur. 
2- Bu davalı aleyhine girişilen icra takibine ilişkin dosyada yapılan haciz ve araştırmalarda davalıya ait haczi kabil menkul ve gayrimenkul mal bulunamamış, ancak muris babası ……….. adına kayıtlı ve henüz intikali yapılmamış taşınmazların bulunduğu tespit edilmiştir.
3- Muris adına kayıtlı taşınmazların intikal ve satışına esas olmak üzere alınan yetki ile ….. ... Sulh Hukuk Mahkemesine açılan dava sonucunda murisin mirasçılarını gösterir …/…/… tarih, ... Esas ve  …. Karar sayılı mirasçılık belgesi dosya içerisine sunulmuştur. 
4- Muris adına kayıtlı taşınmazların verasette iştirak halinde olduğu anlaşıldığından İİK.nun 121 maddesi uyarınca taşınmaz satışlarının nasıl yapılacağı konusunda İcra Hakimliğine yapılan başvuru sonucunda ……... İcra Hukuk Mahkemesinin …/…/… tarih,  …….. Esas ve ….. Karar sayılı kararı ile borçlu ….’e mirasen intikal eden ….. ili …….ilçesi ……. Köyü …. parsel, …. parsel, …. parsel ve … parsel sayılı taşınmazlardan borçluya intikal edecek olan hisseler açısından açılacak ortaklığın giderilmesi davası sonucu satışın veya taksimin yapılmasına, bu hususta Sulh Hukuk Mahkemelerinde dava açmak üzere süre ve yetki verilmesine karar verilmiştir. 
5- İcra dosya alacağının tahsiline esas olmak üzere; borçlu hissesinden borcu karşılayacak miktarda satılarak paraya çevrilmesi için taşınmazların satılarak mirasçılar arasındaki ortaklığın giderilmesi için işbu davayı açmak zarureti doğmuştur. 

II. YASAL NEDENLER : İİK., TMK., HMK ve ilgili mevzuat hükümleri.

III. DELİLLER : 
- Mirasçılık belgesi, 
- İcra Hakimliği kararı, 
- İcra takip dosyası, 
- Tapu kaydı, 
- Bilirkişi raporu, 
- Tanık beyanları ve diğer her türlü delil.

IV. SONUÇ ve İSTEM: Yukarıda açıklanan nedenlerle; 
1- Davamızın kabulü ile, borçlu murisi adına kayıtlı ….. ili …….ilçesi ……. Köyü …. parsel, …. parsel, …. parsel ve … parsel sayılı taşınmazlardan borcu karşılamaya yetecek kadar satılması suretiyle taraflar arasındaki Ortaklığın Giderilmesine,
2- İşbu dava nedeniyle yapılacak masraf, harç ve giderler ile ücreti vekaletin hisseleri oranında hissedarlara aidiyetine karar verilmesini vekaleten saygı ile arz ve talep ederiz. …/…/…

Davacı Vekili
 Av. ……………….

EKİ : 
Ek-1 Veraset ilamı, .
Ek-2 Dava açma yetkisi veren
    İcra hakimliği karar örneği`,
  },
  'Borçlar Hukuku': {
    'Sözleşme Bozma': `DİLEÇE — SÖZLEŞME BOZMA VE TAZMİNAT\n\nDavacı: [Adı Soyadı]\nDavalı: [Şirket Adı]\n\nSÖZLEŞME:\nTarihi: [Tarih]\nKonusu: [Açıklama]\nBedeli: [Tutar] TL\n\nBOZMA SEBEPLERİ:\n[Davalının yükümlülüklerini yerine getirmemesi]\n\nZARAR:\nÖdenen tutar: [Tutar] TL\nDiğer zararlar: [Tutar] TL\nTOPLAM: [Tutar] TL\n\nKANUNİ DAYANAKLAR:\nTBK m.112, m.117-126\n\nTALEP:\n[Tutar] TL tazminat ödenmesi.\n\n________________________`,
    'Ayıplı Hizmet': `DİLEÇE — AYIPLI HİZMET VE TAZMİNAT\n\nDavacı: [Adı Soyadı]\nDavalı: [Hizmet Veren]\n\nHİZMET SÖZLEŞMESİ:\nTürü: [Açıklama]\nTarihi: [Tarih]\nBedeli: [Tutar] TL\n\nAYIPLAR:\n1. [Ayıp 1]\n2. [Ayıp 2]\n\nZARAR:\nMaddi: [Tutar] TL\nManevi: [Tutar] TL\nTOPLAM: [Tutar] TL\n\nKANUNİ DAYANAKLAR:\nTBK m.227-240\n\nTALEP:\n[Tutar] TL tazminat ödenmesi.\n\n________________________`,
  
    'Trafik Kazası - Değer Kaybı Tazminatı': `......... ASLİYE HUKUK MAHKEMESİ HAKİMLİĞİ’NE

DAVACI: 
TC KİMLİK NUMARASI : 
ADRES: 
VEKİLİ: 
ADRES: 
DAVALI: 
ADRESİ: 
KONU: Trafik Kazası Sonucu Araçta Meydana Gelen 
Değer Kaybı İle Aracın Kullanılmamasından 
Doğan Zararın Tazmin Edilmesi İstemimizden 
İbarettir.
DAVA DEĞERİ : 

AÇIKLAMALAR :
1-) Müvekkilimizin sevk ve idaresinde bulunan … plakalı, … model … marka ticari taksiye (EK-1), davalının sevk ve idaresinde bulunan … plakalı aracın arkadan çarpması sonucu meydana gelen maddi hasarlı trafik kazasında (EK-2)  müvekkilimize ait aracın bagaj kısmı tamamen hasar görmüş, arka dingilin yamulması (EK-3) nedeni ile aracın hareket kabiliyeti tamamen ortadan kalkmıştır. Araç … gün serviste (EK-4) kalmış, bu süre boyunca kullanılamamıştır. 
2-) Müvekkilimiz, hasara uğrayan aracını …/…/… tarihinde almış olup kaza tarihine kadar aracın tüm bakımlarını (EK-5) zamanında yaptırmıştır. Kaza tarihine kadar aracın değişen her hangi bir parçası bulunmadığı gibi kaportasında da en ufak bir çizik bile söz konusu olmamıştır. Müvekkilimiz, aracını tamir süresi boyunca kullanamamış ve ortalama … TL olan günlük kazancını … gün boyunca elde edememiştir. Bu durumla ilgili olarak dilekçemiz ekinde sunulmuş tanık listesinde (EK -6) isimleri yer alan ilgililer de, mahkemenizce uygun görülmesi halinde duruma ilişkin izahat verecektir.
3-) Müvekkilimiz, … yıllık taksici olup geçimini bu şekilde sağlamaktadır. Meydana gelen kaza nedeni ile araçta oluşan değer kaybı ve aracın tamirde kaldığı süre boyunca oluşan kar kaybının ödenmesi için mahkemenize başvurulması zorunluluğu hasıl olmuştur. 

HUKUKİ NEDENLER : 6098 s. TBK m. 122, 6100 s. HMK m. 2, 6

HUKUKİ DELİLLER : Ruhsat Fotokopisi, Trafik Kaza Tespit Tutanağı, Aracın Hasarını Gösterir Fotoğraflar, Servis Hasar Onarım Raporu, Servis Bakım Raporları

SONUÇ VE İSTEM         : Yukarıda açıkladığımız nedenlerden dolayı, müvekkilimize ait araçta meydana gelen değer kaybı ile aracın tamir süresince kullanılamaması nedeni ile mahrum kalınan kar kaybı karşılığı olarak … TL’nin davalıdan alınmasına ve yargılama giderleri ve vekalet ücretinin karşı tarafa yükletilmesine karar verilmesini vekaleten talep ederiz. …/…/…

Davacı Vekili
   Av.


EKLER: 
1. Ruhsat fotokopisi
2. Trafik kaza tespit tutanağı
3. Aracın hasarını gösterir fotoğraflar
4. Servis hasar onarım raporu
5. Servis bakım raporları
6. Tanıkların listesi
7. Bir adet onaylı vekaletname örneği.`,
  },
  'Ticaret Hukuku': {
    'Şirket Feshi': `DİLEÇE — ŞİRKET FESHİ VE TASFİYE\n\nDavacı Ortak: [Adı — %Pay]\nDavalı Şirket: [Ticaret Unvanı]\n\nŞİRKET:\nTür: [A.Ş. / Ltd.]\nKuruluş: [Tarih]\nSermaye: [Tutar] TL\n\nFESİH SEBEPLERİ:\n1. [Sebep 1]\n2. [Sebep 2]\n\nKANUNİ DAYANAKLAR:\nTTK m.166, m.179-194\n\nTALEP:\n1. Şirketin FESHİ ve TASFİYESİ\n2. Tasfiye memuru atanması\n\n________________________`,
    'Marka İhlali': `DİLEÇE — MARKA İHLALİ\n\nDavacı: [Şirket]\nDavalı: [Şirket]\n\nMARKA:\nAdı: [Ad]\nTescil No: [No]\nSınıf: [No]\n\nİHLAL:\n[Davalının benzer marka kullanımı]\n\nZARAR:\nSatış kaybı: [Tutar] TL\nManevi: [Tutar] TL\nTOPLAM: [Tutar] TL\n\nKANUNİ DAYANAKLAR:\n6769 SMK m.37-38\n\nTALEP:\n1. İhlalin durdurulması\n2. [Tutar] TL tazminat\n\n________________________`,
  
    'Kasko Sigorta Araç Hasar Tazminatı': `... ASLİYE TİCARET MAHKEMESİ’NE

DAVACI : 
DAVACI VEKİLİ:
DAVALI : 
DAVA KONUSU : Sigortalı araçta meydana gelen hasarın tazmini isteminden 
   ibarettir.

AÇIKLAMALAR :
1-) Müvekkil … …’e ait kasko sigortalı … plakalı … model … marka araç, … ili, … ilçesi … mevkiindeki kapalı otoparkta bulunduğu sırada, dava dışı … …’e ait  … plakalı … model … marka araçta LPG sistemindeki arızadan kaynaklı olarak meydana gelen yangının sirayet etmesi sonucu yanarak kullanılamaz hale gelmiştir.
2-) Meydana gelen olay sonrasında müvekkil aracında oluşan ve Mahkemenizin …/… D. İş sayılı delil tespiti dosyasıyla … TL.  olarak tespit edilen zararın sigorta poliçesi uyarınca tazmin edilmesi istemiyle davalı sigortacısına başvurmuş, …/…/… tarihinde kendisine verilen yanıtta hasarın teminat dışı olduğundan bahisle bu istemi reddedilmiştir.
3-) Davalı şirketin iddiası doğru değildir zira gerek müvekkil ile davalı şirket arasında imzalanan poliçede gerekse de Kara Taşıtları Kasko Sigortası Genel Şartları’nda yukarıda belirttiğimiz şekilde gerçekleşen hasarların teminat dışı olduğuna dair herhangi bir hüküm yoktur. Müvekkil poliçede ve genel şartlarda belirtilen tüm yükümlülüklerini yerine getirmiş, primlerini zamanında yatırmıştır. Zamanında yapılan bildirime rağmen ve diğer bütün şartları gerçekleşmişken davalının zararın tazmininden imtina etmesi poliçe ve genel şartlar hükümlerine, dahası kanun hükümlerine aykırıdır.
4-) Yukarıda bahsettiğimiz sebeplerle, müvekkilin sigortalı aracında meydana gelen zararın 6762 sayılı Türk Ticaret Kanunu, Kara Taşıtları Kasko Sigortası Genel Şartları ve taraflar arasında imzalanan poliçe hükümleri gereğince davalı sigorta şirketi tarafından tazmin edilmesini sağlamak amacıyla mahkemenize başvurmak zorunluluğu doğmuştur.

HUKUKİ NEDENLER :   6762 S. K. m. 1299, Kara Taşıtları Kasko Sigortası Genel Şartları A.3, A.5, B.3 ve ilgili mevzuat.

HUKUKİ DELİLLER : Kasko sigorta poliçesi, davalıya çekilen …/…/… tarihli ihtarname, … Mahkemesi’nin …/… D. İş sayılı delil tespiti dosyası ve diğer hukuki deliller.


SONUÇ VE İSTEM         : Yukarıda açıklanan nedenlerle, fazlaya ilişkin haklarımız saklı kalmak kaydıyla araçta oluşan zarar bedeli  ... TL.nin zararlandırıcı olayın meydana geldiği tarihten itibaren işletilecek reeskont faiziyle birlikte davalı sigorta şirketi tarafından tazminine ve yargılama giderlerinin davalıya yükletilmesine karar verilmesini müvekkil adına saygıyla talep ederiz. …/…/…

 Davacı Vekili
   Av.`,
  
    'Kasko Sigorta Hasar Tazminatı': `... ASLİYE TİCARET MAHKEMESİ’NE

DAVACI : 
DAVACI VEKİLİ:
DAVALI : 
DAVA KONUSU : Sigortalı araçta meydana gelen hasarın tazmini isteminden 
   ibarettir.

AÇIKLAMALAR :
1-) Müvekkil … …’e ait kasko sigortalı … plakalı … model … marka araç, … ili, … ilçesi … mevkiindeki kapalı otoparkta bulunduğu sırada, dava dışı … …’e ait  … plakalı … model … marka araçta LPG sistemindeki arızadan kaynaklı olarak meydana gelen yangının sirayet etmesi sonucu yanarak kullanılamaz hale gelmiştir.
2-) Meydana gelen olay sonrasında müvekkil aracında oluşan ve Mahkemenizin …/… D. İş sayılı delil tespiti dosyasıyla … TL.  olarak tespit edilen zararın sigorta poliçesi uyarınca tazmin edilmesi istemiyle davalı sigortacısına başvurmuş, …/…/… tarihinde kendisine verilen yanıtta hasarın teminat dışı olduğundan bahisle bu istemi reddedilmiştir.
3-) Davalı şirketin iddiası doğru değildir zira gerek müvekkil ile davalı şirket arasında imzalanan poliçede gerekse de Kara Taşıtları Kasko Sigortası Genel Şartları’nda yukarıda belirttiğimiz şekilde gerçekleşen hasarların teminat dışı olduğuna dair herhangi bir hüküm yoktur. Müvekkil poliçede ve genel şartlarda belirtilen tüm yükümlülüklerini yerine getirmiş, primlerini zamanında yatırmıştır. Zamanında yapılan bildirime rağmen ve diğer bütün şartları gerçekleşmişken davalının zararın tazmininden imtina etmesi poliçe ve genel şartlar hükümlerine, dahası kanun hükümlerine aykırıdır.
4-) Yukarıda bahsettiğimiz sebeplerle, müvekkilin sigortalı aracında meydana gelen zararın 6762 sayılı Türk Ticaret Kanunu, Kara Taşıtları Kasko Sigortası Genel Şartları ve taraflar arasında imzalanan poliçe hükümleri gereğince davalı sigorta şirketi tarafından tazmin edilmesini sağlamak amacıyla mahkemenize başvurmak zorunluluğu doğmuştur.

HUKUKİ NEDENLER :   6762 S. K. m. 1299, Kara Taşıtları Kasko Sigortası Genel Şartları A.3, A.5, B.3 ve ilgili mevzuat.

HUKUKİ DELİLLER : Kasko sigorta poliçesi, davalıya çekilen …/…/… tarihli ihtarname, … Mahkemesi’nin …/… D. İş sayılı delil tespiti dosyası ve diğer hukuki deliller.


SONUÇ VE İSTEM         : Yukarıda açıklanan nedenlerle, fazlaya ilişkin haklarımız saklı kalmak kaydıyla araçta oluşan zarar bedeli  ... TL.nin zararlandırıcı olayın meydana geldiği tarihten itibaren işletilecek reeskont faiziyle birlikte davalı sigorta şirketi tarafından tazminine ve yargılama giderlerinin davalıya yükletilmesine karar verilmesini müvekkil adına saygıyla talep ederiz. …/…/…

 Davacı Vekili
   Av.
`,
  
    'Trafik Kazası Maddi Tazminat': `                                  ... ASLİYE HUKUK MAHKEMESİ HAKİMLİĞİ’NE


DAVACI: 
TC KİMLİK NUMARASI : 
ADRES: 
VEKİLİ: 
ADRES: 
DAVALI: 
ADRESİ: 
KONU                               : …TL. Maddi tazminat isteminden ibarettir.
DAVA DEĞERİ : … TL

AÇIKLAMALAR : 
1) Müvekkilimiz, sevk ve idaresi altında bulunan … plakalı aracı ile … istikametinden … yönüne doğru seyir halinde iken, … mevkiinde önünde seyreden davalı …’nın sevk ve idaresindeki … plakalı aracın lastiğinin fırlaması neticesinde, davalının aracı müvekkilimizin seyir şeridi olan sol şeride devrilmiştir. Arkadan gelen müvekkilimizin hiçbir manevra şansı kalmamış ve davalının aracına çarpmıştır. Çarpma sonucu maddi hasar meydana gelmiştir. (EK-1)
2) Kazanın oluş şekli düşünüldüğünde, teknik arızanın olay üzerinde %100 oranında etkili olduğu açıktır. Zira, davalı aracının lastik somunlarının gerektiği şekilde sıkılmaması nedeniyle lastik araçtan fırlamış ve kamyonetin devrilmesine yol açmıştır. Bu husus, mahkemeniz huzurunda dinlenmelerini istediğimiz ve dilekçemiz ekinde (EK-2) sunduğumuz tanık listesinde isimleri ve adresleri yer alan tanıklarımızın ifadeleri ile açıklığa kavuşacaktır.
3) 2918 sayılı Karayolları Trafik Kanunu'nun 86/1. maddesinde belirtildiği gibi; araç sahibi ve şoförünün sorumluluktan kurtulabilmesi için zararın mücbir sebepten veya kazazedenin veya üçüncü kişinin ağır kusurundan ileri gelmiş olması gerekir. Araç tekerinin fırlaması teknik arıza olup, mücbir sebep değildir. Bilindiği gibi teknik arızalar çoğu kez aracın periyodik bakımının zamanında yapılmamasından ileri gelmektedir. Bu durumda işletenin sorumlu sayılması gerekir. Kusurun söz konusu olduğu hallerde mücbir sebepten söz edilemez. 
4) Müvekkilimizin aracında meydana gelen kaza sonucu … TL.’lık hasar meydana gelmiştir. (EK-3) Davalı, müvekkilimizin aracında oluşan hasarı karşılamayı kaza anında sözlü olarak taahhüt etmiştir. Davalıya …yevmiye nolu ... Noterliği tarafından düzenlenen ihtarname .../ .../ ... tarihinde tebliğ edilmiş olmasına rağmen, bu zamana kadar herhangi bir ödemede bulunulmamıştır. (EK-4)
5) Meydana gelen trafik kazası nedeni ile aracın işleteni olan davalının müvekkilimizin aracında oluşan hasarı ödememesi nedeni ile işbu davayı açma zorunluluğu doğmuştur.

HUKUKİ NEDENLER: 2918 s. KTK m.85, 86, TBK, 6100 s. HMK m. 266 ve sair 
 ilgili mevzuat

HUKUKİ DELİLLER: 
1-) …/…/… tarihli Trafik Kazası Tespit Tutanağı
2-) Tanık   beyanları
3-) …/…/… tarihli faturalar
4-) …. Noterliğinin …. yevmiye nolu ihtarnamesi
5-) Bilirkişi incelemesi

SONUÇ VE İSTEM: Yukarıda açıkladığımız nedenlerle, …TL. maddi tazminatın işleyecek kanuni faizi ile birlikte davalıdan alınmasına, yargılama giderleri ve vekalet ücretinin karşı tarafa yükletilmesine, karar verilmesini müvekkilimiz adına saygıyla talep ederiz.  …/ …/ …

Davacı Vekili
   Av.

EKLER:
1-) …/…/… tarihli Trafik Kazası Tespit Tutanağı
2-) Tanıkların hangi konuda tanıklık edeceklerini gösterir tanık listesi
3-) …/…/… tarihli faturalar
4-) …. Noterliğinin …. yevmiye nolu ihtarnamesi
5-) Bir adet onaylı vekaletname örneği
`,
  
    'Trafik Kazası - Değer Kaybı ve Kullanamama Tazminatı': `......... ASLİYE HUKUK MAHKEMESİ HAKİMLİĞİ’NE

DAVACI: 
TC KİMLİK NUMARASI : 
ADRES: 
VEKİLİ: 
ADRES: 
DAVALI: 
ADRESİ: 
KONU: Trafik Kazası Sonucu Araçta Meydana Gelen 
Değer Kaybı İle Aracın Kullanılmamasından 
Doğan Zararın Tazmin Edilmesi İstemimizden 
İbarettir.
DAVA DEĞERİ : 

AÇIKLAMALAR :
1-) Müvekkilimizin sevk ve idaresinde bulunan … plakalı, … model … marka ticari taksiye (EK-1), davalının sevk ve idaresinde bulunan … plakalı aracın arkadan çarpması sonucu meydana gelen maddi hasarlı trafik kazasında (EK-2)  müvekkilimize ait aracın bagaj kısmı tamamen hasar görmüş, arka dingilin yamulması (EK-3) nedeni ile aracın hareket kabiliyeti tamamen ortadan kalkmıştır. Araç … gün serviste (EK-4) kalmış, bu süre boyunca kullanılamamıştır. 
2-) Müvekkilimiz, hasara uğrayan aracını …/…/… tarihinde almış olup kaza tarihine kadar aracın tüm bakımlarını (EK-5) zamanında yaptırmıştır. Kaza tarihine kadar aracın değişen her hangi bir parçası bulunmadığı gibi kaportasında da en ufak bir çizik bile söz konusu olmamıştır. Müvekkilimiz, aracını tamir süresi boyunca kullanamamış ve ortalama … TL olan günlük kazancını … gün boyunca elde edememiştir. Bu durumla ilgili olarak dilekçemiz ekinde sunulmuş tanık listesinde (EK -6) isimleri yer alan ilgililer de, mahkemenizce uygun görülmesi halinde duruma ilişkin izahat verecektir.
3-) Müvekkilimiz, … yıllık taksici olup geçimini bu şekilde sağlamaktadır. Meydana gelen kaza nedeni ile araçta oluşan değer kaybı ve aracın tamirde kaldığı süre boyunca oluşan kar kaybının ödenmesi için mahkemenize başvurulması zorunluluğu hasıl olmuştur. 

HUKUKİ NEDENLER : 6098 s. TBK m. 122, 6100 s. HMK m. 2, 6

HUKUKİ DELİLLER : Ruhsat Fotokopisi, Trafik Kaza Tespit Tutanağı, Aracın Hasarını Gösterir Fotoğraflar, Servis Hasar Onarım Raporu, Servis Bakım Raporları

SONUÇ VE İSTEM         : Yukarıda açıkladığımız nedenlerden dolayı, müvekkilimize ait araçta meydana gelen değer kaybı ile aracın tamir süresince kullanılamaması nedeni ile mahrum kalınan kar kaybı karşılığı olarak … TL’nin davalıdan alınmasına ve yargılama giderleri ve vekalet ücretinin karşı tarafa yükletilmesine karar verilmesini vekaleten talep ederiz. …/…/…

Davacı Vekili
   Av.


EKLER: 
1. Ruhsat fotokopisi
2. Trafik kaza tespit tutanağı
3. Aracın hasarını gösterir fotoğraflar
4. Servis hasar onarım raporu
5. Servis bakım raporları
6. Tanıkların listesi
7. Bir adet onaylı vekaletname örneği.
`,
  },
  'Kambiyo Hukuku': {
    'Çek Protestosu': `DİLEÇE — ÇEK PROTESTOSU VE KAMBIYAL HAK\n\nDavacı (Hamil): [Adı Soyadı]\nDavalı (Muharrir): [Adı Soyadı]\n\nÇEK:\nNo: [No]\nBanka/Şube: [Banka]\nTutar: [Tutar] TL\nVade: [Tarih]\nProtesto: [Tarih]\n\nOLAY:\nÇek vade tarihinde ibraz edilmiş, ödenmemiş,\nnoter aracılığıyla protestosu yapılmıştır.\n\nALACAK:\nÇek: [Tutar] TL\nFaiz: [Tutar] TL\nTOPLAM: [Tutar] TL\n\nKANUNİ DAYANAKLAR:\nÇek Kanunu, İİK m.1-3\n\nTALEP:\n[Tutar] TL ödeme.\n\n________________________`,
    'Senet Protestosu': `DİLEÇE — SENET PROTESTOSU\n\nDavacı: [Adı Soyadı]\nDavalı: [Adı Soyadı]\n\nSENET:\nNo: [No]\nTutar: [Tutar] TL\nVade: [Tarih]\nProtesto: [Tarih]\n\nKANUNİ DAYANAKLAR:\nKambiyo Kanunu, İİK m.1-3\n\nTALEP:\n[Tutar] TL + faiz + masraf ödenmesi.\n\n________________________`,
  },
  'Aile Hukuku': {
    'Boşanma Davası': `DİLEÇE — BOŞANMA DAVASI\n\nDavacı Eş: [Adı Soyadı — TC No]\nDavalı Eş: [Adı Soyadı — TC No]\nEvlilik Tarihi: [Tarih]\n\nBOŞANMA SEBEPLERİ:\n[Evlilik birliğinin temelinden sarsılması]\n\nMÜŞTEREK ÇOCUKLAR:\n1. [Adı — Doğum Tarihi]\n\nTALEPLER:\n1. Evlilik birliğinin BOŞANMA ile sona erdirilmesi\n2. Velayet: [Annede/Babada]\n3. Nafaka: Aylık [Tutar] TL\n4. Maddi tazminat: [Tutar] TL\n5. Manevi tazminat: [Tutar] TL\n\nKANUNİ DAYANAKLAR:\nTMK m.163-184, m.174-175\n\n________________________`,
    'Nafaka Davası': `DİLEÇE — NAFAKA DAVASI\n\nNafaka Talep Eden: [Adı Soyadı]\nNafaka Yükümlüsü: [Adı Soyadı]\n\nNAFAKA KONUSU:\n[Kendisi / Müşterek çocuk ...]\n\nTALEP:\nAylık: [Tutar] TL\nTürü: [İştirak / Yoksulluk / Tedbir]\n\nKANUNİ DAYANAKLAR:\nTMK m.182/2, m.175\n\nTALEP:\nAylık [Tutar] TL nafaka + TÜFE artışı\n\n________________________`,
  
    '6284 - Aile İçi Şiddet Tedbir Kararı': `NÖBETÇİ AİLE MAHKEMESİNE
 ……………….

DAVACI : C.B., adres, T.C. Kimlik No:…….
VEKİLİ: ……
DAVALI: A.B.. adı soyad, adres, TC Kimlik No: …
DAVA KONUSU : 6284 sayılı Kanun kapsamında tedbir kararı verilmesi hk.

I. AÇIKLAMALAR:
1- Müvekkilim ile davalı yaklaşık 8 yıldır evlidir. Bu evlilikten M. adında müşterek çocukları olmuştur.
2- Müvekkilim ile davalı arasında belli bir süredir aile içi tartışmalar yaşanmaktadır. Aralarında evin satışıyla ilgili çözemedikleri bir sorun vardır. Bu sorunu çözemedikleri için davalı sürekli agresifleşmekte ve müvekkilime baskı uygulamaktadır.
3- Müvekkilim bu baskılardan çekinmektedir. Davalının şiddete meyilli kişiliği nedeniyle müvekkilim hayatından ve sağlığından endişe etmektedir.
4- Ayrıca, davalı sinirlendiğinde çocuğa da kötü davranmakta, her tarafa bağırıp çağırmaktadır.
5- Davalının bu eylemleri çekilmez ve ileride neler olacağı hususunda öngörülmez bir hal almıştır.
6- 6284 sayılı Kanun uyarınca müvekkilimin korunması için ilgili kanunun koruyucu ve destekleyici tedbirlerinin davalı hakkında uygulanmasına karar verilmesi zorunlu hale gelmiştir.
7- Açıklanan nedenlerle, davalı hakkında 6284 sayılı kanunun 4 ve 5. maddeleri kapsamında tedbir uygulanması talep etme zarureti doğmuştur.

II. DELİLLER:
- Tanık beyanları,
- Aile nüfus kayıt örneği,

III. HUKUKİ NEDENLER: 
1-6284 sayılı kanun ilgili hükümleri
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.

IV. SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Davalının müvekkilime ve müşterek çocuğa yönelik olarak şiddet tehdidi, hakaret, aşağılama veya küçük düşürmeyi içeren söz ve davranışlarda bulunmamasına,
2) Davalının 2 ay süreyle müşterek konuttan derhâl uzaklaştırılması ve müşterek konutun müvekkilime ve çocuğuna tahsis edilmesine,
3) Davalının müvekkilime bulundukları konuta ve işyerine yaklaşmamasına,
4) Müvekkilimin şahsi eşyalarına ve ev eşyalarına zarar vermemesine, 
5) Müvekkilimi iletişim araçlarıyla veya sair surette rahatsız etmemesine, 
6) Davalının bulundurulması veya taşınmasına kanunen izin verilen silahları kolluğa teslim etmesine,
7- Yargılama giderlerinin davalı üzerinde bırakılmasına,
Karar verilmesini vekaleten saygılarımızla arz ve talep ederiz. …./…./…..

DAVACI VEKİLİ
Av. ……………..
                   imza


EKİ:
Vekaletname`,
    'Mal Rejimi Tasfiyesi - Katılma Alacağı': `………. NÖBETÇİ AİLE MAHKEMESİNE

 İHTİYATİ TEDBİR TALEPLİDİR

DAVACI : ……… (T.C. No:…….)
VEKİLİ : Av. ….
DAVALI : ……. (T.C No:……)
KONU: Boşanma ile sona eren mal rejiminin tasfiyesi ile, fazlaya ilişkin haklarımız saklı kalmak kaydıyla şimdilik 1.000,00 TL katılma alacağının davalıdan tahsili ile; olası bir mal kaçırma sonucu hak kaybını önlemek için davalı üzerine kayıtlı …. Plakalı araç üzerine ve davalının banka hesaplarına ihtiyati tedbir konulmasına karar verilmesi talepli istekten ibarettir.
HARCA ESAS DEĞER : 1.000,00 TL

I. AÇIKLAMALAR :
A. Olayların Özeti
Davacı/müvekkil …. ile davalı …., 03.01.1997 tarihinde evlenmişlerdir. Ancak aralarında baş gösteren sorunlar nedeniyle …. Aile Mahkemesinin 2017/122 E, 2019/48 K. Sayılı boşanma kararı ile boşanmışlardır. İlgili boşanma kararı 23.04.2019 tarihinde kesinleşmiş olup; dava tarihi olan 02.12.2017 tarihinde sona eren mal rejiminin tasfiyesi için iş bu davanın açılması zarureti doğmuştur. 
Müvekkilim tarafından yapılan harici araştırmada sonucu, evlilik birliği içinde ve her iki eşin katkısı ile alınan …. plakalı aracın, şuan başkası adına kayıtlı olduğu tespit edilmiştir. Dolayısıyla davalı üzerine kayıtlı araca ve banka hesaplarına tedbir konulmasını talep etme zarureti hasıl olmuştur.
Nitekim 4721 Saylı Türk Medeni Kanunu m.202’ye göre; “Eşler arasında edinilmiş mallara katılma rejiminin uygulanması asıldır.” Dolayısıyla evlilik birliği içinde edinilmiş olan tüm mal varlığının, boşanma kararının kesinleşmesi ile birlikte tasfiye edilerek eşler arasında yarı oranda paylaştırılması gerekmektedir.

B. Davaya Konu Edinilmiş Mallar
1) …. Plakalı Otomobil 
Evlilik birliği içinde edinilmiş olan ve mal rejimin tasfiyesine konu edilecek olan alacak kaleminin kaynağı …. plakalı araçtır. Davalı taraf … yılında henüz evlilik birliği devam ederken anılan aracı satın almış ancak şuan edinilen harici bilgiye göre, mal kaçırma gayesi güderek başkası üzerine geçirmiştir. Bahsettiğimiz aracın davalı yana ait olduğu ise, tarafların boşanma davasının görüldüğü … Aile Mahkemesi ….. sayılı dosyasının celbi ile görülecektir. Zira yapılan sosyal ve ekonomik durum araştırmasında, davalı ….’ın 140.000,00 TL değerinde otomobilinin olduğu kayıtlara geçmiştir. Bahse konu otomobilin de edinilmiş mal olduğu ve tasfiye aşamasında hesaba katılması gerekeceği de aşikardır.
Boşanma hazırlığı içerisinde bulunan davalının, … plakalı aracı başkasının üzerine geçirmiş olması açıkça mal kaçırma iradesini açık etmektedir. Bahsi geçen aracın şuan kim adına kayıtlı olduğunun da sorgulanması, aralarında herhangi bir hısımlık varsa bu durumun da ortaya konulması gerekmektedir.

2) Davalının Adına Açılmış Olan Banka Hesaplarındaki Mal Varlığı
Davalı taraf geriye dönük banka hesap hareketleri de incelenmelidir. Evlilik birliği içinde biriktirmiş olduğu paraların ve olası bir mal kaçırmanın olup olmadığına ilişkin bilgilere ulaşılması, gerekirse bunların da tasfiyeye konu edilmesi için, bankalara yazılacak müzekkereler ile maaş hesabı hariç olmak üzere hem bu hesaplara tedbir konulmasını hem de geriye dönük hesap hareketlerinin celbini talep ediyoruz. 

II. HUKUKİ SEBEPLER : TMK, HMK ve ilgili sair mevzuat.

III. DELİLLER : 
1) Nüfus kayıtları,
2) Aile Mahkemesi ….. sayılı dosyası,
3) Davalının adına açılmış bulunan banka hesap hareketleri (celbini talep ediyoruz),
4) Trafik şube kayıtları,
5) Tanık,
6) Yemin,
7) Bilirkişi incelemesi,
8) Keşif,
9) İbrazı mümkün her türlü sair delil,

IV. SONUÇ VE İSTEM : Yukarıda arz ve izah olunan ve Sayın Mahkemenizce re’sen göz önünde bulundurulacak hususlarla birlikte;
1) DAVAMIZIN KABULÜ ile birlikte mal rejiminin tasfiyesi sonucu fazlaya ilişkin hak ve alacaklarımız saklı kalmak kaydıyla ŞİMDİLİK 1.000 TL’nin davalıdan tahsiline,
2) Kötü niyetli olarak mal kaçırma maksatlı olası bir muvazaalı işlemle hak kaybımıza sebebiyet vermemesi için davalının banka hesaplarına İHTİYATEN TEDBİR KONULMASINA,
3) Tüm yargılama giderleri ile vekalet ücretinin davalı yana yükletilmesine,
Karar verilmesini Saygıyla arz ve talep ederiz. …./…./….
 
Davacı Vekili
Av. …………….


Ek: Vekaletname`,
  
    'Evlenmenin Nisbi Butlanı': `NÖBETÇİ AİLE MAHKEMESİNE
                                                                       ……………….


DAVACI: A.B.., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: A.V., adres, T.C. kimlik no:…….
DAVALI: D.B. Adı Soyad, Adres,
DAVA KONUSU : Evlenmenin Nisbi Butlanı

I. AÇIKLAMALAR:
1- Müvekkilim ile davalı D.B. …/…/… tarihinde resmi nikah kıymak suretiyle evlenmişlerdir. 
2- Kendileri düğün merasimini …/…/… tarihinde yapmayı planlamışlardır. 
3- Ancak henüz düğün merasimi yapılmadan …/…/… tarihinde müvekkilim, eşi olan A.B.’nin …. hastalığının bulunduğunu öğrenmiştir.
4-Davalı müvekkilime hastalığıyla ilgili hiçbir bilgi vermemiş ve bu durumu kendisinden gizlemiştir. Resmi evlenme töreni yapıldıktan sonra önemli bir şey değilmiş gibi müvekkilime hastalığını itiraf etmiştir.
5- Bu hastalık gerek müvekkilim için, gerekse de ilerde düşünülecek olan alt soyları için büyük bir tehdit oluşturmaktadır. Bu hastalık müvekkilimden gizlenmiştir. Müvekkilim bu nedenle yanıltıldığı için evlenmiştir. 
6- TMK m. 150/2 hükmü uyarınca davacının veya altsoyunun sağlığı için ağır tehlike oluşturan bir hastalığın gizlenmesi evlenmenin nisbi butlanı halleri arasında sayılmıştır. Açıklanan nedenlerle evliliğin nisbi butlan nedeniyle iptaline karar verilmesine talep ve dava etmek zarureti doğmuştur. 

II. DELİLLER:
- Davalının hastalığıyla ilgili alınacak rapor,
- Nüfus kayıt örneği,
- Tanık beyanları
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: m. 150/2.
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
3-Sair ilgili mevzuat

IV. SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Müvekkilim ile davalı D.B. arasındaki evliliğin TMK m. 150/2 hükmü uyarınca nisbi butlanla batıl sayılarak İPTALİNE, 
2) Kararın kayıtlara işlenmesi için Nüfus Müdürlüğü’ne gönderilmesine,
3) Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,
Karar verilmesini vekaleten saygılarımızla arz ve talep ederiz. …./…./…..

DAVACI VEKİLİ
Av. ……………..
                   imza


EKİ:
1-Rapor
2-Nüfus kayıt örneği
3-Vekaletname`,
  
    'Boşanma - Terk Nedeniyle': `NÖBETÇİ AİLE MAHKEMESİNE
 ……………….

DAVACI: C.B., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: …..
DAVALI: A.B.. adı soyad, adres, TC Kimlik No: …
DAVA KONUSU : Boşanma (Terk Nedeniyle) 
OLAY TARİHİ: …/…/…
DAVA TARİHİ: …./…/…

I. AÇIKLAMALAR:
1- Müvekkilim ile davalı …/…/… tarihinde evlenmişlerdir. Tarafların evliliklerinden … isminde müşterek çocukları olmuştur.
2- Evlilik birliği devam ederken davalı, aile içinde yaşanan sorunları bahane ederek babaevine gitmiş ve geri dönmemiştir.
3- Davalının eve dönmesi için Mahkemenizin …/… D. İş esas-karar sayılı dosyası ile ihtar davası açılmış olup, bu karar …/…/… tarihinde davalıya tebliğ edilmiştir.
4- Buna rağmen davalı müşterek haneye dönmemiştir. Davalı eve dönmemekte tamamen haksızdır.
5- Müvekkilim bu nedenle boşanmak ve davalı ile bağını koparmak istemektedir. Söz konusu evliliği sürdüremeyecek duruma gelmiştir.

II. DELİLLER:
- Aile Nüfus Kaydı Örneği,
- … Mahkemesinin …/… esas sayılı ihtar dosyası,
- Tanık beyanları
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: m. 164, 169, 174, 175, 182
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.

IV. SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1-Müvekkilim … ile davalı ….’nün TMK m. 164/1 hükmü uyarınca Boşanmalarına,
2-Müşterek çocuk ...’nün velayetinin müvekkilim ….’ye verilmesine,
3-Müşterek çocuk ... ile davalı arasında makul ölçüde kişisel ilişki kurulmasına,
4-Müvekkilim için dava tarihinden itibaren aylık 1.250,00 TL tedbir nafakasının; hükmün kesinleşmesinden itibaren aylık 1.750,00 TL yoksulluk nafakasının davalıdan alınarak müvekkilime verilmesine,
5-Müşterek çocuk … için dava tarihinden itibaren aylık 1.000,00 TL tedbir nafakasının; hükmün kesinleşmesinden itibaren aylık 1.000,00 TL iştirak nafakasının davalıdan alınarak müvekkilime verilmesine,
6-Müvekkilim için hükmün kesinleşmesinden itibaren işleyecek yasal faizi ile birlikte … TL maddi tazminatın davalıdan alınarak müvekkilime verilmesine,
7-Müvekkilim için hükmün kesinleşmesinden itibaren işleyecek yasal faizi ile birlikte … TL manevi tazminatın davalıdan alınarak müvekkilime verilmesine,
8-Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,
Karar verilmesini vekaleten saygılarımızla arz ve talep ederiz. …./…./…..

DAVACI VEKİLİ
Av. ……………..
                   imza
EKİ:
Vekaletname
`,
  
    'Boşanma - Evlilik Birliğinin Temelinden Sarsılması': `NÖBETÇİ AİLE MAHKEMESİNE
 ……………….

DAVACI: C.B., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: …..
DAVALI: A.B.. adı soyad, adres, TC Kimlik No: …
DAVA KONUSU : Boşanma (Evlilik Birliğinin Temelinden Sarsılması Nedeniyle) 
OLAY TARİHİ: …/…/…
DAVA TARİHİ: …./…/…

I. AÇIKLAMALAR:
1- Müvekkilim ile davalı …/…/… tarihinde evlenmişlerdir. Tarafların evliliklerinden … isminde müşterek çocukları olmuştur.
2- Evlilik birliği devam ederken müvekkilim ile davalı arasında çok defa tartışmalar yaşanmış, davalı müvekkilimi sürekli aşağılamış ve kötü davranışlarda bulunmuştur. Buna rağmen müvekkilim müşterek çocuğun hatırı için bu eylemleri büyütmeyerek evlilik birliğini sürdürmeye devam etmiştir.
3- Ancak davalının olumsuz davranışları son zamanlarda artmaya başlamıştır. En son …/…/… günü çıkan tartışmada davalı müvekkilimi ağır şekilde dövmüş ve olay savcılığa yansımıştır.
4- Söz konusu olayda müvekkilim ekli rapora göre basit bir tıbbi müdahale ile giderilemeyecek derecede yaralanmış ve 5 gün hastanede tedavi görmüştür (EK-1). Söz konusu olayla ilgili … Cumhuriyet savcılığının …/… soruşturma numaralı dosyasında soruşturma devam etmektedir.
5- Müvekkilim yaşanan son olaydan sonra bir daha eve gitmemiş ve hemen boşanma davası açmak istemiştir.
6- Yaşanan bu son olay nedeniyle müvekkilim ile davalı arasındaki evlilik birliği temelinden sarsılmış ve evlilik çekilmez hale gelmiştir. 
7- Yukarıda açıklanan nedenlerle müvekkilim ile davalı arasındaki evliliğin evlilik birliğinin temelinden sarsılması nedeniyle boşanma yoluyla sona erdirilmesini talep etme zarureti doğmuştur.

II. DELİLLER:
- Hastane raporları,
- … C. Başsavcılığının …/… sayılı soruşturma dosyası,
- Tanık beyanları
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: m. 166, 169, 174, 175, 182
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
3-Sair ilgili mevzuat

IV. SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1-Müvekkilim … ile davalı ….’nün TMK m. 166/1 hükmü uyarınca Boşanmalarına,
2-Müşterek çocuk ...’nün velayetinin müvekkilim ….’ye verilmesine,
3-Müşterek çocuk ... ile davalı arasında makul ölçüde kişisel ilişki kurulmasına,
4-Müvekkilim için dava tarihinden itibaren aylık 1.250,00 TL tedbir nafakasının; hükmün kesinleşmesinden itibaren aylık 1.750,00 TL yoksulluk nafakasının davalıdan alınarak müvekkilime verilmesine,
5-Müşterek çocuk … için dava tarihinden itibaren aylık 1.000,00 TL tedbir nafakasının; hükmün kesinleşmesinden itibaren aylık 1.000,00 TL iştirak nafakasının davalıdan alınarak müvekkilime verilmesine,
6-Müvekkilim için hükmün kesinleşmesinden itibaren işleyecek yasal faizi ile birlikte … TL maddi tazminatın davalıdan alınarak müvekkilime verilmesine,
7-Müvekkilim için hükmün kesinleşmesinden itibaren işleyecek yasal faizi ile birlikte … TL manevi tazminatın davalıdan alınarak müvekkilime verilmesine,
8-Yargılama gideri ve vekalet ücretinin davalıya yükletilmesine,
Karar verilmesini vekaleten saygılarımızla arz ve talep ederiz. …./…./…..

DAVACI VEKİLİ
Av. ……………..
                   imza

EKİ:
1-Rapor
2-Vekaletname
`,
  
    '6284 Sayılı Kanun Kapsamında Tedbir': `NÖBETÇİ AİLE MAHKEMESİNE
 ……………….

DAVACI : C.B., adres, T.C. Kimlik No:…….
VEKİLİ: ……
DAVALI: A.B.. adı soyad, adres, TC Kimlik No: …
DAVA KONUSU : 6284 sayılı Kanun kapsamında tedbir kararı verilmesi hk.

I. AÇIKLAMALAR:
1- Müvekkilim ile davalı yaklaşık 8 yıldır evlidir. Bu evlilikten M. adında müşterek çocukları olmuştur.
2- Müvekkilim ile davalı arasında belli bir süredir aile içi tartışmalar yaşanmaktadır. Aralarında evin satışıyla ilgili çözemedikleri bir sorun vardır. Bu sorunu çözemedikleri için davalı sürekli agresifleşmekte ve müvekkilime baskı uygulamaktadır.
3- Müvekkilim bu baskılardan çekinmektedir. Davalının şiddete meyilli kişiliği nedeniyle müvekkilim hayatından ve sağlığından endişe etmektedir.
4- Ayrıca, davalı sinirlendiğinde çocuğa da kötü davranmakta, her tarafa bağırıp çağırmaktadır.
5- Davalının bu eylemleri çekilmez ve ileride neler olacağı hususunda öngörülmez bir hal almıştır.
6- 6284 sayılı Kanun uyarınca müvekkilimin korunması için ilgili kanunun koruyucu ve destekleyici tedbirlerinin davalı hakkında uygulanmasına karar verilmesi zorunlu hale gelmiştir.
7- Açıklanan nedenlerle, davalı hakkında 6284 sayılı kanunun 4 ve 5. maddeleri kapsamında tedbir uygulanması talep etme zarureti doğmuştur.

II. DELİLLER:
- Tanık beyanları,
- Aile nüfus kayıt örneği,

III. HUKUKİ NEDENLER: 
1-6284 sayılı kanun ilgili hükümleri
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.

IV. SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Davalının müvekkilime ve müşterek çocuğa yönelik olarak şiddet tehdidi, hakaret, aşağılama veya küçük düşürmeyi içeren söz ve davranışlarda bulunmamasına,
2) Davalının 2 ay süreyle müşterek konuttan derhâl uzaklaştırılması ve müşterek konutun müvekkilime ve çocuğuna tahsis edilmesine,
3) Davalının müvekkilime bulundukları konuta ve işyerine yaklaşmamasına,
4) Müvekkilimin şahsi eşyalarına ve ev eşyalarına zarar vermemesine, 
5) Müvekkilimi iletişim araçlarıyla veya sair surette rahatsız etmemesine, 
6) Davalının bulundurulması veya taşınmasına kanunen izin verilen silahları kolluğa teslim etmesine,
7- Yargılama giderlerinin davalı üzerinde bırakılmasına,
Karar verilmesini vekaleten saygılarımızla arz ve talep ederiz. …./…./…..

DAVACI VEKİLİ
Av. ……………..
                   imza


EKİ:
Vekaletname
`,
  
    'Aile Konutu - Tapu İptali, Tescil ve Şerh': `NÖBETÇİ AİLE MAHKEMESİNE
                                                                       ……………….

 İHTİYATİ TEDBİR TALEPLİDİR

DAVACI: M.R., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALILAR: 1-Z.R. Adı Soyad, Adres,
 2-İ.C. Adı Soyad, Adres,
DAVA KONUSU : Aile Konutu Nedeniyle Tapu İptali Ve Tescil ile Aile 
   Konutu Şerhi Verilmesi
DAVA KON. DEĞERİ: … TL 

I. AÇIKLAMALAR :
1- Müvekkilim M.R. ile davalılardan Z.R. resmi nikahlı evli olup, dava konusunu oluşturan … ili … ilçesi … köyü … parsel sayılı taşınmazda oturmaktadırlar ve bu taşınmaz aile konutu niteliğindedir. Bu hususta taraflar arasında bir ihtilaf bulunmamaktadır. Yapılacak keşifte de bu durum net bir şekilde görülecektir.
2- Söz konusu taşınmaz davalı Z.R. üzerine kayıtlı iken, TMK m. 194/1 hükmündeki “eşin açık rızası” olmaksızın diğer davalı İ.C.’ye …/…/… tarihinde satıp temlik etmiştir. Tapu kayıtları incelendiğinde bu durum anlaşılacaktır.
3- Yukarıda belirtildiği üzere, dava konusu taşınmaz aile konutu niteliğinde olmasına rağmen müvekkillimin açık rızası olmaksızın devredildiğinden tapunun iptali ile davalılardan Z.R. üzerine kaydedilmesi gerekir. Diğer davalı olan kayıt maliki İ.C. davalı Z.R’nin kuzeni olup, dava konusu taşınmazın aile konutu olduğunu bilmektedir. Bu nedenle iyiniyetli olmadığından TMK m. 1023 koruyuculuğundan istifade edemez.
4- Yapılan temlikin amacı, müvekkilimin eşi olan davalı Z.R. arasında baş gösteren geçimsizliktir. Davalı Z.R. mal kaçırmak amacıyla söz konusu taşınmazın tapusunu devretmiştir. Kaldı ki, davalı İ.C.’nin bu taşınmazı alacak mali gücü yoktur. Yaptırılacak araştırmada bu husus anlaşılacaktır.
5- Bilindiği üzere 1.1.2002 tarihinde yürürlüğe giren 4721 sayılı Yeni Türk Medeni Kanunu 194,240,254,279 ve 652.maddelerde “aile konutu” adı altında yeni bir hukuki kavram getirmiştir. TMK’nın 194/1.maddesi “eşlerden biri diğer eşin açık rızası bulunmadıkça, aile konutu ile ilgili kira sözleşmesini feshedemez ; aile konutunu devredemez veya aile konutu üzerindeki haklarını sınırlandırmayacağını” hükme bağlamıştır. Bu düzenleme ile Tapu Sicilinde konutun maliki olarak gözüken eşin hukuki işlem özgürlüğü diğer eşin katılımına, onamına bağlanmıştır, amaç aile konutunu ve bu konut ile ilgili kanuni hakları koruma altına almaktır. Bu koruma, evlilik birliği devam ettiğine göre 4721 sayılı Kanunun yürürlüğe girişinden önceki edinilmiş aile konutları içinde geçerlidir.(Yargıtay 2.HD.3.5.2005 Tarih ve 2005/2547 e 2005/7234 K. Sayılı ilamı)
6- Davalıların buna rağmen söz konusu devri yapmasından dolayı işbu davanın açılması zarureti doğmuştur.

II. DELİLLER:
- Tapu kayıtları,
- Emsal satış sözleşmeleri,
- Ekonomik ve sosyal durum araştırması,
- Keşif ve bilirkişi incelemesi,
- Tanık beyanları,
Tanık listesi
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz hususların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

III. HUKUKİ NEDENLER: 
1-4721 Sayılı Türk Medeni Kanunu: 194, 704, 705 ve 706. Maddeleri.
2-6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Dava sonuçlanıncaya kadar, dava konusu taşınmazın üçüncü kişilere satılmasının engellenmesi için dava konusu … kayıtlı taşınmazın üzerine, öncelikle teminatsız olarak, eğer mahkeme aksi kanaatte ise mahkemenin takdir edeceği teminat karşılığında, ihtiyati tedbir konulmasına,
2) Dava konusunu oluşturan bağımsız bölümün tapu kaydının iptali ile önceki maliki Z.R. adına tapuya kayıt ve tesciline,
3) Taşınmaz üzerine TMK m. 194 hükmü uyarınca aile konutu şerhi verilmesine,
4) Yargılama gideri ve vekalet ücretinin davalılara yükletilmesine,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                                                           DAVACI VEKİLİ
                                                         Av. ……………..
                               İmza

EKİ:
- Vekaletname örneği
- Nüfus kayıt örneği
`,
  },
  'Nüfus Davaları': {
    'Ad Soyad Düzeltimi': `DİLEÇE — AD SOYAD DÜZELTİMİ\n\nDavacı: [Adı Soyadı — TC No]\nDavalı: [İl] Nüfus Müdürlüğü\n\nMEVCUT KAYIT: [Mevcut Ad/Soyad]\nDÜZELTİLECEK: [Doğru Ad/Soyad]\n\nGEREKÇE:\n[Yazım hatası / Yanlış kayıt]\n\nBELGELER:\n- Okul/SGK/Banka kayıtları\n\nKANUNİ DAYANAKLAR:\nTMK m.27, 5490 NHK m.36\n\nTALEP:\nNüfus kaydının düzeltilmesi.\n\n________________________`,
    'Yaş Düzeltimi': `DİLEÇE — YAŞ DÜZELTİMİ\n\nDavacı: [Adı Soyadı]\nDavalı: [İl] Nüfus Müdürlüğü\n\nKAYITLI TARİH: [Tarih]\nGERÇEK DOĞUM TARİHİ: [Tarih]\n\nGEREKÇE:\n[Tahmini kayıt / Yazım hatası]\n\nDELİLLER:\n- Radyolojik kemik yaşı raporu\n- Tanık beyanları\n\nKANUNİ DAYANAKLAR:\nTMK m.35, 5490 NHK m.36\n\nTALEP:\nDoğum tarihinin düzeltilmesi.\n\n________________________`,
  },
  'İcra Hukuku': {
    'İtirazın İptali': `DİLEÇE — İTİRAZIN İPTALİ VE İNKAR TAZMİNATI\n\nDavacı (Alacaklı): [Adı Soyadı]\nDavalı (Borçlu): [Adı Soyadı]\nİcra Dosyası: [Daire ve No]\n\nALACAK:\nTürü: [Kira/Sözleşme/Fatura]\nTutar: [Tutar] TL\nTakip Tarihi: [Tarih]\n\nİTİRAZIN HAKSIZLIĞI:\n[Sözleşme/Fatura ile ispatlanacak]\n\nKANUNİ DAYANAKLAR:\nİİK m.67/1 (İtirazın İptali)\nİİK m.67/2 (%20 İnkar Tazminatı)\n\nTALEP:\n1. İtirazın İPTALİ\n2. Takibin devamı\n3. %20 İNKAR TAZMİNATI\n\n________________________`,
    'Menfi Tespit': `DİLEÇE — MENFİ TESPİT DAVASI\n\nDavacı (Borçlu): [Adı Soyadı]\nDavalı (Alacaklı): [Adı Soyadı]\nİcra Dosyası: [No]\n\nTALEP KONUSU:\nDavalının talep ettiği [Tutar] TL borç\nhaksız olup mevcut değildir.\n\nBORÇSUZLUK GEREKÇESİ:\n[Ödendi / Zamanaşımı / Sahte belge]\n\nKANUNİ DAYANAKLAR:\nİİK m.72 (Menfi Tespit)\n\nTALEP:\nBorçsuzluğun tespiti.\n\n________________________`,
  
    'İtirazın İptali Davası': `NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE
                                                                       ……………….
 
İCRA DOSYA NO: …../….

DAVACI(ALACAKLI): A.B.., adres, T.C. Kimlik No:…….
DAVACI VEKİLİ: A.V., adres, T.C. kimlik no:…….
DAVALI(BORÇLU): D.D. Adı Soyad, Adres,
DAVA KONUSU : İtirazın İptali Talebi 
DAVA DEĞERİ: … TL

I. AÇIKLAMALAR:
1- Davalı borçlu, müvekkilimden …… TL karşılığı ……. tarihinde perde satın almıştır. Perdeyi satın aldığı gün …. TL, ….. TL, …. TL ve …. TL ayrı ayrı olmak üzere toplam …. TL'yi kendi kredi kartı ile ödemiştir. (Kredi kartı ile yapılan ödemeye ilişkin slipler ektedir) Bakiye kalan ……. TL bakımından ise davalı borçlu bugüne kadar hiç bir ödeme yapmamıştır.
2- Davalı borçluya, yapılan onlarca uyarıya rağmen, davalı borçlu bugüne kadar ödeme yapmamış ve ödeme yapılmaması nedeniyle müvekkilim tarafından davalı borçlu hakkında …. İcra Dairesinin  …../….. esas sayılı dosyasından icra takip başlatılmış ve faizi ile birlikte davalı borçluya toplam  ……. TL bakımından icra ödeme emri gönderilmiştir.
3- Davalı borçluya gönderilen ödeme emrine davalı borçlu vekili haksız şekilde itirazda bulunarak icra takibinin durmasına sebebiyet vermiştir. Haksız yapılan itirazın kaldırılması için için bu davanın açılması gerekmiştir.
4. Davalı borçlu müvekkilime borçludur. davalı borçlunun müvekkilime borçlu olduğuna dair kendi imzasını taşıyan yazılı evrak mevcuttur. Yazılı evrak karşısında davalının borcu yoktur iddiası ancak yazılı bir evrakla ispatlanabilir.   
5- Davalı borçlu, borcunun 3.000,00 TL'lik kısmını kendi kredi kartı ile ödemiştir buda davalı borçlunun müvekkilimden alış veriş yaptığının göstergesidir.
6- Müvekkilim tarafından davalı borçlunun telefon numarasına değişik tarihlerde borcu ödemesi için bilgilendirme mesajı atılmış davalı bu mesajlara hiç itiraz etmediği gibi borcunun olduğunu kabul etmiştir. Müvekkilimin çalışanları tarafından davalı borçlunun kullanmış olduğu telefon hattına hem normal mesaj hem de WhatsApp'ına mesaj atılarak borcun ödenmesi için bildirimde bulunulmuş ve davalı bu borç bildirimlerine hiç itiraz etmemiştir. Bu da davacının borcunu kabul ettiğini göstermektedir. 
7- Müvekkilimin çalışanları tarafından ……. tarihinden düzenlenen sipariş   formunda davalının kişisel bilgilerinin bulunduğu gibi ayrıca davalının salonunun güneşlik ve perde ölçüleri bulunmaktadır. Her ne kadar bu sipariş formu tek başına delil niteliğine haiz değilse de diğer delillerimiz ve tanık anlatımları birlikte değerlendirildiğinde davalının, müvekkilime borcu olduğu kesin olarak anlaşılacaktır.
8- Müvekkilimin çalışanları tarafından, davalıya perde satıldığı ve yine perdelerin müvekkilim çalışanları tarafından davalının evine takıldığına ilişkin tanıklarımız mevcuttur.
9- Müvekkilim ile davalı arasında yapılan perde alım satımı nedeniyle davalı, müvekkilime borçludur. Davalının, müvekkilime borcu bizzat altında imzası olan evraka dayanmaktadır. Fakat buna rağmen sözleşmeye dayalı alacağımızı tahsil için başlattığımız icra takibine davalı kötüniyetli şekilde itiraz etmiştir. Davalı borcunun bir kısmını kendi kredi kartı ile ödemesine rağmen borcunu inkar etmesi ne kadar kötüniyetli olduğunu ortaya koyar. Davalının kötüniyeti dikkate alınarak takip konusu alacağın %20 oranından aşağı olmamak üzere kötüniyet tazminata hükmedilmesini talep ederiz. 
11. Davalı kötüniyetli borca itiraz etmesi ve mal varlığının kaçırma kastının bulunması nedenilye ihtiyati haciz talebimizin kabulüne karar verilmelidir. Davalı kendi imzaladığı evraka rağmen borca itiraz etmesi ve yine mal varlığını kaçırma kastının bulunması ve yargılama süresince müvekkilimin alacağına kavuşmama ihtimali dikkate alınarak davalının mal varlıklarına ihtiyati haciz konulmasını talep ederiz.

II. DELİLLER:
- ….. İcra dairesinin … esas sayılı dosyası,
- Davalının kendi kredi kartı ile yaptığı ödemeye ilişkin banka kayıtları (ekte pos cihazı slipleri eklenmiştir) Mahkeme bu kayıtları yeterli görmediği takdirde … Bankası A.Ş. Van şubesine davalı adına kredi kartı ile müvekkilime ait işyerinde …. tarihinde işlem yapılıp yapılmadığı, yapılmış ise işlemin türü ve miktarının sorulması için müzekkere yazılmasına,
- Müvekkilimin çalışanlarının davalı borçluya attığı mesaj kayıtları,(ekte sunulmuştur.) Mahkeme yeterli görmediği takdirde ilgili GSM şirketine, mahkemeye sunduğumuz mesaj içeriklerinin doğruluğunun teyidi için müzekkere yazılmasına,
- …… tarihli davalının altında imzası bulunduğu ve müvekkilime borcu olduğunu gösterir evrak, (evrak ektedir.) 
- Davalı adına ….. tarihinde düzenlenen Fatura,
- Müvekkilimin çalışanları tarafından ….. tarihinde düzenlenen sipariş formu, 
- Bilirkişi raporları,
-Tanık beyanları
a-) ………., Adres…
b-) ………., Adres….
c-)……….., Adres….
- Yemin delili: Yukarıda belirttiğimiz vakıaların belirttiğimiz delillerle ispat edilemediği kanaatine varılması halinde 6100 sayılı HMK 225 ve devamı hükümleri uyarınca davalı tarafa teklif edilecek yemin sonucu.

HUKUKİ NEDENLER: 
1- İcra ve İflas Kanunu m. 67
2- Türk Borçlar Kanunu, 
3- 6100 Sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri.
4- İlgili diğer mevzuat hükümleri

SONUÇ ve TALEP : Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile,
1) Öncelikle davalının borcu olduğuna dair evrakta imzası bulunması, haklılığımızın açık ve tartışmasız olması ve davalının imzasının bulunduğu evrak nedeniyle ispat külfetinin davalıda olması, davalının kötü niyetli borca itiraz etmesi ve ayrıca davalının aylarca borcunu ödememesi nedeniyle davalının mal kaçırma durumu dikkate alınarak tüm mal varlıklarına İHTİYATİ HACİZ KONULMASINA, 
2) İtirazın iptali DAVAMIZIN KABULÜNE, davalının ….. İcra Dairesinin …../…. esas sayılı dosyasının asıl alacak ve tüm ferileri yönünden yaptığı İTİRAZIN İPTALİNE, icranın kaldığı YERDEN DEVAMINA, 
3) Herhangi bir nedene dayanmayan, davalının imzası bulunan evraka rağmen kötü niyetle müvekkilimin mağduriyetine neden olması nedeniyle bu icra takibinden dolayı alacağın %20 dan aşağı olmamak üzere KÖTÜNİYET TAZMİNATINA HÜKMEDİLMESİNE, bu tazminata icra dosyasının takip tarihinden itibaren YASAL FAİZ UYGULANMASINA,
4) Yargılama gideri ve vekalet ücretinin davalı üzerine bırakılmasına,
Karar verilmesini talep eder gereğini arz ederim.
DAVACI VEKİLİ
Av. ……………..
                 İmza

EKİ:
- Vekaletname`,
  },
  'İş Hukuku': {
    'İşçi Haklı Fesih': `DİLEÇE — İŞÇİ HAKLI FESİH VE TAZMİNAT\n\nİşçi (Davacı): [Adı Soyadı]\nİşveren (Davalı): [Şirket Adı]\n\nİŞÇİLİK İLİŞKİSİ:\nBaşlama: [Tarih]\nSon Gün: [Tarih]\nGörev: [Pozisyon]\nMaaş: [Tutar] TL\n\nHAKLI FESİH SEBEPLERİ:\n1. [Sebep — 4857 m.24/...]\n\nALACAKLAR:\nKıdem: [Tutar] TL\nİhbar: [Tutar] TL\nÖdenmemiş Maaş: [Tutar] TL\nTOPLAM: [Tutar] TL\n\nKANUNİ DAYANAKLAR:\n4857 İK m.24, 1475 İK m.14\n\nTALEP:\n[Tutar] TL alacağın ödenmesi.\n\n________________________`,
    'İşe İade': `DİLEÇE — FESHİN GEÇERSİZLİĞİ VE İŞE İADE\n\nİşçi: [Adı Soyadı]\nİşveren: [Şirket]\n\nİŞÇİLİK:\nBaşlama: [Tarih] — Son: [Tarih]\nGörev: [Pozisyon]\nBrüt Maaş: [Tutar] TL\n\nFESİH:\nTarihi: [Tarih]\nGerekçe: [İşverenin iddiası]\n\nDAVACININ GÖRÜŞÜ:\n[Feshin neden geçersiz olduğu]\n\nKANUNİ DAYANAKLAR:\n4857 İK m.18-21\n\nTALEP:\n1. Feshin GEÇERSİZLİĞİ\n2. İŞE İADE\n3. 4 aylık boşta kalma tazminatı\n\n________________________`,
  
    'Ücret ve Fazla Mesai Alacağı': `NÖBETÇİ İŞ MAHKEMESİNE
                                    ……………….

 
DAVACI: A.B., adres, T.C. Kimlik No:……
VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI: … 
DAVA KONUSU              : Ücret ve fazla çalışma alacağının hesaplanması uzmanlık gerektirdiğinden, bilirkişi raporundan sonra artırma dilekçesi sunmak suretiyle fazlaya ilişkin haklarımızı saklı tutmak kaydıyla şimdilik … TL ücret alacağı, … TL fazla çalışma alacağı ile dava tarihinden işleyecek olan mevduata uygulanan en yüksek faizin tahsili
HARCA ESAS DEĞER: … TL
DAVA TÜRÜ: HMK m. 107 kapsamında belirsiz alacak davası

I. AÇIKLAMALAR :
1- Müvekkilim A.B., davalıya ait olan ve … adresinde bulunan konutunda … isimli işyerinde …/…/… tarihli iş sözleşmesiyle işçi (temizlik görevlisi) statüsünde işe başlamıştır (EK-1).
2- Müvekkilimle davalı arasında yapılan iş sözleşmesinde müvekkilime asgari ücret ödeneceği kararlaştırılmıştır.
3- Müvekkilim sözleşme tarihinden itibaren işyerinde düzenli olarak çalışmış ve … ayına kadar ücretlerini eksiksiz almıştır. 
4- Covid-19 salgınının etkisiyle işyerini kapatacağını gerekçe gösteren davalı, …/…/… tarihinden itibaren müvekkilimi işten çıkarmıştır. Müvekkilime işten çıkarma ihbarı …/…/… tarihinde tebliğ edilmiştir (EK-2).
5- Müvekkilim davalının işyerinde çalıştığı süre zarfında son iki aylık ücretini almamıştır. 
6- Bunun yanısıra, bütün aylarda 45 saati aşan fazla çalışması bulunduğu halde ve bunun ödenmesini talep ettiği halde gerekli ödeme yapılmamıştır. Bu bağlamda, müvekkilim haftanın 6 günü saat 08.00-19.00 saatleri arasında çalışmıştır. Müvekkilime her gün 1 saat ara dinlenmesi yaptırılmıştır. Müvekkilim toplamda … saat fazla çalışma yapmış ve bunun karşılığı ödenmemiştir.
7- İşveren olan davalı tarafından tutulan bordro, ücret hesap pusulası gibi kayıtlarda fazla mesai yapıldığına dair bir tahakkuk söz konusu değildir. Söz konusu bordroları ekte sunuyoruz (EK-3). 
8- Aşağıda isimlerini belirttiğimiz tanıklarımız da fazla mesai yapıldığını ve ücretlerin ödenmediğini teyit edeceklerdir. Bu tanıkların davalı ile husumetleri yoktur. Beyanları esasa etkilidir.
9- Davalı ile yapılan arabuluculuk görüşmelerinden sonuç alınamamış olup iş bu davanın açılması zaruri hale gelmiştir. Arabuluculuk tutanağı dilekçemiz ekindedir (EK-4).

II. DELİLLER
- İş sözleşmesi, 
- İş sözleşmesi feshi ihbar yazısı,
- Ücret bordroları,
- Özlük dosyası,
- SGK kayıtları,
- Banka kayıtları,
- Arabuluculuk tutanağı,
- Tanık beyanları,
a) ……
b) ……
- Yemin ve sair her türlü delil.

III. HUKUKİ NEDENLER: 
1-4857 s. İş Kanunu m. 32 vd.
2-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile, 
1-Fazlaya ilişkin haklarımız saklı kalmak kaydıyla şimdilik … TL Ücret ve … TL fazla çalışma alacağının dava tarihinden itibaren mevduata uygulanan en yüksek faiz oranıyla birlikte davalıdan TAHSİLİNE,
2-Yargılama giderleri ile vekalet ücretinin davalı üzerinde bırakılmasına,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                              DAVACI VEKİLİ
                             Av. ……………..
                İmza


EKİ:
1- İş sözleşmesi, 
2- İş sözleşmesi feshi ihbar yazısı,
3- Ücret bordroları,
4- Arabuluculuk tutanağı,
5- Vekaletname`,
    'İş Kazası - Maluliyet Oranı Tespiti': `NÖBETÇİ İŞ MAHKEMESİNE
                                    ……………….

 
DAVACI: A.B., adres, T.C. Kimlik No:……
VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALILAR: 1)… (İşveren) 
     2) Sosyal Güvenlik Kurumu
DAVA KONUSU : Maluliyet Oranı Tespit İstemi

I. AÇIKLAMALAR :
1- Müvekkilim A.B., davalıya …’ye ait olan ve … adresinde bulunan ve tekstil üretimi yapan … isimli işyerinde …/…/… tarihli iş sözleşmesiyle dikiş ustası statüsünde çalışmakta idi (EK-1).
2- Müvekkilim, iş sözleşmesi devam ederken …/…/… günü işyerindeki kumaş ruloları düzgün dizilmediği için üzerine devrilmiş ve olayda sağ el bileğinde kırık oluşmuştur. Tedavi sonucunda bilek kısmına 6 adet platin takılmıştır. Bu kaza sonucunda müvekkilim yaklaşık iki ay ayağa kalkamamış ve kalktıktan sonra da aksayarak yürümeye başlamıştır.
3-Yine, kaza sonucunda müvekkilim çeşitli yerlerinden yaralanmış ve durum adli rapora yansımıştır (EK-2).
4-İş kazası sonucu Kurum Sağlık Kurulu tarafından düzenlenen rapora göre müvekkilimin yüzde … oranında sürekli iş göremez olduğuna karar verilmiştir (EK-3).
5-Bu rapora müvekkilimin yaptığı itiraz üzerine Sosyal Sigorta Yüksek Sağlık Kurumu tarafından verilen kararda müvekkilimin itirazı reddedilmiştir (EK-4).
6-Müvekkilimle ilgili tespit edilen bu oran kabul edilemez. Müvekkilimin el bileğinde … adet platin vardır. Belirlenen oran çok düşüktür. Bu nedenle, Sosyal Sigorta Yüksek Sağlık Kurulu tarafından verilen kararın hükümden düşürülebilmesi için, müvekkilimin maluliyet oranının tespitini istemek zarureti doğmuştur.

II. DELİLLER:
- İş sözleşmesi, 
- İş yeri sicil dosyası,
- SGK işyeri kayıtları,
- İş kazası tahkikat dosyası,
- İlgili rapor ve kararlar,
- Hastane raporları ve kayıtları,
- Tanık beyanları,
- Bilirkişi incelemesi,
a) ……
b) ……
- Yemin ve sair her türlü delil.

III. HUKUKİ NEDENLER: 
1-5510 s. SSGSSK, İş Kanunu, 6331 sayılı Kanun, ilgili yönetmelikler
2-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile, 
1-Müvekkilimin Adli Tıp Kurumu ilgili ihtisas dairesine sevki ile, iş kazasıyla ilgili MALULİYET ORANININ TESPİTİNE,
2-Yargılama giderleri ile vekalet ücretinin davalılar üzerinde bırakılmasına,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                              DAVACI VEKİLİ
                             Av. ……………..
                İmza


EKİ:
1- İş sözleşmesi, 
2- Hastane raporları,
3- SGK başvuru yazısı,
4- SGK cevabi yazısı,
5- Vekaletname`,
  },

  'Kira & Taşınmaz': {
    'Delil Tespiti Dilekçesi': `..... NÖBETÇİ  SULH HUKUK MAHKEMESİNE

Delil Tespiti İsteği

TESPİT TALEBİNDE BULUNAN: Adı-Soyadı-TC Kimlik No:, Adres
TALEPTE BULUNAN VEKİLİ   :  Av. ....
ALEYHİNE TESPİT İSTENEN: ......
KONU: Delil Tespiti İstemimizden İbarettir
TESPİT MAHALLİ: .....

I. AÇIKLAMALAR
1-) Aleyhine tespit talebinde bulunduğumuz karşı taraf ile müvekkilim arasında ekte sunulan kira sözleşmesi yapılmış ve karşı taraf …. tarihinden tahliye tarihi olan …. tarihine kadar taşınmazda kiracı sıfatıyla oturmuştur (EK-1).
2-) Dava konusu taşınmaz karşı tarafa teslim edildiğinde, herhangi bir eksiği veya kırık çıkık malzemesi olmadan teslim edilmiştir. Ekli sözleşmenin … maddesinde bu husus açıkça yazılmıştır.
3-) Karşı taraf kendisinden talep ettiğimiz yeni kira bedelini ödeyemeyeceğini belirterek taşınmazı …. tarihinde tahliye etmiş ve anahtarı aynı gün teslim etmiştir.
4-) Karşı tarafın taşınmazı tahliye etmesinin ardından aynı gün yaptığımız incelemede;
- Mutfak dolabının kırılmış olduğu,
- Mutfak tezgahının kırılmış olduğu,
- Arka odadaki camın çatlamış olduğu,
- Duvarlara makul olmayan zararlar verildiği,
- Balkon camının kırılmış olduğu,
- Holdeki parkelerin bir kısmının sökülmüş ve kırılmış olduğu
Tarafımızca tespit edilmiş ve ekte sunduğumuz fotoğraf ve video kayıtlarıyla belgelenmiştir (EK-2).
5-) Müvekkilim bu arıza ve eksiklikleri gidererek taşınmazını üçüncü bir kişiye kiralayacaktır. İleride karşı tarafa açacağımız maddî tazminat davasına esas olmak üzere, karşı tarafın verdiği bu zararların tespit edilmesi gerektiğinden, delil tespiti talebinde bulunulması zarureti doğmuştur.
6-) 6100 s. HMK m. 400/2 hükmüne göre, "Delil tespiti istenebilmesi için hukuki yararın varlığı gerekir. Kanunda açıkça öngörülen hâller dışında, delilin hemen tespit edilmemesi hâlinde kaybolacağı yahut ileri sürülmesinin önemli ölçüde zorlaşacağı ihtimal dâhilinde bulunuyorsa hukuki yarar var sayılır." Somut olayımızda da, tespit istediğimiz taşınmaz müvekkilim tarafından yeni kiracının kullanımına uygun hale getirilmek suretiyle kiralanacağından, delillerin kaybolacağı açıktır. 
Açıkladığımız bu nedenlerle, karşı tarafın verdiği zararın tespiti için mahkemenizden delil tespiti yapılması hususunda talepte bulunma zarureti doğmuştur.

IV. HUKUKİ NEDENLER
6100 sayılı HMK m. 316, 400, 401, 402 ve sair ilgili mevzuat

V. DELİLLER
- Kira sözleşmesi, 
- Taşınmazın zarardan sonraki halini gösteren fotoğraflar ve video CD’si

VI. SONUÇ ve İSTEM: Yukarıda arz ve izah edilen sebeplerden dolayı;
Tespit talebimizin kabulü ile;
1) Müvekkilin dava konusu taşınmazının alanında uzman bilirkişi heyeti eşliğinde incelenerek verilen zararın tespitini ve bu hususta detaylı bilirkişi raporu alınmasını,
2) Müvekkilin uğradığı maddi zararın parasal olarak bilirkişiler vasıtasıyla tespitini,
Saygılarımızla vekaleten arz ve talep ederiz. 06/05/2022


Tespit Talebinde Bulunan Vekili
Av. Halil POLAT-39261

EKLER: 
1-Kira sözleşmesi
2-Fotoğraflar ve CD
3-Vekaletname`,
    'Faydalı ve Zorunlu Masraflar Alacağı': `NÖBETÇİ SULH HUKUK MAHKEMESİNE
                                    ……………….

 
DAVACI (KİRACI): A.B., adres, T.C. Kimlik No:……
VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI (KİRALAYAN): …
DAVA KONUSU : Faydalı ve Zorunlu Masraflar Nedeniyle Alacak
DAVA DEĞERİ: … TL.

I. AÇIKLAMALAR :
1- Müvekkilim A.B., ekte sunulan …/…/… tarihli kira sözleşmesiyle … adresinde bulunan davalıya ait ait daireyi 1 yıl süreyle davalıya kiralamıştır. Söz konusu sözleşme dilekçemiz ekindedir (EK-1).
2- Sözleşmenin … maddesine göre, müvekkil dairenin yıpranmış olan üç oda kapısını ve mutfak tezgahını yenisiyle değiştirecek ve sözleşme sonunda buna dair masrafları kiraya verenden tahsil edecektir.
3- Müvekkil sözleşme kapsamında gerekli imalatları ve tadilatları yaparak … TL masraf yapmıştır. Bu masraflara dair faturalar dilekçemiz ekindedir (EK-2).
4- Müvekkilim 1 yıllık kira süresi sonunda tayini çıktığı için taşınmazı tahliye etmiştir ve sözleşme bu haliyle sona ermiştir.
5- Müvekkilim davalıdan TBK m. 321/3 hükmü kapsamında faydalı ve zorunlu masraf niteliğindeki giderleri davalıdan talep etmişse de, davalı bu giderleri karşılayamayacağını bildirmiştir. Bu konuyla ilgili whatsapp yazışmaları dilekçemiz ekindedir (EK-3).
6- TBK m. 321 hükmüne göre kiracı faydalı ve zorunlu masrafları kiraya verenden talep edebilir. Talebe rağmen bu masrafları karşılamayan davalıya karşı işbu davanın açılması zarureti doğmuştur.

II. DELİLLER:
- Kira sözleşmesi, 
- Whatsapp mesajları,
- Faturalar,
- Keşif ve bilirkişi raporları,
- Tanık beyanları,
- Yemin ve sair her türlü delil.

III. HUKUKİ NEDENLER: 
1-6098 Sayılı Türk Borçlar Kanunu: 321, 520. maddeleri
2-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile, 
1- Fazlaya ilişkin haklarımız saklı kalmak kaydıyla, TBK m. 321 ve 520 hükümleri uyarınca, davalının dairesine yapılan faydalı ve zorunlu masraflara ilişkin … TL alacağın, muacceliyet tarihi olan tahliye tarihinden (…/…/… tarihinden) itibaren yasal faizi ile DAVALIDAN TAHSİLİ İLE MÜVEKKİLİME ÖDENMESİNE,
2-Yargılama giderleri ile vekalet ücretinin davalı üzerinde bırakılmasına,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                              DAVACI VEKİLİ
                             Av. ……………..
                İmza

EKİ:
1- Kira sözleşmesi
2- Faturalar,
3- Whatsapp yazışması
4- Vekaletname`,
    'İki Haklı İhtar - Tahliye ve Kira Alacağı': `NÖBETÇİ SULH HUKUK MAHKEMESİNE
                                    ……………….

 
DAVACI (KİRALAYAN): A.B., adres, T.C. Kimlik No:……
VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI (KİRACI): …
DAVA KONUSU : İki Haklı Nedeniyle Tahliye ve Alacak
DAVA DEĞERİ: … TL.

I. AÇIKLAMALAR :
1- Müvekkilim A.B., ekte sunulan …/…/… tarihli kira sözleşmesiyle … adresinde bulunan kendisine ait daireyi 1 yıl süreyle davalıya kiralamıştır. Kira sözleşmesi …/…/… - …/…/… tarihlerine ilişkindir. Söz konusu sözleşme dilekçemiz ekindedir (EK-1).
2- Sözleşmenin … maddesine göre, kira bedeli aylık … TL belirlenmiş olup, her ayın 15’ine kadar müvekkilin … iban numaralı hesabına yatırılacaktır.
3- Davalı sözleşme kurulduğundan beri kira bedellerini ödemede savsaklama göstermiş, çoğu kez kira bedelini geç ödemiştir. Bu hususta davalı çoğu kez sözlü olarak uyarılmıştır.
4- Davalının ilk üç aylık kira bedelini ödemede savsaklama göstermesi nedeniyle, dördüncü ayı oluşturan … ayına dair kira bedelinin süresinde ödenmemesi üzerine … Noterliği’nin …/…/… tarih ve … yevmiye numaralı ihtarnamesi ile kiracıya ödeme ihtarnamesi gönderilmiştir (EK-2). 
5- İhtarnamede, davalının … ayına ilişkin toplam … TL’lik kira bedelinin ödenmesi, aksi halde yasal yollara başvurulacağı ihtar edilmiştir. 
6- Söz konusu ihtarname davalıya …/…/… tarihinde tebliğ edilmiş ve davalı söz konusu … ayına ait kira bedelini ihtarın tebliğinden sonra …/…/… tarihinde ödemiştir. İlgili dekont dilekçemiz ekindedir (EK-3).
7- Davalı kiracının … ayına ödenmesi gereken … TL’lik kira bedelini de süresinde ödememesi nedeniyle … Noterliği’nin …/…/… tarih ve … yevmiye numaralı ihtarnamesi ile kiracıya ikinci ödeme ihtarnamesi gönderilmiştir (EK-4). Söz konusu ikinci ihtar davalıya …/…/… tarihinde tebliğ edilmiş ve davalı işbu dava tarihine kadar kira bedelini ödememiştir.
8- TBK m. 352/2 hükmüne göre, “Kiracı, bir yıldan kısa süreli kira sözleşmelerinde kira süresi içinde; bir yıl ve daha uzun süreli kira sözleşmelerinde ise bir kira yılı veya bir kira yılını aşan süre içinde kira bedelini ödemediği için kendisine yazılı olarak iki haklı ihtarda bulunulmasına sebep olmuşsa kiraya veren, kira süresinin ve bir yıldan uzun süreli kiralarda ihtarların yapıldığı kira yılının bitiminden başlayarak bir ay içinde, dava yoluyla kira sözleşmesini sona erdirebilir.”
9- Müvekkilim davalıya kira bedellerinin süresinde ödenmemesi nedeniyle bir kira yılı içinde iki farklı aya dair iki haklı ihtar göndermiş ve ihtarların tebliğinden önce herhangi bir ödeme yapılmamıştır. İkinci ihtara konu … ayına ilişkin kira bedeli de hiç ödenmemiştir. Bu nedenle TBK m. 352/2 hükmündeki iki haklı ihtar nedeniyle tahliyenin tüm koşulları oluşmuştur.
10- Bu nedenle, TBK m. 352/2 hükmü nedeniyle tahliye açılması zarureti doğmuştur.

II. DELİLLER:
- Kira sözleşmesi, 
- İhtarname
- Dekont,
- Tanık beyanları,
- Yemin ve sair her türlü delil.

III. HUKUKİ NEDENLER: 
1-6098 Sayılı Türk Borçlar Kanunu: 352/2. maddesi
2-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile, 
1- … TL kira bedelinin muacceliyet tarihinden itibaren işleyecek yasal faizi ile DAVALIDAN TAHSİLİ İLE MÜVEKKİLİME ÖDENMESİNE,
2- Şartları oluştuğundan TBK m. 352/2 hükmü uyarınca davalının dava konusu taşınmazdan TAHLİYESİNE,
3- Taşınmazın boş olarak müvekkilime teslimine,
4- Yargılama giderleri ile vekalet ücretinin davalı üzerinde bırakılmasına,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                               DAVACI VEKİLİ
                             Av. ……………..
                İmza

EKİ:
1- Kira sözleşmesi
2- İhtarname
3- Vekaletname`,
    'Konut İhtiyacı Nedeniyle Tahliye': `NÖBETÇİ SULH HUKUK MAHKEMESİNE
                                    ……………….

 
DAVACI (KİRALAYAN): A.B., adres, T.C. Kimlik No:……
VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI (KİRACI): …
DAVA KONUSU : Konut İhtiyacı Nedeniyle Tahliye 
DAVA DEĞERİ: … TL.

I. AÇIKLAMALAR :
1- Müvekkilim A.B., ekte sunulan …/…/… tarihli kira sözleşmesiyle … adresinde bulunan kendisine ait daireyi 1 yıl süreyle davalıya kiralamıştır. Kira sözleşmesi …/…/… - …/…/… tarihlerine ilişkindir. Söz konusu sözleşme dilekçemiz ekindedir (EK-1).
2- Müvekkilimin … isminde 23 yaşında bir erkek evladı bulunmakta olup, … yılı Haziran ayında evlenecektir. Müvekkilin kirada olan başka konutu yoktur ve davalının oturduğu konuta bu yönüyle ihtiyaç vardır.
3- TBK m. 350/1.bent hükmüne göre, “Kiralananı kendisi, eşi, altsoyu, üstsoyu veya kanun gereği bakmakla yükümlü olduğu diğer kişiler için konut ya da işyeri gereksinimi sebebiyle kullanma zorunluluğu varsa, belirli süreli sözleşmelerde sürenin sonunda, belirsiz süreli sözleşmelerde kiraya ilişkin genel hükümlere göre fesih dönemine ve fesih bildirimi için öngörülen sürelere uyularak belirlenecek tarihten başlayarak bir ay içinde açacağı dava ile sona erdirebilir.”
4- Somut olayda kira süresi bir yıllık olup bu süre …/…/… tarihinde sona ermiştir. Sona erme tarihinden 45 gün öncesinden davalıya … Noterliği’nin …/…/… tarih ve … yevmiye numaralı ihbarnamesi ile kira sözleşmesinin ihtiyaç nedeniyle feshedileceğine dair ihbarda bulunulmuştur (EK-2). Bu ihbarname …/…/… tarihinde davalıya tebliğ edilmiştir.
5- Fesih ihbarına rağmen davalı taşınmazı tahliye etmemekte ve ihtiyaç iddiasının samimi olmadığını iddia etmektedir. Oysa davalının savunması yersizdir. Müvekkilin oğlu …/…/… tarihinde … isimli bayan ile nişanlanmış olup 23 Haziran tarihi için … isimli düğün salonu ile anlaşma yapılmıştır. Söz konusu nişan davetiyesinden bir suret ile düğün salonu rezervasyon evrakları dilekçemiz ekindedir (EK-3).
6- Müvekkilin ihtiyaç iddiası samimidir, gerçektir ve halen devam etmektedir. Bu nedenle davalının tahliyesine karar verilmesini talep etme zarureti doğmuştur.

II. DELİLLER:
- Kira sözleşmesi, 
- İhbarname
- Nişan davetiyesi,
- Rezervasyon evrakı,
- Tanık beyanları,
- Yemin ve sair her türlü delil.

III. HUKUKİ NEDENLER: 
1-6098 Sayılı Türk Borçlar Kanunu: 350/1. bent
2-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile, 
1- Şartları oluştuğundan TBK m. 350/1.bent hükmü uyarınca davalının dava konusu taşınmazdan TAHLİYESİNE,
2-Taşınmazın boş olarak müvekkilime teslimine,
3- Yargılama giderleri ile vekalet ücretinin davalı üzerinde bırakılmasına,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                               DAVACI VEKİLİ
                             Av. ……………..
                İmza


EKİ:
1- Kira sözleşmesi
2- İhbarname
3- Davetiye
4- Sözleşme
5- Vekaletname`,
    'Konut İhtiyacı Tahliye (Varyant)': `NÖBETÇİ SULH HUKUK MAHKEMESİNE
                                    ……………….

 
DAVACI (KİRALAYAN): A.B., adres, T.C. Kimlik No:……
VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI (KİRACI): …
DAVA KONUSU : Konut İhtiyacı Nedeniyle Tahliye 
DAVA DEĞERİ: … TL.

I. AÇIKLAMALAR :
1- Müvekkilim A.B., ekte sunulan …/…/… tarihli kira sözleşmesiyle … adresinde bulunan kendisine ait daireyi 1 yıl süreyle davalıya kiralamıştır. Kira sözleşmesi …/…/… - …/…/… tarihlerine ilişkindir. Söz konusu sözleşme dilekçemiz ekindedir (EK-1).
2- Müvekkilimin … isminde 23 yaşında bir erkek evladı bulunmakta olup, … yılı Haziran ayında evlenecektir. Müvekkilin kirada olan başka konutu yoktur ve davalının oturduğu konuta bu yönüyle ihtiyaç vardır.
3- TBK m. 350/1.bent hükmüne göre, “Kiralananı kendisi, eşi, altsoyu, üstsoyu veya kanun gereği bakmakla yükümlü olduğu diğer kişiler için konut ya da işyeri gereksinimi sebebiyle kullanma zorunluluğu varsa, belirli süreli sözleşmelerde sürenin sonunda, belirsiz süreli sözleşmelerde kiraya ilişkin genel hükümlere göre fesih dönemine ve fesih bildirimi için öngörülen sürelere uyularak belirlenecek tarihten başlayarak bir ay içinde açacağı dava ile sona erdirebilir.”
4- Somut olayda kira süresi bir yıllık olup bu süre …/…/… tarihinde sona ermiştir. Sona erme tarihinden 45 gün öncesinden davalıya … Noterliği’nin …/…/… tarih ve … yevmiye numaralı ihbarnamesi ile kira sözleşmesinin ihtiyaç nedeniyle feshedileceğine dair ihbarda bulunulmuştur (EK-2). Bu ihbarname …/…/… tarihinde davalıya tebliğ edilmiştir.
5- Fesih ihbarına rağmen davalı taşınmazı tahliye etmemekte ve ihtiyaç iddiasının samimi olmadığını iddia etmektedir. Oysa davalının savunması yersizdir. Müvekkilin oğlu …/…/… tarihinde … isimli bayan ile nişanlanmış olup 23 Haziran tarihi için … isimli düğün salonu ile anlaşma yapılmıştır. Söz konusu nişan davetiyesinden bir suret ile düğün salonu rezervasyon evrakları dilekçemiz ekindedir (EK-3).
6- Müvekkilin ihtiyaç iddiası samimidir, gerçektir ve halen devam etmektedir. Bu nedenle davalının tahliyesine karar verilmesini talep etme zarureti doğmuştur.

II. DELİLLER:
- Kira sözleşmesi, 
- İhbarname
- Nişan davetiyesi,
- Rezervasyon evrakı,
- Tanık beyanları,
- Yemin ve sair her türlü delil.

III. HUKUKİ NEDENLER: 
1-6098 Sayılı Türk Borçlar Kanunu: 350/1. bent
2-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile, 
1- Şartları oluştuğundan TBK m. 350/1.bent hükmü uyarınca davalının dava konusu taşınmazdan TAHLİYESİNE,
2-Taşınmazın boş olarak müvekkilime teslimine,
3- Yargılama giderleri ile vekalet ücretinin davalı üzerinde bırakılmasına,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                               DAVACI VEKİLİ
                             Av. ……………..
                İmza


EKİ:
1- Kira sözleşmesi
2- İhbarname
3- Davetiye
4- Sözleşme
5- Vekaletname`,
    'İşyeri İhtiyacı Nedeniyle Tahliye': `NÖBETÇİ SULH HUKUK MAHKEMESİNE
                                    ……………….

 
DAVACI (KİRALAYAN): A.B., adres, T.C. Kimlik No:……
VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI (KİRACI): …
DAVA KONUSU : İşyeri İhtiyacı Nedeniyle Tahliye 
DAVA DEĞERİ: … TL.

I. AÇIKLAMALAR :
1- Müvekkilim A.B., ekte sunulan …/…/… tarihli kira sözleşmesiyle … adresinde bulunan kendisine ait işyeri niteliğindeki dükkanı 1 yıl süreyle davalıya kiralamıştır. Kira sözleşmesi …/…/… - …/…/… tarihlerine ilişkindir. Söz konusu sözleşme dilekçemiz ekindedir (EK-1).
2- Müvekkilim …/…/… tarihinde çalıştığı kurumdan emekli olmuştur ve okuyan evlatlarının olması nedeniyle emeklilik maaşıyla geçinemeyeceği için, söz konusu dükkanı kırtasiye olarak işletmek ve kullanmak istemektedir.
3- TBK m. 350/1.bent hükmüne göre, “Kiralananı kendisi, eşi, altsoyu, üstsoyu veya kanun gereği bakmakla yükümlü olduğu diğer kişiler için konut ya da işyeri gereksinimi sebebiyle kullanma zorunluluğu varsa, belirli süreli sözleşmelerde sürenin sonunda, belirsiz süreli sözleşmelerde kiraya ilişkin genel hükümlere göre fesih dönemine ve fesih bildirimi için öngörülen sürelere uyularak belirlenecek tarihten başlayarak bir ay içinde açacağı dava ile sona erdirebilir.”
4- Somut olayda kira süresi bir yıllık olup bu süre …/…/… tarihinde sona ermiştir. Sona erme tarihinden 45 gün öncesinden davalıya … Noterliği’nin …/…/… tarih ve … yevmiye numaralı ihbarnamesi ile kira sözleşmesinin ihtiyaç nedeniyle feshedileceğine dair ihbarda bulunulmuştur (EK-2). Bu ihbarname …/…/… tarihinde davalıya tebliğ edilmiştir.
5- Fesih ihbarına rağmen davalı taşınmazı tahliye etmemekte ve ihtiyaç iddiasının samimi olmadığını iddia etmektedir. Oysa davalının savunması yersizdir. Müvekkil emekli olup söz konusu yeri kendine ait işyeri olarak kullanacaktır. Tanık beyanları da bu hususu doğrulayacaktır.
6- Müvekkilin ihtiyaç iddiası samimidir, gerçektir ve halen devam etmektedir. Bu nedenle davalının tahliyesine karar verilmesini talep etme zarureti doğmuştur.

II. DELİLLER:
- Kira sözleşmesi, 
- İhbarname
- Tanık beyanları,
- Yemin ve sair her türlü delil.

III. HUKUKİ NEDENLER: 
1-6098 Sayılı Türk Borçlar Kanunu: 350/1. bent
2-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile, 
1- Şartları oluştuğundan TBK m. 350/1.bent hükmü uyarınca davalının dava konusu taşınmazdan TAHLİYESİNE,
2- Taşınmazın boş olarak müvekkilime teslimine,
3- Yargılama giderleri ile vekalet ücretinin davalı üzerinde bırakılmasına,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                               DAVACI VEKİLİ
                             Av. ……………..
                İmza

EKİ:
1- Kira sözleşmesi
2- İhbarname
3- Vekaletname`,
    'Sözleşmeye Aykırılık - Tahliye': `NÖBETÇİ SULH HUKUK MAHKEMESİNE
          ……………….

 
DAVACI (KİRALAYAN): A.B., adres, T.C. Kimlik No:……
VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI (KİRACI): …
DAVA KONUSU : Akde Aykırılık Nedeniyle Tahliye
DAVA DEĞERİ: … TL.

I. AÇIKLAMALAR :
1- Müvekkilim A.B., ekte sunulan …/…/… tarihli kira sözleşmesiyle … adresinde bulunan kendisine ait daireyi 1 yıl süreyle davalıya kiralamıştır. Kira sözleşmesi …/…/… - …/…/… tarihlerine ilişkindir. Söz konusu sözleşme dilekçemiz ekindedir (EK-1).
2- Davalı kiracı, kira sözleşmesinin kurulduğu tarihten kısa bir süre sonra komşuları rahatsız edecek şekilde yaşamaya başlamıştır. Süreç içerisinde kendisiyle ilgili yönetici …’den ve diğer komşulardan defalarca şikayetler gelmiştir. Kendisi defalarca sözlü olarak uyarılmasına rağmen, uyarılara kulak asmamıştır.
3- Davalı kiracı, eve sürekli alkollü ve genellikle geç saatlerde gelmekte, apartman içinde komşularla tartışmakta, eve getirdiği arkadaşlarıyla gece geç saatlere kadar gürültü yaparak eğlenmektedir. 
4- En son …/…/… tarihinde eve getirdiği arkadaşlarıyla aldıkları alkolün etkisiyle arkadaşlarıyla kavga etmiş ve komşular müdahale ederek kavgayı ayırmıştır. Kavganın gece geç saatte olması nedeniyle tüm apartman rahatsız olmuş ve teyakkuz haline geçmiştir. 
5- Yukarıda belirtilen vakıalarla ilgili olarak bina sakinleri olan …, …, … ve bina yöneticisi … tanıktır. Yine bunun gibi, dilekçemiz ekinde sunulan kamera kayıtları da yaşanan olayları teyit etmektedir (EK-2). Kamera kayıtları da incelendiğinde davalının sürekli şekilde eve gece 02.00’den sonra ve alkolün etkisiyle döndüğü, ayakta duramayacak şekilde eve geldiği görülmektedir.
6- Komşulardan gelen şikayetlerin artması üzerine davalının TBK m. 316 hükmü kapmasında komşulara saygı gösterme borcuna uygun davranması konusunda uyarılması gerekmiş ve … Noterliğinin …/…/… tarih ve … yevmiye numaralı ihtarnamesi …/…/… tarihinde tebliğ edilmiştir. İhtarnamede, binada yaşanan tüm olaylar özetlenmiş ve davalıya 30 gün içinde TBK m. 316/1 hükmündeki komşulara saygı gösterme borcuna uygun davranması ve aykırılığı gidermesi, aksi halde sözleşmenin feshedileceği ve tahliye davası açılacağı açıkça bildirilmiştir. 
7- İhtarname …/…/… tarihinde davalı kiracıya tebliğ edilmesine rağmen davalı eylemlerine son vermemiş ve en son …/…/… tarihinde bina içinde gece vakti yüksek sesle müzik dinlemesi nedeniyle alt komşusu … tarafından uyarılmış ve bu uyarı sözlü tartışmaya dönüşmüştür. Komşuların müdahalesi ile tartışma yatıştırılmıştır. Komşulardan … ve … bu olayın tanığıdır.
8- Tüm uyarılara ve ihtara rağmen koşulara saygı gösterme yükümlülüğünü ihlal etmeye devam eden davalının TBK m. 316/2 hükmü uyarınca tahliyesi için tüm koşullar somut olayda vuku bulmuştur. Davalının akde aykırı bu davranışı nedeniyle sözleşme feshedilmiş ve tahliye davası açma zarureti doğmuştur.

II. DELİLLER:
- Kira sözleşmesi, 
- Kamera kayıtları, 
- Tanık beyanları, 
- Yemin ve sair her türlü delil.

III. HUKUKİ NEDENLER: 
1-6098 Sayılı Türk Borçlar Kanunu: 316/1, 2. fıkraları
2-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile, 
1- Şartları oluştuğundan TBK m. 316/1 ve 2. fıkraları uyarınca davalının dava konusu taşınmazdan TAHLİYESİNE.
2- Taşınmazın boş olarak müvekkilime teslimine,
3- Yargılama giderleri ile vekalet ücretinin davalı üzerinde bırakılmasına, 
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

         DAVACI VEKİLİ
        Av. ……………..
     İmza

EKİ:
1- Kira sözleşmesi
2- Kamera kayıtları
3- Vekaletname`,
  
    'Kira Tahliyesi': `NÖBETÇİ SULH HUKUK MAHKEMESİNE
                                    ……………….

 
DAVACI (KİRALAYAN): A.B., adres, T.C. Kimlik No:……
VEKİLİ: Av. …, adres, T.C. kimlik no:…….
DAVALI (KİRACI): …
DAVA KONUSU : Konut İhtiyacı Nedeniyle Tahliye 
DAVA DEĞERİ: … TL.

I. AÇIKLAMALAR :
1- Müvekkilim A.B., ekte sunulan …/…/… tarihli kira sözleşmesiyle … adresinde bulunan kendisine ait daireyi 1 yıl süreyle davalıya kiralamıştır. Kira sözleşmesi …/…/… - …/…/… tarihlerine ilişkindir. Söz konusu sözleşme dilekçemiz ekindedir (EK-1).
2- Müvekkilimin … isminde 23 yaşında bir erkek evladı bulunmakta olup, … yılı Haziran ayında evlenecektir. Müvekkilin kirada olan başka konutu yoktur ve davalının oturduğu konuta bu yönüyle ihtiyaç vardır.
3- TBK m. 350/1.bent hükmüne göre, “Kiralananı kendisi, eşi, altsoyu, üstsoyu veya kanun gereği bakmakla yükümlü olduğu diğer kişiler için konut ya da işyeri gereksinimi sebebiyle kullanma zorunluluğu varsa, belirli süreli sözleşmelerde sürenin sonunda, belirsiz süreli sözleşmelerde kiraya ilişkin genel hükümlere göre fesih dönemine ve fesih bildirimi için öngörülen sürelere uyularak belirlenecek tarihten başlayarak bir ay içinde açacağı dava ile sona erdirebilir.”
4- Somut olayda kira süresi bir yıllık olup bu süre …/…/… tarihinde sona ermiştir. Sona erme tarihinden 45 gün öncesinden davalıya … Noterliği’nin …/…/… tarih ve … yevmiye numaralı ihbarnamesi ile kira sözleşmesinin ihtiyaç nedeniyle feshedileceğine dair ihbarda bulunulmuştur (EK-2). Bu ihbarname …/…/… tarihinde davalıya tebliğ edilmiştir.
5- Fesih ihbarına rağmen davalı taşınmazı tahliye etmemekte ve ihtiyaç iddiasının samimi olmadığını iddia etmektedir. Oysa davalının savunması yersizdir. Müvekkilin oğlu …/…/… tarihinde … isimli bayan ile nişanlanmış olup 23 Haziran tarihi için … isimli düğün salonu ile anlaşma yapılmıştır. Söz konusu nişan davetiyesinden bir suret ile düğün salonu rezervasyon evrakları dilekçemiz ekindedir (EK-3).
6- Müvekkilin ihtiyaç iddiası samimidir, gerçektir ve halen devam etmektedir. Bu nedenle davalının tahliyesine karar verilmesini talep etme zarureti doğmuştur.

II. DELİLLER:
- Kira sözleşmesi, 
- İhbarname
- Nişan davetiyesi,
- Rezervasyon evrakı,
- Tanık beyanları,
- Yemin ve sair her türlü delil.

III. HUKUKİ NEDENLER: 
1-6098 Sayılı Türk Borçlar Kanunu: 350/1. bent
2-6100 sayılı Hukuk Muhakemeleri Kanunu ilgili maddeleri
3-Sair ilgili mevzuat

IV. SONUÇ ve İSTEM : 
Yukarıda arz ve izah edilen nedenlerden dolayı;
Davamızın Kabulü ile, 
1- Şartları oluştuğundan TBK m. 350/1.bent hükmü uyarınca davalının dava konusu taşınmazdan TAHLİYESİNE,
2-Taşınmazın boş olarak müvekkilime teslimine,
3- Yargılama giderleri ile vekalet ücretinin davalı üzerinde bırakılmasına,
Karar verilmesini vekaleten arz ve talep ederiz. …/…/…

                               DAVACI VEKİLİ
                             Av. ……………..
                İmza


EKİ:
1- Kira sözleşmesi
2- İhbarname
3- Davetiye
4- Sözleşme
5- Vekaletname
`,
  },
};

function sablonListesiOlustur() {
  const container = document.getElementById('sablon-listesi');
  if (!container) return;
  let html = '';
  for (const [kategori, sablonlar] of Object.entries(SABLONLAR)) {
    html += '<h3>' + kategori + '</h3>';
    for (const ad of Object.keys(sablonlar)) {
        html += '<div class="sablon-item" data-sablon="' + ad.replace(/"/g,'&quot;') + '" title="' + ad + '">' + ad + '</div>';
    }
  }
  container.innerHTML = html;
}

function sablonSec(ad) {
  try {
    const textarea = document.getElementById('dilekce-text');
    if (!textarea) return;
    let icerik = '';
    for (const sablonlar of Object.values(SABLONLAR)) {
      if (sablonlar[ad]) { icerik = sablonlar[ad]; break; }
    }
    if (!icerik) return;
    textarea.value = icerik;
    dilekceIstatistik();
    st('aktif-sablon', ad);
    document.querySelectorAll('.sablon-item').forEach(el => {
      el.classList.toggle('active', el.textContent === ad);
    });
    toast('Şablon yüklendi: ' + ad, 'basari');
  } catch(e) { console.error('sablonSec hatası:', e); }
}

function sablonAra(q) {
  const qq = (q || '').toLowerCase();
  document.querySelectorAll('.sablon-item').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(qq) ? '' : 'none';
  });
}

function dilekceIstatistik() {
  try {
    const text = gv('dilekce-text');
    st('stat-kelime', (text.match(/\S+/g)||[]).length);
    st('stat-char', text.length);
    st('stat-cumle', (text.match(/[.!?]+/g)||[]).length);
    st('stat-para', text.split(/\n\n+/).filter(p=>p.trim()).length);
  } catch(e) {}
}

function ekleMetin(metin) {
  try {
    const ta = document.getElementById('dilekce-text');
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.substring(0,s) + metin + ta.value.substring(e);
    ta.selectionStart = ta.selectionEnd = s + metin.length;
    ta.focus();
    dilekceIstatistik();
  } catch(e) {}
}

function dilekceTemizle() {
  const ta = document.getElementById('dilekce-text');
  if (ta && confirm('Metin temizlensin mi?')) {
    ta.value = ''; dilekceIstatistik();
    st('aktif-sablon','Seçilmedi');
  }
}
function dilekceKopyala() {
  navigator.clipboard.writeText(gv('dilekce-text'))
    .then(()=>toast('Metin kopyalandı!','basari'))
    .catch(()=>toast('Kopyalama başarısız.','hata'));
}

function dilekceBelgeHTML() {
  const text = gv('dilekce-text');
  return '<pre>' + esc(text) + '</pre>';
}

function dilekcePencereAc() {
  const text = gv('dilekce-text');
  if (!text.trim()) { toast('Önce bir dilekçe seçin veya yazın.','hata'); return; }
  const baslik = gv('aktif-sablon') || 'Dilekçe';
  belgeModalAc(baslik, dilekceBelgeHTML(), 'dilekce');
}

function dilekceWordIndir() {
  const text = gv('dilekce-text');
  if (!text.trim()) { toast('Word için önce bir dilekçe seçin.','hata'); return; }
  belgeWordIndir(gv('aktif-sablon') || 'Dilekçe', dilekceBelgeHTML());
}

function dilekcePdfYazdir() {
  const text = gv('dilekce-text');
  if (!text.trim()) { toast('PDF/Yazdır için önce bir dilekçe seçin.','hata'); return; }
  belgePdfYazdir(gv('aktif-sablon') || 'Dilekçe', dilekceBelgeHTML());
}

async function dilekceKaydet() {
  const text = gv('dilekce-text');
  if (!text.trim()) { toast('Kaydedilecek metin yok.','hata'); return; }
  const veri = { tur:'dilekce', icerik:text, tarih:new Date().toISOString(), sablon:gv('aktif-sablon')||'' };
  if (window.hukukAPI) {
    const r = await window.hukukAPI.dosyaKaydet({ icerik:veri });
    if (r.basarili) { toast('Kaydedildi!','basari'); belgeleYenile(); }
    else toast('Kayıt başarısız: '+r.hata,'hata');
  } else {
    const blob = new Blob([text],{type:'text/plain;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dilekce-'+Date.now()+'.txt';
    a.click();
    toast('Dosya indirildi.','basari');
  }
}
function dilekceYazdir() {
  dilekcePdfYazdir();
}

/* ══════════════════════════════════════════
   BÖLÜM 3 — HÂKİM KARAR YAZIM
══════════════════════════════════════════ */
// ── 2026 Yargı Harç Tarifeleri (492 s. Harçlar K., Seri No:98 Tebliği) ──────────
const HARC = {
  nispi:   0.06831,  // Binde 68,31 — Karar ve İlam Harcı (nispi)
  pesin:   0.25,     // Peşin harç = toplam harcın 1/4'ü
  istinaf: 50000,    // 2026 İstinaf kesinlik sınırı (HMK m.341)
  temyiz:  682000,   // 2026 Temyiz kesinlik sınırı (HMK m.362)
  maktu:   732,      // 2026 Maktu karar ve ilam harcı (Asliye Hukuk)
};

// ── 2025-2026 AAÜT Maktu Vekâlet Ücretleri (R.G.: 4 Kasım 2025, No:33067) ──────
const VEKALET = {
  asliye:  {m: 45000},  // Asliye Hukuk & Asliye Ticaret
  sulh:    {m: 30000},  // Sulh Hukuk
  aile:    {m: 35000},  // Aile Mahkemesi
  is:      {m: 35000},  // İş Mahkemesi
  ticaret: {m: 45000},  // Asliye Ticaret Mahkemesi
  icra:    {m: 9000},   // İcra Daireleri (genel takip)
};

// ── 2025-2026 AAÜT Üçüncü Kısım — Nisbi Vekâlet Dilim Tablosu ──────────────────
const VEKALET_DILIM = [
  {ust:   600000, oran: 0.16},
  {ust:  1200000, oran: 0.15},
  {ust:  2400000, oran: 0.14},
  {ust:  3600000, oran: 0.13},
  {ust:  5400000, oran: 0.11},
  {ust:  7800000, oran: 0.08},
  {ust: 10800000, oran: 0.05},
  {ust: 14400000, oran: 0.03},
  {ust: 18600000, oran: 0.02},
  {ust: Infinity, oran: 0.01},
];

function calcNisbiVekalet(miktar) {
  if (!miktar || miktar <= 0) return 0;
  let toplam = 0, kalan = miktar, oncekiUst = 0;
  for (const d of VEKALET_DILIM) {
    const dilimBoy = d.ust - oncekiUst;
    const pay     = Math.min(kalan, dilimBoy);
    toplam += pay * d.oran;
    kalan  -= pay;
    oncekiUst = d.ust;
    if (kalan <= 0) break;
  }
  return toplam;
}
const DAVALAR = {
  sozlesme:{ad:'Sözleşmeden Doğan Tazminat',kanun:'TBK m.112, m.117-126, HMK m.326',tip:'para'},
  haksiz:{ad:'Haksız Fiil Tazminatı',kanun:'TBK m.49-52, TBK m.58, HMK m.326',tip:'para'},
  manevi:{ad:'Manevi Tazminat',kanun:'TMK m.24-25, TBK m.58, HMK m.326',tip:'para'},
  alacak:{ad:'Alacak Davası',kanun:'TBK m.83-89, TBK m.101, HMK m.326',tip:'para'},
  'itiraz-iptal':{ad:'İtirazın İptali (İİK m.67)',kanun:'İİK m.67/1, m.67/2, HMK m.326',tip:'para',inkar:true},
  menfi:{ad:'Menfi Tespit (İİK m.72)',kanun:'İİK m.72, HMK m.326',tip:'para',kotu:true},
  'tapu-iptal':{ad:'Tapu İptali ve Tescil',kanun:'TMK m.705, m.1023, TBK m.36',tip:'tapu'},
  zamanaşimi:{ad:'Kazandırıcı Zamanaşımı',kanun:'TMK m.713/1, Kadastro K. m.14',tip:'tapu'},
  irtifak:{ad:'İrtifak / Geçit Hakkı',kanun:'TMK m.747, m.780-795',tip:'tapu-bedel'},
  'tapu-duz':{ad:'Tapu Kaydı Düzeltimi',kanun:'Tapu K. m.29, TMK m.705',tip:'tapu'},
  izale:{ad:'Ortaklığın Giderilmesi',kanun:'TMK m.698-700',tip:'tapu'},
  bosanma:{ad:'Boşanma Davası',kanun:'TMK m.163, m.174-175, m.182, m.185-196',tip:'aile'},
  nafaka:{ad:'Nafaka Davası',kanun:'TMK m.182/2, m.175, m.176',tip:'nafaka'},
  velayet:{ad:'Velayet Davası',kanun:'TMK m.182, m.337-351',tip:'aile'},
  'ad-soyad':{ad:'Ad Soyad Düzeltimi',kanun:'TMK m.27, 5490 NHK m.36',tip:'nufus'},
  yas:{ad:'Yaş Düzeltimi',kanun:'TMK m.35, 5490 NHK m.36',tip:'nufus'},
  nesep:{ad:'Nesep / Soybağı',kanun:'TMK m.282-308',tip:'nufus'},
  kidem:{ad:'Kıdem + İhbar Tazminatı',kanun:'4857 İK m.17, 1475 İK m.14',tip:'para'},
  iade:{ad:'Feshin Geçersizliği / İşe İade',kanun:'4857 İK m.18-21',tip:'iade'},
  marka:{ad:'Marka / Patent İhlali',kanun:'6769 SMK m.37-38, m.149-151',tip:'para'},
  sirket:{ad:'Şirket Feshi ve Tasfiyesi',kanun:'TTK m.166, m.179-194',tip:'sirket'},
};

let HS = {};

function formTab(idx) {
  document.querySelectorAll('.ftab').forEach((t,i)=>t.classList.toggle('active',i===idx));
  document.querySelectorAll('.ftab-pane').forEach((p,i)=>p.classList.toggle('active',i===idx));
}

function davaTuruSec() {
  try {
    const tur = gv('f-dava-turu');
    const d = DAVALAR[tur];
    if (!d) return;
    const kanunEl = document.getElementById('f-kanun');
    if (kanunEl) kanunEl.value = d.kanun;
    const ozel = document.getElementById('f-ozel-alan');
    if (!ozel) return;
    let html = '';
    if (d.tip==='tapu'||d.tip==='tapu-bedel') {
      html = '<div class="form-group"><label>Taşınmaz (Ada/Parsel)</label><input id="f-tasin" placeholder="1234 Ada, 45 Parsel" oninput="kararGuncelle()"></div>';
      if (d.tip==='tapu-bedel') html += '<div class="form-group"><label>İrtifak Bedeli (TL)</label><input id="f-irtifak" type="number" placeholder="0" oninput="kararGuncelle()"></div>';
    } else if (d.tip==='nafaka') {
      html = '<div class="fg2"><div class="form-group"><label>Çocuk / Lehtar</label><input id="f-naf-kisi" placeholder="Defne ŞAHIN" oninput="kararGuncelle()"></div><div class="form-group"><label>Aylık Nafaka (TL)</label><input id="f-naf-tutar" type="number" placeholder="0" oninput="kararGuncelle()"></div></div>';
    } else if (d.tip==='nufus') {
      html = '<div class="fg2"><div class="form-group"><label>Mevcut Kayıt</label><input id="f-nus-eski" placeholder="Mevcut" oninput="kararGuncelle()"></div><div class="form-group"><label>Düzeltilecek</label><input id="f-nus-yeni" placeholder="Yeni" oninput="kararGuncelle()"></div></div>';
    } else if (d.tip==='aile') {
      html = '<div class="form-group"><label>Müşterek Çocuklar</label><input id="f-cocuk" placeholder="Ad (D.T.)" oninput="kararGuncelle()"></div>';
    } else if (d.tip==='iade') {
      html = '<div class="fg2"><div class="form-group"><label>Brüt Aylık (TL)</label><input id="f-ucret" type="number" placeholder="0" oninput="kararGuncelle()"></div><div class="form-group"><label>Boşta Kalma (Ay, max 4)</label><input id="f-bostas" type="number" placeholder="4" max="4" oninput="kararGuncelle()"></div></div>';
    }
    ozel.innerHTML = html;
    hesaplaKarar();
  } catch(e) { console.error('davaTuruSec:', e); }
}

function hesaplaKarar() {
  try {
    const tur = gv('f-dava-turu');
    const d = DAVALAR[tur];
    const deger = parseFloat(gv('f-deger'))||0;
    const kabul = parseFloat(gv('f-kabul'))||0;
    const red = Math.max(0, deger - kabul);
    const mhkTur = gv('f-mhk-tur')||'asliye';
    const bilirkisi = parseFloat(gv('f-bilirkisi'))||0;
    const tip = d ? d.tip : 'para';
    const el_red = document.getElementById('f-red');
    if (el_red) el_red.value = red > 0 ? red.toFixed(2) : '';
    const oran = deger > 0 ? (kabul/deger*100) : 0;
    const tv = VEKALET[mhkTur] || VEKALET.asliye;
    let topHarc=0, pesin=0, bakiye=0, vekD=0, vekDal=0;
    if (['nufus','tapu','tapu-bedel','aile','nafaka'].includes(tip)) {
      topHarc = HARC.maktu; pesin = HARC.maktu; bakiye = 0; vekD = tv.m; vekDal = 0;
    } else {
      topHarc = kabul * HARC.nispi;
      pesin = deger * HARC.nispi * HARC.pesin;
      bakiye = Math.max(0, topHarc - pesin);
      vekD = kabul > 0 ? Math.max(calcNisbiVekalet(kabul), tv.m) : 0;
      vekDal = red > 0 ? Math.max(calcNisbiVekalet(red), tv.m) : 0;
    }
    const gider = bilirkisi + (deger > 100000 ? 2500 : 1200);
    HS = { deger, kabul, red, oran, topHarc, pesin, bakiye, vekD, vekDal, gider, tip, tur, mhkTur };
    st('h-nispi', fmt(deger * HARC.nispi));
    st('h-pesin', fmt(pesin));
    st('h-bakiye', fmt(bakiye));
    st('h-oran', oran.toFixed(1) + '% kabul');
    st('h-vek-d', fmt(vekD));
    st('h-vek-dal', vekDal > 0 ? fmt(vekDal) : '—');
    st('h-gider', fmt(gider));
    // Yargı yolu
    let yyClass='', yyText='';
    if (['nufus','tapu','tapu-bedel','aile','nafaka','sirket'].includes(tip)) {
      yyClass='yp-istinaf'; yyText='🏛 İSTİNAF YOLU AÇIK — BAM (Tebliğden 2 hafta)';
    } else if (deger < HARC.istinaf) {
      yyClass='yp-kesin'; yyText='🔒 KESİN KARAR (Değer < 50.000 TL — 2026 sınırı)';
    } else if (deger < HARC.temyiz) {
      yyClass='yp-istinaf'; yyText='🏛 İSTİNAF YOLU AÇIK — BAM (2 hafta)';
    } else {
      yyClass='yp-temyiz'; yyText='🔺 İSTİNAF + TEMYİZ YOLU AÇIK';
    }
    HS.yyClass = yyClass; HS.yyText = yyText;
    const yyal = document.getElementById('yargi-yolu-alan');
    if (yyal) yyal.innerHTML = '<div class="yargi-pill '+yyClass+'">'+yyText+'</div>';
    st('sb-dava-tur', (d && d.ad) || '—');
    st('sb-hesap', 'Harç: ' + fmt(topHarc));
    kararGuncelle();
  } catch(e) { console.error('hesaplaKarar:', e); }
}

function hukumKur() {
  try {
    const d = DAVALAR[HS.tur];
    if (!d) return '<div class="hukum-item" style="color:#bbb;font-style:italic;font-family:sans-serif;font-size:12px">← Dava türü seçiniz</div>';
    const davaci = gv('f-dav-ad') || '[Davacı]';
    const davali = gv('f-dal-ad') || '[Davalı]';
    const faiz = tarihFmt(gv('f-faiz'));
    const ktar = tarihFmt(gv('f-ktar'));
    let items = [], n = 1;
    const item = (renk, html) => '<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>'+n+'.</strong> <span style="color:'+renk+';font-weight:700">'+html+'</span></div>';
    n++;

    const tip = HS.tip || 'para';
    n = 1;

    if (tip === 'tapu' || tip === 'tapu-bedel') {
      const tasin = gv('f-tasin') || '[Taşınmaz Ada/Parsel]';
      items.push(item(KC, 'Davanın <strong>KABULÜNE</strong>')); n++;
      if (HS.tur==='tapu-iptal') {
        items.push(item(RC,'<strong>'+tasin+'</strong> taşınmazın davalı adına olan tapu kaydının <strong>İPTALİNE</strong>')); n++;
        items.push(item(KC,'Taşınmazın davacı <strong>'+davaci+'</strong> adına <strong>TESCİLİNE</strong>')); n++;
      } else if (HS.tur==='zamanaşimi') {
        items.push(item(KC,'<strong>'+tasin+'</strong> tapusuz taşınmazın davacı adına <strong>TESCİLİNE</strong>')); n++;
      } else if (HS.tur==='irtifak') {
        items.push(item(KC,'Bilirkişi krokisinde gösterilen güzergâhta <strong>GEÇİT HAKKI TESİSİNE</strong>')); n++;
        const bed = parseFloat(gv('f-irtifak'))||0;
        if (bed>0) { items.push(item(TC,'Geçit bedeli <strong>'+fmt(bed)+'</strong>\'nin davacıdan alınarak davalıya ödenmesine')); n++; }
      } else {
        items.push(item(KC,'<strong>'+tasin+'</strong> tapu kaydında gerekli <strong>DÜZELTMELERİN YAPILMASINA</strong>')); n++;
      }
      items.push('<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>'+n+'.</strong> Tapu Sicil Müdürlüğü\'ne tescil müzekkeresi yazılmasına</div>'); n++;
      items.push(item(TC,'<strong>'+fmt(HS.topHarc)+'</strong> yargılama harcının davalıdan tahsiline')); n++;
      items.push(item(TC,'<strong>'+fmt(HS.vekD)+'</strong> vekâlet ücretinin davalıdan alınarak davacıya verilmesine')); n++;

    } else if (tip === 'nufus') {
      const eski = gv('f-nus-eski') || '[mevcut]';
      const yeni = gv('f-nus-yeni') || '[düzeltilecek]';
      items.push(item(KC,'Davanın <strong>KABULÜNE</strong>')); n++;
      items.push(item(KC,'Davacının nüfus kaydındaki <strong>"'+eski+'"</strong> kaydının <strong>"'+yeni+'"</strong> olarak <strong>DÜZELTİLMESİNE/TESCİLİNE</strong>')); n++;
      items.push('<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>'+n+'.</strong> İlgili Nüfus Müdürlüğü\'ne düzeltme müzekkeresi yazılmasına</div>'); n++;
      items.push(item(TC,'Maktu harç <strong>'+fmt(HS.topHarc)+'</strong> davacıdan tahsiline')); n++;

    } else if (tip === 'nafaka') {
      const kisi = gv('f-naf-kisi') || 'Lehtar';
      const nafTut = parseFloat(gv('f-naf-tutar'))||0;
      items.push(item(KC,'Davanın <strong>KABULÜNE</strong>')); n++;
      items.push(item(TC,'<strong>'+kisi+'</strong> için aylık <strong>'+fmt(nafTut)+' İŞTİRAK NAFAKASINA</strong>')); n++;
      items.push('<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>'+n+'.</strong> Her yılın Ocak ayında TÜFE artış oranında artırılmasına</div>'); n++;
      items.push(item(TC,'Maktu harç <strong>'+fmt(HS.topHarc)+'</strong> tahsiline; <strong>'+fmt(HS.vekD)+'</strong> vekâlet ücreti davalıdan davacıya')); n++;

    } else if (tip === 'aile') {
      items.push(item(KC,'Davanın <strong>KABULÜNE</strong>')); n++;
      items.push(item(RC,'Tarafların <strong>BOŞANMALARINA</strong>')); n++;
      const cocuk = gv('f-cocuk');
      if (cocuk) { items.push('<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>'+n+'.</strong> Müşterek çocukların velayetinin belirlenmesine</div>'); n++; }
      items.push(item(TC,'Maktu harç <strong>'+fmt(HS.topHarc)+'</strong> tahsiline; <strong>'+fmt(HS.vekD)+'</strong> vekâlet ücreti davalıdan davacıya')); n++;

    } else if (tip === 'iade') {
      const ucret = parseFloat(gv('f-ucret'))||0;
      const bostas = Math.min(parseInt(gv('f-bostas'))||4, 4);
      items.push(item(KC,'Davanın <strong>KABULÜNE</strong>')); n++;
      items.push(item(KC,'Davalı işverence yapılan feshin <strong>GEÇERSİZLİĞİNE</strong>')); n++;
      items.push(item(KC,'Davacının işe iadesine; 1 ay içinde başlatılmazsa <strong>4-8 aylık tazminata</strong>')); n++;
      if (ucret>0) { items.push(item(TC,'Boşta geçen <strong>'+bostas+' ay</strong> için <strong>'+fmt(ucret*bostas)+'</strong> ücretinin davalıdan tahsiline')); n++; }

    } else {
      // Para davaları
      if (HS.kabul > 0 && HS.red > 0) {
        items.push(item(KC,'Davanın <strong>KISMİ KABULÜNE</strong>')); n++;
        items.push(item(RC,'Fazlaya ilişkin talebin <strong>REDDİNE</strong>')); n++;
        items.push(item(TC,'<strong>'+fmt(HS.kabul)+'</strong>\'nin <strong>'+faiz+'</strong> tarihinden yasal faiziyle davalıdan tahsiline')); n++;
        if (d.inkar) { items.push(item(RC,'İİK m.67/2 uyarınca %20 = <strong>'+fmt(HS.kabul*.2)+' İNKAR TAZMİNATINA</strong>')); n++; }
        const ko = Math.round(HS.oran);
        items.push(item(TC,'Harç ve giderlerin <strong>%'+ko+' kabul</strong> oranında paylaştırılmasına')); n++;
        items.push(item(TC,'<strong>'+fmt(HS.vekD)+'</strong> vekâlet ücreti davalıdan; <strong>'+fmt(HS.vekDal)+'</strong> vekâlet ücreti davacıdan karşı tarafa')); n++;
      } else if (HS.kabul > 0) {
        items.push(item(KC,'Davanın <strong>KABULÜNE</strong>')); n++;
        items.push(item(TC,'<strong>'+fmt(HS.kabul)+'</strong>\'nin <strong>'+faiz+'</strong> tarihinden yasal faiziyle davalıdan tahsiline')); n++;
        if (d.inkar) { items.push(item(RC,'İİK m.67/2 uyarınca %20 = <strong>'+fmt(HS.kabul*.2)+' İNKAR TAZMİNATINA</strong>')); n++; }
        if (d.kotu) { items.push(item(RC,'İİK m.72 uyarınca %20 = <strong>'+fmt(HS.kabul*.2)+' KÖTÜNİYET TAZMİNATINA</strong>')); n++; }
        items.push(item(TC,'<strong>'+fmt(HS.topHarc)+'</strong> harç ve <strong>'+fmt(HS.gider)+'</strong> gider davalıdan davacıya')); n++;
        items.push(item(TC,'<strong>'+fmt(HS.vekD)+'</strong> vekâlet ücreti davalıdan alınarak davacıya verilmesine')); n++;
      } else {
        items.push(item(RC,'Davanın <strong>REDDİNE</strong>')); n++;
        items.push(item(TC,'Harç ve gider davacıdan tahsiline')); n++;
        items.push(item(TC,'<strong>'+fmt(HS.vekDal)+'</strong> vekâlet ücreti davacıdan alınarak davalıya verilmesine')); n++;
      }
    }

    // Yargı yolu
    const yyC = HS.yyClass || 'yp-istinaf';
    let yyM = '';
    if (yyC==='yp-kesin') yyM = 'Kararın <strong style="color:'+RC+'">KESİN</strong> olduğuna (HMK m.362)';
    else if (yyC==='yp-istinaf') yyM = 'Tebliğden itibaren <strong>2 hafta</strong> içinde <strong style="color:'+KC+'">İSTİNAF YOLU AÇIK</strong> olmak üzere';
    else yyM = 'Tebliğden itibaren <strong>2 hafta</strong> içinde <strong style="color:'+KC+'">İSTİNAF + TEMYİZ YOLU AÇIK</strong> olmak üzere';
    items.push('<div style="padding:6px 0;border-bottom:1px dotted #d4c5a0;font-size:12px;line-height:1.7"><strong>'+n+'.</strong> '+yyM+'</div>'); n++;
    items.push('<div style="font-weight:800;background:#f9f5ea;padding:8px 0;font-size:12px;border-radius:2px">Karar verildi. <span style="float:right;font-weight:400;color:#888">'+ktar+'</span></div>');
    return items.join('');
  } catch(e) {
    console.error('hukumKur:', e);
    return '<div style="color:red;font-size:11px">Hüküm oluşturma hatası: '+e.message+'</div>';
  }
}

function kararGuncelle() {
  try {
    const d = DAVALAR[gv('f-dava-turu')];
    const mhk = gv('f-mhk');
    const il = gv('f-il');
    sv('kk-mhk', mhk ? mhk.toUpperCase() + (il ? ' — ' + il.toUpperCase() : '') : '[ MAHKEME ADI ]');
    st('kk-esas', ': ' + (gv('f-esas')||'…'));
    st('kk-kno', ': ' + (gv('f-kno')||'…'));
    st('kk-hakim', ': ' + (gv('f-hakim')||'…') + (gv('f-sicil') ? ' (' + gv('f-sicil') + ')' : ''));
    st('kk-katip', ': ' + (gv('f-katip')||'…'));
    st('kk-tarih', ': ' + tarihFmt(gv('f-ktar')));
    const dav = gv('f-dav-ad'), dal = gv('f-dal-ad');
    st('kk-dav', ': ' + (dav||'…') + (gv('f-dav-tc') ? ' — TC: ' + gv('f-dav-tc') : ''));
    st('kk-dav-vek', ': ' + (gv('f-dav-vek')||'…'));
    st('kk-dal', ': ' + (dal||'…') + (gv('f-dal-tc') ? ' — TC: ' + gv('f-dal-tc') : ''));
    st('kk-dal-vek', ': ' + (gv('f-dal-vek')||'…'));
    st('kk-dava-ad', ': ' + ((d && d.ad)||'…'));
    const dd = parseFloat(gv('f-deger'));
    st('kk-deger', dd > 0 ? ': ' + fmt(dd) : ': …');
    const iddia = gv('f-iddia');
    sv('kk-iddia', iddia || '<span style="color:#bbb;font-style:italic;font-family:sans-serif;font-size:12px">← Gerekçe sekmesinden doldurun</span>');
    sv('kk-savunma', gv('f-savunma') || '');
    const grc = gv('f-gerekce');
    sv('kk-gerekce', grc || '<span style="color:#bbb;font-style:italic;font-family:sans-serif;font-size:12px">← Gerekçe sekmesinden doldurun</span>');
    st('kk-kanun', gv('f-kanun') || '—');
    sv('kk-hukum', hukumKur());
    st('kk-katip-imza', gv('f-katip')||'…');
    st('kk-tarih-imza', tarihFmt(gv('f-ktar')));
    st('kk-hakim-imza', (gv('f-hakim')||'…') + (gv('f-sicil') ? ' — ' + gv('f-sicil') : ''));
  } catch(e) { console.error('kararGuncelle:', e); }
}

function kararYazdir() {
  const el = document.getElementById('karar-kagit');
  if (!el) return;
  const w = window.open('','','width=950,height=800');
  w.document.write('<!DOCTYPE html><html><head><title>Karar</title>');
  w.document.write('<style>body{font-family:"Times New Roman",serif;margin:2cm;font-size:12.5px;line-height:1.9}.placeholder-txt{display:none}</style>');
  w.document.write('</head><body>'+el.innerHTML+'</body></html>');
  w.document.close(); setTimeout(()=>w.print(),400);
  toast('Yazdırma ekranı açıldı.','basari');
}

async function kararKaydetHP() {
  const veri = {
    tur:'karar', tarih:new Date().toISOString(),
    dava: DAVALAR[gv('f-dava-turu')]?.ad,
    davaci:gv('f-dav-ad'), davali:gv('f-dal-ad'),
    esas:gv('f-esas'), deger:gv('f-deger')
  };
  if (window.hukukAPI) {
    const r = await window.hukukAPI.dosyaKaydet({ icerik:veri });
    if (r.basarili) { toast('Karar kaydedildi!','basari'); belgeleYenile(); }
    else toast('Kayıt başarısız.','hata');
  } else { toast('Kaydedildi (önizleme modu).','bilgi'); }
}

function kararSifirla() {
  if (!confirm('Tüm alanlar sıfırlansın mı?')) return;
  document.querySelectorAll('#page-hakim input, #page-hakim select, #page-hakim textarea').forEach(el=>{
    if (el.type==='number'||el.type==='text'||el.type==='date') el.value='';
    else if (el.tagName==='TEXTAREA') el.value='';
  });
  HS = {};
  const ozel = document.getElementById('f-ozel-alan');
  if (ozel) ozel.innerHTML = '';
  kararGuncelle();
  toast('Sıfırlandı.','bilgi');
}

/* ══════════════════════════════════════════
   BÖLÜM 4 — KARAR ÖRNEKLERİ
══════════════════════════════════════════ */
let aktifOrnek = { ad:'Karar Örneği', html:'' };

function ornekListesiOlustur() {
  const liste = document.getElementById('ornek-liste');
  if (!liste) return;
  let html = '';
  for (const [kat, ornekler] of Object.entries(ORNEKLER)) {
    html += '<div class="ol-group"><h4>' + kat + '</h4>';
    for (const ad of Object.keys(ornekler)) {
        html += '<div class="ol-item" data-ornek="' + ad.replace(/"/g,'&quot;') + '">' + ad + '</div>';
    }
    html += '</div>';
  }
  liste.innerHTML = html;
}

function ornekGoster(ad) {
  try {
    document.querySelectorAll('.ol-item').forEach(el => el.classList.toggle('active', el.textContent === ad));
    const ic = document.getElementById('ornek-icerik');
    if (!ic) return;
    for (const ornekler of Object.values(ORNEKLER)) {
      if (ornekler[ad]) {
        const html = ornekler[ad]();
        aktifOrnek = { ad, html };
        ic.innerHTML = html;
        if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
          belgeModalAc(ad, html, 'ornek');
        }
        return;
      }
    }
    ic.innerHTML = '<div style="padding:20px;color:#999">Karar bulunamadı.</div>';
  } catch(e) {
    console.error('ornekGoster:', e);
    const ic = document.getElementById('ornek-icerik');
    if (ic) ic.innerHTML = '<div style="padding:20px;color:red">Hata: '+e.message+'</div>';
  }
}

function ornekPencereAc() {
  if (!aktifOrnek.html) { toast('Önce bir karar örneği seçin.','hata'); return; }
  belgeModalAc(aktifOrnek.ad, aktifOrnek.html, 'ornek');
}

function ornekWordIndir() {
  if (!aktifOrnek.html) { toast('Word için önce bir karar örneği seçin.','hata'); return; }
  belgeWordIndir(aktifOrnek.ad, aktifOrnek.html);
}

function ornekYazdir() {
  if (!aktifOrnek.html) { toast('Önce bir karar örneği seçin.','hata'); return; }
  belgePdfYazdir(aktifOrnek.ad, aktifOrnek.html);
}

/* ══════════════════════════════════════════
   BÖLÜM 5 — HESAPLAMA
══════════════════════════════════════════ */
function calcHarc() {
  try {
    const d = parseFloat(document.getElementById('c-deger')?.value)||0;
    const tur = document.getElementById('c-tur')?.value || 'nispi';
    const oran = parseFloat(document.getElementById('c-oran')?.value)||100;
    let nispi = 0;
    if (tur==='nispi') nispi = d*.06831;
    else if (tur==='maktu') nispi = 732;
    else if (tur==='tapu') nispi = d*.0455;
    else if (tur==='is') nispi = d*.0509;
    const pesin=nispi*.25, bakiye=nispi*.75, kabul=nispi*(oran/100);
    st('sh-nispi', fmt(nispi)); st('sh-pesin', fmt(pesin));
    st('sh-bakiye', fmt(bakiye)); st('sh-kabul', fmt(kabul)+' (%'+oran+' kabul)');
    const el = document.getElementById('s-harc');
    if (el) el.style.display = 'block';
    toast('Harç hesaplandı.','basari');
  } catch(e) { console.error('calcHarc:', e); }
}
function calcVekalet() {
  try {
    const kabul = parseFloat(document.getElementById('v-kabul')?.value)||0;
    const red = parseFloat(document.getElementById('v-red')?.value)||0;
    const mhk = document.getElementById('v-mhk')?.value || 'asliye';
    const tv = VEKALET[mhk] || VEKALET.asliye;
    const vD = kabul > 0 ? Math.max(calcNisbiVekalet(kabul), tv.m) : 0;
    const vDal = red > 0 ? Math.max(calcNisbiVekalet(red), tv.m) : 0;
    const net = vD - vDal;
    st('sv-dav', fmt(vD)); st('sv-dal', vDal>0 ? fmt(vDal) : '—');
    st('sv-net', fmt(net) + (net>=0 ? ' (Davacı lehine)' : ' (Davalı lehine)'));
    const el = document.getElementById('s-vekalet');
    if (el) el.style.display = 'block';
    toast('Vekâlet ücreti hesaplandı.','basari');
  } catch(e) { console.error('calcVekalet:', e); }
}
function calcInkar() {
  try {
    const tak = parseFloat(document.getElementById('i-takip')?.value)||0;
    if (!tak) { toast('Takip tutarı giriniz.','hata'); return; }
    st('si-tak', fmt(tak)); st('si-taz', fmt(tak*.2)+' (%20)'); st('si-top', fmt(tak*1.2));
    const el = document.getElementById('s-inkar');
    if (el) el.style.display = 'block';
    toast('İnkar tazminatı hesaplandı.','basari');
  } catch(e) { console.error('calcInkar:', e); }
}
function calcFaiz() {
  try {
    const ana = parseFloat(document.getElementById('faiz-ana')?.value)||0;
    const bas = document.getElementById('faiz-bas')?.value;
    const bit = document.getElementById('faiz-bit')?.value;
    if (!ana || !bas || !bit) { toast('Tüm alanları doldurun.','hata'); return; }
    const gun = Math.ceil((new Date(bit)-new Date(bas))/(1000*86400));
    if (gun <= 0) { toast('Bitiş tarihi başlangıçtan sonra olmalı.','hata'); return; }
    // 2026 faiz oranları: Yasal %24 (3095 s.K. m.1), Ticari/TCMB avans %36
    const oranlar = {yasal:.24, tcmb:.36, ticari:.36};
    const tur = document.getElementById('faiz-tur')?.value || 'yasal';
    const faiz = ana * (oranlar[tur]||.24) * (gun/365);
    st('sf-gun', gun+' gün'); st('sf-faiz', fmt(faiz)); st('sf-top', fmt(ana+faiz));
    const el = document.getElementById('s-faiz');
    if (el) el.style.display = 'block';
    toast('Faiz hesaplandı.','basari');
  } catch(e) { console.error('calcFaiz:', e); }
}
function calcSure() {
  try {
    const teblig = document.getElementById('sc-teblig')?.value;
    const gun = parseInt(document.getElementById('sc-yol')?.value)||14;
    if (!teblig) { toast('Tebliğ tarihi giriniz!','hata'); return; }
    const bitis = new Date(teblig); bitis.setDate(bitis.getDate()+gun);
    const bugun = new Date();
    const kalan = Math.ceil((bitis-bugun)/(1000*86400));
    const fmtD = d => d.toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric',weekday:'long'});
    const renk = kalan<0?RC:kalan<=3?'#b5451b':KC;
    const durum = kalan<0?'🚫 SÜRE DOLDU!':kalan===0?'⚠️ SON GÜN!':kalan+' gün kaldı ✅';
    const el = document.getElementById('sc-sonuc');
    if (el) {
      el.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:12px">'+
        '<div><strong>Tebliğ:</strong><br>'+fmtD(new Date(teblig))+'</div>'+
        '<div><strong>Son Gün:</strong><br><span style="color:#0c1f3f;font-weight:700">'+fmtD(bitis)+'</span></div>'+
        '<div><strong>Durum:</strong><br><span style="color:'+renk+';font-weight:700">'+durum+'</span></div></div>';
      el.style.display = 'block';
    }
  } catch(e) { console.error('calcSure:', e); }
}

/* ══════════════════════════════════════════
   BÖLÜM 6 — KAYITLI BELGELER
══════════════════════════════════════════ */
async function belgeleYenile() {
  const el = document.getElementById('belge-listesi');
  if (!el) return;
  if (!window.hukukAPI) {
    el.innerHTML = '<div style="color:#999;font-size:11px;grid-column:1/-1;padding:20px;text-align:center">Kayıt özelliği yalnızca kurulu Electron uygulamasında çalışır.</div>';
    return;
  }
  try {
    const dosyalar = await window.hukukAPI.dosyaListele();
    st('belge-say', dosyalar.length + ' Belge');
    if (dosyalar.length === 0) {
      el.innerHTML = '<div style="color:#999;font-size:11px;grid-column:1/-1;padding:20px;text-align:center">Henüz kayıtlı belge yok.</div>';
      return;
    }
    el.innerHTML = dosyalar.map(d => {
      const tar = new Date(d.tarih).toLocaleDateString('tr-TR');
      return '<div class="dash-card" style="text-align:left;align-items:flex-start;cursor:default">'+
        '<div style="font-size:22px;margin-bottom:6px">📄</div>'+
        '<div style="font-size:11px;font-weight:700;color:#0c1f3f">'+d.ad+'</div>'+
        '<div style="font-size:9px;color:#6b6070;margin-top:3px">'+tar+'</div>'+
        '</div>';
    }).join('');
  } catch(e) { el.innerHTML = '<div style="color:red;font-size:11px">Listeleme hatası.</div>'; }
}

/* ══════════════════════════════════════════
   BAŞLATMA
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Şablon ve örnek listeleri
    sablonListesiOlustur();
    ornekListesiOlustur();

    // Karar yazım sistemi başlat
    davaTuruSec();

    // Bugünün tarihini varsayılan yap
    const bugun = new Date().toISOString().split('T')[0];
    ['f-ktar','faiz-bas','faiz-bit'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = bugun;
    });

    kararGuncelle();
    belgeleYenile();

    // Dilekçe istatistikleri
    const dtxt = document.getElementById('dilekce-text');
    if (dtxt) dtxt.addEventListener('input', dilekceIstatistik);

    // Electron IPC
    if (window.hukukAPI) {
      window.hukukAPI.getVersion().then(v => {
        if (v) st('sb-ver', 'Hukuk Pro v'+v+' — 2024');
      }).catch(()=>{});

      window.hukukAPI.onMenuAction((action, data) => {
        const aktif = document.querySelector('.page.active')?.id;
        switch(action) {
          case 'yeni-dilekce': showPage('dilekce'); setTimeout(dilekceTemizle, 100); break;
          case 'yeni-karar': showPage('hakim'); setTimeout(kararSifirla, 100); break;
          case 'kaydet':
            if (aktif==='page-dilekce') dilekceKaydet();
            else if (aktif==='page-hakim') kararKaydetHP();
            break;
          case 'yazdir':
            if (aktif==='page-dilekce') dilekceYazdir();
            else if (aktif==='page-hakim') kararYazdir();
            else ornekYazdir();
            break;
          case 'modul-anasayfa': showPage('anasayfa'); break;
          case 'modul-dilekce': showPage('dilekce'); break;
          case 'modul-hakim': showPage('hakim'); break;
          case 'modul-karar': showPage('ornekler'); break;
          case 'modul-hesaplama': showPage('hesaplama'); break;
          case 'modul-yargi': showPage('ustyargi'); break;
          case 'kilavuz': showPage('anasayfa'); break;
        }
      });
    }
    console.log('✅ Hukuk Pro başarıyla yüklendi.');
  } catch(e) {
    console.error('❌ Başlatma hatası:', e);
  }
});

/* ══════════════════════════════════════════
   EVENT BAĞLAMALARI — Tüm butonlar burada
   (Hiçbir onclick HTML'de yok!)
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Sidebar navigasyon ── */
  document.querySelectorAll('.sb-item[data-page]').forEach(el => {
    el.addEventListener('click', () => showPage(el.dataset.page));
  });

  /* ── Dashboard kartları ── */
  const dcMap = {
    'dc-dilekce':'dilekce','dc-hakim':'hakim','dc-ornekler':'ornekler',
    'dc-hesaplama':'hesaplama','dc-ustyargi':'ustyargi','dc-kayitli':'kayitli'
  };
  Object.entries(dcMap).forEach(([id,page]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => showPage(page));
  });

  /* ── Ana sayfa butonları ── */
  const btnYeniDilekceAna = document.getElementById('btn-yeni-dilekce-ana');
  if (btnYeniDilekceAna) btnYeniDilekceAna.addEventListener('click', () => { showPage('dilekce'); setTimeout(dilekceTemizle,100); });
  const btnYeniKararAna = document.getElementById('btn-yeni-karar-ana');
  if (btnYeniKararAna) btnYeniKararAna.addEventListener('click', () => { showPage('hakim'); setTimeout(kararSifirla,100); });

  /* ── Dilekçe butonları ── */
  ['btn-dl-yazdir','btn-dl-yazdir2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', dilekceYazdir);
  });
  ['btn-dl-pencere','btn-dl-pencere2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', dilekcePencereAc);
  });
  ['btn-dl-word','btn-dl-word2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', dilekceWordIndir);
  });
  ['btn-dl-kaydet','btn-dl-kaydet2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', dilekceKaydet);
  });
  const btnDlTemizle = document.getElementById('btn-dl-temizle');
  if (btnDlTemizle) btnDlTemizle.addEventListener('click', dilekceTemizle);
  const btnDlKopyala = document.getElementById('btn-dl-kopyala');
  if (btnDlKopyala) btnDlKopyala.addEventListener('click', dilekceKopyala);

  /* ── Dilekçe toolbar "Ekle" butonları ── */
  document.querySelectorAll('.tb-btn[data-ekle]').forEach(el => {
    el.addEventListener('click', () => ekleMetin(el.dataset.ekle));
  });

  /* ── Şablon arama ── */
  const sablonAraEl = document.getElementById('sablon-ara');
  if (sablonAraEl) sablonAraEl.addEventListener('input', () => sablonAra(sablonAraEl.value));

  /* ── Hâkim karar butonları ── */
  const btnHkYazdir = document.getElementById('btn-hk-yazdir');
  if (btnHkYazdir) btnHkYazdir.addEventListener('click', kararYazdir);
  const btnHkKaydet = document.getElementById('btn-hk-kaydet');
  if (btnHkKaydet) btnHkKaydet.addEventListener('click', kararKaydetHP);
  const btnHkSifirla = document.getElementById('btn-hk-sifirla');
  if (btnHkSifirla) btnHkSifirla.addEventListener('click', kararSifirla);

  /* ── Form tabs ── */
  document.querySelectorAll('.ftab[data-ftab]').forEach(el => {
    el.addEventListener('click', () => formTab(parseInt(el.dataset.ftab)));
  });

  /* ── Karar form live update ── */
  const kararInputIds = ['f-mhk','f-il','f-esas','f-kno','f-ktar','f-hakim','f-sicil','f-katip',
    'f-dav-ad','f-dav-tc','f-dav-vek','f-dal-ad','f-dal-tc','f-dal-vek',
    'f-faiz','f-deger','f-kabul','f-bilirkisi','f-iddia','f-savunma','f-gerekce','f-kanun'];
  kararInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', kararGuncelle);
  });

  /* ── Dava türü + mahkeme türü değişikliği ── */
  const fDavaTuru = document.getElementById('f-dava-turu');
  if (fDavaTuru) fDavaTuru.addEventListener('change', () => { davaTuruSec(); kararGuncelle(); });
  const fMhkTur = document.getElementById('f-mhk-tur');
  if (fMhkTur) fMhkTur.addEventListener('change', () => { hesaplaKarar(); kararGuncelle(); });

  /* ── Karar değer alanları ── */
  ['f-deger','f-kabul','f-bilirkisi'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', hesaplaKarar);
  });

  /* ── Karar örnekleri ── */
  const btnOrnYazdir = document.getElementById('btn-orn-yazdir');
  if (btnOrnYazdir) btnOrnYazdir.addEventListener('click', ornekYazdir);
  const btnOrnPencere = document.getElementById('btn-orn-pencere');
  if (btnOrnPencere) btnOrnPencere.addEventListener('click', ornekPencereAc);
  const btnOrnWord = document.getElementById('btn-orn-word');
  if (btnOrnWord) btnOrnWord.addEventListener('click', ornekWordIndir);

  const docClose = document.getElementById('doc-close');
  if (docClose) docClose.addEventListener('click', belgeModalKapat);
  const docWord = document.getElementById('doc-word');
  if (docWord) docWord.addEventListener('click', () => belgeWordIndir());
  const docPdf = document.getElementById('doc-pdf');
  if (docPdf) docPdf.addEventListener('click', () => belgePdfYazdir());
  const docPopup = document.getElementById('doc-popup');
  if (docPopup) docPopup.addEventListener('click', () => belgePencereAc());
  const docModal = document.getElementById('doc-modal');
  if (docModal) docModal.addEventListener('click', e => { if (e.target === docModal) belgeModalKapat(); });
  suruklenebilirOnizleme();

  /* ── Hesaplama butonları ── */
  const hCalcMap = {
    'btn-calc-harc': calcHarc,
    'btn-calc-vekalet': calcVekalet,
    'btn-calc-inkar': calcInkar,
    'btn-calc-faiz': calcFaiz,
    'btn-calc-sure': calcSure
  };
  Object.entries(hCalcMap).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  });

  /* ── Kayıtlı belgeler ── */
  const btnBelgeYenile = document.getElementById('btn-belge-yenile');
  if (btnBelgeYenile) btnBelgeYenile.addEventListener('click', belgeleYenile);
  const btnBelgeKlasor = document.getElementById('btn-belge-klasor');
  if (btnBelgeKlasor) btnBelgeKlasor.addEventListener('click', () => window.hukukAPI?.klasorAc());
  const btnKlasor = document.getElementById('btn-klasor');
  if (btnKlasor) btnKlasor.addEventListener('click', () => window.hukukAPI?.klasorAc());

  console.log('✅ Tüm event listener\'lar bağlandı.');
});

/* ── Event Delegation: Şablon ve Örnek listesi tıklamaları ── */
document.addEventListener('DOMContentLoaded', () => {

  // Şablon listesi - event delegation
  const sablonListesiEl = document.getElementById('sablon-listesi');
  if (sablonListesiEl) {
    sablonListesiEl.addEventListener('click', (e) => {
      const item = e.target.closest('[data-sablon]');
      if (item) sablonSec(item.dataset.sablon);
    });
  }

  // Örnek listesi - event delegation
  const ornekListesiEl = document.getElementById('ornek-liste');
  if (ornekListesiEl) {
    ornekListesiEl.addEventListener('click', (e) => {
      const item = e.target.closest('[data-ornek]');
      if (item) ornekGoster(item.dataset.ornek);
    });
  }

});
