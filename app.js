/* ════════════════════════════════════════════════
   HEMO-LAB · Sesión 9 · app.js
   Lógica completa: navegación, sidebar animado,
   lightbox, asistencia, encuesta, línea del tiempo,
   constructor genotipo→fenotipo, compatibilidad,
   caso clínico, quiz salida, metacognición,
   cronómetro y ruleta de turnos.
   ════════════════════════════════════════════════ */

/* ═════════ ESTADO GLOBAL ═════════ */
const STATE = {
  currentSlide: 0,
  totalSlides: 10,
  theme: 'light',
  attendance: {},
  bloodSurvey: { A: 0, B: 0, AB: 0, O: 0, UK: 0 },
  timelineOpen: null,
  investigationLog: [],
  genoAnswers: {},
  caseAnswered: false,
  retroAnswered: {},
  exitAnswered: {},
  exitScore: 0,
  metaAnswers: {},
  timer: { seconds: 45 * 60, running: false, interval: null }
};

/* Lista de 26 estudiantes (puedes editarla) */
const STUDENTS = [
  "Ana M.","Brayan","Carolina","Daniel","Esther","Fátima","Gabriel","Hilda",
  "Isaac","Joselyn","Kevin","Luisa","Manuel","Noelia","Óscar","Patricia",
  "Quirino","Rosa","Samuel","Teresa","Ulises","Valeria","Wilkin","Ximena",
  "Yulissa","Zoé"
];

/* ═════════ INICIALIZACIÓN ═════════ */
window.addEventListener('DOMContentLoaded', () => {
  buildAttendance();
  buildBloodSurvey();
  buildRetroQuiz();
  buildTimeline();
  buildGenoTable();
  buildCompatSelector();
  buildExitQuiz();
  buildMetaTable();
  setupSidebarHover();
  setupKeyboard();
  updateProgress();
});

/* ═════════ NAVEGACIÓN DE SLIDES ═════════ */
function goTo(n) {
  if (n < 0 || n >= STATE.totalSlides) return;
  document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(i => i.classList.remove('active'));
  document.getElementById('slide' + n).classList.add('active');
  document.getElementById('nav' + n).classList.add('active');
  STATE.currentSlide = n;
  updateProgress();
  updatePhaseLabel();
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  const pct = ((STATE.currentSlide + 1) / STATE.totalSlides) * 100;
  document.getElementById('topProg').style.width = pct + '%';
}

function updatePhaseLabel() {
  const phaseLbl = document.getElementById('phaseLbl');
  const segments = document.querySelectorAll('.ph-segment');
  segments.forEach(s => s.classList.remove('active'));
  let phase;
  if (STATE.currentSlide <= 2) phase = 'inicio';
  else if (STATE.currentSlide <= 7) phase = 'desarrollo';
  else phase = 'cierre';
  document.querySelector('.ph-' + phase).classList.add('active');
  phaseLbl.textContent = phase.charAt(0).toUpperCase() + phase.slice(1);
}

/* ═════════ SIDEBAR ═════════ */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  const bb = document.getElementById('burgerBtn');
  const isOpen = sb.classList.contains('open');
  if (isOpen) {
    sb.classList.remove('open');
    ov.classList.remove('show');
    bb.classList.remove('open');
  } else {
    sb.classList.add('open');
    ov.classList.add('show');
    bb.classList.add('open');
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
  document.getElementById('burgerBtn').classList.remove('open');
}

function setupSidebarHover() {
  const hotzone = document.getElementById('sidebarHotzone');
  const sidebar = document.getElementById('sidebar');
  let hideTimer;

  hotzone.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer);
    sidebar.classList.add('open');
    document.getElementById('burgerBtn').classList.add('open');
  });

  sidebar.addEventListener('mouseenter', () => clearTimeout(hideTimer));

  sidebar.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => {
      sidebar.classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('show');
      document.getElementById('burgerBtn').classList.remove('open');
    }, 350);
  });
}

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('lightbox').classList.contains('open')) {
      if (e.key === 'Escape') closeLightbox();
      return;
    }
    if (document.getElementById('pautaModal').classList.contains('open')) {
      if (e.key === 'Escape') closePautaModal();
      return;
    }
    if (e.key === 'ArrowRight') goTo(STATE.currentSlide + 1);
    else if (e.key === 'ArrowLeft') goTo(STATE.currentSlide - 1);
  });
}

/* ═════════ TEMA OSCURO ═════════ */
function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  document.getElementById('themeLabel').textContent = isDark ? '☀️ Claro' : '🌙 Oscuro';
}

