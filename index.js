const d3 = window.d3;
console.log("✅ Script index.js bien chargé !");

// Sélectionne la div #chart et ajoute un SVG
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", 800)
    .attr("height", 500);

// Ajoute un cercle pour tester si D3 fonctionne bien
svg.append("circle")
    .attr("cx", 400)
    .attr("cy", 250)
    .attr("r", 50)
    .attr("fill", "blue");

console.log("✅ Cercle ajouté au SVG !");