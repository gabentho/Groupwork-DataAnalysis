const d3 = window.d3; // Utilisation correcte dans le navigateur
console.log("✅ D3.js Version :", d3.version);

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

    // ✅ Filtrer les valeurs NaN pour éviter les erreurs Leaflet
    data = data.filter(d => !isNaN(d.latitude) && !isNaN(d.longitude));

    // 🗺️ Carte Leaflet
    const map = L.map('map').setView([48.8566, 2.3522], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 📍 Ajout des stations Velib avec icônes et couleurs dynamiques
    data.forEach(d => {
        let color = d.mechanical + d.ebike > 10 ? "green" : "red";
        let icon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="background:${color};width:10px;height:10px;border-radius:50%;"></div>`,
            iconSize: [10, 10]
        });

        L.marker([d.latitude, d.longitude], { icon: icon })
            .addTo(map)
            .bindPopup(`<b>🚲 ${d.name}</b><br>🔵 Mécaniques : ${d.mechanical}<br>⚡ Électriques : ${d.ebike}`);
    });

    // 📊 Ajout du graphique des vélos disponibles
    createHistogram(data);
    createPieChart(data);

}).catch(function(error) {
    console.error("❌ Erreur de chargement du CSV :", error);
});

// 📊 Création d'un histogramme interactif des vélos
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

    const x = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.mechanical + d.ebike)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(""));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.name))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .style("fill", "steelblue")
        .transition()
        .duration(1000)
        .attr("y", d => y(d.mechanical + d.ebike))
        .attr("height", d => height - y(d.mechanical + d.ebike));
}

// 🏆 Graphique circulaire interactif
function createPieChart(data) {
    const width = 400, height = 400, radius = Math.min(width, height) / 2;
    const svg = d3.select("#piechart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    let totalMechanical = d3.sum(data, d => d.mechanical);
    let totalElectric = d3.sum(data, d => d.ebike);

    const pieData = [
        { type: "Mécaniques", value: totalMechanical },
        { type: "Électriques", value: totalElectric }
    ];

    const color = d3.scaleOrdinal()
        .domain(["Mécaniques", "Électriques"])
        .range(["#3498db", "#e74c3c"]);

    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(50).outerRadius(radius);

    svg.selectAll("path")
        .data(pie(pieData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.type))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .transition()
        .duration(1000)
        .attrTween("d", function(d) {
            const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return function(t) { return arc(interpolate(t)); };
        });
}