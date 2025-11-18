// CSV reading and writing utilities
// Handles CSV file I/O operations using libraries like papaparse or csv-parser

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

/**
 * Ensures the output directory exists
 */
function ensureOutputDirectory() {
  const outputDir = path.join(__dirname, '../../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

/**
 * Writes data to a CSV file
 * @param {string} filename - Name of the CSV file
 * @param {Array} data - Array of objects to write
 * @param {Array} fields - Optional array of field names to include
 * @returns {string} - Path to the written file
 */
function writeCSV(filename, data, fields = null) {
  const outputDir = ensureOutputDirectory();
  const filePath = path.join(outputDir, filename);
  
  // Use Papa.unparse to convert data to CSV
  const csv = Papa.unparse(data, {
    fields: fields,
    header: true
  });
  
  fs.writeFileSync(filePath, csv, 'utf8');
  return filePath;
}

/**
 * Formats a number with commas and specified decimal places
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted number string
 */
function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

module.exports = {
  writeCSV,
  formatNumber,
  ensureOutputDirectory
};

