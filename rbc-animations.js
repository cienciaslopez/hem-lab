/* ════════════════════════════════════════════════
   HEMO-LAB · Renderizador de Glóbulos Rojos
   Versión 2 · Responsive y contenido
   ════════════════════════════════════════════════ */

const ANTIGEN_COLORS = {
  A: '#9333ea',  // morado (igual al pentágono)
  B: '#16a34a'   // verde (igual a la cápsula)
};

/**
 * Renderiza un glóbulo rojo responsive dentro de un contenedor.
 * El tamaño se adapta al ancho disponible del contenedor padre.
 */
function renderRBC(target, type, size = 'mini', animate = false) {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  // Medimos el contenedor disponible y calculamos un tamaño que QUEPA
  const containerWidth = container.clientWidth || (size === 'mini' ? 110 : 180);
  // Reservamos espacio para que los antígenos no se salgan
  const safe = containerWidth * 0.62;
  const rbcWidth  = Math.max(60, Math.min(safe, size === 'mini' ? 90 : 150));
  const rbcHeight = rbcWidth * 0.92;

  // Tamaño proporcional de antígenos
  const markerWidth  = Math.max(10, rbcWidth * 0.14);
  const markerHeight = markerWidth * 1.35;
  const fontSize     = Math.max(8, rbcWidth * 0.11);
  const numMarkers   = 10;

  const rotCell = -30;
  const overlap = rbcWidth * 0.04;
  const rx = (rbcWidth  / 2) + (markerHeight / 2) - overlap;
  const ry = (rbcHeight / 2) + (markerHeight / 2) - overlap;

  let html = '';
  const outerAnim = type === 'O' ? 'anim-float-o' : 'anim-float';

  html += `<div class="${outerAnim}" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">`;

  let innerClasses = '';
  if (type === 'AB' && size !== 'mini') innerClasses = 'anim-glow';

  html += `<div class="${innerClasses}" style="position:relative;width:${rbcWidth}px;height:${rbcHeight}px;transform:rotate(${rotCell}deg);">`;
  html += `<div class="rbc-real" style="width:100%;height:100%;"></div>`;

  if (type !== 'O') {
    const angleStep = (Math.PI * 2) / numMarkers;
    for (let i = 0; i < numMarkers; i++) {
      const angleRad = i * angleStep;
      const x = Math.cos(angleRad) * rx;
      const y = Math.sin(angleRad) * ry;
      const rotDeg = Math.atan2(y, x) * (180 / Math.PI) + 90;
      const delay = animate ? (i * 0.1).toFixed(2) : 0;
      const animClass = animate ? 'anim-pop' : '';

      let markerType = '';
      let letter = '';
      if (type === 'A') { markerType = 'marker-a'; letter = 'A'; }
      else if (type === 'B') { markerType = 'marker-b'; letter = 'B'; }
      else if (type === 'AB') {
        markerType = i % 2 === 0 ? 'marker-a' : 'marker-b';
        letter     = i % 2 === 0 ? 'A' : 'B';
      }

      html += `
        <div style="position:absolute;top:50%;left:50%;width:0;height:0;
                    transform:translate(${x}px, ${y}px) rotate(${rotDeg}deg);z-index:10;">
          <div class="marker-animator ${animClass}"
               style="animation-delay:${delay}s;${animate ? 'opacity:0;' : 'opacity:1;'}">
            <div class="${markerType}"
                 style="position:absolute;transform:translate(-50%, -50%);
                        width:${markerWidth}px;height:${markerHeight}px;font-size:${fontSize}px;">
              ${letter}
            </div>
          </div>
        </div>
      `;
    }
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

/* ════════════════════════════════════════════════
   FLIP CARDS · Slide 4
   ════════════════════════════════════════════════ */

const BLOOD_TYPES_INFO = {
  A: {
    type: 'Grupo A',
    geno: 'I<sup>A</sup>I<sup>A</sup> · I<sup>A</sup>i',
    pheno: 'Antígeno A en la membrana',
    color: '#9333ea',
    featured: false
  },
  B: {
    type: 'Grupo B',
    geno: 'I<sup>B</sup>I<sup>B</sup> · I<sup>B</sup>i',
    pheno: 'Antígeno B en la membrana',
    color: '#16a34a',
    featured: false
  },
  AB: {
    type: 'Grupo AB ⭐',
    geno: 'I<sup>A</sup>I<sup>B</sup>',
    pheno: 'Codominancia: antígenos A y B',
    color: '#f5b400',
    featured: true
  },
  O: {
    type: 'Grupo O',
    geno: 'ii',
    pheno: 'Sin antígenos en la membrana',
    color: '#6b7280',
    featured: false
  }
};

function buildFlipCards() {
  const grid = document.getElementById('flipGrid');
  if (!grid) return;

  grid.innerHTML = '';
  ['A','B','AB','O'].forEach(t => {
    const info = BLOOD_TYPES_INFO[t];
    const wrap = document.createElement('div');
    wrap.className = 'flip-card-wrapper';
    wrap.innerHTML = `
      <div class="flip-card" id="flip-${t}" onclick="flipCard('${t}')">

        <div class="flip-face flip-front ${info.featured ? 'featured' : ''}">
          <div class="ff-cell-preview" id="ffPrev-${t}"></div>
          <div class="ff-type">${info.type}</div>
          <div class="ff-tag geno-tag-${t}">${info.geno}</div>
          <div class="ff-hint">Haz clic para ver su fenotipo</div>
        </div>

        <div class="flip-face flip-back">
          <div class="fb-stage" id="fbStage-${t}"></div>
          <div class="fb-info">
            <div class="fb-type">${info.type}</div>
            <div class="fb-geno geno-tag-${t}">${info.geno}</div>
            <div class="fb-pheno">${info.pheno}</div>
            <button class="fb-back-btn" onclick="event.stopPropagation(); flipCard('${t}')">← Volver</button>
          </div>
        </div>

      </div>
    `;
    grid.appendChild(wrap);
  });

  // Render previews después de que los contenedores existan en el DOM
  requestAnimationFrame(() => {
    ['A','B','AB','O'].forEach(t => renderRBC('ffPrev-' + t, t, 'mini', false));
  });
}

function flipCard(type) {
  const card = document.getElementById('flip-' + type);
  if (!card) return;

  const willFlip = !card.classList.contains('flipped');
  card.classList.toggle('flipped');

  if (willFlip) {
    // Render con animación dentro del stage trasero
    setTimeout(() => renderRBC('fbStage-' + type, type, 'large', true), 250);
  } else {
    setTimeout(() => {
      const stage = document.getElementById('fbStage-' + type);
      if (stage) stage.innerHTML = '';
    }, 700);
  }
}

// Re-renderizar previews si la ventana cambia de tamaño
let _rbcResizeT;
window.addEventListener('resize', () => {
  clearTimeout(_rbcResizeT);
  _rbcResizeT = setTimeout(() => {
    ['A','B','AB','O'].forEach(t => {
      const prev = document.getElementById('ffPrev-' + t);
      if (prev) renderRBC('ffPrev-' + t, t, 'mini', false);
      const card = document.getElementById('flip-' + t);
      if (card && card.classList.contains('flipped')) {
        renderRBC('fbStage-' + t, t, 'large', true);
      }
    });
  }, 200);
});

window.addEventListener('DOMContentLoaded', buildFlipCards);
