// Data reading module
// Reads and loads the CSV file into memory for processing

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

/**
 * Reads the DPWH flood control projects CSV file and loads it into memory
 * @param {string} filePath - Path to the CSV file (optional, uses default if not provided)
 * @returns {Promise<Array>} - Promise that resolves to an array of project objects
 */
function readData(filePath = null) {
  // Default path to the CSV file
  const defaultPath = path.join(__dirname, '../../data/dpwh_flood_control_projects.csv');
  const csvFilePath = filePath || defaultPath;

  return new Promise((resolve, reject) => {
    const results = [];

    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      return reject(new Error(`CSV file not found at: ${csvFilePath}`));
    }

    console.log(`[INFO] Reading CSV file from: ${csvFilePath}`);
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Add each row to the results array
        results.push(row);
      })
      .on('end', () => {
        console.log(`[SUCCESS] Successfully loaded ${results.length} rows from CSV`);
        console.log(`[INFO] Sample row fields:`, Object.keys(results[0] || {}));
        resolve(results);
      })
      .on('error', (error) => {
        console.error(`[ERROR] Error reading CSV file:`, error.message);
        reject(error);
      });
  });
}

/**
 * Test function to verify CSV reading works correctly
 * Logs the total number of rows and displays a sample row
 */
async function testReadData() {
  try {
    console.log('\n[TEST] Testing readData function...\n');
    
    const data = await readData();
    
    console.log(`\n[RESULT] Total rows loaded: ${data.length}`);
    console.log(`\n[INFO] Available columns (${Object.keys(data[0]).length}):`);
    console.log(Object.keys(data[0]).join(', '));
    
    console.log('\n[SAMPLE] Sample row (first record):');
    console.log(JSON.stringify(data[0], null, 2));
    
    console.log('\n[SAMPLE] Sample row (last record):');
    console.log(JSON.stringify(data[data.length - 1], null, 2));
    
    return data;
  } catch (error) {
    console.error('[ERROR] Test failed:', error.message);
    throw error;
  }
}

// Export the functions
module.exports = {
  readData,
  testReadData
};

// If this file is run directly, execute the test
if (require.main === module) {
  testReadData()
    .then(() => {
      console.log('\n[SUCCESS] readData.js test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n[ERROR] readData.js test failed!');
      process.exit(1);
    });
}

