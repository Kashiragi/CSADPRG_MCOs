// Logging service module
// Manages log file creation and validation reports for data ingestion process

const fs = require('fs');
const path = require('path');

/**
 * Ensures the logs directory exists
 */
function ensureLogDirectory() {
  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
}

/**
 * Gets the path to the ingestion log file
 * @returns {string} - Path to ingestion.log
 */
function getLogFilePath() {
  const logDir = ensureLogDirectory();
  return path.join(logDir, 'ingestion.log');
}

/**
 * Writes a log entry to the ingestion log file
 * @param {string} message - Message to log
 * @param {string} level - Log level (INFO, WARNING, ERROR)
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  
  const logFilePath = getLogFilePath();
  fs.appendFileSync(logFilePath, logEntry, 'utf8');
  
  // Also log to console
  console.log(`[${level}] ${message}`);
}

/**
 * Clears the log file (useful at the start of a new ingestion process)
 */
function clearLog() {
  const logFilePath = getLogFilePath();
  fs.writeFileSync(logFilePath, '', 'utf8');
  console.log('[INFO] Log file cleared');
}

/**
 * Logs an informational message
 * @param {string} message - Message to log
 */
function logInfo(message) {
  log(message, 'INFO');
}

/**
 * Logs a warning message
 * @param {string} message - Message to log
 */
function logWarning(message) {
  log(message, 'WARNING');
}

/**
 * Logs an error message
 * @param {string} message - Message to log
 */
function logError(message) {
  log(message, 'ERROR');
}

/**
 * Logs a section header for better log organization
 * @param {string} title - Section title
 */
function logSection(title) {
  const separator = '='.repeat(80);
  log(separator, 'INFO');
  log(title, 'INFO');
  log(separator, 'INFO');
}

/**
 * Logs validation results in a structured format
 * @param {Object} validationResults - Object containing validation statistics
 */
function logValidationResults(validationResults) {
  logSection('DATA VALIDATION RESULTS');
  
  logInfo(`Total Rows: ${validationResults.totalRows}`);
  logInfo(`Valid Rows: ${validationResults.validRows}`);
  logInfo(`Invalid Rows: ${validationResults.invalidRows}`);
  
  if (validationResults.missingFields) {
    logInfo('\nMissing or Invalid Fields:');
    for (const [field, count] of Object.entries(validationResults.missingFields)) {
      if (count > 0) {
        logWarning(`  ${field}: ${count} rows with missing/invalid data`);
      }
    }
  }
  
  if (validationResults.issues && validationResults.issues.length > 0) {
    logInfo(`\nTotal Issues Found: ${validationResults.issues.length}`);
    if (validationResults.issues.length <= 50) {
      validationResults.issues.forEach((issue, index) => {
        logWarning(`  Issue ${index + 1}: ${issue}`);
      });
    } else {
      // Log first 50 issues
      validationResults.issues.slice(0, 50).forEach((issue, index) => {
        logWarning(`  Issue ${index + 1}: ${issue}`);
      });
      logWarning(`  ... and ${validationResults.issues.length - 50} more issues`);
    }
  }
  
  logInfo('\nValidation completed successfully');
}

/**
 * Reads the log file content
 * @returns {string} - Content of the log file
 */
function readLog() {
  const logFilePath = getLogFilePath();
  if (fs.existsSync(logFilePath)) {
    return fs.readFileSync(logFilePath, 'utf8');
  }
  return '';
}

module.exports = {
  log,
  logInfo,
  logWarning,
  logError,
  logSection,
  logValidationResults,
  clearLog,
  readLog,
  getLogFilePath
};

