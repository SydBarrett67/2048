const express = require("express");
const path = require("path");
const session = require("express-session");
const fs = require("fs");

const { leggiUtenti, salvaUtenti } = require("./utils.js");

const app = express();
const PORT = 3000;

const USERS_PATH = path.join(__dirname, "jsons/users.json");
const LEADERBOARD_PATH = path.join(__dirname, "jsons/leaderboard.json");

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/pages/html'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// ---- SESSION ----
app.use(session({
    secret: "2048-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// ---- HOME ----
app.get("/home", (req, res) => {
    const gridSize = parseInt(req.query.size) || 4;
    const utente   = req.session.utente ?? null;
    res.render("home", {
        titolo: "2048",
        gridSize,
        score: 0,
        record: 8192,
        moves: 0,
        playing: false,
        grid: Array(gridSize * gridSize).fill(0),
        leaderboard: [],
        userLoggedIn: !!utente,
        user: utente ?? { nome: "", avatar: null }
    });
});

// ---- LOGIN ----
app.get("/login", (req, res) => {
    if (req.session.utente) return res.redirect("/home");
    res.render("login");
});

// ---- API ----

// Login — solo username
app.post("/api/login", (req, res) => {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: "Username mancante" });

    const utenti = leggiUtenti();
    if (!utenti.find(u => u.nome === nome)) {
        utenti.push({ nome, avatar: null });
        salvaUtenti(utenti);
    }

    req.session.utente = { nome, avatar: null };
    res.json({ success: true });
});

// Logout
app.post("/api/logout", (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Utente corrente
app.get("/api/me", (req, res) => {
    if (!req.session.utente)
        return res.status(401).json({ error: "Non loggato" });
    res.json(req.session.utente);
});

// Salva punteggio
app.post("/api/score", (req, res) => {
    const { nome, punteggio, mosse } = req.body;
    const data = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, "utf-8"));

    data.push({ nome, punteggio, mosse, data: new Date().toISOString() });
    data.sort((a, b) => b.punteggio - a.punteggio);

    fs.writeFileSync(LEADERBOARD_PATH, JSON.stringify(data.slice(0, 10), null, 4));
    res.json({ success: true });
});

// Leggi classifica
app.get("/api/leaderboard", (req, res) => {
    const data = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, "utf-8"));
    res.json(data);
});

// ---- FALLBACK 404 ----
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "../public/Chrome-Dinosaur/index.html"));
});

app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});