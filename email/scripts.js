// Inhalt als UTF-8 kodieren, damit Umlaute und Emojis korrekt im QR-Code landen
qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s));

const MARGIN = 4; // Ruhezone in Modulen, vom QR-Standard empfohlen

const $ = (id) => document.getElementById(id);
const canvas = $('qr');
const status = $('status');
let qr = null;

// Baut den Text, der im QR-Code gespeichert wird (mailto-Link)
function getData() {
  const to = $('to').value.trim();
  if (!to) return '';

  const params = [];
  if ($('subject').value.trim()) params.push('subject=' + encodeURIComponent($('subject').value.trim()));
  if ($('body').value.trim()) params.push('body=' + encodeURIComponent($('body').value.trim()));
  return `mailto:${to}` + (params.length ? '?' + params.join('&') : '');
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