/* ═════════ LIGHTBOX ═════════ */
function openLightbox(imgId) {
  const img = document.getElementById(imgId);
  if (!img) return;
  const lb = document.getElementById('lightbox');
  document.getElementById('lbImg').src = img.src;
  lb.classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}
function closeLightboxBg(e) {
  if (e.target.id === 'lightbox') closeLightbox();
}

/* ═════════ MODAL PAUTA ═════════ */
function openPautaModal() {
  document.getElementById('pautaModal').classList.add('open');
}
function closePautaModal() {
  document.getElementById('pautaModal').classList.remove('open');
}

/* ═════════ ASISTENCIA ═════════ */
function buildAttendance() {
  const grid = document.getElementById('attGrid');
  grid.innerHTML = '';
  STUDENTS.forEach((name, i) => {
    const el = document.createElement('div');
    el.className = 'att-item';
    el.textContent = name;
    el.onclick = () => toggleAttendance(i, el);
    grid.appendChild(el);
    STATE.attendance[i] = false;
  });
  updateAttendanceSummary();
}
function toggleAttendance(i, el) {
  STATE.attendance[i] = !STATE.attendance[i];
  el.classList.toggle('present', STATE.attendance[i]);
  updateAttendanceSummary();
}
function markAllPresent() {
  document.querySelectorAll('.att-item').forEach((el, i) => {
    STATE.attendance[i] = true;
    el.classList.add('present');
  });
  updateAttendanceSummary();
}
function resetAttendance() {
  document.querySelectorAll('.att-item').forEach((el, i) => {
    STATE.attendance[i] = false;
    el.classList.remove('present');
  });
  updateAttendanceSummary();
}
function updateAttendanceSummary() {
  const total = STUDENTS.length;
  const present = Object.values(STATE.attendance).filter(v => v).length;
  document.getElementById('attTotal').textContent = total;
  document.getElementById('attPresent').textContent = present;
  document.getElementById('attAbsent').textContent = total - present;
}

/* ═════════ RETRO QUIZ (Slide 1) ═════════ */
const RETRO_QS = [
  {
    q: "¿Qué demostró el experimento con los ratones Agutí?",
    opts: [
      { t: "Que la dieta de la madre cambia la expresión genética sin alterar el ADN", ok: true },
      { t: "Que los genes mutan con la edad", ok: false },
      { t: "Que el color del pelo es solo genético", ok: false }
    ]
  },
  {
    q: "¿Las marcas epigenéticas cambian la secuencia del ADN?",
    opts: [
      { t: "Sí, modifican la secuencia", ok: false },
      { t: "No, solo regulan qué genes se expresan", ok: true },
      { t: "Solo en células reproductoras", ok: false }
    ]
  }
];
function buildRetroQuiz() {
  const cont = document.getElementById('retroQuiz');
  cont.innerHTML = '';
  RETRO_QS.forEach((q, i) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'retro-q';
    qDiv.innerHTML = `<div class="retro-q-text">${i + 1}. ${q.q}</div>`;
    const optsDiv = document.createElement('div');
    optsDiv.className = 'retro-opts';
    q.opts.forEach((o, j) => {
      const btn = document.createElement('button');
      btn.className = 'retro-opt';
      btn.textContent = o.t;
      btn.onclick = () => answerRetro(i, j, o.ok, optsDiv);
      optsDiv.appendChild(btn);
    });
    qDiv.appendChild(optsDiv);
    cont.appendChild(qDiv);
  });
}
function answerRetro(qi, oi, ok, optsDiv) {
  if (STATE.retroAnswered[qi]) return;
  STATE.retroAnswered[qi] = true;
  const btns = optsDiv.querySelectorAll('.retro-opt');
  btns.forEach((b, idx) => {
    const isCorrect = RETRO_QS[qi].opts[idx].ok;
    if (isCorrect) b.classList.add('correct');
    else if (idx === oi) b.classList.add('wrong');
    b.style.pointerEvents = 'none';
  });
}

/* ═════════ ENCUESTA DE SANGRE ═════════ */
const BLOOD_TYPES = ['A', 'B', 'AB', 'O', 'UK'];
const BLOOD_LABELS = { A: 'A', B: 'B', AB: 'AB', O: 'O', UK: 'No lo sé' };

