document.getElementById("btn-login").addEventListener("click", async () => {
    const nome = document.getElementById("nome").value.trim();
    if (!nome) {
        document.getElementById("errore").textContent = "Inserisci un username";
        return;
    }

    const res  = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome })
    });
    const data = await res.json();

    if (data.error) {
        document.getElementById("errore").textContent = data.error;
        return;
    }

    window.location.href = "/home";
});