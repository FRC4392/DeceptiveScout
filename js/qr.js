let qrInstance = null;

export function initQr(container) {
  container.innerHTML = '';
  qrInstance = new window.QRCode(container, {
    text: ' ',
    width: 280,
    height: 280,
    correctLevel: window.QRCode.CorrectLevel.M,
  });
}

export function updateQr(text) {
  if (!qrInstance) return;
  qrInstance.makeCode(text || ' ');
}

export function clearQr() {
  qrInstance?.clear();
}
