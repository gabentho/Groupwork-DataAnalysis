import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://unpkg.com/topojson-client@3?module";




(async function () {
  try {
    const rawData = await d3.csv("Velib.csv", d3.autoType);
    console.log("Données chargées :", rawData);

    const mapData = await d3.json("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/communes.geojson");
    console.log("Données de la carte :", mapData);

    const stationData = rawData.map(d => ({
      name: d["Nom station"],
      lat: +d["latitude"],
      lon: +d["longitude"],
      hour: +d["hour"],
      density: +d["Densite de la Station"],
      capacity: +d["Capacité de la station"],
      borb: +d["Nombre bornettes libres"],
      total: +d["Nombre total vélos disponibles"],
      menanic: +d["Vélos mécaniques disponibles"],
      electrics: +d["Vélos électriques disponibles"]
    }));

    const width = 1300, height = 800;

    const projection = d3.geoMercator()
      .center([2.3522, 48.8566])
      .scale(150000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const color = d => d > 0.7 ? "red" : d > 0.4 ? "orange" : d > 0.1 ? "yellow" : "blue";
    const radius = d3.scaleSqrt()
      .domain(d3.extent(stationData, d => d.density))
      .range([4, 7]);

    const svg = d3.select("#chart")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .on("click", reset);

    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);
    svg.call(zoom);

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

    const stationLayer = g.append("g").attr("id", "stations");

    function clicked(event, d) {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
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
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    }

    function zoomed(event) {
      const { transform } = event;
      g.attr("transform", transform);
      g.attr("stroke-width", 1 / transform.k);
    }

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
      .enter().append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * 25)
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", d => d.color);

    legend.selectAll("text")
      .data(legendData)
      .enter().append("text")
      .attr("x", 30)
      .attr("y", (d, i) => i * 25 + 15)
      .attr("fill", "white")
      .attr("font-size", "14px")
      .text(d => d.label);

    const sliderContainer = d3.select("#slider-container")
      .style("padding", "10px")
      .style("background", "#111");

    const heures_a_garder = [6, 7, 9, 10, 11, 13, 12, 14, 15, 16, 17, 18, 19, 0];

    const sliderLabel = sliderContainer.append("p")
      .attr("id", "slider-label")
      .style("color", "white")
      .style("font-size", "16px")
      .text("Heure sélectionnée : 6h");

    sliderContainer.append("input")
      .attr("type", "range")
      .attr("min", 0)
      .attr("max", heures_a_garder.length - 1)
      .attr("step", 1)
      .attr("value", 0)
      .style("width", "80%")
      .style("margin", "20px 10%")
      .on("input", function () {
        const selectedHour = heures_a_garder[this.value];
        updateCharts(selectedHour);
      });

    function updateCharts(selectedHour) {
      sliderLabel.text(`Heure sélectionnée : ${selectedHour}h`);
      const filteredData = stationData.filter(d => d.hour === +selectedHour);

      const circles = stationLayer.selectAll("circle")
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
          .text(d => `${d.name}\nDensité: ${d.density.toFixed(2)}\nCapacité: ${d.capacity}\nBornettes: ${d.borb}\nVélos: ${d.total}\nMécaniques: ${d.menanic}\nElectriques: ${d.electrics}`),
        update => update.transition().duration(200)
          .attr("r", d => radius(d.density))
          .attr("fill", d => color(d.density)),
        exit => exit.remove()
      );

      barChartTotal(stationData, selectedHour);
      barChartTotalEle(stationData, selectedHour);
    }

    function barChartTotal(data, selectedHour = 6) {
        const width = 700;
        const barHeight = 25;
        const marginTop = 30;
        const marginRight = 20;
        const marginBottom = 30;
        const marginLeft = 200;

        const topStations = data
            .filter(d => d.hour === selectedHour && d.total > 0)
            .sort((a, b) => d3.descending(a.total, b.total))
            .slice(0, 10);

        const height = topStations.length * barHeight + marginTop + marginBottom;

        const x = d3.scaleLinear()
            .domain([0, d3.max(topStations, d => d.total)])
            .range([marginLeft, width - marginRight]);

        const y = d3.scaleBand()
            .domain(topStations.map(d => d.name))
            .rangeRound([marginTop, height - marginBottom])
            .padding(0.1);

        d3.select("#barchart").html("");

        const svg = d3.select("#barchart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .style("background", "#111")
            .style("color", "white")
            .style("font", "12px sans-serif");

        svg.append("g")
            .selectAll("rect")
            .data(topStations)
            .join("rect")
            .attr("x", x(0))
            .attr("y", d => y(d.name))
            .attr("width", d => x(d.menanic) - x(0))
            .attr("height", y.bandwidth())
            .attr("fill", "red");

        // Add blue (électriques)
        svg.append("g")
            .selectAll("rect")
            .data(topStations)
            .join("rect")
            .attr("x", d => x(d.menanic))
            .attr("y", d => y(d.name))
            .attr("width", d => x(d.electrics) - x(0))
            .attr("height", y.bandwidth())
            .attr("fill", "blue");

        // Text total
        svg.append("g")
            .attr("fill", "white")
            .attr("text-anchor", "end")
            .selectAll("text")
            .data(topStations)
            .join("text")
            .attr("x", d => x(d.total) - 5)
            .attr("y", d => y(d.name) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d.total.toFixed(0));

        // Y axis (station names)
        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .attr("fill", "white");

        // X axis (total)
        svg.append("g")
            .attr("transform", `translate(0,${marginTop})`)
            .call(d3.axisTop(x).ticks(width / 80))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .attr("fill", "white");
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
 
        document.getElementById("rond").appendChild(svg.node());
 
    } catch (error) {
        console.error("Erreur dans la génération du graphique :", error);
    }
})();
 
