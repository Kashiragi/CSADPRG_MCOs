// Data cleaning module
// Converts data types, imputes null values, and filters data by specified years

const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { logInfo, logWarning, logSection } = require('../services/loggingService');

// Enable custom parse format for dayjs
dayjs.extend(customParseFormat);

/**
 * Converts a string to a float number
 * @param {string} value - String value to convert
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} - Parsed number or default value
 */
function parseNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '' || value === 'null') {
    return defaultValue;
  }
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Converts a string to a Date object using dayjs
 * @param {string} dateString - Date string to convert
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
function parseDate(dateString) {
  if (!dateString || dateString === '' || dateString === 'null') {
    return null;
  }
  
  const parsed = dayjs(dateString, ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'], true);
  return parsed.isValid() ? parsed.toDate() : null;
}

/**
 * Validates and cleans coordinate values
 * @param {string} lat - Latitude value
 * @param {string} lon - Longitude value
 * @returns {Object|null} - Object with lat/lon or null if invalid
 */
function cleanCoordinates(lat, lon) {
  const latitude = parseNumber(lat, null);
  const longitude = parseNumber(lon, null);
  
  // Check if coordinates are valid
  if (latitude === null || longitude === null) {
    return null;
  }
  
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }
  
  return { latitude, longitude };
}

/**
 * Cleans a single data row
 * @param {Object} row - Raw data row
 * @returns {Object} - Cleaned data row with proper types
 */
function cleanRow(row) {
  // Parse dates
  const startDate = parseDate(row.StartDate);
  const completionDate = parseDate(row.ActualCompletionDate);
  
  // Parse numeric fields
  const fundingYear = parseNumber(row.FundingYear, null);
  const approvedBudget = parseNumber(row.ApprovedBudgetForContract, null);
  const contractCost = parseNumber(row.ContractCost, null);
  const contractorCount = parseNumber(row.ContractorCount, 1);
  
  // Clean coordinates
  const projectCoords = cleanCoordinates(row.ProjectLatitude, row.ProjectLongitude);
  const capitalCoords = cleanCoordinates(row.ProvincialCapitalLatitude, row.ProvincialCapitalLongitude);
  
  return {
    // Keep original text fields
    mainIsland: row.MainIsland || '',
    region: row.Region || '',
    province: row.Province || '',
    legislativeDistrict: row.LegislativeDistrict || '',
    municipality: row.Municipality || '',
    districtEngineeringOffice: row.DistrictEngineeringOffice || '',
    projectId: row.ProjectId || '',
    projectName: row.ProjectName || '',
    typeOfWork: row.TypeOfWork || '',
    contractId: row.ContractId || '',
    contractor: row.Contractor || '',
    provincialCapital: row.ProvincialCapital || '',
    
    // Converted numeric fields
    fundingYear: fundingYear,
    approvedBudgetForContract: approvedBudget,
    contractCost: contractCost,
    contractorCount: contractorCount,
    
    // Converted date fields
    startDate: startDate,
    actualCompletionDate: completionDate,
    
    // Cleaned coordinates
    projectLatitude: projectCoords ? projectCoords.latitude : null,
    projectLongitude: projectCoords ? projectCoords.longitude : null,
    provincialCapitalLatitude: capitalCoords ? capitalCoords.latitude : null,
    provincialCapitalLongitude: capitalCoords ? capitalCoords.longitude : null,
    
    // Keep original raw values for reference
    _raw: {
      startDate: row.StartDate,
      completionDate: row.ActualCompletionDate,
      approvedBudget: row.ApprovedBudgetForContract,
      contractCost: row.ContractCost
    }
  };
}

/**
 * Filters data by funding year range
 * @param {Array} data - Array of cleaned data rows
 * @param {number} startYear - Start year (inclusive)
 * @param {number} endYear - End year (inclusive)
 * @returns {Array} - Filtered data array
 */
function filterByYears(data, startYear = 2021, endYear = 2023) {
  return data.filter(row => {
    if (row.fundingYear === null) return false;
    return row.fundingYear >= startYear && row.fundingYear <= endYear;
  });
}

/**
 * Removes rows with missing critical coordinates
 * @param {Array} data - Array of cleaned data rows
 * @param {boolean} dropMissingCoords - Whether to drop rows with missing coordinates
 * @returns {Array} - Filtered data array
 */
function handleMissingCoordinates(data, dropMissingCoords = true) {
  if (!dropMissingCoords) {
    return data;
  }
  
  return data.filter(row => {
    return row.projectLatitude !== null && row.projectLongitude !== null;
  });
}

/**
 * Main cleaning function - orchestrates all cleaning operations
 * @param {Array} validatedData - Validated data array (should be only valid rows)
 * @param {Object} options - Cleaning options
 * @returns {Array} - Cleaned and filtered data array
 */
