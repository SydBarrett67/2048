const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;



app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});


// Fallback 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "../public/Chrome-Dinosaur/index.html"));
});

