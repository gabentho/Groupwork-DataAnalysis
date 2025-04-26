import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";



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
      electrics: +d["Vélos électriques disponibles"],
      arrondisement: +d["arrondissement"]
    }));

    const width = 1920 , height = 1080;
    let selectedStationName = null;
    let currentHour = 6;
    let sliderAnimationInterval = null;
    const projection = d3.geoMercator()
      .center([2.3522, 48.8566])
      .scale(150000)
      .translate([width / 2 - 400, height / 2]);

    const path = d3.geoPath().projection(projection);

    const color = d => d > 0.7 ? "#DD0E82" : d > 0.4 ? "#B57EB3" : d > 0.1 ? "#F7B000" : "#6793C8";
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
      .attr("fill", "#000")
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
      selectedStationName = null;
      syncSliderToHour(currentHour);
      d3.select("#barchart").style("display", "block").html("");
      barChartTotal(stationData, currentHour);

    
      d3.select("#linechart").html("").style("display", "none");
      d3.select("#station-dashboard").style("display", "none");
      d3.select("#barchart1").style("display", "none");
    
      stationLayer.selectAll("circle")
        .transition()
        .duration(500)
        .style("opacity", 1);
    
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity)
        .on("end", () => {
          svg.selectAll(".zoom-label").remove();
        });
    }

    function zoomed(event) {
      const { transform } = event;
      g.attr("transform", `translate(${transform.x - 400}, ${transform.y}) scale(${transform.k})`);
      g.attr("stroke-width", 1 / transform.k);
      svg.selectAll(".zoom-label").remove();
      d3.select("#linechart").html("");
      d3.select("#station-dashboard").style("display", "none");;
      
    }
  
    const legendData = [
      { color: "#DD0E82", label: "Density > 0.7" },
      { color: "#B57EB3", label: "0.4 < Density ≤ 0.7" },
      { color: "#F7B000", label: "0.1 < Density ≤ 0.4" },
      { color: "#6793C8", label: "Density ≤ 0.1" }
    ];

    const legend = svg.append("g")
      .attr("transform", `translate(20, 20)`); 

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
      .attr("font-size", "12px")
      .text(d => d.label);

    const sliderContainer = d3.select("#slider-container")
      .style("padding", "10px")
      .style("background", "transparent");

    const heures_a_garder = [6, 7, 9, 10, 11, 13, 12, 14, 15, 16, 17, 18, 19];

    const sliderLabel = sliderContainer.append("p")
      .attr("id", "slider-label")
      .text("6H");

    sliderContainer.append("input")
      .attr("type", "range")
      .attr("min", 0)
      .attr("max", heures_a_garder.length - 1)
      .attr("step", 1)
      .attr("value", 0)
      .attr("class", "range")
      .style("width", "400px")
      .style("margin", "20px 10%")
      .on("input", function () {
        currentHour = heures_a_garder[this.value]; 
        updateCharts(currentHour);
      });

    function zoomToStation([lon, lat], r = 150, name = "", selectedHour = currentHour) {
        const [x, y] = projection([lon, lat]);
        const finalScale = height / r;
        const intermediateScale = 0.9;
        const cx = width / 2, cy = height / 2;
      
        svg.selectAll(".zoom-label").remove();
        stationLayer.selectAll("circle")
          .each(function(d) {
            d3.select(this).style("opacity", d.name === name ? 1 : 0);
          });
      
        svg.transition()
          .duration(1000)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(cx, cy)
              .scale(intermediateScale)
              .translate(-cx+400, -cy)
          )
          .transition()
          .duration(1000)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(cx, cy)
              .scale(finalScale)
              .translate(-x, -y)
          )
          .on("end", () => {
            svg.append("text")
              .attr("class", "zoom-label")
              .attr("x", cx-400)
              .attr("y", cy)
              .attr("text-anchor", "middle")
              .attr("dy", ".35em")
              .text(name)
              .attr("fill", "white")
              .attr("font-size", "16px")
              .attr("font-weight", "bold");
      
            selectedStationName = name;
            syncSliderToHour(currentHour);
            createLineChart(name);
            updateStationDashboard(name, selectedHour);
            d3.select("#linechart").style("display", "block");
            d3.select("#barchart1").style("display", "block");
            d3.select("#station-dashboard").style("display", "block");
            d3.select("#barchart").style("display", "none");
          });
      }






    function updateCharts(selectedHour) {
        sliderLabel.text(`${selectedHour}h`);
      
        const filteredData = stationData.filter(d => d.hour === +selectedHour);
      
        const circles = stationLayer.selectAll("circle")
          .data(filteredData, d => d.name);
        currentHour = selectedHour; 
      
        circles.join(
          enter => enter.append("circle")
            .attr("cx", d => projection([d.lon, d.lat])[0])
            .attr("cy", d => projection([d.lon, d.lat])[1])
            .attr("r", d => radius(d.density))
            .attr("fill", d => color(d.density))
            .attr("stroke", "white")
            .attr("stroke-width", 0.5)
            .on("click", (event, d) => {
              event.stopPropagation();
              selectedStationName = d.name;
              zoomToStation([d.lon, d.lat], 50, d.name, selectedHour);
              animateSlider(14000);
              syncSliderToHour(currentHour);
              updateCharts(selectedHour); 
            })
            .on("dblclick", reset)
            .append("title")
            .text(d => `${d.name}\nDensité: ${d.density.toFixed(2)}\nCapacité: ${d.capacity}\nBornettes: ${d.borb}\nVélos: ${d.total}\nMécaniques: ${d.menanic}\nElectriques: ${d.electrics}`),
          update => update.transition().duration(200)
            .attr("r", d => radius(d.density))
            .attr("fill", d => color(d.density)),
          exit => exit.remove()
        );
      
        if (selectedStationName) {
          d3.select("#barchart").style("display", "none");
      
          d3.select("#linechart").style("display", "block");
          d3.select("#barchart1").style("display", "block");
          d3.select("#station-dashboard").style("display", "block");
      
          createLineChart(selectedStationName);
          updateStationDashboard(selectedStationName, selectedHour);
        } else {
          d3.select("#barchart").style("display", "block");
      
          d3.select("#linechart").style("display", "none");
          d3.select("#barchart1").style("display", "none");
          d3.select("#station-dashboard").style("display", "none");
      
          barChartTotal(stationData, selectedHour);
        }
      }
    function syncSliderToHour(hour) {
        const index = heures_a_garder.indexOf(hour);
        d3.select("input.range").property("value", index);
        sliderLabel.text(`${hour}h`);
    }

    function barChartTotal(data, selectedHour = 6) {
        const width = 550;
        const barHeight = 25;
        const marginTop = 30;
        const marginRight = 10;
        const marginBottom = 40;
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
            .style("background", "transparent")
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
            .attr("fill", "#6793C8");

        svg.append("g")
            .selectAll("rect")
            .data(topStations)
            .join("rect")
            .attr("x", d => x(d.menanic))
            .attr("y", d => y(d.name))
            .attr("width", d => x(d.electrics) - x(0))
            .attr("height", y.bandwidth())
            .attr("fill", "#DD0E82");
            

        svg.append("g")
            .attr("fill", "white")
            .attr("text-anchor", "end")
            .selectAll("text")
            .data(topStations)
            .join("text")
            .attr("x", d => x(d.total) - 5)
            .attr("y", d => y(d.name) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d.total.toFixed(0))
    

        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .attr("fill", "white")
            .on("mouseover", function () {
              d3.select(this).attr("fill", "#B57EB3");
            })
            .on("mouseout", function () {
              d3.select(this).attr("fill", "white");
            })
            .on("click", (event, label) => {
              const station = data.find(d => d.name === label);
              if (station) {
                event.stopPropagation();
                zoomToStation([station.lon, station.lat], 50, station.name,selectedHour);
              }
            })
            ;

        svg.append("g")
            .attr("transform", `translate(0,${marginTop})`)
            .call(d3.axisTop(x).ticks(width / 80))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .attr("fill", "white");
            const legend = svg.append("g")
            .attr("transform", `translate(${width - 160}, ${height - 40})`);
        
          const legendItems = [
            { label: "Mechanical bike", color: "#DD0E82" },
            { label: "Electric bike", color: "#6793C8" }
          ];
        
          legend.selectAll("rect")
            .data(legendItems)
            .join("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", d => d.color);
        
          legend.selectAll("text")
            .data(legendItems)
            .join("text")
            .attr("x", 18)
            .attr("y", (d, i) => i * 20 + 10)
            .text(d => d.label)
            .attr("fill", "white")
            .style("font-size", "12px");
        
            }

        
    
    function createLineChart(stationName) {

              const stationHistory = stationData
                .filter(d => d.name === stationName && d.total > 0)
                .sort((a, b) => a.hour - b.hour); 
            
              if (stationHistory.length === 0) return;
            
              const width = 550;
              const height = 200;
              const margin = { top: 30, right: 30, bottom: 30, left: 50 };
            
              d3.select("#linechart").html("");
              d3.select("#barchart1").html(""); 
              const svg = d3.select("#linechart")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .style("background", "transparent");
            
              const x = d3.scaleLinear()
                .domain(d3.extent(stationHistory, d => d.hour))
                .range([margin.left, width - margin.right]);
            
              const y = d3.scaleLinear()
                .domain([0, d3.max(stationHistory, d => d.total)])
                .range([height - margin.bottom, margin.top]);
            
              const line = d3.line()
                .x(d => x(d.hour))
                .y(d => y(d.total))
                .curve(d3.curveMonotoneX);
            
              svg.append("path")
                .datum(stationHistory)
                .attr("fill", "none")
                .attr("stroke", "#555")
                .attr("stroke-width", 1.5)
                .attr("d", line);
            

              svg.selectAll("circle")
                .data(stationHistory)
                .join("circle")
                .attr("cx", d => x(d.hour))
                .attr("cy", d => y(d.total))
                .attr("r", 4)
                .attr("fill", d => {
                  if (d.density > 0.7) return "#DD0E82";
                  if (d.density > 0.4) return "#B57EB3";
                  if (d.density > 0.1) return "#F7B000";
                  return "blue#6793C8";
                })
                .append("title")
                .text(d => `Heure: ${d.hour}h\nVélos: ${d.total}\nDensité: ${d.density.toFixed(2)}`);
            
              svg.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x)
                  .tickValues(heures_a_garder)
                  .tickFormat(d => `${d}h`))
                .selectAll("text")
                .attr("fill", "white");
            
              svg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y))
                .selectAll("text")
                .attr("fill", "white");
            
              svg.append("text")
                .attr("x", width / 2)
                .attr("y", margin.top - 10)
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .attr("font-size", "16px")
                .text(`Bike availability over time at "${stationName}"`);
            }

  function updateStationDashboard(stationName, selectedHour) {
    const stationInfo = stationData.find(d => d.name === stationName && d.hour === selectedHour);

    d3.select("#station-dashboard")
      .style("display", stationInfo ? "block" : "none");

    if (!stationInfo) return;


    d3.select("#station-name").text(`Station : ${stationInfo.name} à ${selectedHour}h`);

    const metrics = [
      { label: "Total Bikes", value: stationInfo.total, color: "#B1B807" },
      { label: "Mechanical", value: stationInfo.menanic, color: "#DD0E82" },
      { label: "Electric", value: stationInfo.electrics, color: "#6793C8" },
      { label: "Density", value: stationInfo.density, color: "#F7B000" }
    ];

    const svg = d3.select("#dashboard-chart");
    const width = 500;
    svg.attr("width", width); 
    const height = +svg.attr("height");
    const margin = { top: 20, right: 20, bottom: 20, left: 100 };

    const x = d3.scaleLinear()
      .domain([0, d3.max(metrics, d => d.value)])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(metrics.map(d => d.label))
      .range([margin.top, height - margin.bottom])
      .padding(0.3);

    const bars = svg.selectAll("rect")
      .data(metrics, d => d.label);

    bars.exit().remove();

    // Update
    bars.transition().duration(600)
      .attr("x", x(0))
      .attr("width", d => x(d.value) - x(0))
      .attr("y", d => y(d.label))
      .attr("height", y.bandwidth())
      .attr("fill", d => d.color);

    bars.enter()
      .append("rect")
      .attr("x", x(0))
      .attr("y", d => y(d.label))
      .attr("height", y.bandwidth())
      .attr("fill", d => d.color)
      .attr("width", 0)
      .transition().duration(600)
      .attr("width", d => x(d.value) - x(0));

    const labels = svg.selectAll("text").data(metrics, d => d.label);
    labels.exit().remove();

    labels.transition().duration(600)
      .attr("x", d => x(d.value) + 5)
      .attr("y", d => y(d.label) + y.bandwidth() / 2)
      .text(d => d.value.toFixed(0))
      .style("font-size", "12px")
      .attr("fill", "white")
      .attr("alignment-baseline", "middle");

    labels.enter()
      .append("text")
      .style("font-size", "12px")
      .attr("x", d => x(0))
      .attr("y", d => y(d.label) + y.bandwidth() / 2)
      .text(d => d.value.toFixed(0))
      .attr("fill", "white")
      .attr("alignment-baseline", "middle")
      .transition().duration(600)
      .attr("x", d => x(d.value) + 5);
    const metricLabels = svg.selectAll(".metric-label")
    .data(metrics, d => d.label);

    metricLabels.exit().remove();

    metricLabels.enter()
    .append("text")
    .attr("class", "metric-label")
    .attr("x", margin.left - 10)
    .attr("y", d => y(d.label) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .attr("fill", "white")
    .style("font-size", "12px")
    .text(d => d.label);
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
                    ? 
                      Array.from(d3.group(stations, d => d["arrondissement"]), ([arr, arrStations]) => ({
                            name: `Arrondissement ${arr}`, 
                            children: Array.from(d3.group(arrStations, d => d["Nom station"]),
                                ([stationName, records]) => ({
                                    name: stationName,
                                    value: d3.max(records, d => +d["Capacité de la station"])
                                })
                            )
                      }))
                    : 
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
 
        const width = 700;
        const height = width;
 
        const pack = d3.pack().size([width, height]).padding(3);
        const rootPacked = pack(root);
 
        const colorScale = d3.scaleLinear()
          .domain([0, 50, 100]) 
          .range(["#F7B000" ,"#DD0E82"]);
        
        const svg = d3.create("svg")
            .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
            .attr("width", width)
            .attr("height", height)
            .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: transparent cursor: pointer;`);
 
        const node = svg.append("g")
            .selectAll("circle")
            .data(rootPacked.descendants().slice(1))
            .join("circle")
            .attr("fill", d => {
              if (!d.children) {
                return colorScale(d.value); 
              }
              return "transparent"; 
            })
            .attr("pointer-events", d => !d.children ? "none" : null)
            .on("mouseover", function() { d3.select(this).attr("stroke", "#F7B000"); })
            .on("mouseout", function() { d3.select(this).attr("stroke", null); })
            .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));
 
        const label = svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(rootPacked.descendants())
            .join("text")
            .attr("class", d => `node-label depth-${d.depth}`) 
            .style("font-size", d => {
              if (d.depth === 1 && d.data.name === "Paris") return "30px";
              if (d.depth === 1) return "8px";
              if (d.depth === 2) return "8px";
              if (d.depth >= 3) return "7px";
              return "0px";
          })
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

d3.csv("Velib.csv", d3.autoType).then(data => {
  const filtered = data.filter(d => d.arrondissement !== "Hors Paris");

  filtered.forEach(d => {
    d.arrondissement = +d.arrondissement;
  });

  const grouped = d3.rollups(
    filtered,
    v => d3.mean(v, d => d["Nombre total vélos disponibles"]),
    d => d.hour,
    d => d.arrondissement
  );

  const flatData = [];
  for (const [hour, arrs] of grouped) {
    for (const [arrondissement, moyenne] of arrs) {
      flatData.push({ hour,  arrondissement: `Arrondissement ${arrondissement}`, moyenne });
    }
  }

  drawArrondissementChart(flatData).then(svg => {
    document.getElementById("linechart-arrondissement").appendChild(svg);
  });
});

async function drawArrondissementChart(data) {
  const width = 650;
  const height = 500;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 30;


  function getColorByArrondissement(arr) {
    const num = parseInt(arr.replace("Arrondissement ", ""));
    if ([12, 17, 10, 16, 13].includes(num)) return "#F7B000";
    if ([1, 2, 3, 7, 5, 8, 6, 9, 4].includes(num)) return "#DD0E82";
    if ([19, 18, 14, 20, 11, 15].includes(num)) return "#6793C8";
    return "#000";
  }
  
  const x = d3.scaleLinear()
    .domain([6, 19])
    .range([marginLeft, width - marginRight]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.moyenne)]).nice()
    .range([height - marginBottom, marginTop]);

    const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; overflow: visible; font: 10px 'Inter', sans-serif; color: white;");
  
    svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(g => {
      g.call(d3.axisBottom(x)
        .tickValues(d3.range(6, 19))
        .tickFormat(d => `${d}h`)
        .tickSizeOuter(0)
      );
      g.selectAll("text")
        .attr("fill", "white")
        .style("font-family", "Inter");
      g.selectAll("line")
        .attr("stroke", "white");
      g.select(".domain")
        .attr("stroke", "white");
    });

    // Axe Y (à gauche)
    svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(g => {
      g.call(d3.axisLeft(y));
      g.select(".domain").remove();
      g.selectAll(".tick line").clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1)
        .attr("stroke", "white");
      g.append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "white")
        .attr("text-anchor", "start")
        .style("font-family", "Inter")
        .text("↑ Average available bikes");
      g.selectAll("text")
        .attr("fill", "white")
        .style("font-family", "Inter");
    });

  const points = data.map(d => [x(d.hour), y(d.moyenne), d.arrondissement]);

  const groups = d3.rollup(
    points,
    v => Object.assign(v.sort((a, b) => a[0] - b[0]), { z: v[0][2] }),
    d => d[2]
  );
  const line = d3.line();
  const path = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(groups.values())
    .join("path")
    .style("stroke", d => getColorByArrondissement(d.z))
    .style("mix-blend-mode", "multiply")
    .attr("d", line);

    const dot = svg.append("g").attr("display", "none");

    dot.append("circle").attr("r", 2.5);
    

    dot.append("text")
        .attr("text-anchor", "middle")
        .attr("y", -12) 
        .style("fill", "#ffffff") 
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("opacity", 1);

  svg
    .on("pointerenter", pointerentered)
    .on("pointermove", pointermoved)
    .on("pointerleave", pointerleft)
    .on("touchstart", event => event.preventDefault());

  function pointermoved(event) {
    const [xm, ym] = d3.pointer(event);
    const i = d3.leastIndex(points, ([x, y]) => Math.hypot(x - xm, y - ym));
    const [xVal, yVal, arrondissement] = points[i];
    dot.attr("display", null);
    path.style("stroke", ({ z }) => z === arrondissement ? getColorByArrondissement(z) : "#333")
        .filter(({ z }) => z === arrondissement).raise();
    dot.attr("transform", `translate(${xVal},${yVal})`);
    dot.select("circle").attr("fill", getColorByArrondissement(arrondissement));
    dot.select("text").text(` ${arrondissement}`);
    svg.property("value", data[i]).dispatch("input", { bubbles: true });
  }

  function pointerentered() {
    path.style("mix-blend-mode", null).style("stroke", "#ddd");
    path.style("stroke", d => getColorByArrondissement(d.z));
  }

  function pointerleft() {
    path.style("stroke", d => getColorByArrondissement(d.z));
    dot.attr("display", "none");
    svg.node().value = null;
    svg.dispatch("input", { bubbles: true });
  }

  return svg.node();
}
