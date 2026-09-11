/* ============================================================
   HUKUK PRO v1.0.2 — Ana Uygulama JavaScript
   ============================================================ */
'use strict';

/* ---------- Kısayollar ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------- Uygulama Durumu ---------- */
const App = {
  aktifSayfa: 'anasayfa',
  aktifSablon: null,
  kararlar: [],
  dilekceler: [],
  sonIslemler: []
};

/* ---------- Yardımcılar ---------- */
function toast(mesaj, tur = 'bilgi') {
  const t = document.createElement('div');
  t.className = 'toast';
  const renk = { bilgi:'#0c1f3f', basari:'#1e5c3a', hata:'#7a1a1a', uyari:'#8a6000' };
  t.style.background = renk[tur] || renk.bilgi;
  t.textContent = mesaj;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2400);
}

function tlFormat(n) {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

function tarihFormat(d) {
  if (!d) return '—';
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('tr-TR');
}

function tarihUzun(d) {
  if (!d) return '…';
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt)) return '…';
  const aylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return `${dt.getDate()} ${aylar[dt.getMonth()]} ${dt.getFullYear()}`;
}

function bugun() { return new Date().toISOString().split('T')[0]; }
function sayiDegeri(el) { const v = parseFloat(el && el.value); return isFinite(v) ? v : 0; }
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---------- localStorage ---------- */
const STORE_KEY = 'hukukpro_v1';

function storeYukle() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    App.kararlar    = d.kararlar    || [];
    App.dilekceler  = d.dilekceler  || [];
    App.sonIslemler = d.sonIslemler || [];
  } catch (e) { console.warn('Kayıt okunamadı', e); }
}

function storeKaydet() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      kararlar: App.kararlar,
      dilekceler: App.dilekceler,
      sonIslemler: App.sonIslemler.slice(0, 10)
    }));
  } catch (e) { console.warn('Kayıt yapılamadı', e); }
}

function islemEkle(tur, ad) {
  App.sonIslemler.unshift({ tur, ad, tarih: new Date().toISOString() });
  App.sonIslemler = App.sonIslemler.slice(0, 10);
  storeKaydet();
}

/* ---------- Sayfa Geçişi ---------- */
function sayfaAc(id) {
  $$('.page').forEach(p => p.classList.remove('active'));
  const hedef = $('#page-' + id);
  if (hedef) hedef.classList.add('active');

  $$('.sb-item').forEach(i => i.classList.remove('active'));
  const nav = $(`.sb-item[data-page="${id}"]`);
  if (nav) nav.classList.add('active');

  App.aktifSayfa = id;
  const basliklar = {
    anasayfa:'Ana Sayfa', dilekce:'Dilekçe Yazma', hakim:'Hâkim Karar Yazım',
    ornekler:'Karar Örnekleri', hesaplama:'Hesaplama', ustyargi:'Üst Yargı',
    kayitli:'Kayıtlı Belgeler'
  };
  const sb = $('#sb-aktif'); if (sb) sb.textContent = basliklar[id] || id;

  if (id === 'kayitli') belgeListesiYenile();
  if (id === 'anasayfa') anasayfaYenile();

  const side = $('#sidebar');
  if (side) side.classList.remove('open');
}

/* ============================================================
   DİLEKÇE ŞABLONLARI
   ============================================================ */
const SABLONLAR = [
  { k:'İcra Hukuku', a:'İtirazın İptali Davası',
    m:`İSTANBUL [  ] ASLİYE HUKUK MAHKEMESİ'NE

DAVACI   : [Ad Soyad / Unvan]
VEKİLİ   : Av. [Ad Soyad] — [Adres]
DAVALI   : [Ad Soyad / Unvan] — [Adres]

KONU     : İtirazın iptali ve icra inkâr tazminatı talebimizden ibarettir.

AÇIKLAMALAR :
1- Müvekkilimiz ile davalı arasında [tarih] tarihli [sözleşme/ilişki] nedeniyle davalı borçlu, müvekkilimize [tutar] TL borçlanmıştır.
2- Alacağın tahsili amacıyla [icra müdürlüğü]'nün [esas] sayılı dosyası ile takip başlatılmış; davalı borçlu [tarih] tarihinde haksız ve kötüniyetli olarak borca itiraz etmiştir.
3- İtiraz üzerine takip durmuş olup, davalının itirazı haksızdır.

HUKUKİ NEDENLER : İİK m.67 ve ilgili mevzuat.
DELİLLER         : İcra dosyası, sözleşme, faturalar, ticari defterler, tanık, yemin, bilirkişi.

SONUÇ VE İSTEM :
Yukarıda açıklanan nedenlerle davalının haksız itirazının İPTALİNE, takibin devamına, alacağın %20'sinden az olmamak üzere icra inkâr tazminatına hükmedilmesine, yargılama giderleri ve vekâlet ücretinin davalıya yükletilmesine karar verilmesini saygılarımla talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'İcra Hukuku', a:'Menfi Tespit Davası',
    m:`[  ] ASLİYE HUKUK MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Ad Soyad]

KONU   : Menfi tespit talebimizden ibarettir.

AÇIKLAMALAR :
1- Davalı tarafından müvekkilimiz aleyhine [icra müdürlüğü]'nün [esas] sayılı dosyası ile [tutar] TL üzerinden takip başlatılmıştır.
2- Müvekkilimizin davalıya [sebep] nedeniyle herhangi bir borcu bulunmamaktadır.
3- Takibin haksız olması nedeniyle müvekkilimizin borçlu olmadığının tespiti gerekmektedir.

HUKUKİ NEDENLER : İİK m.72 ve ilgili mevzuat.
DELİLLER : İcra dosyası, sözleşme, ödeme belgeleri, tanık, bilirkişi.

SONUÇ VE İSTEM :
Müvekkilimizin davalıya borçlu olmadığının tespitine, takibin iptaline, kötüniyet tazminatına, yargılama giderleri ve vekâlet ücretinin davalıya yükletilmesine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'İcra Hukuku', a:'İtirazın Kaldırılması Talebi',
    m:`[  ] İCRA HUKUK MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Ad Soyad]

KONU   : İtirazın kaldırılması ve icra inkâr tazminatı talebimizden ibarettir.

AÇIKLAMALAR :
1- [İcra müdürlüğü]'nün [esas] sayılı dosyası ile davalı aleyhine [tutar] TL alacağın tahsili amacıyla takip başlatılmıştır.
2- Borçlu [tarih] tarihinde haksız olarak borca itiraz etmiştir.
3- Alacağımız [senet/sözleşme/İİK m.68 belgesi] ile sabittir.

HUKUKİ NEDENLER : İİK m.68 ve ilgili mevzuat.
DELİLLER : İcra dosyası, belgeler.

SONUÇ VE İSTEM :
İtirazın KALDIRILMASINA, takibin devamına, %20'den az olmamak üzere icra inkâr tazminatına hükmedilmesine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Aile Hukuku', a:'Anlaşmalı Boşanma Dilekçesi',
    m:`[  ] AİLE MAHKEMESİ'NE

DAVACI : [Ad Soyad] — T.C. [  ]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Ad Soyad] — T.C. [  ]
VEKİLİ : Av. [Ad Soyad]

KONU   : Anlaşmalı boşanma talebimizden ibarettir.

AÇIKLAMALAR :
1- Taraflar [tarih] tarihinde evlenmiş olup, TMK m.166/3 kapsamında en az bir yıl süren evliliklerinde anlaşmalı olarak boşanma kararı almışlardır.
2- Taraflar arasında aşağıdaki hususlarda mutabakat sağlanmıştır:
   a) [Velayet / nafaka / tazminat / mal paylaşımı düzenlemeleri]
   b) [Diğer anlaşma hususları]
3- Tarafların beyanı ve sunulan protokol çerçevesinde boşanmalarına karar verilmesi talep olunmaktadır.

HUKUKİ NEDENLER : TMK m.166/3, HMK ve ilgili mevzuat.
DELİLLER : Nüfus kayıtları, evlilik cüzdanı, anlaşma protokolü, tanık.

SONUÇ VE İSTEM :
Tarafların ANLAŞMALI OLARAK BOŞANMALARINA, protokol doğrultusunda gerekli düzenlemelerin yapılmasına karar verilmesini saygılarımla talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Aile Hukuku', a:'Çekişmeli Boşanma Dilekçesi',
    m:`[  ] AİLE MAHKEMESİ'NE

DAVACI : [Ad Soyad] — T.C. [  ]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Ad Soyad] — T.C. [  ]

KONU   : Boşanma, velayet, nafaka ve tazminat talebimizden ibarettir.

AÇIKLAMALAR :
1- Taraflar [tarih] tarihinde evlenmişlerdir. Evlilik birliği [sebep] nedeniyle temelinden sarsılmıştır.
2- Davalının [kusurlu davranışlar] evlilik birliğinin devamını çekilmez hale getirmiştir.
3- Müvekkilimizin [çocuk sayısı] adet müşterek çocuğu bulunmaktadır.

HUKUKİ NEDENLER : TMK m.161, 166, 174, 175 ve ilgili mevzuat.
DELİLLER : Nüfus kaydı, tanık beyanları, mesaj kayıtları, sosyal inceleme raporu.

SONUÇ VE İSTEM :
Tarafların BOŞANMALARINA, müşterek çocukların velayetinin müvekkilimize verilmesine, çocuklar için [tutar] TL tedbir/iştirak nafakasına, müvekkilimiz lehine [tutar] TL maddi ve [tutar] TL manevi tazminata, yoksulluk nafakasına, yargılama giderleri ve vekâlet ücretinin davalıya yükletilmesine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Aile Hukuku', a:'Nafaka Artırım Davası',
    m:`[  ] AİLE MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Ad Soyad]

KONU   : Nafaka artırım talebimizden ibarettir.

