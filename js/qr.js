window.DS = window.DS || {};

(function () {

let qrInstance = null;

function initQr(container) {
  container.innerHTML = '';
  qrInstance = new window.QRCode(container, {
    text: ' ',
    width: 280,
    height: 280,
    correctLevel: window.QRCode.CorrectLevel.M,
  });
}

function updateQr(text) {
  if (!qrInstance) return;
  qrInstance.makeCode(text || ' ');
}

function clearQr() {
  qrInstance?.clear();
}

DS.qr = { initQr, updateQr, clearQr };

})();
