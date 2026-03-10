document.addEventListener("DOMContentLoaded", () => {

const GRID_SIZE = parseInt(document.querySelector(".board").dataset.size) || 4;

// ---- STATE ----
let griglia         = [];
let punteggio       = 0;
let mosse           = 0;
let gameOver        = false;
let ultimaDirezione = null;
let secondi         = 0;
let timerInterval   = null;

// ---- DOM ----
const board       = document.querySelector(".board");
const elPunteggio = document.querySelector(".score-box:nth-child(1) .value");
const elMosse     = document.querySelector(".score-box:nth-child(3) .value");
const elTimer     = document.querySelector(".score-box-timer .value");

// ---- INIT ----
function inizia() {
    board.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    griglia         = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    punteggio       = 0;
    mosse           = 0;
    gameOver        = false;
    ultimaDirezione = null;

    board.innerHTML = "";
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const t = document.createElement("div");
        t.className = "tile tile-empty";
        board.appendChild(t);
    }

    clearInterval(timerInterval);
    secondi = 0;
    timerInterval = setInterval(() => { secondi++; aggiornaTimer(); }, 1000);
    aggiornaTimer();

    aggiungiRandom();
    aggiungiRandom();
    render();
}

// ---- TIMER ----
function aggiornaTimer() {
    const mm = String(Math.floor(secondi / 60)).padStart(2, "0");
    const ss = String(secondi % 60).padStart(2, "0");
    elTimer.textContent = `${mm}:${ss}`;
}

// ---- TILE RANDOM ----
function aggiungiRandom() {
    const vuote = [];
    griglia.forEach((riga, r) => riga.forEach((v, c) => { if (v === 0) vuote.push([r, c]); }));
    if (!vuote.length) return;
    const [r, c] = vuote[Math.floor(Math.random() * vuote.length)];
    griglia[r][c] = Math.random() < 0.9 ? 2 : 4;
}

// ---- RENDER ----
function render(fuse = new Set(), mosse_ = new Set()) {
    const tiles = board.querySelectorAll(".tile");
    griglia.forEach((riga, r) => riga.forEach((val, c) => {
        const idx  = r * GRID_SIZE + c;
        const tile = tiles[idx];
        if (!tile) return;

        tile.className   = val === 0 ? "tile tile-empty" : `tile tile-${Math.min(val, 2048)}`;
        tile.textContent = val || "";

        if (fuse.has(idx)) tile.classList.add("pop");
        if (mosse_.has(idx) && ultimaDirezione) {
            void tile.offsetWidth;
            tile.classList.add(`slide-${ultimaDirezione}`);
        }
    }));

    elPunteggio.textContent = punteggio.toLocaleString("it-IT");
    elMosse.textContent     = mosse;
}

// ---- LOGICA ----
function comprimi(riga) {
    const f = riga.filter(v => v !== 0);
    let punti = 0;
    const out = [];
    let skip  = false;

    for (let i = 0; i < f.length; i++) {
        if (skip) { skip = false; continue; }
        if (f[i] === f[i + 1]) {
            out.push(f[i] * 2);
            punti += f[i] * 2;
            skip = true;
        } else {
            out.push(f[i]);
        }
    }

    while (out.length < GRID_SIZE) out.push(0);
    return { riga: out, punti };
}

const trasponi = g => g[0].map((_, c) => g.map(r => r[c]));
const inverti  = g => g.map(r => [...r].reverse());

function muovi(dir) {
    if (gameOver) return;
    ultimaDirezione = dir;

    const prima = griglia.map(r => [...r]);
    let g = prima.map(r => [...r]);

    if (dir === "su")     g = trasponi(g);
    if (dir === "giu")    g = inverti(trasponi(g));
    if (dir === "destra") g = inverti(g);

    let puntiTotali = 0;
    let modificata  = false;
    const fuse = new Set();

    g = g.map((riga, r) => {
        const { riga: nuova, punti } = comprimi(riga);
        nuova.forEach((v, c) => { if (v !== riga[c] && v !== 0) fuse.add(r * GRID_SIZE + c); });
        if (nuova.join() !== riga.join()) modificata = true;
        puntiTotali += punti;
        return nuova;
    });

    if (!modificata) return;

    if (dir === "su")     g = trasponi(g);
    if (dir === "giu")    g = trasponi(inverti(g));
    if (dir === "destra") g = inverti(g);

    griglia    = g;
    punteggio += puntiTotali;
    mosse     += 1;

    aggiungiRandom();

    const spostate = new Set();
    griglia.forEach((riga, r) => riga.forEach((v, c) => {
        if (v !== 0 && v !== prima[r][c]) spostate.add(r * GRID_SIZE + c);
    }));

    render(fuse, spostate);

    if (griglia.some(r => r.includes(2048))) fine("HAI VINTO!");
    else if (haiPerso()) fine("GAME OVER");
}

function haiPerso() {
    for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++) {
            if (griglia[r][c] === 0) return false;
            if (c + 1 < GRID_SIZE && griglia[r][c] === griglia[r][c + 1]) return false;
            if (r + 1 < GRID_SIZE && griglia[r][c] === griglia[r + 1][c]) return false;
        }
    return true;
}

function fine(titolo) {
    gameOver = true;
    clearInterval(timerInterval);
    if (griglia.some(r => r.includes(2048))) salvaScore();

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
        <div class="overlay-box">
            <h2>${titolo}</h2>
            <p class="overlay-score">Punteggio: <strong>${punteggio.toLocaleString("it-IT")}</strong></p>
            <p class="overlay-score">Tempo: <strong>${elTimer.textContent}</strong></p>
            <button class="btn btn-primary" onclick="document.querySelector('.overlay').remove(); inizia()">↺ RIGIOCA</button>
        </div>`;
    document.body.appendChild(overlay);
}

// ---- SCORE ----
async function salvaScore() {
    try {
        await fetch("/api/score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: window.USERNAME ?? "anonymous", punteggio, mosse, tempo: secondi })
        });
    } catch (err) {
        console.error("Errore salvataggio score:", err);
    }
}

// ---- INPUT ----
document.addEventListener("keydown", e => {
    const mappa = { ArrowUp: "su", ArrowDown: "giu", ArrowLeft: "sinistra", ArrowRight: "destra" };
    if (mappa[e.key]) { e.preventDefault(); muovi(mappa[e.key]); }
});

document.querySelectorAll(".grid-size-btn").forEach(btn =>
    btn.addEventListener("click", () => window.location.href = `/home?size=${btn.dataset.size}`)
);

document.getElementById("btn-hamburger")?.addEventListener("click", () =>
    document.getElementById("hamburger-menu").classList.toggle("open")
);

document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
        const theme = btn.dataset.theme;
        document.documentElement.setAttribute("data-theme", theme);
        await fetch("/api/tema", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema: theme })
        });
    });
});

document.documentElement.setAttribute("data-theme", window.THEME ?? "dark");

document.getElementById("btn-logout")?.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
});

document.getElementById("btn-nuova")?.addEventListener("click", inizia);

// ---- START ----
inizia();

}); // fine DOMContentLoaded