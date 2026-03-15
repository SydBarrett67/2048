const express = require("express");
const path = require("path");
const session = require("express-session");
const fs = require("fs");

const { leggiUtenti, salvaUtenti } = require("./utils.js");

const app = express();
const PORT = 3000;

const LEADERBOARD_PATH = path.join(__dirname, "jsons/leaderboard.json");

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/pages/html'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Sessioni con durata di 24 ore
app.use(session({
    secret: "2048-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));


// Pagine

app.get("/home", (req, res) => {
    const gridSize = parseInt(req.query.size) || 4;
    const user = req.session.user ?? null;

    const utenti = leggiUtenti();
    const utenteSalvato = utenti.find(u => u.nome === user?.nome);
    const tema = utenteSalvato?.tema ?? "dark";

    
    const leaderboard = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, "utf-8"));
    leaderboard.sort((a, b) => a.tempo - b.tempo);

    res.render("home", {
        titolo: "2048",
        gridSize,
        score: 0,
        record: 0,
        moves: 0,
        playing: false,
        grid: Array(gridSize * gridSize).fill(0),
        leaderboard,
        userLoggedIn: !!user,
        user: user ?? { nome: "", avatar: null },
        theme: tema || "dark"
    });
});

app.get("/login", (req, res) => {
    // Se già loggato, rimanda direttamente a home
    if (req.session.user) return res.redirect("/home");
    res.render("login");
});

app.get("/storico", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    res.render("storico", { user: req.session.user });
});


// API

// Login solo per username — se non esiste lo crea
app.post("/api/login", (req, res) => {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: "Username mancante" });

    const utenti = leggiUtenti();
    if (!utenti.find(u => u.nome === nome)) {
        utenti.push({ nome, avatar: null, tema: "dark" });
        salvaUtenti(utenti);
    }

    const utente = utenti.find(u => u.nome === nome);
    req.session.user = { nome, avatar: null, tema: utente?.tema ?? "dark" };
    res.json({ success: true });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Salva il punteggio nella leaderboard globale (top 10) e nello storico dell'utente
app.post("/api/score", (req, res) => {
    const { nome, punteggio, mosse, tempo } = req.body;

    const leaderboard = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, "utf-8"));
    leaderboard.push({ nome, punteggio, mosse, tempo, data: new Date().toISOString() });
    leaderboard.sort((a, b) => b.punteggio - a.punteggio);
    fs.writeFileSync(LEADERBOARD_PATH, JSON.stringify(leaderboard.slice(0, 10), null, 4));

    const utenti = leggiUtenti();
    const user = utenti.find(u => u.nome === nome);
    if (user) {
        if (!user.storico) user.storico = [];
        user.storico.push({ punteggio, mosse, tempo, data: new Date().toISOString() });
        salvaUtenti(utenti);
    }

    res.json({ success: true });
});

// Storico partite dell'utente loggato, in ordine dal più recente
app.get("/api/storico", (req, res) => {
    if (!req.session.user)
        return res.status(401).json({ error: "Non loggato" });

    const utenti = leggiUtenti();
    const user = utenti.find(u => u.nome === req.session.user.nome);
    res.json((user?.storico ?? []).reverse());
});

// Aggiorna il tema dell'utente, sia nel JSON che nella sessione attiva
app.post("/api/tema", (req, res) => {
    if (!req.session.user)
        return res.status(401).json({ error: "Non loggato" });

    const { tema } = req.body;
    if (!["dark", "light", "colorful", "syds-choice"].includes(tema))
        return res.status(400).json({ error: "Tema non valido" });

    const utenti = leggiUtenti();
    const utente = utenti.find(u => u.nome === req.session.user.nome);
    if (utente) {
        utente.tema = tema;
        salvaUtenti(utenti);
        req.session.user.tema = tema;
    }

    res.json({ success: true });
});


// Fallback 404
app.use((req, res) => {
    res.status(404).send("<h1>Pagina non trovata</h1>");
});

app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});