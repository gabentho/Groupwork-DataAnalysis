console.log("Chargement du script D3.js...");
// Définir la taille du graphique
const width = 800, height = 500;
const svg = d3.select("#chart")
    .attr("width", width)
    .attr("height", height);

// Charger les données CSV
d3.csv("velib-disponibilite-en-temps-reel-11:03.csv").then(data => {
    console.log("Données chargées :", data);

    // Transformer les données
    data.forEach(d => {
        d.latitude = +d.latitude;   // Convertir en nombre
        d.longitude = +d.longitude; // Convertir en nombre
    });

    // Définir les échelles
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.longitude))
        .range([50, width - 50]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.latitude))
        .range([height - 50, 50]);

    // Ajouter des points pour chaque station
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.longitude))
        .attr("cy", d => yScale(d.latitude))
        .attr("r", 5)
        .attr("fill", "steelblue");

    console.log("Visualisation D3.js créée !");
});

