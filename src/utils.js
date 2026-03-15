const fs   = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "/jsons/users.json");

function leggiUtenti() {
    return JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
}

function salvaUtenti(utenti) {
    try {
        fs.writeFileSync(USERS_PATH, JSON.stringify(utenti, null, 4));
        console.log("Salvato correttamente");
    } catch (err) {
        console.error("Errore scrittura:", err);
    }
}

module.exports = { leggiUtenti, salvaUtenti };