AÇIKLAMALAR :
1- [Mahkeme] [esas] sayılı kararla müvekkilimize aylık [tutar] TL nafaka bağlanmıştır.
2- Aradan geçen süre içinde ekonomik koşullar, enflasyon ve ihtiyaçlar önemli ölçüde artmıştır.
3- Mevcut nafaka miktarı ihtiyaçları karşılamaktan uzaktır.

HUKUKİ NEDENLER : TMK m.176 vd. ve ilgili mevzuat.
DELİLLER : İlam, gelir belgeleri, gider belgeleri, tanık.

SONUÇ VE İSTEM :
Nafakanın aylık [yeni tutar] TL'ye çıkarılmasına karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Tazminat', a:'Maddi ve Manevi Tazminat Davası',
    m:`[  ] ASLİYE HUKUK MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Ad Soyad / Kurum]

KONU   : Maddi ve manevi tazminat talebimizden ibarettir.

AÇIKLAMALAR :
1- [Tarih] tarihinde meydana gelen [olay] nedeniyle müvekkilimiz [zarar] zararına uğramıştır.
2- Olay davalının [kusurlu davranışı] nedeniyle gerçekleşmiştir.
3- Müvekkilimizin maddi zararı [tutar] TL olup, ayrıca duyduğu elem ve ızdırap nedeniyle manevi tazminat talep etme hakkı doğmuştur.

HUKUKİ NEDENLER : TBK m.49, 50, 51, 56 ve ilgili mevzuat.
DELİLLER : Kaza tutanağı, hastane kayıtları, bilirkişi, tanık, tanık beyanları.

SONUÇ VE İSTEM :
[tutar] TL maddi ve [tutar] TL manevi tazminatın olay tarihinden itibaren işleyecek yasal faizi ile birlikte davalıdan alınarak müvekkilimize verilmesine, yargılama giderleri ve vekâlet ücretinin davalıya yükletilmesine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Tazminat', a:'Destekten Yoksun Kalma Tazminatı',
    m:`[  ] ASLİYE HUKUK MAHKEMESİ'NE

DAVACI : [Ad Soyad] (destek gören)
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Ad Soyad / Kurum]

KONU   : Destekten yoksun kalma tazminatı talebimizden ibarettir.

AÇIKLAMALAR :
1- [Tarih] tarihinde vefat eden [muris adı], müvekkilimizin [yakınlık derecesi] olup müvekkilimize destek sağlamaktaydı.
2- Ölüm, davalının [kusurlu davranışı] sonucu meydana gelmiştir.
3- Müvekkilimiz, desteğini yitirmesi nedeniyle maddi zarara uğramıştır.

HUKUKİ NEDENLER : TBK m.53, 55 ve ilgili mevzuat.
DELİLLER : Veraset ilamı, nüfus kayıtları, gelir belgeleri, bilirkişi.

SONUÇ VE İSTEM :
[tutar] TL destekten yoksun kalma tazminatının olay tarihinden itibaren işleyecek yasal faizi ile birlikte davalıdan alınarak müvekkilimize verilmesine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'İş Hukuku', a:'Kıdem ve İhbar Tazminatı Davası',
    m:`[  ] İŞ MAHKEMESİ'NE

DAVACI : [Ad Soyad] — T.C. [  ]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Şirket Adı]

KONU   : Kıdem, ihbar tazminatı, yıllık izin ve ücret alacaklarımızın tahsili talebimizden ibarettir.

AÇIKLAMALAR :
1- Müvekkilimiz [tarih] — [tarih] tarihleri arasında davalı işyerinde [görev] olarak çalışmıştır.
2- İş sözleşmesi davalı işveren tarafından [sebep] ile feshedilmiştir.
3- Müvekkilimizin kıdem ve ihbar tazminatı, yıllık izin ücreti, fazla mesai ve diğer işçilik alacakları ödenmemiştir.

HUKUKİ NEDENLER : 4857 s. İş Kanunu, 6098 s. TBK ve ilgili mevzuat.
DELİLLER : İşe giriş bildirgesi, hizmet dökümü, tanık, bilirkişi, SGK kayıtları.

SONUÇ VE İSTEM :
Kıdem tazminatı, ihbar tazminatı, yıllık izin ücreti, fazla mesai ve diğer işçilik alacaklarının en yüksek banka mevduat faizi ile birlikte davalıdan alınarak müvekkilimize verilmesine, yargılama giderleri ve vekâlet ücretinin davalıya yükletilmesine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'İş Hukuku', a:'İşe İade Davası',
    m:`[  ] İŞ MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Şirket Adı]

KONU   : Feshin geçersizliği ve işe iade talebimizden ibarettir.

AÇIKLAMALAR :
1- Müvekkilimiz [tarih] tarihinden itibaren davalı işyerinde çalışmakta iken [tarih] tarihinde işten çıkarılmıştır.
2- İş sözleşmesi geçerli bir sebep gösterilmeksizin feshedilmiştir.
3- Arabuluculuk görüşmelerinden sonuç alınamamıştır.

HUKUKİ NEDENLER : 4857 s. İş K. m.18-21 ve ilgili mevzuat.
DELİLLER : Arabuluculuk tutanağı, işyeri kayıtları, tanık, bilirkişi.

SONUÇ VE İSTEM :
Feshin GEÇERSİZLİĞİNE, müvekkilimin İŞE İADESİNE, 4 aylık boşta geçen süre ücreti ve işe başlatmama tazminatının davalıdan tahsiline karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'İş Hukuku', a:'Mobbing (Psikolojik Taciz) Davası',
    m:`[  ] İŞ MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Şirket Adı]

KONU   : Mobbing nedeniyle maddi ve manevi tazminat talebimizden ibarettir.

AÇIKLAMALAR :
1- Müvekkilimiz davalı işyerinde çalışmakta iken [tarih] tarihleri arasında sistematik olarak psikolojik tacize maruz kalmıştır.
2- Davalı işveren, [davranışlar] ile müvekkilimizin kişilik haklarını ihlal etmiştir.
3- Bu nedenle müvekkilimiz [tarih] tarihinde iş akdini haklı sebeple feshetmiştir.

HUKUKİ NEDENLER : 4857 s. İş K., TBK m.49, 56 ve ilgili mevzuat.
DELİLLER : Tanık beyanları, mesaj/e-posta kayıtları, sağlık raporları, bilirkişi.

SONUÇ VE İSTEM :
Mobbing nedeniyle [tutar] TL maddi ve [tutar] TL manevi tazminatın davalıdan alınarak müvekkilimize verilmesine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Taşınmaz', a:'Tapu İptali ve Tescil Davası',
    m:`[  ] ASLİYE HUKUK MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]

KONU   : Tapu iptali ve tescil talebimizden ibarettir.

AÇIKLAMALAR :
1- [İl/İlçe] [ada/parsel] sayılı taşınmaz, [sebep — miras/satış/bağış] nedeniyle müvekkilimize ait olmasına rağmen davalı adına kayıtlıdır.
2- Tapu kaydı gerçek hukuki durumu yansıtmamaktadır.
3- Müvekkilimizin taşınmaz üzerindeki hakkı [belge] ile sabittir.

HUKUKİ NEDENLER : TMK m.683, 705, 713 ve ilgili mevzuat.
DELİLLER : Tapu kaydı, vergi kayıtları, tanık, keşif, bilirkişi, harita.

SONUÇ VE İSTEM :
Dava konusu taşınmazın tapu kaydının İPTALİ ile müvekkilimiz adına TESCİLİNE, yargılama giderleri ve vekâlet ücretinin davalıya yükletilmesine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Taşınmaz', a:'Ortaklığın Giderilmesi (İzale-i Şuyu)',
    m:`[  ] SULH HUKUK MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Ad Soyad] ve diğerleri

KONU   : Ortaklığın giderilmesi (izale-i şuyu) talebimizden ibarettir.

AÇIKLAMALAR :
1- Taraflar, [il/ilçe] [ada/parsel] sayılı taşınmazda [hisse oranı] hisse ile paydaştır.
2- Taşınmaz üzerinde taraflar arasında fiili paylaşım sağlanamamıştır.
3- Ortaklığın aynen taksim yoluyla giderilmesi mümkün bulunmamaktadır.

HUKUKİ NEDENLER : TMK m.698-700, 701 ve ilgili mevzuat.
DELİLLER : Tapu kaydı, veraset ilamı, keşif, bilirkişi.

SONUÇ VE İSTEM :
Ortaklığın SATIŞ YOLUYLA GİDERİLMESİNE, satış bedelinin paylar oranında taraflara dağıtılmasına karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Taşınmaz', a:'Ecrimisil (İşgal Tazminatı) Davası',
    m:`[  ] ASLİYE HUKUK MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Ad Soyad]

KONU   : Ecrimisil (işgal tazminatı) talebimizden ibarettir.

AÇIKLAMALAR :
1- Müvekkilimize ait [taşınmaz bilgisi], davalı tarafından [tarih] tarihinden itibaren haksız olarak işgal edilmektedir.
2- Davalının işgali nedeniyle müvekkilimiz taşınmazdan yararlanamamaktadır.
3- Müvekkilimizin [tutar] TL ecrimisil alacağı doğmuştur.

HUKUKİ NEDENLER : TMK m.995, TBK m.49, 50 ve ilgili mevzuat.
DELİLLER : Tapu kaydı, keşif, bilirkişi, tanık.

