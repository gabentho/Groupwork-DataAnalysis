const d3 = window.d3; // Utilisation correcte dans le navigateur
console.log("✅ D3.js Version :", d3.version);

// 📂 Chargement des données Velib depuis le CSV
d3.csv("Velib-1303.csv").then(function(data) {
    console.log("📊 Données Velib chargées :", data);

    // 🔹 Nettoyage et conversion des données
    data.forEach(d => {
        d.total = +d["Nombre total vélos disponibles"]; // Nombre total de vélos
    });

    // ✅ Transformation des données pour le Bubble Chart
    const velibData = {
        "name": "Stations Velib",
        "children": data.map(d => ({
            "name": d["Nom station"], 
            "value": d.total 
        })).filter(d => d.value > 0) // On filtre les stations sans vélos
    };

    console.log("🔵 Données formatées pour le Bubble Chart :", velibData);

    // 📍 Création du Bubble Chart avec les données transformées
    document.getElementById("bubblechart").appendChild(createBubbleChart(velibData));

    // 📊 Ajout du graphique des vélos disponibles
    createHistogram(data);
    createPieChart(data);

}).catch(function(error) {
    console.error("❌ Erreur de chargement du CSV :", error);
});

// 📌 Fonction Bubble Chart
function createBubbleChart(data) {
    const width = 600;
    const height = width;

    const color = d3.scaleLinear()
        .domain([0, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    const pack = d3.pack()
        .size([width, height])
        .padding(3);

    const root = pack(d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));

    const svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .attr("width", width)
        .attr("height", height)
        .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 auto; background: ${color(0)}; cursor: pointer;`);

    const node = svg.append("g")
        .selectAll("circle")
        .data(root.descendants().slice(1))
        .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "white")
        .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function () { d3.select(this).attr("stroke", "#000"); })
        .on("mouseout", function () { d3.select(this).attr("stroke", null); })
        .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

    const label = svg.append("g")
        .style("font", "10px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants())
        .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.name);

    svg.on("click", (event) => zoom(event, root));
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v) {
        const k = width / v[2];

        view = v;

        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    function zoom(event, d) {
        focus = d;

        const transition = svg.transition()
            .duration(event.altKey ? 7500 : 750)
            .tween("zoom", d => {
                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                return t => zoomTo(i(t));
            });

        label
            .filter(function (d) { return d.parent === focus || this.style.display === "inline"; })
            .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function (d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function (d) { if (d.parent !== focus) this.style.display = "none"; });
    }

    return svg.node();
}