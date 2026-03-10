const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/pages/html'));

app.use(express.static(path.join(__dirname, '../public')));


// Home and game
app.get("/home", (req, res) => {
    res.render("home", {
        titolo: "2048",
        gridSize: 4,
        score: 0,
        record: 8192,
        moves: 0,
        playing: false,
        grid: Array(16).fill(0),
        leaderboard: [

        ],
        userLoggedIn: true,
        user: {

        }
    });
});


// Listen on port 3000
app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});

// Fallback 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "../public/Chrome-Dinosaur/index.html"));
});