function buildBloodSurvey() {
  const grid = document.getElementById('bloodGrid');
  grid.innerHTML = '';
  BLOOD_TYPES.forEach(t => {
    const btn = document.createElement('div');
    btn.className = 'blood-btn' + (t === 'UK' ? ' unk' : '');
    btn.innerHTML = `
      <div class="bb-type">${BLOOD_LABELS[t]}</div>
      <div class="bb-count" id="bbCount-${t}">0</div>
    `;
    btn.onclick = () => addBlood(t);
    grid.appendChild(btn);
  });
  renderBloodChart();
}
function addBlood(t) {
  STATE.bloodSurvey[t]++;
  document.getElementById('bbCount-' + t).textContent = STATE.bloodSurvey[t];
  renderBloodChart();
}
function resetBlood() {
  BLOOD_TYPES.forEach(t => {
    STATE.bloodSurvey[t] = 0;
    document.getElementById('bbCount-' + t).textContent = 0;
  });
  renderBloodChart();
  document.getElementById('rdCompare').style.display = 'none';
}
function renderBloodChart() {
  const wrap = document.getElementById('chartWrap');
  const total = Object.values(STATE.bloodSurvey).reduce((a, b) => a + b, 0) || 1;
  wrap.innerHTML = '';
  BLOOD_TYPES.forEach(t => {
    const count = STATE.bloodSurvey[t];
    const pct = ((count / total) * 100).toFixed(1);
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <div class="bar-label">${BLOOD_LABELS[t]}</div>
      <div class="bar-track"><div class="bar-fill ${t}" style="width:${pct}%"></div></div>
      <div class="bar-pct">${pct}% (${count})</div>
    `;
    wrap.appendChild(row);
  });
}
function compareRD() {
  document.getElementById('rdCompare').style.display = 'block';
}

/* ═════════ LÍNEA DEL TIEMPO (Slide 3) ═════════ */
const TIMELINE = [
  {
    year: "1628",
    mini: "Circulación",
    title: "William Harvey describe la circulación sanguínea",
    text: "El médico inglés William Harvey publica su teoría de que la sangre circula por el cuerpo bombeada por el corazón. Es la base de toda la hematología moderna.",
    q: "¿Por qué fue revolucionaria esta idea para su época?"
  },
  {
    year: "1665",
    mini: "Primer intento",
    title: "Richard Lower transfunde sangre entre perros",
    text: "El médico Richard Lower realiza la primera transfusión exitosa entre dos perros en Oxford. Demuestra que la sangre puede transferirse, pero aún no se entiende por qué a veces falla.",
    q: "¿Qué riesgos crees que existían al transfundir sangre sin conocer los grupos?"
  },
  {
    year: "1818",
    mini: "Primer humano",
    title: "James Blundell salva a una madre",
    text: "El obstetra inglés James Blundell realiza la primera transfusión humano-humano exitosa para tratar una hemorragia posparto. Aún así, muchas transfusiones fallaban inexplicablemente.",
    q: "¿Qué dato faltaba conocer para evitar muertes por transfusión?"
  },
  {
    year: "1901",
    mini: "Karl Landsteiner ⭐",
    title: "Descubrimiento de los grupos ABO",
    text: "El médico austriaco Karl Landsteiner descubre los grupos sanguíneos A, B y O al mezclar muestras y observar aglutinación. En 1930 recibe el Nobel de Medicina. Es la base de la transfusión moderna.",
    q: "¿Por qué este descubrimiento cambió la medicina para siempre?"
  },
  {
    year: "1902",
    mini: "Grupo AB",
    title: "Se identifica el cuarto grupo: AB",
    text: "Los discípulos de Landsteiner, Alfred von Decastello y Adriano Sturli, descubren el cuarto grupo sanguíneo: AB. Este grupo es especial porque presenta AMBOS antígenos en la superficie del glóbulo rojo.",
    q: "¿Qué fenómeno genético explica que se expresen los dos antígenos?"
  },
  {
    year: "1940",
    mini: "Factor Rh",
    title: "Descubrimiento del Factor Rh",
    text: "Landsteiner y Wiener descubren el Factor Rh estudiando monos Rhesus. Esto explica casos de incompatibilidad entre madre e hijo durante el embarazo (enfermedad hemolítica del recién nacido).",
    q: "¿Por qué el Factor Rh es importante en el embarazo?"
  }
];
function buildTimeline() {
  const track = document.getElementById('timelineTrack');
  track.innerHTML = '';
  TIMELINE.forEach((h, i) => {
    const el = document.createElement('div');
    el.className = 'tl-item';
    el.innerHTML = `<div class="tl-year">${h.year}</div><div class="tl-mini">${h.mini}</div>`;
    el.onclick = () => openTimelineItem(i, el);
    track.appendChild(el);
  });
}
function openTimelineItem(i, el) {
  document.querySelectorAll('.tl-item').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  const h = TIMELINE[i];
  const detail = document.getElementById('timelineDetail');
  detail.innerHTML = `
    <div class="td-year">${h.year}</div>
    <div class="td-title">${h.title}</div>
    <div class="td-text">${h.text}</div>
    <div class="td-q">
      <strong>💬 Pregunta de investigación:</strong> ${h.q}
      <input type="text" id="tlInput${i}" placeholder="Escribe tu respuesta y presiona Enter..."
        onkeydown="if(event.key==='Enter') logInvestigation(${i})">
    </div>
  `;
  STATE.timelineOpen = i;
}
function logInvestigation(i) {
  const input = document.getElementById('tlInput' + i);
  if (!input || !input.value.trim()) return;
  const entry = { year: TIMELINE[i].year, q: TIMELINE[i].q, a: input.value.trim() };
  STATE.investigationLog.push(entry);
  renderInvestigationLog();
  input.value = '';
  input.placeholder = '✓ Registrado. Pasa al siguiente hito.';
}
function renderInvestigationLog() {
  const log = document.getElementById('investLog');
  if (!STATE.investigationLog.length) {
    log.className = 'invest-empty';
    log.textContent = 'Aún no has registrado descubrimientos...';
    return;
  }
  log.className = '';
  log.innerHTML = STATE.investigationLog.map(e => `
    <div class="invest-entry">
      <strong>${e.year}</strong> · ${e.q}<br>
      <em>→ ${e.a}</em>
    </div>
  `).join('');
}

/* ═════════ CONSTRUCTOR GENOTIPO → FENOTIPO ═════════ */
const GENO_TABLE = [
  { geno: "I<sup>A</sup>I<sup>A</sup>", correct: "A" },
  { geno: "I<sup>A</sup>i",              correct: "A" },
  { geno: "I<sup>B</sup>I<sup>B</sup>", correct: "B" },
  { geno: "I<sup>B</sup>i",              correct: "B" },
  { geno: "I<sup>A</sup>I<sup>B</sup>", correct: "AB" },
  { geno: "ii",                          correct: "O" }
];
const PHENOTYPES = ['A', 'B', 'AB', 'O'];

function buildGenoTable() {
  const tbl = document.getElementById('genoTable');
  tbl.innerHTML = `
    <tr><th>Genotipo</th><th>Tu respuesta (fenotipo)</th></tr>
  `;
  GENO_TABLE.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="geno-cell">${row.geno}</td>
      <td class="geno-answer" id="genoAns${i}" onclick="pickPhenotype(${i})">— elegir —</td>
    `;
    tbl.appendChild(tr);
  });
}
function pickPhenotype(i) {
  const current = STATE.genoAnswers[i] || null;
  const nextIdx = current ? (PHENOTYPES.indexOf(current) + 1) % PHENOTYPES.length : 0;
  const next = PHENOTYPES[nextIdx];
  STATE.genoAnswers[i] = next;
  const cell = document.getElementById('genoAns' + i);
  cell.textContent = next;
  cell.classList.remove('correct', 'wrong');
  cell.classList.add('filled');
}
function checkGenoTable() {
  let ok = 0;
  GENO_TABLE.forEach((row, i) => {
    const cell = document.getElementById('genoAns' + i);
    cell.classList.remove('filled');
    if (STATE.genoAnswers[i] === row.correct) {
      cell.classList.add('correct');
      ok++;
    } else if (STATE.genoAnswers[i]) {
      cell.classList.add('wrong');
    }
  });
  const fb = document.getElementById('genoFeedback');
  if (ok === GENO_TABLE.length) {
    fb.className = 'ok';
    fb.textContent = `🎉 ¡Perfecto! Has acertado las ${ok} combinaciones. Comprendes los alelos múltiples.`;
  } else {
    fb.className = 'bad';
    fb.textContent = `📚 Acertaste ${ok} de ${GENO_TABLE.length}. Revisa las marcadas en rojo y vuelve a intentarlo.`;
  }
}
function revealGenoTable() {
  GENO_TABLE.forEach((row, i) => {
    STATE.genoAnswers[i] = row.correct;
    const cell = document.getElementById('genoAns' + i);
    cell.textContent = row.correct;
    cell.classList.remove('wrong', 'filled');
    cell.classList.add('correct');
  });
  const fb = document.getElementById('genoFeedback');
  fb.className = 'ok';
  fb.textContent = '⚡ Tabla revelada. Estudia las combinaciones para la próxima clase.';
}
function resetGenoTable() {
  STATE.genoAnswers = {};
  GENO_TABLE.forEach((_, i) => {
    const cell = document.getElementById('genoAns' + i);
    cell.textContent = '— elegir —';
    cell.classList.remove('filled', 'correct', 'wrong');
  });
  document.getElementById('genoFeedback').textContent = '';
  document.getElementById('genoFeedback').className = '';
}

