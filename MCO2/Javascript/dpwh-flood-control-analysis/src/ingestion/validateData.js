// Data validation module
// Logs row counts, detects invalid or missing data, and reports data quality issues

const { logInfo, logWarning, logError, logSection, logValidationResults, clearLog } = require('../services/loggingService');

/**
 * Checks if a value is missing or invalid
 * @param {*} value - Value to check
 * @returns {boolean} - True if value is missing/invalid
 */
function isMissing(value) {
  return value === null || value === undefined || value === '' || value === 'null';
}

/**
 * Validates if a string is a valid date
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid date
 */
function isValidDate(dateString) {
  if (isMissing(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validates if a string is a valid number
 * @param {string} numString - Number string to validate
 * @returns {boolean} - True if valid number
 */
function isValidNumber(numString) {
  if (isMissing(numString)) return false;
  const num = parseFloat(numString);
  return !isNaN(num) && isFinite(num);
}

/**
 * Validates if coordinates are valid (latitude and longitude)
 * @param {string} lat - Latitude value
 * @param {string} lon - Longitude value
 * @returns {boolean} - True if both are valid coordinates
 */
function isValidCoordinates(lat, lon) {
  if (!isValidNumber(lat) || !isValidNumber(lon)) return false;
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/**
 * Validates a single data row
 * @param {Object} row - Data row to validate
 * @param {number} rowIndex - Row index for error reporting
 * @returns {Object} - Validation result with issues array
 */
function validateRow(row, rowIndex) {
  const issues = [];
  const rowNum = rowIndex + 1;

  // Check required text fields
  const requiredTextFields = [
    'MainIsland',
    'Region',
    'Province',
    'ProjectId',
    'ProjectName',
    'TypeOfWork',
    'ContractId',
    'Contractor'
  ];

  requiredTextFields.forEach(field => {
    if (isMissing(row[field])) {
      issues.push(`Row ${rowNum}: Missing ${field}`);
    }
  });

  // Check date fields
  const dateFields = ['StartDate', 'ActualCompletionDate'];
  dateFields.forEach(field => {
    if (!isMissing(row[field]) && !isValidDate(row[field])) {
      issues.push(`Row ${rowNum}: Invalid date format in ${field}: ${row[field]}`);
    } else if (isMissing(row[field])) {
      issues.push(`Row ${rowNum}: Missing ${field}`);
    }
  });

  // Check numeric fields
  const numericFields = [
    'FundingYear',
    'ApprovedBudgetForContract',
    'ContractCost',
    'ContractorCount'
  ];

  numericFields.forEach(field => {
    if (!isValidNumber(row[field])) {
      issues.push(`Row ${rowNum}: Invalid or missing number in ${field}: ${row[field]}`);
    }
  });

  // Check coordinates (project location)
  if (!isValidCoordinates(row.ProjectLatitude, row.ProjectLongitude)) {
    issues.push(`Row ${rowNum}: Invalid project coordinates (Lat: ${row.ProjectLatitude}, Lon: ${row.ProjectLongitude})`);
  }

  // Check coordinates (provincial capital)
  if (!isValidCoordinates(row.ProvincialCapitalLatitude, row.ProvincialCapitalLongitude)) {
    issues.push(`Row ${rowNum}: Invalid provincial capital coordinates (Lat: ${row.ProvincialCapitalLatitude}, Lon: ${row.ProvincialCapitalLongitude})`);
  }

  return {
    isValid: issues.length === 0,
    issues: issues
  };
}

/**
 * Validates the entire dataset
 * @param {Array} data - Array of data rows
 * @returns {Object} - Validation results with statistics
 */
function validateData(data) {
  logSection('STARTING DATA VALIDATION');
  logInfo(`Total rows to validate: ${data.length}`);

  let validRows = 0;
  let invalidRows = 0;
  const allIssues = [];
  
  // Track missing fields count
  const missingFields = {
    MainIsland: 0,
    Region: 0,
    Province: 0,
    ProjectId: 0,
    ProjectName: 0,
    TypeOfWork: 0,
    ContractId: 0,
    Contractor: 0,
    StartDate: 0,
    ActualCompletionDate: 0,
    FundingYear: 0,
    ApprovedBudgetForContract: 0,
    ContractCost: 0,
    ContractorCount: 0,
    ProjectCoordinates: 0,
    CapitalCoordinates: 0
  };

  // Validate each row
  data.forEach((row, index) => {
    const validation = validateRow(row, index);
    
    if (validation.isValid) {
      validRows++;
    } else {
      invalidRows++;
      allIssues.push(...validation.issues);
      
      // Count specific missing fields
      validation.issues.forEach(issue => {
        if (issue.includes('Missing MainIsland')) missingFields.MainIsland++;
        if (issue.includes('Missing Region')) missingFields.Region++;
        if (issue.includes('Missing Province')) missingFields.Province++;
        if (issue.includes('Missing ProjectId')) missingFields.ProjectId++;
        if (issue.includes('Missing ProjectName')) missingFields.ProjectName++;
        if (issue.includes('Missing TypeOfWork')) missingFields.TypeOfWork++;
        if (issue.includes('Missing ContractId')) missingFields.ContractId++;
        if (issue.includes('Missing Contractor')) missingFields.Contractor++;
        if (issue.includes('Missing StartDate')) missingFields.StartDate++;
        if (issue.includes('Missing ActualCompletionDate')) missingFields.ActualCompletionDate++;
        if (issue.includes('Invalid or missing number in FundingYear')) missingFields.FundingYear++;
        if (issue.includes('Invalid or missing number in ApprovedBudgetForContract')) missingFields.ApprovedBudgetForContract++;
        if (issue.includes('Invalid or missing number in ContractCost')) missingFields.ContractCost++;
        if (issue.includes('Invalid or missing number in ContractorCount')) missingFields.ContractorCount++;
        if (issue.includes('Invalid project coordinates')) missingFields.ProjectCoordinates++;
        if (issue.includes('Invalid provincial capital coordinates')) missingFields.CapitalCoordinates++;
      });
    }
  });

  const results = {
    totalRows: data.length,
    validRows: validRows,
    invalidRows: invalidRows,
    missingFields: missingFields,
    issues: allIssues,
    validationDate: new Date().toISOString()
  };

  // Log results
  logValidationResults(results);

  return results;
}

/**
 * Test function to validate data from readData
 */
async function testValidateData() {
  try {
    console.log('\n[TEST] Testing validateData function...\n');
    
    // Clear previous log
    clearLog();
    
    // Import readData
    const { readData } = require('./readData');
    
    // Read data
    const data = await readData();
    
    // Validate data
    const results = validateData(data);
    
    console.log('\n[RESULT] Validation Summary:');
    console.log(`  Total Rows: ${results.totalRows}`);
    console.log(`  Valid Rows: ${results.validRows}`);
    console.log(`  Invalid Rows: ${results.invalidRows}`);
    console.log(`  Data Quality: ${((results.validRows / results.totalRows) * 100).toFixed(2)}%`);
    
    return results;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error('[ERROR] Test failed:', error.message);
    throw error;
  }
}

module.exports = {
  validateData,
  validateRow,
  isValidDate,
  isValidNumber,
  isValidCoordinates,
  testValidateData
};

// If this file is run directly, execute the test
if (require.main === module) {
  testValidateData()
    .then(() => {
      console.log('\n[SUCCESS] validateData.js test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n[ERROR] validateData.js test failed!');
      process.exit(1);
    });
}

