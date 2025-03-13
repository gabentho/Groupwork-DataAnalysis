const d3 = window.d3; // Utilisation correcte dans le navigateur
console.log("✅ D3.js Version :", d3.version);

// Sélection du conteneur SVG
const width = 800, height = 500;
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black");

// Exemple : Ajouter un cercle en test
svg.append("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", 50)
    .attr("fill", "red");