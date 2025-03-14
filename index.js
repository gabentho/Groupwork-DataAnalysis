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
fetch("Velib.csv")
    .then(response => {
        if (!response.ok) throw new Error("Fichier CSV non trouvé !");
        return response.text();
    })
    .then(text => console.log("📂 Fichier CSV trouvé ✅"))
    .catch(error => console.error("🚨 Erreur : ", error));

// 📂 Chargement des données Velib depuis le CSV
d3.csv("Velib.csv").then(function(data) {
    console.log("📊 Données Velib chargées :", data);

    // 🔹 Nettoyage et conversion des données
    data.forEach(d => {
        d.latitude = +d.latitude;
        d.longitude = +d.longitude;
        d.mechanical = +d.mechanical;
        d.ebike = +d.ebike;
    });

    // 🔍 Test rapide : Vérification des données chargées
    console.log("🔍 Exemple première ligne :", data[0]);

    // 📍 Ajout des stations Velib sur la carte
    data.forEach(d => {
        L.marker([d.latitude, d.longitude])
            .addTo(map)
            .bindPopup(`<b>🚲 ${d.name}</b><br>🔵 Mécaniques : ${d.mechanical}<br>⚡ Électriques : ${d.ebike}`);
    });

    // 📊 Histogramme des vélos disponibles
    createHistogram(data);

    // 🏆 Graphique circulaire
    createPieChart(data);

}).catch(function(error) {
    console.error("❌ Erreur de chargement du CSV :", error);
});

// 📊 Création d'un histogramme de disponibilité des vélos
function createHistogram(data) {
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#histogram")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.mechanical + d.ebike)])
        .range([0, width]);

    const histogram = d3.histogram()
        .value(d => d.mechanical + d.ebike)
        .thresholds(x.ticks(20));

    const bins = histogram(data);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height, 0]);

    svg.append("g")
        .selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x0))
        .attr("width", d => x(d.x1) - x(d.x0) - 1)
        .attr("y", d => y(d.length))
        .attr("height", d => height - y(d.length))
        .style("fill", "steelblue");

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

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