/* ═════════ COMPATIBILIDAD (Slide 6) ═════════ */
const COMPAT = {
  'O-':  { dona: ['O-','O+','A-','A+','B-','B+','AB-','AB+'], recibe: ['O-'], nota: 'Donante universal' },
  'O+':  { dona: ['O+','A+','B+','AB+'], recibe: ['O-','O+'], nota: 'Más común en RD' },
  'A-':  { dona: ['A-','A+','AB-','AB+'], recibe: ['O-','A-'], nota: '' },
  'A+':  { dona: ['A+','AB+'], recibe: ['O-','O+','A-','A+'], nota: '' },
  'B-':  { dona: ['B-','B+','AB-','AB+'], recibe: ['O-','B-'], nota: '' },
  'B+':  { dona: ['B+','AB+'], recibe: ['O-','O+','B-','B+'], nota: '' },
  'AB-': { dona: ['AB-','AB+'], recibe: ['O-','A-','B-','AB-'], nota: '' },
  'AB+': { dona: ['AB+'], recibe: ['todos'], nota: 'Receptor universal' }
};
function buildCompatSelector() {
  const sel = document.getElementById('compatSelector');
  sel.innerHTML = '';
  Object.keys(COMPAT).forEach(t => {
    const el = document.createElement('div');
    el.className = 'compat-opt';
    el.textContent = t;
    el.onclick = () => pickCompat(t, el);
    sel.appendChild(el);
  });
}
function pickCompat(t, el) {
  document.querySelectorAll('.compat-opt').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  const data = COMPAT[t];
  const res = document.getElementById('compatResult');
  res.style.display = 'block';
  res.innerHTML = `
    <h4>🩸 Resultados para grupo <strong>${t}</strong></h4>
    <div class="compat-row"><strong>Puede donar a:</strong>
      ${data.dona.map(x => `<span class="compat-tag">${x}</span>`).join('')}
    </div>
    <div class="compat-row"><strong>Puede recibir de:</strong>
      ${data.recibe.map(x => `<span class="compat-tag recv">${x}</span>`).join('')}
    </div>
    ${data.nota ? `<p style="margin-top:10px"><strong>💡 ${data.nota}</strong></p>` : ''}
  `;
}

