let appData = null;

// ========== FIREBASE CONFIG ==========
// Incolla qui la tua config Firebase dopo averla creata
// Leggi il README per istruzioni passo-passo
const FIREBASE_CONFIG = null; // sostituisci con il tuo oggetto config
// Esempio:
// const FIREBASE_CONFIG = {
//   apiKey: "AIza...",
//   authDomain: "fanta-champions.firebaseapp.com",
//   databaseURL: "https://fanta-champions-default-rtdb.firebaseio.com",
//   projectId: "fanta-champions",
//   storageBucket: "fanta-champions.appspot.com",
//   messagingSenderId: "123456789",
//   appId: "1:123456789:web:abc123"
// };

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
      // Ricarica la sezione attiva
      const activeSection = document.querySelector('.section.active')?.id;
      if (activeSection === 'calendario') renderCalendario(document.getElementById('giornataFilter')?.value || '');
      if (activeSection === 'classifica') renderClassifica();
      if (activeSection === 'analisi') renderAnalisi();
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
  const html = sorted.map((team, i) => {
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

  const emojiMap = {
    36: '⚡',
    37: '🔒',
    38: '🏁'
  };

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

  // assegna status narrativo
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
    <div style="font-family:Syne,sans-serif;font-weight:700;font-size:1rem;margin-bottom:10px;color:#2c3e8c;">🎯 Scenario decisivo</div>
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
      // ricarica le sezioni per aggiornare i punti
      renderCalendario(document.getElementById('giornataFilter')?.value || '');
    });
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

  // render sezione
  if (sectionId === 'calendario') renderCalendario(document.getElementById('giornataFilter')?.value || '');
  if (sectionId === 'classifica') renderClassifica();
  if (sectionId === 'analisi') renderAnalisi();
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

  // Inizializza Firebase (se configurato)
  const firebaseOk = await initFirebase();
  if (!firebaseOk) {
    // Carica da localStorage
    risultatiCache = caricaRisultatiSalvati();
  }


  document.querySelectorAll('.nav-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      switchSection(btn.getAttribute('data-section'));
      // chiudi sidebar se aperta
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