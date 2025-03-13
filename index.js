console.log("✅ D3.js Version :", d3.version);

// 🎨 Initialisation du SVG D3.js
const width = 800, height = 500;
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black");

// 🔴 Exemple : Ajouter un cercle en test
svg.append("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", 50)
    .attr("fill", "red");

// 🌙 Mode Sombre
document.getElementById("toggleTheme").addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
});

// 🗺️ Carte Leaflet
const map = L.map('map').setView([48.8566, 2.3522], 12); // Centré sur Paris

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 🚲 Simulation des données Velib
const data = [
    { nom: "Station 1", latitude: 48.8566, longitude: 2.3522, bikes: 10 },
    { nom: "Station 2", latitude: 48.864716, longitude: 2.349014, bikes: 5 },
    { nom: "Station 3", latitude: 48.852937, longitude: 2.3364, bikes: 8 },
];

// 🔵 Ajouter les stations Velib sur la carte
data.forEach(d => {
    L.marker([d.latitude, d.longitude])
        .addTo(map)
        .bindPopup(`<b>🚲 ${d.nom}</b><br>🟢 Dispos: ${d.bikes}`);
});

// 🔹 Tooltip pour D3.js
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

// 🔴 Ajouter des cercles animés avec les données Velib
svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => Math.random() * width)  // Placement aléatoire pour tester
    .attr("cy", d => Math.random() * height)
    .attr("r", 0) // Commence avec un rayon de 0 pour l'animation
    .attr("fill", "steelblue")
    .transition()
    .duration(1000)
    .attr("r", 10); // Animation d'apparition

// 🎭 Interaction Tooltip
svg.selectAll("circle")
    .on("mouseover", function (event, d) {
        tooltip.style("opacity", 1)
            .html(`🚲 Station: ${d.nom}<br>📍 ${d.latitude}, ${d.longitude}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function () {
        tooltip.style("opacity", 0);
    });