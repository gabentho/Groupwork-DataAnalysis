const d3 = window.d3; // Utilisation correcte dans le navigateur
console.log("✅ D3.js Version :", d3.version);

// 🎨 Création du SVG
const width = 800, height = 500;
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid white");

// 🔴 Ajout d'un cercle animé
const circle = svg.append("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", 50)
    .attr("fill", "red");

// 📌 Animation pour bouger le cercle
function moveCircle() {
    circle.transition()
        .duration(2000)
        .attr("cx", Math.random() * (width - 100) + 50)
        .attr("cy", Math.random() * (height - 100) + 50)
        .on("end", moveCircle);
}
moveCircle();

// 🎛️ Mode sombre
document.getElementById("toggleTheme").addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
});

// 🗺️ Carte Leaflet
const map = L.map('map').setView([48.8566, 2.3522], 12); // Centré sur Paris

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 📂 Vérification du fichier CSV avant chargement
fetch("data/velib-disponibilite-en-temps-reel-19h.csv")
    .then(response => {
        if (!response.ok) throw new Error("Fichier CSV non trouvé !");
        return response.text();
    })
    .then(text => console.log("📂 Fichier CSV trouvé ✅"))
    .catch(error => console.error("🚨 Erreur : ", error));

// 📂 Chargement des données Velib depuis le CSV
d3.csv("data/velib-disponibilite-en-temps-reel-19h.csv").then(function(data) {
    console.log("📊 Données Velib chargées :", data);

    // 🔹 Nettoyage et conversion des données
    data.forEach(d => {
        d.latitude = +d.latitude;
        d.longitude = +d.longitude;
        d.bikes = +d.bikes;
    });

    // 🔍 Test rapide : Vérification des données chargées
    console.log("🔍 Exemple première ligne :", data[0]);
    alert(`Première station : ${data[0].nom}, 🚲 ${data[0].bikes} vélos`);

    // 📍 Ajout des stations Velib sur la carte
    data.forEach(d => {
        L.marker([d.latitude, d.longitude])
            .addTo(map)
            .bindPopup(`<b>🚲 ${d.nom}</b><br>🟢 Dispos: ${d.bikes}`);
    });

}).catch(function(error) {
    console.error("❌ Erreur de chargement du CSV :", error);
});

// 🔹 Tooltip pour D3.js
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

d3.selectAll("circle")
    .on("mouseover", function (event, d) {
        tooltip.style("opacity", 1)
            .html(`🚲 Station: ${d.nom}<br>📍 ${d.latitude}, ${d.longitude}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function () {
        tooltip.style("opacity", 0);
    });