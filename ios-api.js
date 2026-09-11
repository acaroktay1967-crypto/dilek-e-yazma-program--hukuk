/* ============================================================
   HUKUK PRO — iOS / Tarayıcı Uyumluluk Katmanı
   ============================================================ */
(function (global) {
  'use strict';

  const ios = {
    /* Basit localStorage sarmalayıcı */
    kaydet(anahtar, veri) {
      try { localStorage.setItem(anahtar, JSON.stringify(veri)); return true; }
      catch (e) { return false; }
    },
    yukle(anahtar) {
      try { const v = localStorage.getItem(anahtar); return v ? JSON.parse(v) : null; }
      catch (e) { return null; }
    },
    sil(anahtar) {
      try { localStorage.removeItem(anahtar); return true; }
      catch (e) { return false; }
    },

    /* Paylaşım — iOS Web Share API varsa kullan */
    paylas(baslik, metin) {
      if (navigator.share) {
        navigator.share({ title: baslik, text: metin }).catch(() => {});
      } else {
        navigator.clipboard.writeText(metin);
        alert('Panoya kopyalandı.');
      }
    },

    /* Yazdırma */
    yazdir(html) {
      const w = window.open('', '_blank');
      if (!w) {
        alert('Açılır pencere engellendi. Safari ayarlarından pop-up izni verin.');
        return;
      }
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 400);
    },

    /* iPhone bildirimi */
    bildir(mesaj) {
      if (window.console && console.log) console.log('[Hukuk Pro]', mesaj);
    },

    /* Cihaz tespiti */
    iphoneMi() {
      return /iPhone|iPad|iPod/.test(navigator.userAgent);
    },

    /* Standalone modda mı çalışıyor (Ana Ekrana Ekle) */
    standaloneMi() {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.navigator.standalone === true;
    }
  };

  global.iosAPI = ios;

  /* Mevcut app.js hukukAPI.klasorAc çağrısı için ince uyumluluk katmanı */
  global.hukukAPI = {
    async klasorAc() {
      ios.bildir('Belgeler tarayıcı yerel hafızasında saklanır.');
      alert('iPhone sürümünde belgeler Safari yerel hafızasında saklanır. Dilekçe ekranındaki Kaydet / Yazdır / Paylaş işlemlerini kullanın.');
      return { basarili: true };
    }
  };

  console.log('iOS API yüklendi. iPhone:', ios.iphoneMi(), '— Standalone:', ios.standaloneMi());
})(window);
