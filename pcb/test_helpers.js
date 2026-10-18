const fs = require('fs');
const path = require('path');

// Helper to format Gerber coordinates (Leading zeros, 4.6 metric mm: 1 mm = 1000000)
// e.g., 100 mm = 100000000
function coord(valMm) {
  const scaled = Math.round(valMm * 1000000);
  return (scaled >= 0 ? '' : '-') + Math.abs(scaled).toString();
}

function gCoord(x, y) {
  return `X${coord(x)}Y${coord(y)}`;
}

// Excellon drill format (Metric, trailing zeros or 3.3 format, e.g. 15.000 mm -> 15000 or 15.000)
function drillCoord(x, y) {
  return `X${(x).toFixed(3)}Y${(y).toFixed(3)}`;
}

console.log('Gerber generator helpers ready');