SONUÇ VE İSTEM :
[tutar] TL ecrimisilin yasal faizi ile birlikte davalıdan alınarak müvekkilimize verilmesine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Tüketici', a:'Ayıplı Mal Nedeniyle Bedel İadesi',
    m:`[  ] TÜKETİCİ MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [Satıcı/Üretici]

KONU   : Ayıplı mal nedeniyle bedel iadesi ve tazminat talebimizden ibarettir.

AÇIKLAMALAR :
1- Müvekkilimiz [tarih] tarihinde davalıdan [ürün] satın almıştır.
2- Ürün [ayıp] nedeniyle ayıplı çıkmış, satıcıya [tarih] tarihinde bildirim yapılmıştır.
3- Ayıp giderilmediğinden müvekkilimizin sözleşmeden dönme hakkı doğmuştur.

HUKUKİ NEDENLER : 6502 s. TKHK m.8-15 ve ilgili mevzuat.
DELİLLER : Fatura, servis kayıtları, bilirkişi, tanık.

SONUÇ VE İSTEM :
Sözleşmeden DÖNME hakkımızın kullanılmasına, ödenen [tutar] TL'nin iadesine, ayıp nedeniyle uğranılan [tutar] TL zararın tazminine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Tüketici', a:'Tüketici Hakem Heyeti Başvurusu',
    m:`[  ] TÜKETİCİ HAKEM HEYETİ'NE

BAŞVURAN : [Ad Soyad] — T.C. [  ]
ADRES    : [Adres]
KARŞI TARAF : [Şirket Adı]

KONU     : [tutar] TL alacağın tahsili talebimizden ibarettir.

AÇIKLAMALAR :
1- [Tarih] tarihinde karşı taraftan [ürün/hizmet] satın alınmıştır.
2- [Sorun/ayıp] nedeniyle karşı tarafa başvurulmuş ancak sonuç alınamamıştır.
3- Alacağımız [tutar] TL olup yasal sınır dahilindedir.

DELİLLER : Fatura, yazışmalar, servis kayıtları.

SONUÇ VE İSTEM :
[tutar] TL alacağın yasal faizi ile birlikte karşı taraftan tahsiline karar verilmesini talep ederim. [Tarih]

Başvuran
[Ad Soyad]`},

  { k:'İdare Hukuku', a:'İptal Davası Dilekçesi',
    m:`[  ] İDARE MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [İdare Adı]

KONU   : [Tarih] tarihli [işlem] işleminin iptali talebimizden ibarettir.

AÇIKLAMALAR :
1- Davalı idarenin [tarih] tarihli [işlem] işlemi müvekkilimizin hukuki menfaatini ihlal etmektedir.
2- İşlem [yetki/şekil/sebep/konu/maksat] yönünden hukuka aykırıdır.
3- İşlemin uygulanması halinde telafisi güç zararlar doğacaktır.

HUKUKİ NEDENLER : 2577 s. İYUK ve ilgili mevzuat.
DELİLLER : İşlem dosyası, idari başvuru kayıtları, tanık, keşif.

SONUÇ VE İSTEM :
Dava konusu işlemin İPTALİNE, YÜRÜTMENİN DURDURULMASINA, yargılama giderleri ve vekâlet ücretinin davalı idareye yükletilmesine karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'İdare Hukuku', a:'Tam Yargı Davası',
    m:`[  ] İDARE MAHKEMESİ'NE

DAVACI : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
DAVALI : [İdare Adı]

KONU   : Maddi ve manevi tazminat talebimizden ibarettir.

AÇIKLAMALAR :
1- Davalı idarenin [işlem/eylem] nedeniyle müvekkilimiz zarara uğramıştır.
2- Zarar, idarenin hizmet kusuru sonucu meydana gelmiştir.
3- İdareye [tarih] tarihinde başvurulmuş, sonuç alınamamıştır.

HUKUKİ NEDENLER : 2577 s. İYUK m.12-13 ve ilgili mevzuat.
DELİLLER : İdari başvuru kayıtları, bilirkişi, tanık.

SONUÇ VE İSTEM :
[tutar] TL maddi ve [tutar] TL manevi tazminatın yasal faizi ile birlikte davalı idareden tahsiline karar verilmesini talep ederim. [Tarih]

Davacı Vekili
Av. [Ad Soyad]`},

  { k:'Ceza', a:'Suç Duyurusu / Şikâyet Dilekçesi',
    m:`[  ] CUMHURİYET BAŞSAVCILIĞI'NA

MÜŞTEKİ : [Ad Soyad] — T.C. [  ]
ADRES    : [Adres]
ŞÜPHELİ  : [Ad Soyad / Bilinmiyor]

KONU     : [Suç türü] suçundan şikâyetimizden ibarettir.

AÇIKLAMALAR :
1- [Tarih] tarihinde [yer]'de şüpheli tarafından müşteki aleyhine [suç] işlenmiştir.
2- Olay [tanık/delil] ile sabittir.
3- Şüphelinin cezalandırılması için işbu şikâyetimizi sunuyoruz.

DELİLLER : Tanık beyanları, kamera kayıtları, mesaj kayıtları, sağlık raporu.

SONUÇ VE İSTEM :
Şüpheli hakkında gerekli SORUŞTURMANIN YAPILMASINA ve kamu davası açılmasına karar verilmesini talep ederim. [Tarih]

Müşteki
[Ad Soyad]`},

  { k:'Ceza', a:'İstinaf Dilekçesi (Ceza)',
    m:`[  ] BÖLGE ADLİYE MAHKEMESİ'NE

İSTİNAF EDEN (Sanık) : [Ad Soyad]
VEKİLİ : Av. [Ad Soyad]
KARAR   : [Mahkeme] [esas/karar] sayılı karar

KONU    : İstinaf talebimizden ibarettir.

AÇIKLAMALAR :
1- [Mahkeme]'nin [tarih] tarihli kararı usul ve yasaya aykırıdır.
2- Deliller takdirinde isabetsizlik yapılmıştır. [Detay]
3- Kararın kaldırılması ve yeniden yargılama yapılması gerekmektedir.

HUKUKİ NEDENLER : 5271 s. CMK m.272-285 ve ilgili mevzuat.

SONUÇ VE İSTEM :
Kararın KALDIRILMASINA, sanığın beraatine ya da yeniden yargılama yapılmasına karar verilmesini talep ederim. [Tarih]

İstinaf Eden Vekili
Av. [Ad Soyad]`},

  { k:'Diğer', a:'İhtarname',
    m:`NOTERLİK İHTARNAME

İHTAR EDEN : [Ad Soyad] — [Adres]
İHTAR EDİLEN : [Ad Soyad] — [Adres]

KONU : [Konu]

AÇIKLAMA :
1- [Tarih] tarihinde tarafımızla tarafınız arasında [ilişki/sözleşme] kurulmuştur.
2- Tarafınızca [yükümlülük] yerine getirilmemiştir.
3- İşbu ihtarname ile [süre] gün içinde [yükümlülük] yerine getirmenizi, aksi halde yasal yollara başvuracağımızı ihtar ederiz.

İHTAR EDEN
[Ad Soyad]`},

  { k:'Diğer', a:'Vekâletname (Genel)',
    m:`VEKÂLETNAME

VEKİL EDEN : [Ad Soyad] — T.C. [  ] — [Adres]
VEKİL      : Av. [Ad Soyad] — TBB [  ] — [Adres]

Yukarıda yazılı vekilimi; her türlü dava, takip, işlem ve sözleşmelerde tarafımı temsile, dava açmaya, açılmış davaları takip etmeye, feragat, kabul, sulh ve taviz vermeye, temyiz ve istinaf etmeye, sair kanuni yollara başvurmaya, tahsilat yapmaya, tapu ve trafik işlemlerinde temsile yetkili olmak üzere vekil tayin ettim.

[İmza]
[Ad Soyad]`}
];

/* ============================================================
   DİLEKÇE SAYFASI
   ============================================================ */
function sablonListesiCiz(filtre = '') {
  const kutu = $('#sablon-listesi');
  if (!kutu) return;
  kutu.innerHTML = '';
  const gruplar = {};
  SABLONLAR
    .filter(s => !filtre || s.a.toLowerCase().includes(filtre.toLowerCase()) || s.m.toLowerCase().includes(filtre.toLowerCase()))
    .forEach(s => { (gruplar[s.k] = gruplar[s.k] || []).push(s); });

  Object.keys(gruplar).forEach(k => {
    const h = document.createElement('h3');
    h.textContent = k;
    kutu.appendChild(h);
    gruplar[k].forEach(s => {
      const d = document.createElement('div');
      d.className = 'sitem';
      d.textContent = s.a;
      d.onclick = () => sablonSec(s, d);
      kutu.appendChild(d);
    });
  });
}

function sablonSec(s, el) {
  $$('.sitem').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  const ta = $('#dilekce-text');
  ta.value = s.m;
  App.aktifSablon = s;
  const aktif = $('#aktif-sablon');
  if (aktif) aktif.textContent = s.a;
  istatistikGuncelle();
  toast('Şablon yüklendi: ' + s.a, 'basari');
}

function istatistikGuncelle() {
  const ta = $('#dilekce-text');
  if (!ta) return;
  const m = ta.value || '';
  const kelimeler = m.trim() ? m.trim().split(/\s+/).length : 0;
  const cumleler = m.split(/[.!?]+/).filter(x => x.trim().length).length;
  const paragraflar = m.split(/\n\s*\n/).filter(x => x.trim().length).length;

  const sk = $('#stat-kelime'); if (sk) sk.textContent = kelimeler;
  const sc = $('#stat-char'); if (sc) sc.textContent = m.length;
  const su = $('#stat-cumle'); if (su) su.textContent = cumleler;
  const sp = $('#stat-para'); if (sp) sp.textContent = paragraflar;
}

function dilekceTemizle() {
  if (!confirm('Dilekçe metni silinecek. Emin misiniz?')) return;
  $('#dilekce-text').value = '';
  App.aktifSablon = null;
  const aktif = $('#aktif-sablon');
  if (aktif) aktif.textContent = 'Seçilmedi';
  istatistikGuncelle();
  toast('Temizlendi', 'uyari');
}

