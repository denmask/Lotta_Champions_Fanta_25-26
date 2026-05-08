let appData = null;

// ========== FIREBASE CONFIG ==========
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAXmwA_YQXl-xTvHVwMlkS0TH1MjPQH9fI",
  authDomain: "fanta-lotta-champions.firebaseapp.com",
  databaseURL: "https://fanta-lotta-champions-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fanta-lotta-champions",
  storageBucket: "fanta-lotta-champions.firebasestorage.app",
  messagingSenderId: "349390204519",
  appId: "1:349390204519:web:1a0b4017f532d430352ec2"
};

let firebaseDB = null;
let firebaseRef = null;
let firebaseSet = null;
let firebaseOnValue = null;
let risultatiCache = {};

async function initFirebase() {
  if (!FIREBASE_CONFIG) return false;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getDatabase, ref, set, onValue } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
    const app = initializeApp(FIREBASE_CONFIG);
    firebaseDB = getDatabase(app);
    firebaseRef = ref;
    firebaseSet = set;
    firebaseOnValue = onValue;

    // Ascolta aggiornamenti in tempo reale
    firebaseOnValue(firebaseRef(firebaseDB, 'risultati'), (snapshot) => {
      risultatiCache = snapshot.val() || {};
      const activeSection = document.querySelector('.section.active')?.id;
      if (activeSection === 'calendario') renderCalendario(document.getElementById('giornataFilter')?.value || '');
      if (activeSection === 'classifica') renderClassifica();
      if (activeSection === 'analisi') renderAnalisi();
      if (activeSection === 'grafici') renderGrafici();
      if (activeSection === 'aggiorna') renderAggiorna();
    });

    console.log('✅ Firebase connesso!');
    return true;
  } catch (e) {
    console.warn('Firebase non disponibile, uso localStorage:', e);
    return false;
  }
}

