// Inhalt als UTF-8 kodieren, damit Umlaute und Emojis korrekt im QR-Code landen
qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s));

const MARGIN = 4; // Ruhezone in Modulen, vom QR-Standard empfohlen

const $ = (id) => document.getElementById(id);
const canvas = $('qr');
const status = $('status');
let qr = null;

// Sonderzeichen im vCard-Format maskieren
const esc = (s) => s.trim().replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');

// Baut den Text, der im QR-Code gespeichert wird (vCard 3.0)
function getData() {
  const v = (id) => esc($(id).value);
  const name = [v('first'), v('last')].filter(Boolean).join(' ') || v('org');
  const address = [v('street'), v('city'), v('zip'), v('country')];
  const lines = [];

  if (name) lines.push(`N:${v('last')};${v('first')};;;`, `FN:${name}`);
  if (v('org')) lines.push(`ORG:${v('org')}`);
  if (v('phone')) lines.push(`TEL;TYPE=CELL:${v('phone')}`);
  if (v('email')) lines.push(`EMAIL:${v('email')}`);
  if (v('website')) lines.push(`URL:${v('website')}`);
  if (address.some(Boolean)) lines.push(`ADR:;;${address[0]};${address[1]};;${address[2]};${address[3]}`);
  if (!lines.length) return '';

  return ['BEGIN:VCARD', 'VERSION:3.0', ...lines, 'END:VCARD'].join('\n');
}

function render() {
  const data = getData();
  qr = null;
  status.textContent = '';
  $('result').hidden = true;
  if (!data) return;

  try {
    qr = qrcode(0, $('ecc').value);
    qr.addData(data);
    qr.make();
  } catch {
    qr = null;
    status.textContent = 'Der Inhalt ist zu lang für einen QR-Code.';
    return;
  }

  const count = qr.getModuleCount();
  const total = count + MARGIN * 2;
  const cell = Math.max(1, Math.round($('size').value / total));
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.height = cell * total;
  ctx.fillStyle = $('bg').value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = $('fg').value;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) ctx.fillRect((c + MARGIN) * cell, (r + MARGIN) * cell, cell, cell);
    }
  }
  $('result').hidden = false;
}

function toSvg() {
  const count = qr.getModuleCount();
  const total = count + MARGIN * 2;
  const size = $('size').value;
  let path = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) path += `M${c + MARGIN} ${r + MARGIN}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges">`
    + `<rect width="100%" height="100%" fill="${$('bg').value}"/><path d="${path}" fill="${$('fg').value}"/></svg>`;
}

function download(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

$('download-png').addEventListener('click', () => {
  download(canvas.toDataURL('image/png'), 'qr-code.png');
});

$('download-svg').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([toSvg()], { type: 'image/svg+xml' }));
  download(url, 'qr-code.svg');
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$('copy').addEventListener('click', () => {
  canvas.toBlob(async (blob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      status.textContent = 'QR-Code in die Zwischenablage kopiert.';
    } catch {
      status.textContent = 'Kopieren wird von diesem Browser nicht unterstützt.';
    }
  });
});

document.querySelector('form').addEventListener('input', render);
document.querySelector('form').addEventListener('submit', (e) => e.preventDefault());
render();
