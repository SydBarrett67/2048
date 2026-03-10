# 2048

Un clone del gioco **2048** costruito con Node.js, Express ed EJS. Supporta autenticazione utente, leaderboard persistente, storico partite e temi personalizzabili.

---

## Features

- Gioco 2048 completo con logica di fusione, rilevamento vittoria e sconfitta
- Autenticazione tramite username (senza password)
- Leaderboard globale — top 10 punteggi salvati su file JSON
- Storico partite per ogni utente
- Timer integrato nella partita
- Temi — dark, light, colorful, syds-choice
- Griglia variabile — 3x3, 4x4, 5x5

---

## Stack

| Layer     | Tecnologia              |
|-----------|-------------------------|
| Backend   | Node.js + Express       |
| Template  | EJS                     |
| Stile     | CSS vanilla             |
| Dati      | File JSON (no database) |
| Sessioni  | express-session         |

---

## Struttura del progetto

```
2048/
├── src/
│   ├── server.js           — server Express, route, API
│   ├── utils.js            — lettura/scrittura file JSON
│   └── jsons/
│       ├── users.json      — utenti registrati
│       └── leaderboard.json
└── public/
    └── pages/
        ├── html/
        │   ├── home.ejs
        │   ├── login.ejs
        │   └── storico.ejs
        ├── style/
        │   ├── home.css
        │   ├── login.css
        │   └── themes/
        │       └── themes.css
        └── js/
            ├── home.js
            ├── login.js
            └── storico.js
```

---

## Installazione

```bash
git clone https://github.com/tuo-username/2048.git
cd 2048
npm install
```

Crea i file dati se non esistono:

```bash
echo "[]" > src/jsons/users.json
echo "[]" > src/jsons/leaderboard.json
```

Avvia il server:

```bash
node src/server.js
```

Apri il browser su [http://localhost:3000/home](http://localhost:3000/home).

---

## API

| Metodo | Route          | Descrizione                        |
|--------|----------------|------------------------------------|
| GET    | /home          | Pagina principale                  |
| GET    | /login         | Pagina di login                    |
| GET    | /storico       | Storico partite (richiede login)   |
| POST   | /api/login     | Login con username                 |
| POST   | /api/logout    | Logout                             |
| GET    | /api/me        | Utente corrente                    |
| POST   | /api/score     | Salva punteggio                    |
| GET    | /api/leaderboard | Leggi classifica                 |
| GET    | /api/storico   | Storico partite utente             |
| POST   | /api/tema      | Cambia tema                        |

---

## Come funziona il gioco

Le frecce direzionali muovono le tile sulla griglia. Tile con lo stesso valore si fondono sommando i loro valori. L'obiettivo è raggiungere la tile **2048**. Il punteggio viene salvato nella leaderboard globale solo se si raggiunge 2048.

---

## Temi disponibili

| Nome        | Descrizione          |
|-------------|----------------------|
| dark        | Scuro (default)      |
| light       | Chiaro               |
| colorful    | Verde terminale      |
| syds-choice | Viola/bordeaux       |

Il tema viene salvato nel profilo utente e ripristinato ad ogni sessione.

---

## Dipendenze

```json
{
  "express": "^4.x",
  "ejs": "^3.x",
  "express-session": "^1.x"
}
```

---

## Licenza

MIT
