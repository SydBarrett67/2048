async function caricaStorico() {
    const res  = await fetch("/api/storico");
    const data = await res.json();
    const box  = document.getElementById("storico-box");

    if (!data.length) {
        box.innerHTML = `<div class="storico-empty">Nessuna partita ancora.</div>`;
        return;
    }

    box.innerHTML = data.map(entry => {
        const mm   = String(Math.floor(entry.tempo / 60)).padStart(2, "0");
        const ss   = String(entry.tempo % 60).padStart(2, "0");
        const data = new Date(entry.data).toLocaleDateString("it-IT", {
            day: "2-digit", month: "short", year: "numeric"
        });

        return `
            <div class="storico-card">
                <div>
                    <div class="stat-label">Punteggio</div>
                    <div class="stat-value">${entry.punteggio.toLocaleString("it-IT")}</div>
                </div>
                <div>
                    <div class="stat-label">Mosse</div>
                    <div class="stat-value">${entry.mosse}</div>
                </div>
                <div>
                    <div class="stat-label">Tempo</div>
                    <div class="stat-value">${mm}:${ss}</div>
                </div>
                <div class="stat-data">${data}</div>
            </div>
        `;
    }).join("");
}

caricaStorico();