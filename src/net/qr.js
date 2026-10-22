// QR-Codes zeigen (SVG) und mit der Kamera lesen – für die Kopplung ohne Internet und für den Beitritts-Link.

import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';

/** SVG-Text eines QR-Codes. */
export function qrSVG(text, cell = 4) {
  const qr = qrcode(0, 'L');
  qr.addData(text, 'Byte');
  qr.make();
  return qr.createSvgTag({ cellSize: cell, margin: 2, scalable: true });
}

/**
 * Kamera öffnen und QR-Codes lesen. video: <video>-Element. onText(text) bei jedem erkannten Code.
 * Liefert stop(). Wirft, wenn keine Kamera erlaubt ist.
 */
export async function scanQR(video, onText) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  video.srcObject = stream;
  video.setAttribute('playsinline', '');
  video.muted = true;
  await video.play().catch(() => {});
  const c = document.createElement('canvas');
  const g = c.getContext('2d', { willReadFrequently: true });
  let alive = true, last = '';
  const tick = () => {
    if (!alive) return;
    if (video.readyState >= 2 && video.videoWidth) {
      const s = Math.min(1, 640 / video.videoWidth);
      c.width = Math.round(video.videoWidth * s); c.height = Math.round(video.videoHeight * s);
      g.drawImage(video, 0, 0, c.width, c.height);
      const img = g.getImageData(0, 0, c.width, c.height);
      const res = jsQR(img.data, c.width, c.height, { inversionAttempts: 'dontInvert' });
      if (res?.data && res.data !== last) { last = res.data; onText(res.data); }
    }
    setTimeout(() => requestAnimationFrame(tick), 120);
  };
  tick();
  return () => { alive = false; for (const t of stream.getTracks()) t.stop(); video.srcObject = null; };
}