function caricaRisultatiSalvati() {
  if (firebaseDB) return risultatiCache;
  try {
    const saved = localStorage.getItem('fantaChampions_risultati');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

async function salvaRisultato(teamName, giornata, punti) {
  const key = `${teamName}_${giornata}`;
  if (firebaseDB) {
    await firebaseSet(firebaseRef(firebaseDB, `risultati/${key}`), punti);
  } else {
    const all = caricaRisultatiSalvati();
    all[key] = punti;
    localStorage.setItem('fantaChampions_risultati', JSON.stringify(all));
  }
}

function getRisultato(teamName, giornata) {
  const all = caricaRisultatiSalvati();
  const val = all[`${teamName}_${giornata}`];
  return val !== undefined ? Number(val) : null;
}

function getPuntiAttuali(team) {
  let extra = 0;
  [36, 37, 38].forEach(g => {
    const r = getRisultato(team.name, g);
    if (r !== null) extra += r;
  });
  return team.punti + extra;
}

function getPuntiMax(team) {
  const risultatiSalvati = caricaRisultatiSalvati();
  let ptBase = team.punti;
  let ptMax = 0;
  [36, 37, 38].forEach(g => {
    const key = `${team.name}_${g}`;
    if (risultatiSalvati[key] !== undefined) {
      ptBase += Number(risultatiSalvati[key]);
    } else {
      ptMax += 3;
    }
  });
  return ptBase + ptMax;
}

function teamClass(name) {
  const m = { 'Juventus': 'juve', 'Roma': 'roma', 'Napoli': 'napoli', 'Milan': 'milan' };
  return 'team-' + (m[name] || 'juve');
}

function renderStandingsStrip(container) {
  const sorted = [...appData.teams].sort((a, b) => getPuntiAttuali(b) - getPuntiAttuali(a));
  const html = sorted.map((team) => {
    const pos = team.posizione;
    return `
      <div class="standing-card pos-${pos}">
        <div class="standing-pos">${pos}</div>
        <img class="standing-logo" src="${team.logo}" alt="${team.name}" onerror="this.style.opacity='0.3'">
        <div class="standing-info">
          <div class="standing-name">${team.name}</div>
          <div class="standing-manager">${team.manager}</div>
        </div>
        <div class="standing-pts">${getPuntiAttuali(team)} <span>pt</span></div>
      </div>
    `;
  }).join('');

  const strip = document.createElement('div');
  strip.className = 'standings-strip';
  strip.innerHTML = html;
  container.appendChild(strip);
}

function renderCalendario(giornataFiltro) {
  const container = document.getElementById('calendarioContainer');
  container.innerHTML = '';

  renderStandingsStrip(container);

  const giornate = [36, 37, 38];
  const giornateToShow = giornataFiltro ? [parseInt(giornataFiltro)] : giornate;

  const emojiMap = { 36: '⚡', 37: '🔒', 38: '🏁' };

  giornateToShow.forEach(g => {
    const block = document.createElement('div');
    block.className = 'giornata-block';

    const label = document.createElement('div');
    label.className = 'giornata-label';
    label.textContent = `${emojiMap[g] || ''} Giornata ${g}`;
    block.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'matches-grid';

    appData.teams.forEach(team => {
      const match = team.calendario.find(c => c.giornata === g);
      if (!match) return;

      const puntiGiornata = getRisultato(team.name, g);
      const scoreHtml = puntiGiornata !== null
        ? `<span class="match-score-val">${puntiGiornata > 0 ? '+' : ''}${puntiGiornata} pt</span>`
        : `<span class="match-score-val not-played">—</span>`;

      const card = document.createElement('div');
      card.className = `match-card ${teamClass(team.name)}`;
      card.innerHTML = `
        <div class="match-team-header">
          <img class="match-team-logo" src="${team.logo}" alt="${team.name}" onerror="this.style.opacity='0.3'">
          <div>
            <div class="match-team-name">${team.name}</div>
            <div class="match-team-manager">${team.manager}</div>
          </div>
          <div class="match-pts-badge">${getPuntiAttuali(team)} pt</div>
        </div>
        <div class="match-vs">
          <span class="match-vs-text">vs ${match.avversario}</span>
          <span class="match-vs-dove">${match.dove === 'casa' ? '🏠 Casa' : '✈️ Trasferta'}</span>
        </div>
        <span class="match-tipo ${match.tipo}">${match.tipologia_label}</span>
        <div class="match-note">${match.note}</div>
        <div class="match-score-row">
          <span class="match-score-label">Punti fanta:</span>
          ${scoreHtml}
        </div>
      `;
      grid.appendChild(card);
    });

    block.appendChild(grid);
    container.appendChild(block);
  });
}

function renderClassifica() {
  const container = document.getElementById('classificaContainer');
  container.innerHTML = '';

  const sorted = [...appData.teams].sort((a, b) => getPuntiAttuali(b) - getPuntiAttuali(a));

  function getStatus(team, rank) {
    if (rank <= 1) return { label: '⭐ In testa', cls: 'favorita' };
    if (rank <= 2) return { label: '🟡 In lotta', cls: 'in-lotta' };
    if (rank === 3) return { label: '🟠 A rischio', cls: 'in-lotta' };
    return { label: '🔴 In svantaggio', cls: 'in-svantaggio' };
  }

  let html = `
    <div class="classifica-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Squadra</th>
            <th>Pt</th>
            <th>Max</th>
            <th>Stato</th>
          </tr>
        </thead>
        <tbody>
  `;

  sorted.forEach((team, i) => {
    const status = getStatus(team, i + 1);
    const ptAttuali = getPuntiAttuali(team);
    const ptMax = getPuntiMax(team);
    const inZona = i < 2;
    html += `
      <tr class="${inZona ? 'zona-champions' : ''}">
        <td><span class="pos-num">${i + 1}</span></td>
        <td>
          <div class="team-cell-cl">
            <img src="${team.logo}" alt="${team.name}" onerror="this.style.opacity='0.3'">
            <div>
              <span class="tn">${team.name}</span>
              <span class="tm">${team.manager}</span>
            </div>
          </div>
        </td>
        <td><span class="pts-bold">${ptAttuali}</span></td>
        <td><span class="pts-max-col">${ptMax}</span></td>
        <td><span class="status-pill ${status.cls}">${status.label}</span></td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function renderAnalisi() {
  const container = document.getElementById('analisiContainer');
  container.innerHTML = '';

  const commenti = {
    'Juventus': 'Denis è terzo ma ha il calendario più favorevole: affronta il Milan in casa nella 36ª (con 2/3 risultati buoni) e chiude con lo spareggio diretto contro la Roma. Se vince il derby finale, è Champions.',
    'Roma': 'Ale parte alla pari con Juve e Napoli ma ha il calendario più complicato: derby in trasferta, poi l\'Inter, poi lo spareggio a Torino. Serve una rimonta di cuore.',
    'Napoli': 'Mattia ha partita abbordabile alla 36ª (Bologna fuori), poi l\'Atalanta potrebbe essere già appagata, e chiude con l\'Inter. Calendario aperto — dipende tutto dalla 36ª.',
    'Milan': 'Lorenzo parte da -4 rispetto alle altre tre. Deve vincerle tutte, sperando che gli altri facciano punteggio basso. Matematicamente possibile, ma serve un filotto perfetto.'
  };

  const statusMap = {
    'Juventus': { label: '⚔️ Favorita', cls: 'favorita' },
    'Roma': { label: '😬 Difficile', cls: 'difficile' },
    'Napoli': { label: '⚡ Possibile', cls: 'possibile' },
    'Milan': { label: '🔴 In svantaggio', cls: 'in-svantaggio' }
  };

  const sorted = [...appData.teams].sort((a, b) => getPuntiAttuali(b) - getPuntiAttuali(a));

  const grid = document.createElement('div');
  grid.className = 'analisi-grid';

  sorted.forEach(team => {
    const ptAttuali = getPuntiAttuali(team);
    const ptMax = getPuntiMax(team);
    const gareRestanti = [36, 37, 38].filter(g => getRisultato(team.name, g) === null).length;
    const s = statusMap[team.name] || { label: '—', cls: 'possibile' };

    const card = document.createElement('div');
    card.className = `analisi-card ${teamClass(team.name)}`;
    card.innerHTML = `
      <div class="analisi-header">
        <img class="analisi-logo" src="${team.logo}" alt="${team.name}" onerror="this.style.opacity='0.3'">
        <div>
          <div class="analisi-name">${team.name}</div>
          <div class="analisi-manager">${team.manager}</div>
        </div>
        <div class="analisi-status ${s.cls}">${s.label}</div>
      </div>
      <div class="analisi-row">
        <span>Punti attuali</span>
        <span class="val">${ptAttuali}</span>
      </div>
      <div class="analisi-row">
        <span>Punti massimi raggiungibili</span>
        <span class="val green">${ptMax}</span>
      </div>
      <div class="analisi-row">
        <span>Gare ancora da giocare</span>
        <span class="val">${gareRestanti}</span>
      </div>
      <div class="analisi-row">
        <span>Distanza dalla 4ª piazza</span>
        <span class="val orange">${calcolaDistanza(team, sorted)}</span>
      </div>
      <div class="analisi-commento">${commenti[team.name] || ''}</div>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);

  const riepilogo = document.createElement('div');
  riepilogo.style.cssText = 'margin-top:20px;background:#fff;border-radius:14px;padding:18px;box-shadow:0 2px 12px rgba(28,32,60,0.08);';
  riepilogo.innerHTML = `
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:1rem;margin-bottom:10px;color:#2c3e8c;">🎯 Scenario decisivo</div>
    <p style="font-size:0.85rem;color:#555977;line-height:1.7;">
      Tre squadre a <strong>53 punti</strong>, una a <strong>49</strong>. 
      In palio ci sono 9 punti max a testa — due entreranno in Champions, due no.
      La giornata 36 è già una mini-finale: <strong>Juventus–Milan</strong> è uno scontro diretto che può cambiare tutto.
      La giornata 38 con <strong>Juventus–Roma</strong> potrebbe essere il vero spareggio.
      La domanda è: si deciderà già alla 36ª, o si andrà all'ultima giornata?
    </p>
  `;
  container.appendChild(riepilogo);
}

function calcolaDistanza(team, sorted) {
  const mio = getPuntiAttuali(team);
  const quarto = getPuntiAttuali(sorted[3]);
  if (!sorted[3] || sorted[3].name === team.name) return '—';
  const diff = mio - quarto;
  if (diff >= 0) return `+${diff} (in zona)`;
  return `${diff}`;
}

function renderAggiorna() {
  const container = document.getElementById('aggiornaContainer');
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'aggiorna-grid';

  appData.teams.forEach(team => {
    const card = document.createElement('div');
    card.className = 'aggiorna-card';

    const fieldRows = [36, 37, 38].map(g => {
      const match = team.calendario.find(c => c.giornata === g);
      if (!match) return '';
      const salvato = getRisultato(team.name, g);
      return `
        <div class="aggiorna-field">
          <label>G${g} — vs ${match.avversario} (${match.dove})</label>
          <input
            type="number"
            id="input_${team.name}_${g}"
            placeholder="Punti fanta (es: 2)"
            value="${salvato !== null ? salvato : ''}"
          >
          <div class="g-label">${match.tipologia_label}</div>
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <div class="aggiorna-header">
        <img class="aggiorna-logo" src="${team.logo}" alt="${team.name}" onerror="this.style.opacity='0.3'">
        <div>
          <div class="aggiorna-name">${team.name}</div>
          <div class="aggiorna-manager">${team.manager}</div>
        </div>
      </div>
      <div class="aggiorna-fields">${fieldRows}</div>
      <button class="btn-salva" data-team="${team.name}">💾 Salva risultati</button>
    `;

    grid.appendChild(card);
  });

  container.appendChild(grid);

  container.querySelectorAll('.btn-salva').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tName = btn.getAttribute('data-team');
      btn.textContent = '⏳ Salvataggio...';
      btn.disabled = true;
      for (const g of [36, 37, 38]) {
        const inp = document.getElementById(`input_${tName}_${g}`);
        if (inp && inp.value !== '') {
          await salvaRisultato(tName, g, Number(inp.value));
        }
      }
      btn.textContent = '💾 Salva risultati';
      btn.disabled = false;
      mostraToast('✅ Risultati salvati!');
      renderCalendario(document.getElementById('giornataFilter')?.value || '');
    });
  });
}

// ===== GRAFICI =====
let chartInstances = {};

function distruggiGrafici() {
  Object.values(chartInstances).forEach(c => c.destroy());
  chartInstances = {};
}

function renderGrafici() {
  distruggiGrafici();
  const container = document.getElementById('graficiContainer');
  container.innerHTML = '';

  const COLORI = {
    'Juventus': { border: '#1a1a1a', bg: 'rgba(26,26,26,0.15)' },
    'Roma':     { border: '#8B0000', bg: 'rgba(139,0,0,0.15)' },
    'Napoli':   { border: '#1E90FF', bg: 'rgba(30,144,255,0.15)' },
    'Milan':    { border: '#AC0000', bg: 'rgba(172,0,0,0.15)' },
  };
  const CLASSI = { 'Juventus': 'juve', 'Roma': 'roma', 'Napoli': 'napoli', 'Milan': 'milan' };

  const sorted = [...appData.teams].sort((a, b) => getPuntiAttuali(b) - getPuntiAttuali(a));

  // --- STAT CARDS ---
  const statRow = document.createElement('div');
  statRow.className = 'chart-stat-row';
  sorted.forEach(team => {
    const pt = getPuntiAttuali(team);
    const ptMax = getPuntiMax(team);
    const cls = CLASSI[team.name] || '';
    statRow.innerHTML += `
      <div class="chart-stat ${cls}">
        <div class="chart-stat-val">${pt}</div>
        <div class="chart-stat-name">${team.name}</div>
        <div class="chart-stat-label">max ${ptMax} pt</div>
      </div>`;
  });
  container.appendChild(statRow);

  // --- RIGA 2 GRAFICI: Line + Doughnut ---
  const grid = document.createElement('div');
  grid.className = 'grafici-grid';

  // GRAFICO LINEA — andamento punti per giornata
  const lineCard = document.createElement('div');
  lineCard.className = 'chart-card';
  lineCard.innerHTML = `
    <div class="chart-title">📈 Andamento punti <span class="chart-subtitle">per giornata</span></div>
    <div class="chart-wrap"><canvas id="chartLine"></canvas></div>
  `;
  grid.appendChild(lineCard);

  // GRAFICO TORTA — probabilità Champions
  const pieCard = document.createElement('div');
  pieCard.className = 'chart-card';
  pieCard.innerHTML = `
    <div class="chart-title">🏆 Probabilità Champions <span class="chart-subtitle">stima</span></div>
    <div class="chart-wrap"><canvas id="chartDoughnut"></canvas></div>
    <div class="chart-legend" id="legendDoughnut"></div>
  `;
  grid.appendChild(pieCard);

  container.appendChild(grid);

  // --- GRAFICO BARRE: punti attuali vs max ---
  const barCard = document.createElement('div');
  barCard.className = 'chart-card-full grafici-grid-full';
  barCard.innerHTML = `
    <div class="chart-title">📊 Punti attuali vs massimo raggiungibile</div>
    <div class="chart-wrap-tall"><canvas id="chartBar"></canvas></div>
  `;
  container.appendChild(barCard);

  // --- RENDER CHARTS ---

  // LINE CHART
  const giornate = ['Inizio', 'G36', 'G37', 'G38'];
  const lineDatasets = appData.teams.map(team => {
    const puntiBase = team.punti;
    let acc = puntiBase;
    const data = [puntiBase];
    for (const g of [36, 37, 38]) {
      const r = getRisultato(team.name, g);
      if (r !== null) { acc += r; data.push(acc); }
      else { data.push(null); }
    }
    return {
      label: team.name,
      data,
      borderColor: COLORI[team.name].border,
      backgroundColor: COLORI[team.name].bg,
      borderWidth: 2.5,
      pointRadius: 5,
      pointHoverRadius: 7,
      tension: 0.3,
      fill: false,
      spanGaps: false,
    };
  });

  chartInstances.line = new Chart(document.getElementById('chartLine'), {
    type: 'line',
    data: { labels: giornate, datasets: lineDatasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y + ' pt' : 'n.d.'}`
          }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { family: 'DM Sans', size: 11 } },
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'DM Sans', size: 11 } }
        }
      }
    }
  });

  // DOUGHNUT — stima probabilità Champions (basata su punti attuali + max raggiungibile)
  // Formula semplice: più sei vicino al max e più punti hai, più alta la % stimata
  const probRaw = appData.teams.map(team => {
    const pt = getPuntiAttuali(team);
    const max = getPuntiMax(team);
    // peso = punti attuali * 0.6 + max * 0.4
    return Math.max(0, pt * 0.6 + max * 0.4);
  });
  const totProb = probRaw.reduce((a, b) => a + b, 0);
  const probPct = probRaw.map(v => Math.round((v / totProb) * 100));

  chartInstances.doughnut = new Chart(document.getElementById('chartDoughnut'), {
    type: 'doughnut',
    data: {
      labels: appData.teams.map(t => t.name),
      datasets: [{
        data: probPct,
        backgroundColor: appData.teams.map(t => COLORI[t.name].border),
        borderColor: '#fff',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` }
        }
      }
    }
  });

  // legenda custom doughnut
  const legendEl = document.getElementById('legendDoughnut');
  appData.teams.forEach((team, i) => {
    legendEl.innerHTML += `
      <div class="chart-legend-item">
        <div class="chart-legend-dot" style="background:${COLORI[team.name].border}"></div>
        ${team.name} <strong>${probPct[i]}%</strong>
      </div>`;
  });

  // BAR CHART — attuali vs max
  chartInstances.bar = new Chart(document.getElementById('chartBar'), {
    type: 'bar',
    data: {
      labels: sorted.map(t => t.name),
      datasets: [
        {
          label: 'Punti attuali',
          data: sorted.map(t => getPuntiAttuali(t)),
          backgroundColor: sorted.map(t => COLORI[t.name].border),
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Punti max raggiungibili',
          data: sorted.map(t => getPuntiMax(t)),
          backgroundColor: sorted.map(t => COLORI[t.name].bg),
          borderColor: sorted.map(t => COLORI[t.name].border),
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'DM Sans', size: 11 }, boxWidth: 12, padding: 16 }
        },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} pt` }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: Math.min(...appData.teams.map(t => getPuntiAttuali(t))) - 5,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { family: 'DM Sans', size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Barlow Condensed', size: 13, weight: '700' } }
        }
      }
    }
  });
}


function mostraToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function switchSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-pill, .sidebar-link').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(sectionId);
  if (target) target.classList.add('active');

  document.querySelectorAll(`[data-section="${sectionId}"]`).forEach(b => b.classList.add('active'));

  if (sectionId === 'calendario') renderCalendario(document.getElementById('giornataFilter')?.value || '');
  if (sectionId === 'classifica') renderClassifica();
  if (sectionId === 'analisi') renderAnalisi();
  if (sectionId === 'grafici') renderGrafici();
  if (sectionId === 'aggiorna') renderAggiorna();
}

async function init() {
  try {
    const res = await fetch('data.json?v=' + Date.now());
    appData = await res.json();
  } catch (e) {
    console.error('Errore nel caricamento di data.json:', e);
    return;
  }

  const firebaseOk = await initFirebase();
  if (!firebaseOk) {
    risultatiCache = caricaRisultatiSalvati();
  }

  document.querySelectorAll('.nav-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      switchSection(btn.getAttribute('data-section'));
      chiudiSidebar();
    });
  });

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(link.getAttribute('data-section'));
      chiudiSidebar();
    });
  });

  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const closeBtn = document.getElementById('sidebarClose');

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
  });
  overlay.addEventListener('click', chiudiSidebar);
  closeBtn.addEventListener('click', chiudiSidebar);

  function chiudiSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  }
  window.chiudiSidebar = chiudiSidebar;

  document.getElementById('giornataFilter').addEventListener('change', (e) => {
    renderCalendario(e.target.value);
  });

  renderCalendario('');
}

document.addEventListener('DOMContentLoaded', init);