import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

(async function() {
    try {
        const rawData = await d3.csv("Velib.csv");
        console.log("Données chargées :", rawData);

        const groupedData = d3.group(rawData, d => d["Nom communes équipées"]);

        const data = {
            name: "root",
            children: Array.from(groupedData, ([city, stations]) => ({
                name: city,
                children: stations.map(d => ({
                    name: d["Nom station"],
                    value: +d["Capacité de la station"]
                }))
            }))
        };

        const root = d3.hierarchy(data)
            .sum(d => d.value || 1)
            .sort((a, b) => b.value - a.value);

        const width = 928;
        const height = width;

        const color = d3.scaleLinear()
            .domain([0, 5])
            .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
            .interpolate(d3.interpolateHcl);

        const svg = d3.create("svg")
            .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
            .attr("width", width)
            .attr("height", height)
            .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 auto; background: ${color(0)}; cursor: pointer;`);

        const pack = d3.pack().size([width, height]).padding(3);
        const rootPacked = pack(root);

        const node = svg.append("g")
            .selectAll("circle")
            .data(rootPacked.descendants().slice(1))
            .join("circle")
            .attr("fill", d => d.children ? color(d.depth) : "white")
            .attr("pointer-events", d => !d.children ? "none" : null)
            .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
            .on("mouseout", function() { d3.select(this).attr("stroke", null); })
            .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

        const label = svg.append("g")
            .style("font", "10px sans-serif")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(rootPacked.descendants())
            .join("text")
            .style("fill-opacity", d => d.depth === 1 ? 1 : 0)
            .style("display", d => d.depth === 1 ? "inline" : "none")
            .text(d => d.data.name);

        svg.on("click", (event) => zoom(event, rootPacked));
        let focus = rootPacked;
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
            const focus0 = focus;
            focus = d;

            const transition = svg.transition()
                .duration(event.altKey ? 7500 : 750)
                .tween("zoom", () => {
                    const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                    return t => zoomTo(i(t));
                });

            label
                .filter(d => d.parent === focus || this.style.display === "inline")
                .transition(transition)
                .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
        }

        // 🔹 Ajoute le graphique à la page HTML
        document.getElementById("chart").appendChild(svg.node());

    } catch (error) {
        console.error("Erreur dans la génération du graphique :", error);
    }
})();

import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

(async function() {
    try {
        // 🔹 Charger la carte de Paris (GeoJSON)
        const parisMap = await d3.json("paris.geojson");
        console.log("Carte de Paris chargée :", parisMap);

        // 🔹 Charger les données Vélib' (nécessaire dans cette fonction)
        const rawData = await d3.csv("Velib.csv");
        console.log("Données Vélib' rechargées :", rawData);

        // 🔹 Dimensions de la carte
        const widthMap = 975;
        const heightMap = 610;

        // 🔹 Création du SVG pour la carte
        const svgMap = d3.create("svg")
            .attr("width", widthMap)
            .attr("height", heightMap)
            .attr("viewBox", [0, 0, widthMap, heightMap])
            .attr("style", "width: 100%; height: auto; background: lightgray;");

        const path = d3.geoPath();

        // 🔹 Ajouter la carte de Paris en fond (Utilisation directe de GeoJSON)
        svgMap.append("path")
            .datum(parisMap)  // ✅ Utilisation directe du GeoJSON
            .attr("fill", "#ddd")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1)
            .attr("d", path);

        // 🔹 Ajouter les stations Vélib' en fonction de leur latitude/longitude
        const scaleSize = d3.scaleLinear()
            .domain([0, d3.max(rawData, d => +d["Capacité de la station"])])
            .range([2, 20]); // Taille des spikes

            svgMap.append("g")
            .attr("fill", "red")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "red")
            .attr("stroke-width", 0.5)
            .selectAll("path")
            .data(rawData)
            .join("path")
            .attr("transform", d => {
                const x = +d["Longitude"] || 0;
                const y = +d["Latitude"] || 0;
                console.log(`Station: ${d["Nom station"]}, Coordonnées: (${x}, ${y})`);
                return `translate(${x},${y})`;
            })
            .attr("d", d => spike(scaleSize(+d["Capacité de la station"] || 0)))
            .append("title")
            .text(d => `${d["Nom station"]} - Capacité: ${d["Capacité de la station"]}`);

        // 🔹 Ajouter la carte dans la page HTML
        document.getElementById("map-chart").appendChild(svgMap.node());

    } catch (error) {
        console.error("Erreur lors de l'affichage de la carte de Paris :", error);
    }
})();

// ✅ **Fonction pour générer des spikes**
function spike(length) {
    return `M0,0V-${length}h5V0z`; // Une ligne verticale de hauteur `length`
}