function dilekceKaydet() {
  const metin = $('#dilekce-text').value.trim();
  if (!metin) return toast('Dilekçe boş!', 'hata');
  const baslik = prompt('Belge başlığı:', App.aktifSablon ? App.aktifSablon.a : 'Dilekçe ' + new Date().toLocaleDateString('tr-TR'));
  if (!baslik) return;
  App.dilekceler.unshift({
    id: 'dl_' + Date.now(),
    baslik,
    metin,
    sablon: App.aktifSablon ? App.aktifSablon.a : null,
    tarih: new Date().toISOString()
  });
  islemEkle('dilekce', baslik);
  storeKaydet();
  toast('Dilekçe kaydedildi', 'basari');
}

function dilekceKopyala() {
  const metin = $('#dilekce-text').value;
  if (!metin) return toast('Kopyalanacak metin yok', 'hata');
  const baslik = (App.aktifSablon && App.aktifSablon.a) || 'Dilekçe';
  if (window.iosAPI && window.iosAPI.iphoneMi() && navigator.share) {
    window.iosAPI.paylas(baslik, metin);
    return;
  }
  navigator.clipboard.writeText(metin)
    .then(() => toast('Kopyalandı', 'basari'))
    .catch(() => toast('Kopyalanamadı', 'hata'));
}

function dilekceYazdir() {
  const metin = $('#dilekce-text').value;
  if (!metin.trim()) return toast('Yazdırılacak metin yok', 'hata');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dilekçe</title>
    <style>body{font-family:'Times New Roman',serif;font-size:13px;line-height:1.9;padding:30px;max-width:800px;margin:auto;white-space:pre-wrap}</style>
    </head><body>${escHtml(metin)}</body></html>`;
  if (window.iosAPI && window.iosAPI.yazdir) {
    window.iosAPI.yazdir(html);
    return;
  }
  const w = window.open('', '_blank');
  if (!w) return toast('Açılır pencere engellendi', 'hata');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

/* ============================================================
   HÂKİM KARAR SAYFASI
   ============================================================ */
const DAVA_ADLARI = {
  'sozlesme':'Sözleşmeden Doğan Tazminat', 'haksiz':'Haksız Fiil Tazminatı',
  'manevi':'Manevi Tazminat', 'alacak':'Alacak Davası',
  'itiraz-iptal':'İtirazın İptali', 'menfi':'Menfi Tespit',
  'tapu-iptal':'Tapu İptali ve Tescil', 'zamanasiimi':'Kazandırıcı Zamanaşımı',
  'irtifak':'İrtifak / Geçit Hakkı', 'tapu-duz':'Tapu Kaydı Düzeltimi',
  'izale':'Ortaklığın Giderilmesi', 'bosanma':'Boşanma',
  'nafaka':'Nafaka', 'velayet':'Velayet',
  'ad-soyad':'Ad Soyad Düzeltimi', 'yas':'Yaş Düzeltimi', 'nesep':'Nesep',
  'kidem':'Kıdem + İhbar Tazminatı', 'iade':'İşe İade',
  'marka':'Marka İhlali', 'sirket':'Şirket Feshi'
};

function hukumUret(davaTuru, deger, kabul) {
  const v = kabul > 0 ? kabul : deger;
  const temel = `1- Davanın KABULÜNE,\n`;
  const gerekce = `\n${'—'.repeat(40)}\nYukarıda açıklanan gerekçe ile;`;
  const yargiGid = `\n${'—'.repeat(40)}\nYargılama giderlerinin davalıdan alınarak davacıya verilmesine,`;
  const kararTeb = `\nKararın taraflara tebliğine,`;
  const kesin = `\nKararın kesinleşmesinden sonra [gereği] yapılmasına karar verildi.`;

  switch (davaTuru) {
    case 'alacak':
    case 'sozlesme':
    case 'haksiz':
      return gerekce + temel +
        `2- ${tlFormat(v)} tazminatın dava tarihinden itibaren işleyecek yasal faizi ile birlikte davalıdan alınarak davacıya verilmesine,` +
        yargiGid + kararTeb + kesin;
    case 'manevi':
      return gerekce + temel +
        `2- ${tlFormat(v)} manevi tazminatın dava tarihinden itibaren işleyecek yasal faizi ile birlikte davalıdan alınarak davacıya verilmesine,` + yargiGid + kararTeb + kesin;
    case 'itiraz-iptal':
      return gerekce + temel +
        `2- Davalının [icra müdürlüğü] [esas] sayılı dosyasına yaptığı İTİRAZIN İPTALİNE,` +
        `3- Takibin ${tlFormat(v)} üzerinden DEVAMINA,` +
        `4- Alacağın %20'si oranında (${tlFormat(v*0.20)}) icra inkâr tazminatının davalıdan alınarak davacıya verilmesine,` + yargiGid + kararTeb + kesin;
    case 'menfi':
      return gerekce + temel +
        `2- Davacının davalıya ${tlFormat(v)} BORÇLU OLMADIĞININ TESPİTİNE,` + yargiGid + kararTeb + kesin;
    case 'tapu-iptal':
    case 'zamanasiimi':
    case 'tapu-duz':
      return gerekce + temel +
        `2- Dava konusu [ada/parsel] sayılı taşınmazın tapu kaydının İPTALİ ile davacı adına TESCİLİNE,` + yargiGid + kararTeb + kesin;
    case 'izale':
      return gerekce + temel +
        `2- Ortaklığın SATIŞ YOLUYLA GİDERİLMESİNE,` +
        `3- Satış bedelinin tapudaki paylar oranında taraflara dağıtılmasına,` + yargiGid + kararTeb + kesin;
    case 'bosanma':
      return gerekce + temel +
        `2- Tarafların BOŞANMALARINA,` +
        `3- [Velayet / nafaka / tazminat düzenlemeleri],` + yargiGid + kararTeb + kesin;
    case 'nafaka':
      return gerekce + temel +
        `2- Davanın KABULÜ ile aylık ${tlFormat(v)} nafakanın davalıdan alınarak davacıya verilmesine,` + yargiGid + kararTeb + kesin;
    case 'ad-soyad':
    case 'yas':
    case 'nesep':
      return gerekce + temel +
        `2- Davanın KABULÜ ile [nüfus kaydının düzeltilmesine],` +
        `3- Karar kesinleştiğinde Nüfus Müdürlüğü'ne bildirilmesine,` + yargiGid + kararTeb + kesin;
    case 'kidem':
    case 'iade':
      return gerekce + temel +
        `2- Davanın KABULÜNE, ${tlFormat(v)} işçilik alacağının en yüksek banka mevduat faizi ile birlikte davalıdan alınarak davacıya verilmesine,` + yargiGid + kararTeb + kesin;
    default:
      return gerekce + temel + `2- [Dava türüne uygun hüküm buraya],` + yargiGid + kararTeb + kesin;
  }
}

function yargiYoluBilgi(davaTuru, deger, kabul) {
  const v = kabul > 0 ? kabul : deger;
  if (v < 28000) return { yol:'KESİN', mesaj:'Karar KESİN — İstinaf yolu kapalı.', sinif:'yp-t' };
  if (v < 238730) return { yol:'İSTİNAF', mesaj:`İSTİNAF yolu açık (BAM). Süre: 2 hafta.`, sinif:'yp-k' };
  return { yol:'İSTİNAF + TEMYİZ', mesaj:`İSTİNAF + TEMYİZ açık (Yargıtay).`, sinif:'yp-i' };
}

function kararOnizlemeGuncelle() {
  const get = id => ($('#' + id) ? $('#' + id).value : '');
  const setTxt = (id, val) => { const e = $('#' + id); if (e) e.textContent = val || '…'; };

  const mhk = get('f-mhk') || '[ MAHKEME ADI ]';
  setTxt('kk-mhk', mhk);
  setTxt('kk-esas', ': ' + (get('f-esas') || '…'));
  setTxt('kk-kno', ': ' + (get('f-kno') || '…'));
  setTxt('kk-hakim', ': ' + (get('f-hakim') || '…'));
  setTxt('kk-katip', ': ' + (get('f-katip') || '…'));
  setTxt('kk-tarih', ': ' + (get('f-ktar') ? tarihFormat(get('f-ktar')) : '…'));
  setTxt('kk-dav', ': ' + (get('f-dav-ad') || '…'));
  setTxt('kk-dav-vek', ': ' + (get('f-dav-vek') || '…'));
  setTxt('kk-dal', ': ' + (get('f-dal-ad') || '…'));
  setTxt('kk-dal-vek', ': ' + (get('f-dal-vek') || '…'));
  setTxt('kk-dava-ad', ': ' + (DAVA_ADLARI[get('f-dava-turu')] || '…'));
  setTxt('kk-deger', ': ' + (get('f-deger') ? tlFormat(parseFloat(get('f-deger'))) : '…'));
  setTxt('kk-iddia', get('f-iddia') || '← Gerekçe sekmesinden doldurun');
  setTxt('kk-savunma', get('f-savunma'));
  setTxt('kk-gerekce', get('f-gerekce') || '← Gerekçe sekmesinden doldurun');
  setTxt('kk-kanun', get('f-kanun') || '…');
  setTxt('kk-hakim-imza', get('f-hakim') || '…');
  setTxt('kk-katip-imza', get('f-katip') || '…');
  setTxt('kk-tarih-imza', get('f-ktar') ? tarihUzun(get('f-ktar')) : '…');

  const davaTuru = get('f-dava-turu');
  const deger = sayiDegeri($('#f-deger'));
  const kabul = sayiDegeri($('#f-kabul'));
  const hukumKutu = $('#kk-hukum');
  if (hukumKutu && davaTuru && deger > 0) {
    const h = hukumUret(davaTuru, deger, kabul);
    hukumKutu.innerHTML = h.split('\n').map(l => l.trim() ? `<div class="hi">${escHtml(l)}</div>` : '').join('');
  } else if (hukumKutu) {
    hukumKutu.innerHTML = '<div class="hi ph">← Dava türü ve değer giriniz</div>';
  }

  const yy = $('#yargi-yolu-alan');
  if (yy && davaTuru && deger > 0) {
    const b = yargiYoluBilgi(davaTuru, deger, kabul);
    yy.innerHTML = `<div class="yp ${b.sinif}">${escHtml(b.mesaj)}</div>`;
  } else if (yy) {
    yy.innerHTML = '';
  }

  hesaplaKararHarc();
}