/* ═════════ CASO CLÍNICO (Slide 7) ═════════ */
const CASE_CORRECT = 1;
function answerCase(i) {
  if (STATE.caseAnswered) return;
  STATE.caseAnswered = true;
  const opts = document.querySelectorAll('.case-opt');
  opts.forEach((o, idx) => {
    if (idx === CASE_CORRECT) o.classList.add('correct');
    else if (idx === i) o.classList.add('wrong');
    o.style.pointerEvents = 'none';
  });
  const fb = document.getElementById('caseFeedback');
  fb.classList.add('show');
  if (i === CASE_CORRECT) {
    fb.classList.add('ok');
    fb.innerHTML = `✅ <strong>¡Correcto!</strong> Si Juan es I<sup>A</sup>i y María es I<sup>B</sup>i, ambos pueden transmitir el alelo "i". Si el hijo recibe "i" de cada progenitor, su genotipo será "ii" → grupo O. La abuela estaba equivocada: ¡es perfectamente biológicamente posible!`;
  } else {
    fb.classList.add('bad');
    fb.innerHTML = `❌ Revisa la opción correcta (B). Recuerda que los alelos I<sup>A</sup> e I<sup>B</sup> son dominantes sobre "i", pero el alelo "i" puede estar "oculto" en padres heterocigotos. Si ambos lo llevan, pueden tener un hijo ii (grupo O).`;
  }
}

