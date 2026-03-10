// ============================================================
//  2048 — game.js
//  Dipendenze: nessuna (vanilla JS)
//  Il server si aspetta POST /api/score { punteggio, mosse }
// ============================================================

const GRID_SIZE = parseInt(document.querySelector(".board").dataset.size) || 4;

// ---- STATE ----
let griglia   = [];
let punteggio = 0;
let mosse     = 0;
let gameOver  = false;
let ultimaDirezione = null;

// ---- Componenti ----
const board         = document.querySelector(".board");
const valPunteggio  = document.querySelector(".score-box:nth-child(1) .value");
const valMosse      = document.querySelector(".score-box:nth-child(3) .value");

// ============================================================
//  Inizializzazione
// ============================================================
function inizia() {
    griglia   = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    punteggio = 0;
    mosse     = 0;
    gameOver  = false;
    ultimaDirezione = null;
    avviaTimer();
    inizializzaBoard();
    aggiungiTileRandom();
    aggiungiTileRandom();
    render();
}

// ---- TIMER ----
let timerInterval = null;
let secondi       = 0;

function avviaTimer() {
    clearInterval(timerInterval);
    secondi = 0;
    aggiornaTimerDOM();
    timerInterval = setInterval(() => {
        secondi++;
        aggiornaTimerDOM();
    }, 1000);
}

function fermaTimer() {
    clearInterval(timerInterval);
}

function aggiornaTimerDOM() {
    const mm = String(Math.floor(secondi / 60)).padStart(2, "0");
    const ss = String(secondi % 60).padStart(2, "0");
    document.querySelector(".score-box-timer .value").textContent = `${mm}:${ss}`;
}

// ============================================================
//  TILE RANDOM
// ============================================================
function aggiungiTileRandom() {
    const vuote = [];
    griglia.forEach((riga, r) =>
        riga.forEach((val, c) => { if (val === 0) vuote.push([r, c]); })
    );
    if (vuote.length === 0) return;
    const [r, c] = vuote[Math.floor(Math.random() * vuote.length)];
    griglia[r][c] = Math.random() < 0.9 ? 2 : 4;
}

// ============================================================
//  RENDER
// ============================================================
function render(posizioniFuse = new Set(), posizioniMosse = new Set()) {
    const tiles = board.querySelectorAll(".tile");

    griglia.forEach((riga, r) => {
        riga.forEach((val, c) => {
            const idx  = r * GRID_SIZE + c;
            const tile = tiles[idx];
            if (!tile) return;

            tile.className = val === 0
                ? "tile tile-empty"
                : `tile tile-${Math.min(val, 2048)}`;

            tile.textContent = val === 0 ? "" : val;

            if (posizioniFuse.has(idx)) tile.classList.add("pop");

            // Slide solo sulle tile che si sono effettivamente spostate
            if (posizioniMosse.has(idx) && ultimaDirezione) {
                void tile.offsetWidth;
                tile.classList.add(`slide-${ultimaDirezione}`);
            }
        });
    });

    valPunteggio.textContent = punteggio.toLocaleString("it-IT");
    valMosse.textContent     = mosse;
}

function inizializzaBoard() {
    board.innerHTML = "";
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const tile = document.createElement("div");
        tile.className = "tile tile-empty";
        board.appendChild(tile);
    }
}

// ============================================================
//  LOGICA MOVIMENTO
// ============================================================

// Comprimi una riga verso sinistra e restituisci { riga, punti }
function comprimi(riga) {
    const filtrata = riga.filter(v => v !== 0);
    let punti = 0;
    const merged = [];
    let skip = false;

    for (let i = 0; i < filtrata.length; i++) {
        if (skip) { skip = false; continue; }
        if (i + 1 < filtrata.length && filtrata[i] === filtrata[i + 1]) {
            const val = filtrata[i] * 2;
            merged.push(val);
            punti += val;
            skip = true;
        } else {
            merged.push(filtrata[i]);
        }
    }

    while (merged.length < GRID_SIZE) merged.push(0);
    return { riga: merged, punti };
}

function trasponi(g) {
    return g[0].map((_, c) => g.map(riga => riga[c]));
}

function inverti(g) {
    return g.map(riga => [...riga].reverse());
}