function hesaplaKararHarc() {
  const deger = sayiDegeri($('#f-deger'));
  const kabul = sayiDegeri($('#f-kabul'));
  const mhkTur = $('#f-mhk-tur') ? $('#f-mhk-tur').value : 'asliye';
  const bilirkisi = sayiDegeri($('#f-bilirkisi'));

  const oranlar = {
    asliye:{ nispi:0.06831, maktu:45000 }, sulh:{ nispi:0.06831, maktu:30000 },
    aile:{ nispi:0.06831, maktu:35000 }, is:{ nispi:0.0509, maktu:35000 },
    ticaret:{ nispi:0.06831, maktu:45000 }, icra:{ nispi:0.06831, maktu:9000 }
  };
  const mh = oranlar[mhkTur] || oranlar.asliye;
  const nispi = deger * mh.nispi;
  const pesin = nispi / 4;
  const bakiye = nispi - pesin;
  const oran = deger > 0 ? ((kabul / deger) * 100) : 0;

  const vekalet = kabul > 0 ? Math.max(kabul * 0.16, mh.maktu) : mh.maktu;
  const vekaletD = Math.max((deger - kabul) * 0.16, mh.maktu);
  const gider = pesin + bilirkisi + 500;

  const set = (id, val) => { const e = $('#' + id); if (e) e.textContent = val; };
  set('h-nispi', tlFormat(nispi));
  set('h-pesin', tlFormat(pesin));
  set('h-bakiye', tlFormat(bakiye));
  set('h-oran', oran.toFixed(1) + '%');
  set('h-vek-d', tlFormat(vekalet));
  set('h-vek-dal', tlFormat(vekaletD));
  set('h-gider', tlFormat(gider));

  const redEl = $('#f-red');
  if (redEl) redEl.value = Math.max(0, deger - kabul).toFixed(2);
}

function kararKaydet() {
  const get = id => ($('#' + id) ? $('#' + id).value : '');
  const davAd = get('f-dav-ad') || 'Bilinmiyor';
  const dalAd = get('f-dal-ad') || 'Bilinmiyor';
  const esas = get('f-esas') || 'Yeni';
  const baslik = `${esas} — ${davAd} / ${dalAd}`;
  const karar = {
    id: 'kr_' + Date.now(),
    baslik,
    esas, kno: get('f-kno'), tarih: new Date().toISOString(),
    mahkeme: get('f-mhk'), hakim: get('f-hakim'),
    davaci: davAd, davali: dalAd,
    davaTuru: get('f-dava-turu'),
    deger: get('f-deger'), kabul: get('f-kabul'),
    metin: $('#karar-kagit') ? $('#karar-kagit').innerText : ''
  };
  App.kararlar.unshift(karar);
  islemEkle('karar', baslik);
  storeKaydet();
  toast('Karar kaydedildi', 'basari');
}

function kararSifirla() {
  if (!confirm('Tüm form alanları temizlenecek. Emin misiniz?')) return;
  $$('.hk-form input, .hk-form textarea, .hk-form select').forEach(el => {
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });
  kararOnizlemeGuncelle();
  toast('Form sıfırlandı', 'uyari');
}

