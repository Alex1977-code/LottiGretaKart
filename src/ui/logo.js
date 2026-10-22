// Schriftzug „Lotti & Greta KART“ als bunte 3D-Buchstaben (wie bei Super Mario 3D World): jeder Buchstabe mit
// eigener Farbe, Glanzverlauf, weißem Rand und farbiger Tiefe darunter. Reines HTML/CSS (siehe .logo3d in style.css).

// [oben, unten, Tiefe]
const C = {
  red: ['#ff6a5a', '#d8101e', '#7a0610'],
  yellow: ['#fff47a', '#ffb800', '#8a5200'],
  green: ['#86f060', '#19a83a', '#0b5a1c'],
  blue: ['#74bcff', '#1a5ee8', '#0a2a7a'],
  violet: ['#d9a0ff', '#8a3ae0', '#3e106e'],
  orange: ['#ffc674', '#ff7a10', '#8a3a00'],
};

function word(text, colors, cls = '') {
  return `<span class="w ${cls}">${[...text].map((ch, i) => {
    const [c1, c2, c3] = C[colors[i % colors.length]];
    const r = ((i % 2 ? 1 : -1) * (3 + (i * 7) % 4)).toFixed(0);
    return `<span class="lg" data-t="${ch}" style="--c1:${c1};--c2:${c2};--c3:${c3};--r:${r}deg;--d:${(i * 0.12).toFixed(2)}s">${ch}</span>`;
  }).join('')}</span>`;
}

/** HTML des Logos; tag = umschließendes Element (h1 im Menü, div im Ladebildschirm). */
export function logoHTML(tag = 'div') {
  return `<${tag} class="logo3d" aria-label="Lotti und Greta Kart">
    <span class="row1">${word('Lotti', ['blue', 'red', 'yellow', 'green', 'violet'])}${word('&', ['orange'], 'amp')}${word('Greta', ['green', 'red', 'blue', 'yellow', 'orange'])}</span>
    ${word('KART', ['red', 'yellow', 'green', 'blue'], 'kart')}
  </${tag}>`;
}