function muovi(direzione) {
    if (gameOver) return;
    ultimaDirezione = direzione;

    let g = griglia.map(r => [...r]);
    let puntiTotali = 0;
    let modificata  = false;

    // Ruota la griglia in modo da lavorare sempre "verso sinistra"
    if (direzione === "su")     g = trasponi(g);
    if (direzione === "giu")    g = inverti(trasponi(g));
    if (direzione === "destra") g = inverti(g);

    g = g.map(riga => {
        const { riga: nuova, punti } = comprimi(riga);
        puntiTotali += punti;
        if (nuova.join() !== riga.join()) modificata = true;
        return nuova;
    });

    // Torna all'orientamento originale
    if (direzione === "su")     g = trasponi(g);
    if (direzione === "giu")    g = trasponi(inverti(g));
    if (direzione === "destra") g = inverti(g);

    if (!modificata) return;

    griglia    = g;
    punteggio += puntiTotali;
    mosse     += 1;

    aggiungiTileRandom();
    render();
    animazioneFusione();

    if (haiVinto())   gestisciVittoria();
    else if (haiPerso()) gestisciSconfitta();
}

// ============================================================
//  WIN / LOSE
// ============================================================
function haiVinto() {
    return griglia.some(riga => riga.includes(2048));
}

function haiPerso() {
    // Controlla se esistono mosse disponibili
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (griglia[r][c] === 0) return false;
            if (c + 1 < GRID_SIZE && griglia[r][c] === griglia[r][c + 1]) return false;
            if (r + 1 < GRID_SIZE && griglia[r][c] === griglia[r + 1][c]) return false;
        }
    }
    return true;
}

function gestisciVittoria() {
    gameOver = true;
    fermaTimer();
    salvaScore();
    mostraOverlay("HAI VINTO!", `Tempo: ${aggiornaTimerDOM()}`);
}

function gestisciSconfitta() {
    gameOver = true;
    fermaTimer();
    salvaScore();
    mostraOverlay("GAME OVER", "Nessuna mossa disponibile.");
}

// ============================================================
//  OVERLAY
// ============================================================
function mostraOverlay(titolo, msg) {
    const existing = document.querySelector(".overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
        <div class="overlay-box">
            <h2>${titolo}</h2>
            <p>${msg}</p>
            <p class="overlay-score">Punteggio: <strong>${punteggio.toLocaleString("it-IT")}</strong></p>
            <button class="btn btn-primary" onclick="inizia()">↺ RIGIOCA</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ============================================================
//  ANIMAZIONE FUSIONE
// ============================================================
function animazioneFusione() {
    document.querySelectorAll(".tile:not(.tile-empty)").forEach(tile => {
        tile.classList.remove("pop");
        // Forza reflow per riavviare l'animazione
        void tile.offsetWidth;
        tile.classList.add("pop");
    });
}

// ============================================================
//  SALVATAGGIO SCORE (backend)
// ============================================================
async function salvaScore() {
    try {
        await fetch("/api/score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ punteggio, mosse })
        });
    } catch (err) {
        console.error("Errore salvataggio score:", err);
    }
}

// ============================================================
//  INPUT — TASTIERA
// ============================================================
document.addEventListener("keydown", e => {
    const mappa = {
        ArrowUp:    "su",
        ArrowDown:  "giu",
        ArrowLeft:  "sinistra",
        ArrowRight: "destra",
    };
    if (mappa[e.key]) {
        e.preventDefault();
        muovi(mappa[e.key]);
    }
});

// ============================================================
//  SELETTORE DIMENSIONE GRIGLIA
// ============================================================
document.querySelectorAll(".grid-size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const size = parseInt(btn.dataset.size);
        // Aggiorna la variabile globale e ricarica
        window.location.href = `/home?size=${size}`;
    });
});

// ============================================================
//  BOTTONE NUOVA PARTITA
// ============================================================
document.querySelectorAll(".btn-primary").forEach(btn => {
    if (btn.textContent.includes("NUOVA")) {
        btn.addEventListener("click", inizia);
    }
});

document.querySelector(".hamburger").addEventListener("click", () => {
    document.getElementById("hamburger-menu").classList.toggle("open");
});

document.getElementById("btn-logout")?.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
});

// ============================================================
//  START
// ============================================================
inizia();