function cleanData(validatedData, options = {}) {
  const {
    startYear = 2021,
    endYear = 2023,
    dropMissingCoords = true,
    logResults = true,
    originalCount = null  // Original row count before validation
  } = options;
  
  if (logResults) {
    logSection('STARTING DATA CLEANING');
    if (originalCount) {
      logInfo(`Original CSV rows: ${originalCount}`);
      logInfo(`Valid rows after validation: ${validatedData.length}`);
      logInfo(`Invalid rows removed: ${originalCount - validatedData.length}`);
    } else {
      logInfo(`Input rows: ${validatedData.length}`);
    }
    logInfo(`Year filter: ${startYear} - ${endYear}`);
    logInfo(`Drop missing coordinates: ${dropMissingCoords}`);
  }
  
  // Step 1: Clean and convert data types
  if (logResults) logInfo('Step 1: Converting data types...');
  const cleanedData = validatedData.map(row => cleanRow(row));
  
  // Step 2: Filter by years
  if (logResults) logInfo('Step 2: Filtering by funding years...');
  const yearFiltered = filterByYears(cleanedData, startYear, endYear);
  if (logResults) {
    logInfo(`Rows after year filter (${startYear}-${endYear}): ${yearFiltered.length}`);
    logInfo(`Rows removed by year filter: ${cleanedData.length - yearFiltered.length}`);
  }
  
  // Step 3: Handle missing coordinates
  if (logResults) logInfo('Step 3: Handling missing coordinates...');
  const coordFiltered = handleMissingCoordinates(yearFiltered, dropMissingCoords);
  if (logResults && dropMissingCoords) {
    const coordsRemoved = yearFiltered.length - coordFiltered.length;
    logInfo(`Rows with missing coordinates removed: ${coordsRemoved}`);
    logInfo(`Final cleaned rows: ${coordFiltered.length}`);
  }
  
  // Calculate and log statistics
  if (logResults) {
    logSection('DATA CLEANING SUMMARY');
    if (originalCount) {
      logInfo(`Original CSV rows: ${originalCount}`);
      logInfo(`After validation: ${validatedData.length}`);
    } else {
      logInfo(`Input rows: ${validatedData.length}`);
    }
    logInfo(`After type conversion: ${cleanedData.length}`);
    logInfo(`After year filter: ${yearFiltered.length}`);
    logInfo(`Final cleaned rows: ${coordFiltered.length}`);
    
    const totalRemoved = originalCount ? originalCount - coordFiltered.length : validatedData.length - coordFiltered.length;
    const baseCount = originalCount || validatedData.length;
    logInfo(`Total removed: ${totalRemoved} (${((totalRemoved / baseCount) * 100).toFixed(2)}%)`);
    logInfo(`Data retention rate: ${(coordFiltered.length / baseCount * 100).toFixed(2)}%`);
    
    // Log data quality metrics
    const nullBudgets = coordFiltered.filter(r => r.approvedBudgetForContract === null).length;
    const nullCosts = coordFiltered.filter(r => r.contractCost === null).length;
    const nullDates = coordFiltered.filter(r => r.startDate === null || r.actualCompletionDate === null).length;
    
    logInfo('\nData quality metrics:');
    logInfo(`  Rows with null ApprovedBudget: ${nullBudgets}`);
    logInfo(`  Rows with null ContractCost: ${nullCosts}`);
    logInfo(`  Rows with null dates: ${nullDates}`);
  }
  
  return coordFiltered;
}

/**
 * Test function to demonstrate cleaning functionality
 */
async function testCleanData() {
  try {
    console.log('\n[TEST] Testing cleanData function...\n');
    
    // Import dependencies
    const { readData } = require('./readData');
    const { validateData } = require('./validateData');
    const { clearLog } = require('../services/loggingService');
    
    // Clear log and read data
    clearLog();
    const rawData = await readData();
    
    // Validate data first
    console.log('\n[INFO] Validating data...');
    const validationResults = validateData(rawData);
    
    // Clean data with validated rows only
    const cleanedData = cleanData(validationResults.validData, {
      startYear: 2021,
      endYear: 2023,
      dropMissingCoords: true,
      logResults: true,
      originalCount: rawData.length
    });
    
    console.log('\n[RESULT] Cleaning completed!');
    console.log(`  Original CSV rows: ${rawData.length}`);
    console.log(`  Valid rows after validation: ${validationResults.validData.length}`);
    console.log(`  Final cleaned rows: ${cleanedData.length}`);
    console.log(`  Overall retention rate: ${(cleanedData.length / rawData.length * 100).toFixed(2)}%`);
    
    // Show sample cleaned row
    console.log('\n[SAMPLE] First cleaned row:');
    console.log(JSON.stringify(cleanedData[0], null, 2));
    
    // Show data type verification
    console.log('\n[VERIFY] Data types:');
    const sample = cleanedData[0];
    console.log(`  fundingYear: ${typeof sample.fundingYear} = ${sample.fundingYear}`);
    console.log(`  approvedBudgetForContract: ${typeof sample.approvedBudgetForContract} = ${sample.approvedBudgetForContract}`);
    console.log(`  contractCost: ${typeof sample.contractCost} = ${sample.contractCost}`);
    console.log(`  startDate: ${sample.startDate instanceof Date} (is Date) = ${sample.startDate}`);
    console.log(`  projectLatitude: ${typeof sample.projectLatitude} = ${sample.projectLatitude}`);
    
    return cleanedData;
  } catch (error) {
    console.error('[ERROR] Test failed:', error.message);
    throw error;
  }
}

module.exports = {
  cleanData,
  cleanRow,
  filterByYears,
  handleMissingCoordinates,
  parseNumber,
  parseDate,
  cleanCoordinates,
  testCleanData
};

// If this file is run directly, execute the test
if (require.main === module) {
  testCleanData()
    .then(() => {
      console.log('\n[SUCCESS] cleanData.js test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n[ERROR] cleanData.js test failed!');
      process.exit(1);
    });
}

