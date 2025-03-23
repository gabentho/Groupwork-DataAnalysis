import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://unpkg.com/topojson-client@3?module";

(async function() {
    try {
        // Charger les données Vélib
        const rawData = await d3.csv("Velib.csv", d3.autoType);
        console.log("Données chargées :", rawData);

        // Charger les données de la carte (France entière)
        const mapData = await d3.json("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/communes.geojson");
        console.log("Données de la carte :", mapData);

        // Préparer les données des stations Vélib
        const stationData = rawData.map(d => ({
            name: d["Nom station"],
            lat: +d["latitude"],
            lon: +d["longitude"],
            hour: +d["hour"],
            density: +d["Densite de la Station"]
        }));

        const width = 1300, height = 800;

        // Définir la projection
        const projection = d3.geoMercator()
            .center([2.3522, 48.8566])  // Centré sur Paris
            .scale(150000)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Définir l'échelle de couleur et de taille
        const color = d => d > 0.7 ? "red" : d > 0.4 ? "orange" : d > 0.1 ? "yellow" : "blue";
        const radius = d3.scaleSqrt()
            .domain(d3.extent(stationData, d => d.density))
            .range([5, 8]);

        // Création du SVG
        const svg = d3.select("#chart")
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("width", width)
            .attr("height", height)
            .on("click", reset);

        const g = svg.append("g");

        // Définition du zoom
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", zoomed);

        svg.call(zoom);

        // Ajouter les communes
        const communes = g.append("g")
            .selectAll("path")
            .data(mapData.features)
            .join("path")
            .attr("d", path)
            .attr("fill", "#111")
            .attr("stroke", "white")
            .attr("stroke-width", 0.5)
            .attr("cursor", "pointer")
            .on("click", clicked);

        communes.append("title")
            .text(d => d.properties.nom);

        const stations = g.append("g")
            .selectAll("circle")
            .data(stationData)
            .join("circle")
            .attr("cx", d => projection([d.lon, d.lat])[0])
            .attr("cy", d => projection([d.lon, d.lat])[1])
            .attr("r", d => radius(d.density))
            .attr("fill", d => color(d.density))
            .attr("stroke", "white")
            .attr("stroke-width", 0.5)
            .append("title")
            .text(d => `${d.name}\nDensité: ${d.density.toFixed(2)}`);

        function clicked(event, d) {
            const [[x0, y0], [x1, y1]] = path.bounds(d);
            event.stopPropagation();
            communes.transition().style("fill", "#111");  
            d3.select(this).transition().style("fill",  "#111");  

            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                d3.pointer(event, svg.node())
            );
        }

        function reset() {
            communes.transition().style("fill", "#111");
            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity
            );
        }

        function zoomed(event) {
            const { transform } = event;
            g.attr("transform", transform);
            g.attr("stroke-width", 1 / transform.k);
        }

        // Ajouter la légende
        const legendData = [
            { color: "red", label: "Densité > 0.7" },
            { color: "orange", label: "0.4 < Densité ≤ 0.7" },
            { color: "yellow", label: "0.1 < Densité ≤ 0.4" },
            { color: "blue", label: "Densité ≤ 0.1" }
        ];

        const legend = svg.append("g")
            .attr("transform", `translate(${width - 150}, 20)`);

        legend.selectAll("rect")
            .data(legendData)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 25)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => d.color);

        legend.selectAll("text")
            .data(legendData)
            .enter()
            .append("text")
            .attr("x", 30)
            .attr("y", (d, i) => i * 25 + 15)
            .attr("fill", "white")
            .attr("font-size", "14px")
            .text(d => d.label);

        // Ajouter le slider pour filtrer les heures
        const sliderContainer = d3.select("#slider-container")
            .style("padding", "10px")
            .style("background", "#111");

        sliderContainer.append("input")
            .attr("type", "range")
            .attr("min", 6)
            .attr("max", 19)
            .attr("value", 6)
            .attr("step", 1)
            .style("width", "80%")
            .style("margin", "20px 10%")
            .on("input", function () {
                updateCharts(this.value);
            });

        const sliderLabel = sliderContainer.append("p")
            .attr("id", "slider-label")
            .text("Heure sélectionnée : 6h");

        function updateCharts(selectedHour) {
            sliderLabel.text(`Heure sélectionnée : ${selectedHour}h`);

            // Filtrer les stations correspondant à l'heure sélectionnée
            const filteredData = stationData.filter(d => d.hour === +selectedHour);

            const circles = g.selectAll("circle")
                .data(filteredData, d => d.name);

            circles.join(
                enter => enter.append("circle")
                    .attr("cx", d => projection([d.lon, d.lat])[0])
                    .attr("cy", d => projection([d.lon, d.lat])[1])
                    .attr("r", d => radius(d.density))
                    .attr("fill", d => color(d.density))
                    .attr("stroke", "white")
                    .attr("stroke-width", 0.5)
                    .append("title")
                    .text(d => `${d.name}\nDensité: ${d.density.toFixed(2)}`),
                update => update
                    .transition().duration(200)
                    .attr("r", d => radius(d.density))
                    .attr("fill", d => color(d.density)),
                exit => exit.remove()
            );
        }

    } catch (error) {
        console.error("Erreur dans la génération du graphique :", error);
    }
})();


