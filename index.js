const d3 = window.d3; // Utilisation correcte dans le navigateur
console.log("✅ D3.js Version :", d3.version);

// 🎛️ Mode sombre
document.getElementById("toggleTheme").addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
});

// 🗺️ Carte Leaflet
const map = L.map('map').setView([48.8566, 2.3522], 12); // Centré sur Paris
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 📂 Chargement des données Velib depuis le CSV
d3.csv("Velib.csv").then(function(data) {
    console.log("📊 Données Velib chargées :", data);

    console.log("🔍 Exemple première ligne après parsing :", data[0]);
data.forEach(d => {
    console.log(`Station: ${d["Nom station"]}, Mécaniques: ${d.mechanical}, Électriques: ${d.ebike}, Lat: ${d.latitude}, Long: ${d.longitude}`);
});

    // 🔹 Nettoyage et conversion des données
    data.forEach(d => {
        // Séparer la colonne "Coordonnées géographiques" en latitude et longitude
        let coords = d["Coordonnées géographiques"].split(",");
        d.latitude = parseFloat(coords[0]);
        d.longitude = parseFloat(coords[1]);

        // Convertir les valeurs des vélos en nombres
        d.mechanical = +d["Vélos mécaniques disponibles"];
        d.ebike = +d["Vélos électriques disponibles"];
    });

    // 🔍 Vérifier si toutes les données sont bien converties
    console.log("🔍 Exemple première ligne :", data[0]);

    // 📍 Ajout des stations Velib sur la carte
    data.forEach(d => {
        if (!isNaN(d.latitude) && !isNaN(d.longitude)) {
            L.marker([d.latitude, d.longitude])
                .addTo(map)
                .bindPopup(`<b>🚲 ${d["Nom station"]}</b><br>🔵 Mécaniques : ${d.mechanical}<br>⚡ Électriques : ${d.ebike}`);
        }
    });

    // 📊 Création de l'histogramme et du graphique circulaire
    createHistogram(data);
    createPieChart(data);

}).catch(function(error) {
    console.error("❌ Erreur de chargement du CSV :", error);
});

// 📊 Création d'un histogramme de disponibilité des vélos
function createHistogram(data) {
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#histogram")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Création de l'échelle X avec les noms des stations
    const x = d3.scaleBand()
        .domain(data.map(d => d["Nom station"]))
        .range([0, width])
        .padding(0.2);

    // Échelle Y pour le nombre total de vélos
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.mechanical + d.ebike)])
        .nice()
        .range([height, 0]);

    // Ajout des barres
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d["Nom station"]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.mechanical + d.ebike))
        .attr("height", d => height - y(d.mechanical + d.ebike))
        .attr("fill", "steelblue");

    // Ajout des axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));
}

// 🏆 Graphique circulaire : Répartition Mécaniques vs Électriques
function createPieChart(data) {
    const pieWidth = 400, pieHeight = 400, radius = Math.min(pieWidth, pieHeight) / 2;
    const pieSvg = d3.select("#piechart")
        .append("svg")
        .attr("width", pieWidth)
        .attr("height", pieHeight)
        .append("g")
        .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`);

    let totalMechanical = d3.sum(data, d => +d.mechanical);
    let totalElectric = d3.sum(data, d => +d.ebike);

    const pieData = [
        { type: "Mécaniques", value: totalMechanical },
        { type: "Électriques", value: totalElectric }
    ];

    const color = d3.scaleOrdinal()
        .domain(["Mécaniques", "Électriques"])
        .range(["#3498db", "#e74c3c"]);

    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(50).outerRadius(radius);

    pieSvg.selectAll("path")
        .data(pie(pieData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.type))
        .attr("stroke", "white")
        .style("stroke-width", "2px");
}