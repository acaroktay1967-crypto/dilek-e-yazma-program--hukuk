/* Hukuk Pro iPhone/PWA uyumluluk katmani */
(function () {
  'use strict';

  const STORE_KEY = 'hukukProBelgeler';

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function writeStore(items) {
    localStorage.setItem(STORE_KEY, JSON.stringify(items));
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.hukukAPI = {
    async dosyaKaydet(payload) {
      try {
        const icerik = payload && payload.icerik ? payload.icerik : payload;
        const items = readStore();
        const now = new Date().toISOString();
        const ad = (icerik && icerik.tur === 'karar' ? 'karar-' : 'dilekce-') + Date.now() + '.hp';
        items.unshift({
          id: Date.now(),
          ad,
          tarih: now,
          tur: icerik && icerik.tur ? icerik.tur : 'belge',
          icerik
        });
        writeStore(items.slice(0, 200));
        return { basarili: true, yol: ad };
      } catch (e) {
        return { basarili: false, hata: e.message };
      }
    },

    async dosyaListele() {
      return readStore().map(item => ({
        ad: item.ad,
        tarih: item.tarih,
        tur: item.tur
      }));
    },

    async pdfOlustur(veri) {
      if (veri && veri.html) {
        const w = window.open('', '', 'width=900,height=700');
        if (w) {
          w.document.write(veri.html);
          w.document.close();
          setTimeout(() => w.print(), 300);
          return { basarili: true };
        }
      }
      return { basarili: false, hata: 'iPhone tarayicisinda PDF icin yazdir/paylas kullanin.' };
    },

    async klasorAc() {
      alert('iPhone surumunde belgeler Safari yerel hafizasinda saklanir. Dilekce ekranindaki Kaydet/Yazdir ve Paylas islemlerini kullanin.');
      return { basarili: true };
    },

    async dialogBilgi(veri) {
      alert((veri && (veri.mesaj || veri.message)) || 'Hukuk Pro');
      return { basarili: true };
    },

    async getVersion() {
      return '1.0.2 iPhone';
    },

    async getDataDir() {
      return 'iPhone Safari Yerel Hafiza';
    },

    onMenuAction() {
      return function noop() {};
    },

    onDosyaAcildi() {
      return function noop() {};
    },

    exportText: downloadText
  };
})();