(async function() {
    try {
        const rawData = await d3.csv("Velib.csv");
        console.log("Données chargées :", rawData);
 
        const groupedData = d3.group(rawData, d => d["Nom communes équipées"]);
 
        const data = {
            name: "root",
            children: Array.from(groupedData, ([city, stations]) => ({
                name: city,
                children: city === "Paris"
                    ? // Si c'est Paris, on regroupe d'abord par arrondissement
                      Array.from(d3.group(stations, d => d["arrondissement"]), ([arr, arrStations]) => ({
                            name: arr, // Nom de l'arrondissement
                            children: Array.from(d3.group(arrStations, d => d["Nom station"]),
                                ([stationName, records]) => ({
                                    name: stationName,
                                    value: d3.max(records, d => +d["Capacité de la station"])
                                })
                            )
                      }))
                    : // Si ce n'est pas Paris, on met directement les stations sous la ville
                      Array.from(d3.group(stations, d => d["Nom station"]),
                        ([stationName, records]) => ({
                            name: stationName,
                            value: d3.max(records, d => +d["Capacité de la station"])
                        })
                      )
            }))
        };
 
        const root = d3.hierarchy(data)
            .sum(d => d.value || 1)
            .sort((a, b) => b.value - a.value);
 
        const width = 800;
        const height = width;
 
        const pack = d3.pack().size([width, height]).padding(3);
        const rootPacked = pack(root);
 
        const color = d3.scaleLinear()
            .domain([0, 8]) // Ajusté selon tes valeurs (0 → 80)
            .range(["#000000", "#FFFFFF"]) // Noir → Blanc
            .interpolate(d3.interpolateHcl);
 
        const svg = d3.create("svg")
            .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
            .attr("width", width)
            .attr("height", height)
            .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: #111; cursor: pointer;`);
 
        const node = svg.append("g")
            .selectAll("circle")
            .data(rootPacked.descendants().slice(1))
            .join("circle")
            .attr("fill", d => d.children ? color(d.depth) : "#111")
            .attr("pointer-events", d => !d.children ? "none" : null)
            .on("mouseover", function() { d3.select(this).attr("stroke", "red"); })
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
            .text(d => d.data.name)
            .style("fill", "white");
 
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
                .filter(function(d) { return d.parent === focus || (this && this.style && this.style.display === "inline"); })
                .transition(transition)
                .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
        }
 
        document.getElementById("chart").appendChild(svg.node());
 
    } catch (error) {
        console.error("Erreur dans la génération du graphique :", error);
    }
})();
 


