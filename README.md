# 🏆 Fanta Champions Tracker 2025/26

Applicativo web per seguire la **lotta Champions Fanta** nelle ultime 3 giornate della stagione 2025/26.

---

## 👥 I protagonisti

| Pos | Squadra | Manager | Punti |
|-----|---------|---------|-------|
| 3° | Juventus | Denis Mascherin | 53 pt |
| 4° | Roma | Ale Beltrame | 53 pt |
| 5° | Napoli | Mattia Beltrame | 53 pt |
| 6° | Milan | Lorenzo Moro | 49 pt |

---

## 📁 Struttura del progetto

```
fanta-champions/
├── index.html     # Pagina principale
├── style.css      # Stili e layout responsive
├── app.js         # Logica applicativa
├── data.json      # Dati squadre e calendario
└── README.md      # Questo file
```

---

## 🚀 Come usarlo online

### Opzione 1 — GitHub Pages (consigliata, gratis)

1. Crea un account su [github.com](https://github.com)
2. Crea un nuovo repository (es. `fanta-champions`)
3. Carica tutti e 5 i file nella root del repository
4. Vai su **Settings → Pages → Source → main branch**
5. Il sito sarà disponibile su `https://tuonome.github.io/fanta-champions`

### Opzione 2 — Netlify Drop (più semplice, gratis)

1. Vai su [app.netlify.com/drop](https://app.netlify.com/drop)
2. Trascina la cartella con i file
3. Il sito è online in 30 secondi con URL personalizzabile

### Opzione 3 — Vercel

1. Vai su [vercel.com](https://vercel.com)
2. Importa il progetto da GitHub
3. Deploy automatico ad ogni aggiornamento

---

## 📅 Calendario ultime 3 giornate

### Giornata 36
- **Juventus** vs Milan *(casa)* — ⚔️ Scontro diretto
- **Roma** vs Lazio *(trasferta)* — 🏙️ Derby di Roma
- **Napoli** vs Bologna *(trasferta)* — ✅ Da vincere
- **Milan** vs Juventus *(trasferta)* — ⚔️ Scontro diretto

### Giornata 37
- **Juventus** vs Lazio *(casa)* — ✅ Da vincere
- **Roma** vs Inter *(casa)* — 😬 Gara difficile
- **Napoli** vs Atalanta *(casa)* — ⚠️ Incerto
- **Milan** vs Bologna *(trasferta)* — ✅ Da vincere

### Giornata 38
- **Juventus** vs Roma *(casa)* — 🔥 Spareggio finale
- **Roma** vs Juventus *(trasferta)* — 🔥 Spareggio finale
- **Napoli** vs Inter *(trasferta)* — 😬 Gara difficile
- **Milan** vs Lazio *(trasferta)* — ✅ Da vincere

---

## ✏️ Aggiornare i risultati

Vai sulla sezione **"✏️ Risultati"** nell'app:

- Inserisci i punti fanta ottenuti da ogni squadra in ogni giornata
- Clicca **"Salva risultati"**
- I dati vengono salvati nel browser (localStorage)
- I punti si aggiornano automaticamente in tutta l'app
- Funziona da mobile, tablet e desktop

> **Nota:** i risultati vengono salvati localmente nel browser. Se vuoi che tutti vedano i risultati aggiornati in tempo reale, valuta di usare Firebase Realtime Database (vedi sotto).

---

## 🔥 Aggiornamento in tempo reale (Firebase — opzionale)

Per permettere a tutti di vedere i risultati aggiornati senza dover ricaricare:

1. Crea un progetto su [firebase.google.com](https://firebase.google.com)
2. Attiva **Realtime Database** in modalità test
3. In `app.js`, sostituisci le funzioni `caricaRisultatiSalvati` / `salvaRisultato` con le chiamate Firebase:

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

const firebaseConfig = { /* tua config */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Salva
function salvaRisultato(teamName, giornata, punti) {
  set(ref(db, `risultati/${teamName}_${giornata}`), punti);
}

// Carica in tempo reale
onValue(ref(db, 'risultati'), (snapshot) => {
  const data = snapshot.val() || {};
  // aggiorna UI
});
```

---

## 📱 Responsive

L'applicativo è ottimizzato per:
- 📱 Mobile (da 320px)
- 📟 Tablet (768px)
- 🖥️ Desktop (960px+)

---

## 🎨 Tech stack

- HTML5 puro
- CSS3 con variabili custom
- Vanilla JavaScript (nessuna dipendenza esterna)
- Font: [Syne](https://fonts.google.com/specimen/Syne) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts
- Loghi squadre: Wikipedia Commons (SVG)

---

*Che vinca il migliore — ma soprattutto Denis* 😄⚽