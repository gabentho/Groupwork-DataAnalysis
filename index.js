console.log("🔄 Chargement du script D3.js...");

// Définir la taille du graphique
const width = 800, height = 500;

// Ajouter un SVG correctement configuré
const svg = d3.select("#chart")
    .append("svg")  // Il manquait cette ligne !
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black"); // Ajoute une bordure pour voir si le SVG est bien affiché

// Charger les données CSV
d3.csv("./velib-disponibilite-en-temps-reel-11:03.csv").then(data => {
    console.log("✅ Données chargées :", data);

    // Vérifier si les données sont bien lues
    if (data.length === 0) {
        console.error("⚠️ Le fichier CSV est vide ou mal chargé !");
        return;
    }

    // Transformer les données
    data.forEach(d => {
        d.latitude = +d.latitude;   // Convertir en nombre
        d.longitude = +d.longitude; // Convertir en nombre
    });

    console.log("🔹 Coordonnées des 5 premières stations :", data.slice(0, 5));

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
        .attr("cx", d => {
            const x = xScale(d.longitude);
            console.log(`📍 Longitude: ${d.longitude} -> x: ${x}`); // Vérifie les valeurs x
            return x;
        })
        .attr("cy", d => {
            const y = yScale(d.latitude);
            console.log(`📍 Latitude: ${d.latitude} -> y: ${y}`); // Vérifie les valeurs y
            return y;
        })
        .attr("r", 5)
        .attr("fill", "steelblue");

    console.log("🎉 Visualisation D3.js créée !");
}).catch(error => {
    console.error("❌ Erreur lors du chargement du CSV :", error);
});