/* ═════════ QUIZ DE SALIDA (Slide 8) ═════════ */
const EXIT_QS = [
  {
    q: "¿Cuántos alelos del gen ABO existen en la población humana?",
    opts: [
      { t: "2", ok: false },
      { t: "3 (IA, IB e i)", ok: true },
      { t: "4", ok: false }
    ]
  },
  {
    q: "¿Qué fenómeno explica que el grupo AB exprese ambos antígenos?",
    opts: [
      { t: "Dominancia completa", ok: false },
      { t: "Codominancia", ok: true },
      { t: "Recesividad", ok: false }
    ]
  },
  {
    q: "¿Cuál es el genotipo del grupo O?",
    opts: [
      { t: "IAIB", ok: false },
      { t: "IAi", ok: false },
      { t: "ii", ok: true }
    ]
  }
];
function buildExitQuiz() {
  const cont = document.getElementById('exitQuiz');
  cont.innerHTML = '';
  EXIT_QS.forEach((q, i) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'exit-q';
    qDiv.innerHTML = `<div class="exit-q-text">${i + 1}. ${q.q}</div>`;
    const opts = document.createElement('div');
    opts.className = 'exit-opts';
    q.opts.forEach((o, j) => {
      const btn = document.createElement('button');
      btn.className = 'exit-opt';
      btn.textContent = o.t;
      btn.onclick = () => answerExit(i, j, o.ok, opts);
      opts.appendChild(btn);
    });
    qDiv.appendChild(opts);
    cont.appendChild(qDiv);
  });
}
function answerExit(qi, oi, ok, optsDiv) {
  if (STATE.exitAnswered[qi]) return;
  STATE.exitAnswered[qi] = true;
  if (ok) STATE.exitScore++;
  const btns = optsDiv.querySelectorAll('.exit-opt');
  btns.forEach((b, idx) => {
    const isCorrect = EXIT_QS[qi].opts[idx].ok;
    if (isCorrect) b.classList.add('correct');
    else if (idx === oi) b.classList.add('wrong');
    b.style.pointerEvents = 'none';
  });
  if (Object.keys(STATE.exitAnswered).length === EXIT_QS.length) {
    const sc = document.getElementById('exitScore');
    sc.style.display = 'block';
    sc.innerHTML = `🎯 Resultado: <strong>${STATE.exitScore} / ${EXIT_QS.length}</strong> respuestas correctas.`;
  }
}

/* ═════════ RÚBRICA METACOGNITIVA ═════════ */
const META_QS = [
  "¿Comprendí los conceptos de hoy?",
  "¿Participé activamente en clase?",
  "¿Puedo explicar la codominancia con mis palabras?",
  "¿Aplicaría lo aprendido fuera del aula?"
];
function buildMetaTable() {
  const tbl = document.getElementById('metaTable');
  tbl.innerHTML = `<tr><th>Aspecto</th><th>1</th><th>2</th><th>3</th><th>4</th></tr>`;
  META_QS.forEach((q, i) => {
    const tr = document.createElement('tr');
    let cells = `<td class="meta-q">${q}</td>`;
    for (let n = 1; n <= 4; n++) {
      cells += `<td><button class="meta-rad" id="meta-${i}-${n}" onclick="pickMeta(${i},${n})">${n}</button></td>`;
    }
    tr.innerHTML = cells;
    tbl.appendChild(tr);
  });
}
function pickMeta(qi, val) {
  STATE.metaAnswers[qi] = val;
  for (let n = 1; n <= 4; n++) {
    document.getElementById(`meta-${qi}-${n}`).classList.toggle('on', n === val);
  }
}