function kararYazdir() {
  const kagit = $('#karar-kagit');
  if (!kagit) return;
  const w = window.open('', '_blank');
  if (!w) return toast('Açılır pencere engellendi', 'hata');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Karar</title>
    <style>
      body{font-family:'Times New Roman',serif;font-size:12.5px;line-height:1.9;padding:30px;max-width:820px;margin:auto}
      .kk-tc{text-align:center;font-weight:bold;font-size:14px;letter-spacing:4px;margin-bottom:3px}
      .kk-mhk{text-align:center;font-weight:bold;font-size:13px;border-bottom:2.5px solid #000;padding-bottom:9px;margin-bottom:15px}
      .kk-bilgi{display:grid;grid-template-columns:130px 1fr;gap:2px 6px;font-size:12px;margin-bottom:11px;line-height:1.7}
      .kk-baslik{font-weight:bold;font-size:11px;text-decoration:underline;text-transform:uppercase;letter-spacing:.4px;margin:13px 0 6px}
      .kk-metin{text-align:justify;margin-bottom:6px;text-indent:20px}
      .hukum-box{border:2.5px solid #000;border-radius:3px;padding:15px 19px;margin:14px 0;background:#fafaf7}
      .hukum-ttl{text-align:center;font-weight:bold;font-size:14px;letter-spacing:3px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px}
      .hi{padding:5px 0;border-bottom:1px dotted #ccc;font-size:12px;line-height:1.7}
      .imza-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px;padding-top:12px;border-top:1px solid #ccc}
      .imza-blk{text-align:center;font-size:11px}
      .imza-cizgi{border-top:1px solid #000;width:120px;margin:0 auto 3px}
    </style></head><body>${kagit.innerHTML}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

/* ============================================================
   HESAPLAMA ARAÇLARI
   ============================================================ */
function hesaplaHarc() {
  const deger = sayiDegeri($('#c-deger'));
  const tur = $('#c-tur') ? $('#c-tur').value : 'nispi';
  const oran = parseFloat(($('#c-oran') && $('#c-oran').value) || 100) / 100;

  let nispi = 0;
  if (tur === 'nispi' || tur === 'maktu') nispi = deger * 0.06831;
  else if (tur === 'tapu') nispi = deger * 0.0455;
  else if (tur === 'is') nispi = deger * 0.0509;

  if (tur === 'maktu') nispi = 269.85;
  const pesin = nispi / 4;
  const bakiye = nispi - pesin;

  const a = $('#sh-nispi'); if (a) a.textContent = tlFormat(nispi);
  const b = $('#sh-pesin'); if (b) b.textContent = tlFormat(pesin);
  const c = $('#sh-bakiye'); if (c) c.textContent = tlFormat(bakiye);
  const d = $('#sh-kabul'); if (d) d.textContent = tlFormat(nispi * oran);
  const el = $('#s-harc'); if (el) el.style.display = 'block';
  toast('Harç hesaplandı', 'basari');
}

function hesaplaVekalet() {
  const kabul = sayiDegeri($('#v-kabul'));
  const red = sayiDegeri($('#v-red'));
  const mhk = $('#v-mhk') ? $('#v-mhk').value : 'asliye';
  const minimumlar = {
    asliye:45000, sulh:30000, aile:35000, is:35000, ticaret:45000, icra:9000
  };
  const min = minimumlar[mhk] || 45000;

  const vDav = Math.max(kabul * 0.16, min);
  const vDal = Math.max(red * 0.16, min);
  const net = vDav - vDal;

  const a = $('#sv-dav'); if (a) a.textContent = tlFormat(vDav);
  const b = $('#sv-dal'); if (b) b.textContent = tlFormat(vDal);
  const c = $('#sv-net'); if (c) c.textContent = tlFormat(net) + (net >= 0 ? ' (Davacı lehine)' : ' (Davalı lehine)');
  const el = $('#s-vekalet'); if (el) el.style.display = 'block';
  toast('Vekâlet hesaplandı', 'basari');
}

function hesaplaInkar() {
  const tutar = sayiDegeri($('#i-takip'));
  const oran = 0.20;
  const taz = tutar * oran;
  const a = $('#si-tak'); if (a) a.textContent = tlFormat(tutar);
  const b = $('#si-taz'); if (b) b.textContent = tlFormat(taz);
  const c = $('#si-top'); if (c) c.textContent = tlFormat(tutar + taz);
  const el = $('#s-inkar'); if (el) el.style.display = 'block';
  toast('Tazminat hesaplandı', 'basari');
}

function hesaplaFaiz() {
  const ana = sayiDegeri($('#faiz-ana'));
  const bas = $('#faiz-bas') ? $('#faiz-bas').value : '';
  const bit = $('#faiz-bit') ? $('#faiz-bit').value : '';
  const tur = $('#faiz-tur') ? $('#faiz-tur').value : 'yasal';

  if (!bas || !bit || ana <= 0) return toast('Tarih ve tutar gerekli', 'hata');
  const d1 = new Date(bas), d2 = new Date(bit);
  if (d2 <= d1) return toast('Bitiş başlangıçtan sonra olmalı', 'hata');

  const gun = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  const oranlar = { yasal:0.24, tcmb:0.36, ticari:0.36 };
  const oran = oranlar[tur] || 0.24;
  const faiz = ana * oran * gun / 365;

  const a = $('#sf-gun'); if (a) a.textContent = gun + ' gün';
  const b = $('#sf-faiz'); if (b) b.textContent = tlFormat(faiz);
  const c = $('#sf-top'); if (c) c.textContent = tlFormat(ana + faiz);
  const el = $('#s-faiz'); if (el) el.style.display = 'block';
  toast('Faiz hesaplandı', 'basari');
}

/* ============================================================
   ÜST YARGI SÜRE HESAPLAYICI
   ============================================================ */
function hesaplaSure() {
  const teblig = $('#sc-teblig') ? $('#sc-teblig').value : '';
  const gun = parseInt($('#sc-yol') ? $('#sc-yol').value : '14', 10);
  if (!teblig) return toast('Tebliğ tarihi gerekli', 'hata');
  const dt = new Date(teblig);
  dt.setDate(dt.getDate() + gun);
  const kutu = $('#sc-sonuc');
  if (!kutu) return;
  kutu.style.display = 'block';
  kutu.innerHTML = `
    <div style="font-weight:800;color:#0c1f3f;font-size:12px">Son Başvuru Tarihi</div>
    <div style="font-size:16px;color:#1a3a8a;font-weight:800;margin-top:4px">${escHtml(tarihUzun(dt))}</div>
    <div style="font-size:10px;color:#666;margin-top:4px">Tebliğ: ${escHtml(tarihFormat(teblig))} + ${gun} gün</div>
  `;
  toast('Hesaplandı: ' + tarihFormat(dt), 'basari');
}

/* ============================================================
   KARAR ÖRNEKLERİ
   ============================================================ */
const ORNEKLER = [
  { k:'Hüküm', a:'Alacak Davası — Kabul Kararı',
    m:`T.C.
İSTANBUL 1. ASLİYE HUKUK MAHKEMESİ
ESAS NO: 2024/1234
KARAR NO: 2024/567

HÂKİM: Ayşe YILMAZ — 45678
KÂTİP: Mehmet KARA

DAVACI: Ahmet YILMAZ
VEKİLİ: Av. Fatma DEMİR
DAVALI: Zeynep KAYA
VEKİLİ: Av. Hasan ARSLAN

DAVA: Alacak (İtirazın İptali)
DAVA TARİHİ: 15/03/2024

GEREKÇE:
Davacı vekili, müvekkilinin davalıdan [tutar] TL alacağı bulunduğunu, takibe yapılan itirazın haksız olduğunu iddia etmiştir. Davalı vekili davanın reddini savunmuştur.

Toplanan deliller, icra dosyası, sözleşme ve bilirkişi raporu birlikte değerlendirildiğinde; davacının davalıdan [tutar] TL alacaklı olduğu sabit görülmüştür.

HÜKÜM:
1- Davanın KABULÜNE,
2- [tutar] TL alacağın dava tarihinden itibaren işleyecek yasal faizi ile birlikte davalıdan alınarak davacıya verilmesine,
3- Yargılama giderlerinin davalıdan alınarak davacıya verilmesine,
4- Kararın taraflara tebliğine,

Karar verildi. 20/06/2024

Kâtip: Mehmet KARA
Hâkim: Ayşe YILMAZ`},

  { k:'Taşınmaz', a:'Tapu İptali ve Tescil Kararı',
    m:`T.C.
KADIKÖY 2. ASLİYE HUKUK MAHKEMESİ
ESAS: 2024/890 — KARAR: 2024/432

DAVACI: Mehmet DEMİR
VEKİLİ: Av. Ali VURAL
DAVALI: Hazine (Maliye Bakanlığı)

DAVA: Tapu İptali ve Tescil
DAVA DEĞERİ: 850.000 TL

GEREKÇE:
Davacı, dava konusu [ada/parsel] sayılı taşınmazın [sebep] nedeniyle müvekkiline ait olduğunu ancak davalı adına kayıtlı bulunduğunu ileri sürmüştür. Yapılan keşif, dinlenen tanık beyanları ve bilirkişi raporu birlikte değerlendirildiğinde, davacının iddiasının sabit olduğu kanaatine varılmıştır.

HÜKÜM:
1- Davanın KABULÜNE,
2- Dava konusu taşınmazın tapu kaydının İPTALİ ile davacı adına TESCİLİNE,
3- Yargılama giderlerinin davalıdan alınarak davacıya verilmesine,

Karar verildi. 10/05/2024`},

  { k:'Nüfus', a:'Ad ve Soyad Düzeltim Kararı',
    m:`T.C.
ANKARA 4. ASLİYE HUKUK MAHKEMESİ
ESAS: 2024/321 — KARAR: 2024/210

DAVACI: Ayşe KAYA
VEKİLİ: Av. Zeynep ŞAHİN
DAVALI: Nüfus Müdürlüğü

DAVA: Ad ve Soyad Düzeltimi

GEREKÇE:
Davacı, nüfus kaydındaki "Ayşe" olan adının "Aysel" olarak düzeltilmesini talep etmiştir. Dinlenen tanıklar ve sunulan belgeler doğrultusunda davacının gerçek adının "Aysel" olduğu anlaşılmıştır.

HÜKÜM:
1- Davanın KABULÜ ile davacının nüfus kaydındaki adının "Aysel" olarak DÜZELTİLMESİNE,
2- Karar kesinleştiğinde Nüfus Müdürlüğü'ne bildirilmesine,

Karar verildi. 08/04/2024`},

  { k:'İcra', a:'İtirazın İptali Kararı',
    m:`T.C.
BAKIRKÖY 3. ASLİYE HUKUK MAHKEMESİ
ESAS: 2024/556 — KARAR: 2024/389

DAVACI: XYZ Ticaret A.Ş.
VEKİLİ: Av. Burak ÖZTÜRK
DAVALI: ABC İnşaat Ltd. Şti.

DAVA: İtirazın İptali (İİK m.67)
DAVA DEĞERİ: 320.000 TL

GEREKÇE:
Davacı, davalı aleyhine başlattığı icra takibine davalının haksız olarak itiraz ettiğini ileri sürmüştür. İcra dosyası, fatura ve ticari defter kayıtları incelendiğinde davacının alacağının sabit olduğu görülmüştür.

HÜKÜM:
1- Davanın KABULÜNE,
2- Davalının icra takibine yaptığı İTİRAZIN İPTALİNE,
3- Takibin 320.000 TL üzerinden DEVAMINA,
4- Alacağın %20'si oranında (64.000 TL) icra inkâr tazminatının davalıdan alınarak davacıya verilmesine,

Karar verildi. 22/05/2024`},

  { k:'Aile', a:'Anlaşmalı Boşanma Kararı',
    m:`T.C.
İSTANBUL 5. AİLE MAHKEMESİ
ESAS: 2024/102 — KARAR: 2024/088

DAVACI: Ahmet YILMAZ
VEKİLİ: Av. Selin AK
DAVALI: Fatma YILMAZ
VEKİLİ: Av. Kemal ER

DAVA: Anlaşmalı Boşanma

GEREKÇE:
Taraflar 15/06/2018 tarihinde evlenmiş, en az bir yıl süren evlilikleri sonucunda TMK m.166/3 kapsamında anlaşmalı boşanma konusunda uzlaşmışlardır. Tarafların duruşmada bizzat dinlenmeleri sonucunda iradelerinin serbest olduğu anlaşılmıştır.

HÜKÜM:
1- Tarafların ANLAŞMALI OLARAK BOŞANMALARINA,
2- Müşterek çocuk [ad]'ın velayetinin anneye verilmesine,
3- Baba tarafından aylık 5.000 TL iştirak nafakasına,
4- Tarafların karşılıklı olarak maddi ve manevi tazminat taleplerinden vazgeçmiş sayılmasına,

Karar verildi. 12/03/2024`},

  { k:'İş', a:'Kıdem ve İhbar Tazminatı Kararı',
    m:`T.C.
İSTANBUL 12. İŞ MAHKEMESİ
ESAS: 2024/445 — KARAR: 2024/298

DAVACI: Hasan ÇELİK
VEKİLİ: Av. Murat YILDIZ
DAVALI: DEF Sanayi A.Ş.

DAVA: Kıdem ve İhbar Tazminatı + İşçilik Alacakları

GEREKÇE:
Davacının 01/02/2015 — 15/12/2023 tarihleri arasında davalı işyerinde çalıştığı, iş sözleşmesinin işveren tarafından haksız olarak feshedildiği, bilirkişi raporu ile belirlenmiştir.

HÜKÜM:
1- Davanın KISMEN KABULÜNE,
2- 180.000 TL kıdem tazminatının fesih tarihinden itibaren banka mevduat faizi ile birlikte davalıdan alınarak davacıya verilmesine,
3- 45.000 TL ihbar tazminatının davalıdan tahsiline,
4- Fazla mesai ve yıllık izin alacaklarının hesaplanarak ödenmesine,
5- Yargılama giderlerinin kabul/red oranına göre paylaştırılmasına,

Karar verildi. 08/05/2024`},

  { k:'İdare', a:'İptal Davası Kararı',
    m:`T.C.
ANKARA 3. İDARE MAHKEMESİ
ESAS: 2024/700 — KARAR: 2024/622

DAVACI: Kemal ARSLAN
VEKİLİ: Av. Deniz YÜCEL
DAVALI: [Bakanlık]

DAVA: İptal (İdari İşlemin İptali)

GEREKÇE:
Davalı idarenin 10/01/2024 tarihli işleminin yetki, şekil, sebep ve maksat yönünden hukuka aykırı olduğu, işlemin davacının hukuki menfaatini ihlal ettiği sonucuna varılmıştır.

HÜKÜM:
1- Dava konusu işlemin İPTALİNE,
2- Yargılama giderlerinin davalı idareden alınarak davacıya verilmesine,
3- Kararın taraflara tebliğine,

Karar verildi. 05/06/2024`},

  { k:'Tazminat', a:'Maddi-Manevi Tazminat Kararı',
    m:`T.C.
İZMİR 4. ASLİYE HUKUK MAHKEMESİ
ESAS: 2024/220 — KARAR: 2024/178

DAVACI: Ali KORKMAZ
VEKİLİ: Av. Nazlı ÖZ
DAVALI: [Karşı Taraf]

DAVA: Maddi ve Manevi Tazminat

GEREKÇE:
Davacının [tarih] tarihinde davalının haksız fiili sonucu yaralandığı, maddi zararının [tutar] TL olduğu, ayrıca duyduğu elem ve ızdırap nedeniyle manevi tazminat talep etme hakkının doğduğu kanaatine varılmıştır.

HÜKÜM:
1- [tutar] TL maddi tazminatın olay tarihinden itibaren yasal faizi ile birlikte davalıdan alınarak davacıya verilmesine,
2- [tutar] TL manevi tazminatın davalıdan tahsiline,
3- Yargılama giderlerinin davalıya yükletilmesine,

Karar verildi. 14/05/2024`},

  { k:'İcra', a:'Menfi Tespit Kararı',
    m:`T.C.
BURSA 1. ASLİYE HUKUK MAHKEMESİ
ESAS: 2024/333 — KARAR: 2024/250

DAVACI: Ayhan DEMİR
VEKİLİ: Av. Serkan KOÇ
DAVALI: Banka A.Ş.

DAVA: Menfi Tespit (İİK m.72)

GEREKÇE:
Davacının davalı bankaya [sebep] nedeniyle borçlu olmadığı, sunulan belgeler ve tanık beyanları ile anlaşılmıştır. Davalı tarafın aksini ispat edemediği görülmüştür.

HÜKÜM:
1- Davanın KABULÜNE,
2- Davacının davalıya [tutar] TL BORÇLU OLMADIĞININ TESPİTİNE,
3- Davalının kötüniyetli olduğu anlaşılmakla %20 oranında kötüniyet tazminatına hükmedilmesine,
4- Yargılama giderlerinin davalıya yükletilmesine,

Karar verildi. 03/04/2024`},

  { k:'İcra', a:'Ortaklığın Giderilmesi Kararı',
    m:`T.C.
İSTANBUL 6. SULH HUKUK MAHKEMESİ
ESAS: 2024/110 — KARAR: 2024/095

DAVACI: Ahmet YILMAZ
VEKİLİ: Av. Leyla KAYA
DAVALILAR: [Diğer paydaşlar]

DAVA: Ortaklığın Giderilmesi (İzale-i Şuyu)

GEREKÇE:
Dava konusu [ada/parsel] sayılı taşınmazda taraflar paydaş olup, taşınmazın aynen taksiminin mümkün olmadığı keşif ve bilirkişi raporu ile belirlenmiştir.

HÜKÜM:
1- Ortaklığın SATIŞ YOLUYLA GİDERİLMESİNE,
2- Satış bedelinin tapudaki paylar oranında taraflara dağıtılmasına,
3- Yargılama giderlerinin paylar oranında paylaştırılmasına,

Karar verildi. 18/04/2024`},

  { k:'Aile', a:'Nafaka Artırım Kararı',
    m:`T.C.
KONYA 2. AİLE MAHKEMESİ
ESAS: 2024/180 — KARAR: 2024/145

DAVACI: Selma YILMAZ
VEKİLİ: Av. Fatma ARSLAN
DAVALI: Kemal YILMAZ

DAVA: Nafaka Artırımı

GEREKÇE:
Daha önce [mahkeme] kararı ile bağlanan nafakanın, ekonomik koşulların değişmesi ve ihtiyaçların artması nedeniyle yetersiz kaldığı anlaşılmıştır.

HÜKÜM:
1- Davanın KABULÜ ile nafakanın aylık [yeni tutar] TL'ye ÇIKARILMASINA,
2- Yargılama giderlerinin davalıya yükletilmesine,

Karar verildi. 25/04/2024`},

  { k:'İş', a:'İşe İade Kararı',
    m:`T.C.
ANKARA 5. İŞ MAHKEMESİ
ESAS: 2024/255 — KARAR: 2024/199

DAVACI: Emre KAR
VEKİLİ: Av. Burak ŞEN
DAVALI: GHI Teknoloji A.Ş.

DAVA: Feshin Geçersizliği ve İşe İade

GEREKÇE:
İş sözleşmesinin geçerli bir sebep gösterilmeksizin feshedildiği, davalı işverenin fesih sebebini ispat edemediği anlaşılmıştır.

HÜKÜM:
1- Feshin GEÇERSİZLİĞİNE,
2- Davacının İŞE İADESİNE,
3- 4 aylık boşta geçen süre ücretinin davalıdan tahsiline,
4- İşe başlatılmama halinde 4 aylık ücret tutarında tazminata hükmedilmesine,

Karar verildi. 30/05/2024`}
];

function ornekListesiCiz() {
  const kutu = $('#ornek-liste');
  if (!kutu) return;
  kutu.innerHTML = '';
  const gruplar = {};
  ORNEKLER.forEach(o => { (gruplar[o.k] = gruplar[o.k] || []).push(o); });
  Object.keys(gruplar).forEach(k => {
    const g = document.createElement('div');
    g.className = 'ol-grp';
    const h = document.createElement('h4');
    h.textContent = k;
    g.appendChild(h);
    gruplar[k].forEach(o => {
      const d = document.createElement('div');
      d.className = 'ol-item';
      d.textContent = o.a;
      d.onclick = () => ornekGoster(o, d);
      g.appendChild(d);
    });
    kutu.appendChild(g);
  });
}

function ornekGoster(o, el) {
  $$('.ol-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  const kutu = $('#ornek-icerik');
  if (!kutu) return;
  kutu.innerHTML = `<div class="karar-kag"><pre style="font-family:'Times New Roman',serif;font-size:12.5px;line-height:1.9;white-space:pre-wrap;margin:0">${escHtml(o.m)}</pre></div>`;
}

function ornekYazdir() {
  const aktif = $('.ol-item.active');
  if (!aktif) return toast('Örnek seçin', 'hata');
  const kutu = $('#ornek-icerik');
  const w = window.open('', '_blank');
  if (!w) return toast('Açılır pencere engellendi', 'hata');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Karar Örneği</title>
    <style>body{font-family:'Times New Roman',serif;font-size:12.5px;line-height:1.9;padding:30px;max-width:820px;margin:auto}
    pre{white-space:pre-wrap;font-family:'Times New Roman',serif;margin:0}</style>
    </head><body>${kutu ? kutu.innerHTML : ''}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

/* ============================================================
   KAYITLI BELGELER
   ============================================================ */
function belgeListesiYenile() {
  const kutu = $('#belge-listesi');
  if (!kutu) return;
  const tumu = [
    ...App.kararlar.map(k => ({ ...k, tip:'karar' })),
    ...App.dilekceler.map(d => ({ ...d, tip:'dilekce' }))
  ].sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

  if (!tumu.length) {
    kutu.innerHTML = '<div style="padding:30px;text-align:center;color:var(--muted);grid-column:1/-1">Henüz kayıtlı belge yok. Dilekçe veya karar oluşturup kaydedin.</div>';
    anasayfaYenile();
    return;
  }

  kutu.innerHTML = '';
  tumu.forEach(b => {
    const kart = document.createElement('div');
    kart.style.cssText = 'background:#fff;border:1px solid var(--border);border-radius:7px;padding:12px;cursor:pointer';
    kart.innerHTML = `
      <div style="font-size:22px;margin-bottom:4px">${b.tip === 'karar' ? '⚖️' : '📝'}</div>
      <div style="font-size:11px;font-weight:800;color:var(--navy);margin-bottom:3px">${escHtml(b.baslik || 'Belge')}</div>
      <div style="font-size:9px;color:var(--muted)">${escHtml(new Date(b.tarih).toLocaleString('tr-TR'))}</div>
      <div style="margin-top:8px;display:flex;gap:5px">
        <button class="tb-btn" style="flex:1" type="button">🗑 Sil</button>
      </div>`;
    kart.addEventListener('click', () => belgeAc(b.id, b.tip));
    const silBtn = kart.querySelector('button');
    silBtn.addEventListener('click', (e) => { e.stopPropagation(); belgeSil(b.id, b.tip); });
    kutu.appendChild(kart);
  });
  anasayfaYenile();
}

function belgeAc(id, tip) {
  if (tip === 'dilekce') {
    const d = App.dilekceler.find(x => x.id === id);
    if (!d) return;
    sayfaAc('dilekce');
    $('#dilekce-text').value = d.metin;
    istatistikGuncelle();
    toast('Belge açıldı', 'basari');
  } else {
    sayfaAc('hakim');
    toast('Karar formu yeniden doldurulabilir', 'bilgi');
  }
}

function belgeSil(id, tip) {
  if (!confirm('Belge silinsin mi?')) return;
  if (tip === 'dilekce') App.dilekceler = App.dilekceler.filter(x => x.id !== id);
  else App.kararlar = App.kararlar.filter(x => x.id !== id);
  storeKaydet();
  belgeListesiYenile();
  toast('Silindi', 'uyari');
}

/* ============================================================
   ANA SAYFA
   ============================================================ */
function anasayfaYenile() {
  const sayi = App.kararlar.length + App.dilekceler.length;
  const sb = $('#belge-say');
  if (sb) sb.textContent = sayi + ' Belge';

  const kutu = $('#son-islemler');
  if (!kutu) return;
  if (!App.sonIslemler.length) {
    kutu.innerHTML = '<div style="color:var(--muted);font-size:10px;padding:12px;text-align:center">Henüz kayıtlı belge yok.</div>';
    return;
  }
  kutu.innerHTML = App.sonIslemler.map(i => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dotted var(--border);font-size:10px">
      <span>${i.tur === 'karar' ? '⚖️' : '📝'} ${escHtml(i.ad)}</span>
      <span style="color:var(--muted);font-size:9px">${escHtml(new Date(i.tarih).toLocaleDateString('tr-TR'))}</span>
    </div>
  `).join('');
}

/* ============================================================
   BAŞLATMA
   ============================================================ */
function init() {
  storeYukle();

  $$('.sb-item').forEach(el => {
    el.onclick = () => sayfaAc(el.dataset.page);
  });

  const kartMap = {
    'dc-dilekce':'dilekce', 'dc-hakim':'hakim', 'dc-ornekler':'ornekler',
    'dc-hesaplama':'hesaplama', 'dc-ustyargi':'ustyargi', 'dc-kayitli':'kayitli'
  };
  Object.keys(kartMap).forEach(id => {
    const el = $('#' + id);
    if (el) el.onclick = () => sayfaAc(kartMap[id]);
  });

  const byd = $('#btn-yeni-dilekce-ana'); if (byd) byd.onclick = () => sayfaAc('dilekce');
  const byk = $('#btn-yeni-karar-ana');   if (byk) byk.onclick = () => sayfaAc('hakim');

  sablonListesiCiz();
  const ara = $('#sablon-ara');
  if (ara) ara.oninput = e => sablonListesiCiz(e.target.value);

  const dta = $('#dilekce-text');
  if (dta) dta.addEventListener('input', istatistikGuncelle);

  const b1 = $('#btn-dl-temizle');   if (b1) b1.onclick = dilekceTemizle;
  const b2 = $('#btn-dl-kaydet');    if (b2) b2.onclick = dilekceKaydet;
  const b3 = $('#btn-dl-yazdir');    if (b3) b3.onclick = dilekceYazdir;
  const b4 = $('#btn-dl-yazdir2');   if (b4) b4.onclick = dilekceYazdir;
  const b5 = $('#btn-dl-kopyala');   if (b5) b5.onclick = dilekceKopyala;
  const b6 = $('#btn-dl-kaydet2');   if (b6) b6.onclick = dilekceKaydet;

  $$('.tb-btn[data-ekle]').forEach(b => {
    b.onclick = () => {
      const ta = $('#dilekce-text');
      const ins = b.dataset.ekle.replace(/&#10;/g, '\n');
      const s = ta.selectionStart;
      ta.value = ta.value.slice(0, s) + ins + ta.value.slice(ta.selectionEnd);
      ta.focus();
      ta.selectionStart = ta.selectionEnd = s + ins.length;
      istatistikGuncelle();
    };
  });

  $$('.ftab').forEach(t => {
    t.onclick = () => {
      $$('.ftab').forEach(x => x.classList.remove('active'));
      $$('.ftab-pane').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const pane = $('#ft' + t.dataset.ftab);
      if (pane) pane.classList.add('active');
    };
  });

  const formIds = ['f-mhk','f-il','f-esas','f-kno','f-ktar','f-hakim','f-sicil','f-katip',
    'f-dav-ad','f-dav-tc','f-dav-vek','f-dal-ad','f-dal-tc','f-dal-vek',
    'f-dava-turu','f-mhk-tur','f-faiz','f-deger','f-kabul','f-bilirkisi',
    'f-iddia','f-savunma','f-gerekce','f-kanun'];
  formIds.forEach(id => {
    const el = $('#' + id);
    if (el) {
      el.addEventListener('input', kararOnizlemeGuncelle);
      el.addEventListener('change', kararOnizlemeGuncelle);
    }
  });

  const bs = $('#btn-hk-sifirla');  if (bs) bs.onclick = kararSifirla;
  const bk = $('#btn-hk-kaydet');   if (bk) bk.onclick = kararKaydet;
  const by = $('#btn-hk-yazdir');   if (by) by.onclick = kararYazdir;

  ornekListesiCiz();
  const bo = $('#btn-orn-yazdir'); if (bo) bo.onclick = ornekYazdir;

  const ch = $('#btn-calc-harc');    if (ch) ch.onclick = hesaplaHarc;
  const cv = $('#btn-calc-vekalet'); if (cv) cv.onclick = hesaplaVekalet;
  const ci = $('#btn-calc-inkar');   if (ci) ci.onclick = hesaplaInkar;
  const cf = $('#btn-calc-faiz');    if (cf) cf.onclick = hesaplaFaiz;
  const cs = $('#btn-calc-sure');    if (cs) cs.onclick = hesaplaSure;

  const by2 = $('#btn-belge-yenile'); if (by2) by2.onclick = belgeListesiYenile;
  const bk2 = $('#btn-belge-klasor'); if (bk2) bk2.onclick = () => toast('Klasör erişimi tarayıcıda sınırlıdır', 'bilgi');

  const kt = $('#f-ktar'); if (kt && !kt.value) kt.value = bugun();

  const menuBtn = $('#menu-btn');
  if (menuBtn) menuBtn.onclick = () => {
    const side = $('#sidebar');
    if (side) side.classList.toggle('open');
  };
  const overlay = $('#sidebar-overlay');
  if (overlay) overlay.onclick = () => {
    const side = $('#sidebar');
    if (side) side.classList.remove('open');
  };

  kararOnizlemeGuncelle();
  anasayfaYenile();
  console.log('Hukuk Pro hazır. Sürüm v1.0.2');
}

document.addEventListener('DOMContentLoaded', init);

/* ============================================================
   Word / ayrı pencere / önizleme (index.html ek butonları)
   ============================================================ */
function metinHtml(metin) {
  return '<pre>' + escHtml(metin) + '</pre>';
}
function dosyaAdi(s) {
  return String(s || 'belge').toLowerCase()
    .replace(/[çğıöşü]/g, ch => ({ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u'}[ch] || ch))
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'belge';
}
let aktifBelge = { baslik:'Belge', html:'', tip:'belge' };

function belgeSayfasiHTML(baslik, html, toolbar) {
  const araclar = toolbar ? `<div class="print-toolbar"><button onclick="window.print()">PDF / Yazdır</button></div>` : '';
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escHtml(baslik)}</title>
  <style>
    body{margin:0;background:#f5f0e0;color:#111;font-family:"Times New Roman",serif}
    .print-toolbar{position:sticky;top:0;z-index:5;background:#0c1f3f;padding:10px;display:flex;gap:8px;justify-content:flex-end}
    .print-toolbar button{border:1px solid #c9a84c;background:#c9a84c;color:#0c1f3f;border-radius:4px;padding:8px 12px;font:700 13px sans-serif}
    .paper{max-width:800px;margin:18px auto;background:#fff;padding:2cm;font-size:13px;line-height:1.9;box-shadow:0 8px 30px rgba(0,0,0,.15)}
    pre{white-space:pre-wrap;font-family:inherit;font-size:inherit;line-height:inherit}
    @media print{body{background:#fff}.print-toolbar{display:none}.paper{box-shadow:none;margin:0;padding:0}}
  </style></head><body>${araclar}<div class="paper">${html}</div></body></html>`;
}

function belgeModalAc(baslik, html, tip) {
  aktifBelge = { baslik, html, tip: tip || 'belge' };
  const title = $('#doc-title'); if (title) title.textContent = baslik;
  const paper = $('#doc-paper'); if (paper) paper.innerHTML = html;
  const modal = $('#doc-modal');
  if (modal) { modal.classList.add('active'); modal.setAttribute('aria-hidden','false'); }
}

function belgeModalKapat() {
  const modal = $('#doc-modal');
  if (modal) { modal.classList.remove('active'); modal.setAttribute('aria-hidden','true'); }
}

function belgeWordIndir(baslik, html) {
  baslik = baslik || aktifBelge.baslik;
  html = html || aktifBelge.html;
  if (!html) return toast('Word için önce bir belge seçin.', 'hata');
  const blob = new Blob([belgeSayfasiHTML(baslik, html, false)], {type:'application/msword;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dosyaAdi(baslik) + '.doc';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('Word dosyası hazırlandı.', 'basari');
}

function dilekcePencereAc() {
  const metin = ($('#dilekce-text') && $('#dilekce-text').value) || '';
  if (!metin.trim()) return toast('Önce bir dilekçe seçin veya yazın.', 'hata');
  const baslik = ($('#aktif-sablon') && $('#aktif-sablon').textContent) || 'Dilekçe';
  belgeModalAc(baslik, metinHtml(metin), 'dilekce');
}

function dilekceWordIndir() {
  const metin = ($('#dilekce-text') && $('#dilekce-text').value) || '';
  if (!metin.trim()) return toast('Word için önce bir dilekçe seçin.', 'hata');
  const baslik = ($('#aktif-sablon') && $('#aktif-sablon').textContent) || 'Dilekçe';
  belgeWordIndir(baslik, metinHtml(metin));
}

function ornekPencereAc() {
  const kutu = $('#ornek-icerik');
  const aktif = $('.ol-item.active');
  if (!aktif || !kutu) return toast('Önce bir karar örneği seçin.', 'hata');
  belgeModalAc(aktif.textContent, kutu.innerHTML, 'ornek');
}

function ornekWordIndir() {
  const kutu = $('#ornek-icerik');
  const aktif = $('.ol-item.active');
  if (!aktif || !kutu) return toast('Word için önce bir karar örneği seçin.', 'hata');
  belgeWordIndir(aktif.textContent, kutu.innerHTML);
}

document.addEventListener('DOMContentLoaded', () => {
  ['btn-dl-pencere','btn-dl-pencere2'].forEach(id => {
    const el = $('#' + id); if (el) el.onclick = dilekcePencereAc;
  });
  ['btn-dl-word','btn-dl-word2'].forEach(id => {
    const el = $('#' + id); if (el) el.onclick = dilekceWordIndir;
  });
  const op = $('#btn-orn-pencere'); if (op) op.onclick = ornekPencereAc;
  const ow = $('#btn-orn-word'); if (ow) ow.onclick = ornekWordIndir;
  const dc = $('#doc-close'); if (dc) dc.onclick = belgeModalKapat;
  const dw = $('#doc-word'); if (dw) dw.onclick = () => belgeWordIndir();
  const dp = $('#doc-pdf'); if (dp) dp.onclick = () => {
    if (!aktifBelge.html) return toast('PDF/Yazdır için önce bir belge seçin.', 'hata');
    const w = window.open('', '_blank');
    if (!w) return toast('Açılır pencere engellendi.', 'hata');
    w.document.write(belgeSayfasiHTML(aktifBelge.baslik, aktifBelge.html, false));
    w.document.close();
    setTimeout(() => w.print(), 350);
  };
  const dpop = $('#doc-popup'); if (dpop) dpop.onclick = () => {
    if (!aktifBelge.html) return toast('Önce bir belge seçin.', 'hata');
    const w = window.open('', '_blank');
    if (!w) return toast('Açılır pencere engellendi.', 'hata');
    w.document.write(belgeSayfasiHTML(aktifBelge.baslik, aktifBelge.html, true));
    w.document.close();
  };
  const klasor = $('#btn-klasor');
  if (klasor) klasor.onclick = () => {
    if (window.hukukAPI && window.hukukAPI.klasorAc) window.hukukAPI.klasorAc();
    else toast('Klasör erişimi tarayıcıda sınırlıdır', 'bilgi');
  };
});
