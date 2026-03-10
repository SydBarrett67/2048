const express = require("express");
const path = require("path");
const session = require("express-session");
const fs = require("fs");

const { leggiUtenti, salvaUtenti } = require("./utils.js");

const app = express();
const PORT = 3000;

// const USERS_PATH = path.join(__dirname, "jsons/users.json");
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
    const user   = req.session.user ?? null;

    const leaderboard = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, "utf-8"));

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
        theme: user?.tema ?? "dark"
    });
});

// ---- LOGIN ----
app.get("/login", (req, res) => {
    if (req.session.user) return res.redirect("/home");
    res.render("login");
});

// ---- Storico ----
app.get("/storico", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    res.render("storico", { user: req.session.user });
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

    req.session.user = { nome, avatar: null };
    res.json({ success: true });
});

// Logout
app.post("/api/logout", (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// user corrente
app.get("/api/me", (req, res) => {
    if (!req.session.user)
        return res.status(401).json({ error: "Non loggato" });
    res.json(req.session.user);
});

// Salva punteggio
app.post("/api/score", (req, res) => {
    const { nome, punteggio, mosse, tempo } = req.body;

    // ---- Leaderboard globale ----
    const leaderboard = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, "utf-8"));
    leaderboard.push({ nome, punteggio, mosse, tempo, data: new Date().toISOString() });
    leaderboard.sort((a, b) => b.punteggio - a.punteggio);
    fs.writeFileSync(LEADERBOARD_PATH, JSON.stringify(leaderboard.slice(0, 10), null, 4));

    // ---- Storico user ----
    const utenti = leggiUtenti();
    const user = utenti.find(u => u.nome === nome);
    if (user) {
        if (!user.storico) user.storico = [];
        user.storico.push({ punteggio, mosse, tempo, data: new Date().toISOString() });
        salvaUtenti(utenti);
    }

    res.json({ success: true });
});

app.get("/api/storico", (req, res) => {
    if (!req.session.user)
        return res.status(401).json({ error: "Non loggato" });

    const utenti = leggiUtenti();
    const user = utenti.find(u => u.nome === req.session.user.nome);
    const storico = user?.storico ?? [];

    res.json(storico.reverse());
});

// Leggi classifica
app.get("/api/leaderboard", (req, res) => {
    const data = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, "utf-8"));
    res.json(data);
});

// Temi
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

// ---- FALLBACK 404 ----
app.use((req, res) => {
    res.status(404).send("<h1> Pagina non trovata</h1>");
});

app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});