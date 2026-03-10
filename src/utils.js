const fs   = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../src/jsons/users.json");

function leggiUtenti() {
    return JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
}

function salvaUtenti(utenti) {
    fs.writeFileSync(USERS_PATH, JSON.stringify(utenti, null, 4));
}

module.exports = { leggiUtenti, salvaUtenti };  // ← questa riga è fondamentale