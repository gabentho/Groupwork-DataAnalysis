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
            .range(["#ff073a", "#9b00ff"]) // Rouge Néon → Violet Électrique
            .interpolate(d3.interpolateHcl);

        const svg = d3.create("svg")
            .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
            .attr("width", width)
            .attr("height", height)
            .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: #111; cursor: pointer;`); 

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

(async function() {
    try {
        // 🚀 Load the Vélib' dataset
        const rawData = await d3.csv("Velib.csv");
        console.log("Vélib' raw data loaded:", rawData);

        // 🚀 Convert hour column to numeric
        rawData.forEach(d => {
            d.hour = +d["hour"];  // Convert hour to number
            d.availableBikes = +d["Nombre total vélos disponibles"]; // Convert to number
        });

        // 🚀 Filter data from 6 AM to 7 PM
        const filteredData = rawData.filter(d => d.hour >= 6 && d.hour <= 19);

        // 🚀 Find the 10 busiest stations (highest variations in bike availability)
        const stationVariations = d3.rollups(filteredData, v => d3.deviation(v, d => d.availableBikes), d => d["Nom station"]);
        const topStations = new Set(stationVariations.sort((a, b) => d3.descending(a[1], b[1])).slice(0, 10).map(d => d[0]));

        // 🚀 Group data by station (only the top 10)
        const stationData = d3.groups(filteredData.filter(d => topStations.has(d["Nom station"])), d => d["Nom station"]);

        // 🚀 Set up dimensions
        const width = 928;
        const height = 500;
        const margin = { top: 30, right: 120, bottom: 50, left: 80 };

        // 🚀 Set up scales
        const x = d3.scaleLinear()
            .domain([6, 19]) // Hours of the day
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.availableBikes)]).nice()
            .range([height - margin.bottom, margin.top]);

        // 🚀 Create line generator (smooth curve)
        const line = d3.line()
            .curve(d3.curveCatmullRom)
            .x(d => x(d.hour))
            .y(d => y(d.availableBikes));

        // 🚀 Create SVG
        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background", "#f9f9f9");

        // 🚀 Define color scale for different stations
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // 🚀 Create group for station lines
        const stationLines = svg.append("g")
            .selectAll("path")
            .data(stationData)
            .join("path")
            .attr("fill", "none")
            .attr("stroke", d => color(d[0]))  // Unique color for each station
            .attr("stroke-width", 2)
            .attr("d", d => line(d[1]))  // Generate path
            .each(function(d) {
                const totalLength = this.getTotalLength();

                d3.select(this)
                    .attr("stroke-dasharray", `${totalLength},${totalLength}`)  // Hide the line
                    .attr("stroke-dashoffset", totalLength)  // Offset to hide it completely
                    .transition()
                    .delay(500)  // Start after a slight delay
                    .duration(3000)  // Animation time
                    .ease(d3.easeLinear)
                    .attr("stroke-dashoffset", 0);  // Reveal the line
            });

        // 🚀 Animate moving points along the lines
        stationData.forEach(station => {
            const stationName = station[0];
            const dataPoints = station[1];

            // Create moving circle for each station
            const movingPoint = svg.append("circle")
                .attr("r", 5)
                .attr("fill", color(stationName))  // Match station color
                .attr("stroke", "white")
                .attr("stroke-width", 1)
                .attr("opacity", 1);  // Start visible

            function animateMovingPoint() {
                movingPoint
                    .transition()
                    .duration(10000) // Adjust speed
                    .ease(d3.easeLinear)
                    .attrTween("transform", function() {
                        return function(t) {
                            const index = Math.floor(t * (dataPoints.length - 1));
                            const d = dataPoints[index];
                            return `translate(${x(d.hour)},${y(d.availableBikes)})`;
                        };
                    })
                    .on("end", animateMovingPoint); // Repeat animation
            }

            animateMovingPoint();
        });

        // 🚀 Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(14).tickFormat(d3.format("02")))
            .append("text")
            .attr("x", width - margin.right)
            .attr("y", 30)
            .attr("fill", "black")
            .attr("text-anchor", "end")
            .text("Time of the Day (Hour)");

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(6))
            .append("text")
            .attr("x", -50)
            .attr("y", margin.top - 20)
            .attr("fill", "black")
            .attr("text-anchor", "start")
            .text("Available Bikes");

        // 🚀 Add tooltip
        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "8px")
            .style("visibility", "hidden");

        // 🚀 Interactivity: Highlight line on hover
        stationLines
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke-width", 4).attr("opacity", 1);
                tooltip.style("visibility", "visible").text(`Station: ${d[0]}`);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke-width", 2).attr("opacity", 0.8);
                tooltip.style("visibility", "hidden");
            });

        // 🚀 Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width - margin.right + 20},${margin.top})`)
            .selectAll("g")
            .data(stationData)
            .join("g")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        legend.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", d => color(d[0]));

        legend.append("text")
            .attr("x", 16)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .text(d => d[0]);

    } catch (error) {
        console.error("Error generating the graph:", error);
    }
})();