/* ═════════ EXPORTAR EVIDENCIAS ═════════ */
function exportEvidence() {
  const synth1 = document.getElementById('synth1')?.value || '';
  const synth2 = document.getElementById('synth2')?.value || '';
  const synth3 = document.getElementById('synth3')?.value || '';
  const presentNames = STUDENTS.filter((_, i) => STATE.attendance[i]);

  const lines = [];
  lines.push('═══════════════════════════════════════');
  lines.push('  HEMO-LAB · SESIÓN 9 · EVIDENCIAS');
  lines.push('  Prof. Steve Polanco · 4.° Grado');
  lines.push('  ' + new Date().toLocaleString('es-DO'));
  lines.push('═══════════════════════════════════════\n');

  lines.push('▶ ASISTENCIA');
  lines.push(`Presentes: ${presentNames.length} / ${STUDENTS.length}`);
  lines.push('Lista: ' + (presentNames.join(', ') || '—') + '\n');

  lines.push('▶ ENCUESTA TIPOS DE SANGRE');
  BLOOD_TYPES.forEach(t => lines.push(`  ${BLOOD_LABELS[t]}: ${STATE.bloodSurvey[t]}`));
  lines.push('');

  lines.push('▶ CUADERNO DE INVESTIGACIÓN');
  if (STATE.investigationLog.length) {
    STATE.investigationLog.forEach(e => lines.push(`  [${e.year}] ${e.q}\n    → ${e.a}`));
  } else lines.push('  (sin entradas)');
  lines.push('');

  lines.push('▶ SÍNTESIS PERSONAL');
  lines.push('  Hoy aprendí: ' + synth1);
  lines.push('  Me sorprendió: ' + synth2);
  lines.push('  Tengo dudas: ' + synth3 + '\n');

  lines.push('▶ QUIZ DE SALIDA');
  lines.push(`  Puntaje: ${STATE.exitScore} / ${EXIT_QS.length}\n`);

  lines.push('▶ AUTOEVALUACIÓN METACOGNITIVA');
  META_QS.forEach((q, i) => lines.push(`  ${q} → ${STATE.metaAnswers[i] || '-'}/4`));

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HemoLab_Sesion9_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═════════ CRONÓMETRO ═════════ */
function fmtTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
function renderTimer() {
  document.getElementById('timerDisp').textContent = fmtTime(STATE.timer.seconds);
}
function timerToggle() {
  const btn = document.getElementById('timerStart');
  if (STATE.timer.running) {
    clearInterval(STATE.timer.interval);
    STATE.timer.running = false;
    btn.textContent = '▶ Start';
  } else {
    STATE.timer.running = true;
    btn.textContent = '⏸ Pausa';
    STATE.timer.interval = setInterval(() => {
      if (STATE.timer.seconds <= 0) {
        clearInterval(STATE.timer.interval);
        STATE.timer.running = false;
        btn.textContent = '▶ Start';
        return;
      }
      STATE.timer.seconds--;
      renderTimer();
    }, 1000);
  }
}
function timerReset() {
  clearInterval(STATE.timer.interval);
  STATE.timer.running = false;
  STATE.timer.seconds = 45 * 60;
  document.getElementById('timerStart').textContent = '▶ Start';
  renderTimer();
}

/* ═════════ RULETA DE TURNOS (FAB) ═════════ */
function spinStudentFab() {
  const presentIdx = Object.keys(STATE.attendance).filter(i => STATE.attendance[i]).map(Number);
  const pool = presentIdx.length ? presentIdx.map(i => STUDENTS[i]) : STUDENTS;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const r = document.getElementById('fabResult');
  r.textContent = '🎯 ' + pick;
  r.classList.add('show');
  clearTimeout(spinStudentFab._t);
  spinStudentFab._t = setTimeout(() => r.classList.remove('show'), 3500);
}
/* ═════════ HOJA DE RESPUESTAS IMPRIMIBLE ═════════ */
function generateReport() {
  const name    = document.getElementById('rpStudentName').value.trim();
  const id      = document.getElementById('rpStudentId').value.trim();
  const section = document.getElementById('rpSection').value.trim();

  if (!name) {
    alert('⚠️ Por favor, escribe tu nombre completo antes de generar la hoja.');
    document.getElementById('rpStudentName').focus();
    return;
  }

  const synth1 = document.getElementById('synth1')?.value.trim() || '';
  const synth2 = document.getElementById('synth2')?.value.trim() || '';
  const synth3 = document.getElementById('synth3')?.value.trim() || '';

  const fechaHoy = new Date().toLocaleDateString('es-DO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── RETRO QUIZ
  let retroHTML = '';
  RETRO_QS.forEach((q, i) => {
    const answered = STATE.retroAnswered[i];
    retroHTML += `
      <div class="rp-q">
        <div class="rp-q-text">${i + 1}. ${q.q}</div>
        <div class="rp-q-ans ${answered ? 'ok' : 'empty'}">
          ${answered ? '✓ Respondida en clase' : '— sin responder —'}
        </div>
      </div>`;
  });

  // ── CUADERNO DE INVESTIGACIÓN (línea del tiempo)
  let investHTML = '';
  if (STATE.investigationLog.length) {
    STATE.investigationLog.forEach(e => {
      investHTML += `
        <div class="rp-q">
          <div class="rp-q-text">[${e.year}] ${e.q}</div>
          <div class="rp-q-ans">${e.a}</div>
        </div>`;
    });
  } else {
    investHTML = `<div class="rp-q-ans empty">— sin registros —</div>`;
  }

  // ── CONSTRUCTOR GENOTIPO → FENOTIPO
  let genoHTML = '';
  GENO_TABLE.forEach((row, i) => {
    const ans = STATE.genoAnswers[i];
    const ok = ans === row.correct;
    const cls = !ans ? 'empty' : (ok ? 'ok' : 'bad');
    const mark = !ans ? '—' : (ok ? '✓' : '✗');
    genoHTML += `
      <div class="rp-q">
        <div class="rp-q-text">${row.geno.replace(/<sup>/g,'').replace(/<\/sup>/g,'')} → ?</div>
        <div class="rp-q-ans ${cls}">
          ${mark} Tu respuesta: <strong>${ans || '—'}</strong> · Correcta: <strong>${row.correct}</strong>
        </div>
      </div>`;
  });

  // ── CASO CLÍNICO
  const caseLabels = ['A','B','C'];
  let caseHTML = '';
  if (STATE.caseAnswered) {
    // No guardamos la opción exacta seleccionada; mostramos si acertó
    caseHTML = `<div class="rp-q-ans ok">✓ Caso clínico respondido. Respuesta correcta: <strong>B</strong> (heterocigotos I<sup>A</sup>i × I<sup>B</sup>i).</div>`;
  } else {
    caseHTML = `<div class="rp-q-ans empty">— sin responder —</div>`;
  }

  // ── SÍNTESIS PERSONAL
  const synthHTML = `
    <div class="rp-q">
      <div class="rp-q-text">🆕 Hoy aprendí que...</div>
      <div class="rp-q-ans ${synth1 ? '' : 'empty'}">${synth1 || '— sin responder —'}</div>
    </div>
    <div class="rp-q">
      <div class="rp-q-text">🤔 Lo que más me sorprendió fue...</div>
      <div class="rp-q-ans ${synth2 ? '' : 'empty'}">${synth2 || '— sin responder —'}</div>
    </div>
    <div class="rp-q">
      <div class="rp-q-text">❓ Aún tengo dudas sobre...</div>
      <div class="rp-q-ans ${synth3 ? '' : 'empty'}">${synth3 || '— sin responder —'}</div>
    </div>`;

  // ── QUIZ DE SALIDA
  let exitHTML = '';
  EXIT_QS.forEach((q, i) => {
    const answered = STATE.exitAnswered[i];
    const correctOpt = q.opts.find(o => o.ok).t;
    exitHTML += `
      <div class="rp-q">
        <div class="rp-q-text">${i + 1}. ${q.q}</div>
        <div class="rp-q-ans ${answered ? 'ok' : 'empty'}">
          ${answered ? '✓ Respondida' : '— sin responder —'} · Correcta: <strong>${correctOpt}</strong>
        </div>
      </div>`;
  });
  const exitScoreLine = `<p style="margin-top:8px"><span class="rp-score">Puntaje: ${STATE.exitScore} / ${EXIT_QS.length}</span></p>`;

  // ── RÚBRICA METACOGNITIVA
  let metaHTML = '';
  META_QS.forEach((q, i) => {
    const val = STATE.metaAnswers[i];
    metaHTML += `
      <div class="rp-q">
        <div class="rp-q-text">${q}</div>
        <div class="rp-q-ans ${val ? 'ok' : 'empty'}">
          ${val ? `Nivel marcado: <strong>${val} / 4</strong>` : '— sin marcar —'}
        </div>
      </div>`;
  });

  // ── HTML COMPLETO DEL INFORME
  const html = `
    <div class="rp-head">
      <h1>🩸 HEMO-LAB · SESIÓN 9</h1>
      <div class="rp-sub">Decodificando la Sangre · Grupos sanguíneos ABO</div>
      <div class="rp-sub">Hoja de respuestas del estudiante</div>
    </div>

    <div class="rp-meta">
      <div><strong>Estudiante:</strong> ${name}</div>
      <div><strong>Matrícula / Lista:</strong> ${id || '—'}</div>
      <div><strong>Sección:</strong> ${section || '—'}</div>
      <div><strong>Docente:</strong> Steve Polanco</div>
      <div style="grid-column:1/-1"><strong>Fecha:</strong> ${fechaHoy}</div>
    </div>

    <div class="rp-section">
      <h3>1. Retroalimentación (Sesión 8 · Epigenética)</h3>
      ${retroHTML}
    </div>

    <div class="rp-section">
      <h3>2. Cuaderno de Investigación · Línea del tiempo</h3>
      ${investHTML}
    </div>

    <div class="rp-section">
      <h3>3. Constructor Genotipo → Fenotipo</h3>
      ${genoHTML}
    </div>

    <div class="rp-section">
      <h3>4. Caso clínico · Familia Pérez</h3>
      ${caseHTML}
    </div>

    <div class="rp-section">
      <h3>5. Síntesis personal</h3>
      ${synthHTML}
    </div>

    <div class="rp-section">
      <h3>6. Quiz de salida</h3>
      ${exitHTML}
      ${exitScoreLine}
    </div>

    <div class="rp-section">
      <h3>7. Autoevaluación metacognitiva</h3>
      ${metaHTML}
    </div>

    <div class="rp-foot">
      <div>
        <div class="rp-sign">Firma del estudiante</div>
      </div>
      <div>
        <div class="rp-sign">Firma del docente</div>
      </div>
    </div>

    <p style="text-align:center;margin-top:20px;font-size:.8rem;color:#9ca3af">
      Documento generado automáticamente por Hemo-Lab · Plataforma Educativa MINERD
    </p>
  `;

  const preview = document.getElementById('reportPreview');
  preview.innerHTML = html;
  preview.style.display = 'block';
  document.getElementById('printBtn').disabled = false;
  preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function printReport() {
  window.print();
}
