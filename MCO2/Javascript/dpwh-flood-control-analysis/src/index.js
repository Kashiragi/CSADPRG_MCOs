// Main entry point for the DPWH Flood Control Analysis application
// Run: node src/index.js
// Orchestrates the data ingestion, processing, and report generation pipeline

// Check and install dependencies BEFORE any other requires
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Checks if node_modules exists and installs dependencies if missing
 */
function checkAndInstallDependencies() {
  const projectRoot = path.resolve(__dirname, '..');
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('\n[INFO] Dependencies not found. Installing packages...\n');
    try {
      execSync('npm install', { 
        cwd: projectRoot, 
        stdio: 'inherit' 
      });
      console.log('\n[SUCCESS] Dependencies installed successfully!\n');
    } catch (error) {
      console.error('[ERROR] Failed to install dependencies:', error.message);
      process.exit(1);
    }
  }
}

// Run dependency check immediately
checkAndInstallDependencies();

// Now safe to require project modules
const readline = require('readline');
const { clearLog, logInfo, logSection } = require('./services/loggingService');
const { readData } = require('./ingestion/readData');
const { validateData } = require('./ingestion/validateData');
const { cleanData } = require('./ingestion/cleanData');
const { deriveFields } = require('./ingestion/deriveFields');
const { generateRegionalEfficiencyReport } = require('./reports/report1_regionalEfficiency');
const { generateContractorRankingReport } = require('./reports/report2_contractorRanking');
const { generateCostOverrunTrendsReport } = require('./reports/report3_costOverrunTrends');
const { generateSummaryReport } = require('./reports/summaryReport');

// Global state
let processedData = null;
let rawDataCount = 0;
let cleanedDataCount = 0;

/**
 * Creates readline interface for user input
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompts user for input
 */
function prompt(question) {
  const rl = createInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Displays a formatted table row
 */
function formatTableRow(values, widths) {
  return '| ' + values.map((val, i) => {
    const str = String(val);
    return str.padEnd(widths[i]);
  }).join(' | ') + ' |';
}

/**
 * Displays a table separator
 */
function formatTableSeparator(widths) {
  return '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
}

/**
 * Load and process the data file
 */
async function loadFile() {
  try {
    console.log('\nProcessing dataset...');
    
    // Clear previous logs
    clearLog();
    
    // Read data
    const rawData = await readData();
    rawDataCount = rawData.length;
    
    // Validate data and get only valid rows
    const validationResults = validateData(rawData);
    const validData = validationResults.validData;
    
    // Clean data (using only validated rows)
    const cleanedData = cleanData(validData, {
      startYear: 2021,
      endYear: 2023,
      dropMissingCoords: true,
      logResults: false,  // Silent mode for UI
      originalCount: rawDataCount
    });
    cleanedDataCount = cleanedData.length;
    
    // Derive fields
    processedData = deriveFields(cleanedData, { logResults: false });
    
    console.log(`\n[SUCCESS] Data loaded and processed!`);
    console.log(`  Original rows: ${rawDataCount}`);
    console.log(`  Valid rows after validation: ${validData.length}`);
    console.log(`  Filtered rows (2021-2023): ${cleanedDataCount}`);
    console.log(`  Invalid rows removed: ${rawDataCount - validData.length}`);
    console.log(`  Year filter removed: ${validData.length - cleanedDataCount}`);
    
  } catch (error) {
    console.error('[ERROR] Failed to load data:', error.message);
    throw error;
  }
}

/**
 * Display Report 1: Regional Efficiency
 */
function displayReport1(report1) {
  console.log('\n\nReport 1: Regional Flood Mitigation Efficiency Summary');
  console.log('='.repeat(140));
  console.log('Regional Flood Mitigation Efficiency Summary');
  console.log('(Filtered: 2021-2023 Projects)');
  console.log();
  
  const widths = [45, 12, 18, 15, 10, 14, 17];
  const headers = ['Region', 'MainIsland', 'TotalBudget', 'MedianSavings', 'AvgDelay', 'HighDelayPct', 'EfficiencyScore'];
  
  console.log(formatTableSeparator(widths));
  console.log(formatTableRow(headers, widths));
  console.log(formatTableSeparator(widths));
  
  // Display top 10 rows
  const displayData = report1.data.slice(0, 10);
  displayData.forEach((row) => {
    const values = [
      row.region,
      row.mainIsland,
      row.totalApprovedBudget.toLocaleString(undefined, {maximumFractionDigits: 0}),
      row.medianCostSavings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
      row.avgCompletionDelay.toFixed(2),
      row.delayPercentage.toFixed(2),
      row.efficiencyScore.toFixed(2)
    ];
    console.log(formatTableRow(values, widths));
  });
  
  console.log(formatTableSeparator(widths));
  console.log(`\n(Full table exported to ${report1.filePath.split('\\').pop()})`);
}

/**
 * Display Report 2: Contractor Ranking
 */
function displayReport2(report2) {
  console.log('\n\nReport 2: Top Contractors Performance Ranking');
  console.log('='.repeat(140));
  console.log('Top Contractors Performance Ranking (Top 15 by TotalCost, >=5 Projects)');
  console.log();
  
  const widths = [6, 55, 18, 13, 10, 15, 18, 12];
  const headers = ['Rank', 'Contractor', 'TotalCost', 'NumProjects', 'AvgDelay', 'TotalSavings', 'ReliabilityIndex', 'RiskFlag'];
  
  console.log(formatTableSeparator(widths));
  console.log(formatTableRow(headers, widths));
  console.log(formatTableSeparator(widths));
  
  // Display top 10 contractors
  const displayData = report2.data.slice(0, 10);
  displayData.forEach((row, index) => {
    const values = [
      (index + 1).toString(),
      row.contractor.substring(0, 53),
      row.totalContractCost.toLocaleString(undefined, {maximumFractionDigits: 0}),
      row.projectCount.toString(),
      row.avgCompletionDelay.toFixed(2),
      row.totalCostSavings.toLocaleString(undefined, {maximumFractionDigits: 0}),
      row.reliabilityIndex.toFixed(2),
      row.riskLevel
    ];
    console.log(formatTableRow(values, widths));
  });
  
  console.log(formatTableSeparator(widths));
  console.log(`\n(Full table exported to ${report2.filePath.split('\\').pop()})`);
}

/**
 * Display Report 3: Cost Overrun Trends
 */
function displayReport3(report3) {
  console.log('\n\nReport 3: Annual Project Type Cost Overrun Trends');
  console.log('='.repeat(140));
  console.log('Annual Project Type Cost Overrun Trends (Grouped by FundingYear and TypeOfWork)');
  console.log();
  
  const widths = [13, 50, 15, 15, 13, 12];
  const headers = ['FundingYear', 'TypeOfWork', 'TotalProjects', 'AvgSavings', 'OverrunRate', 'YoYChange'];
  
  console.log(formatTableSeparator(widths));
  console.log(formatTableRow(headers, widths));
  console.log(formatTableSeparator(widths));
  
  // Display top 15 rows
  const displayData = report3.data.slice(0, 15);
  displayData.forEach((row) => {
    const yoyDisplay = row.yoyChange !== null ? row.yoyChange.toFixed(2) : '0.00';
    const values = [
      row.fundingYear.toString(),
      row.typeOfWork.substring(0, 48),
      row.totalProjects.toString(),
      row.avgCostSavings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
      row.overrunRate.toFixed(2),
      yoyDisplay
    ];
    console.log(formatTableRow(values, widths));
  });
  
  console.log(formatTableSeparator(widths));
  console.log(`\n(Full table exported to ${report3.filePath.split('\\').pop()})`);
}

/**
 * Display Summary Statistics
 */
function displaySummary(summary) {
  console.log('\n\nSummary Stats (summary.json):');
  console.log('='.repeat(80));
  const stats = {
    total_projects: summary.data.overview.totalProjects,
    total_contractors: summary.data.overview.totalContractors,
    total_provinces: summary.data.overview.totalProvinces,
    global_avg_delay: summary.data.performance.globalAvgDelayDays.toFixed(2),
    total_savings: summary.data.financial.totalSavings.toLocaleString(undefined, {maximumFractionDigits: 0}),
    over_budget_rate: summary.data.financial.overBudgetRate.toFixed(2) + '%'
  };
  console.log(JSON.stringify(stats, null, 2));
}

/**
 * Generate all reports
 */
async function generateReports() {
  if (!processedData) {
    console.log('\n[ERROR] Please load the file first (Option 1)');
    return;
  }
  
  try {
    console.log('\nGenerating reports...');
    
    // Generate reports
    const report1 = generateRegionalEfficiencyReport(processedData, { logResults: false });
    const report2 = generateContractorRankingReport(processedData, { 
      logResults: false,
      minProjects: 5,
      topN: 15
    });
    const report3 = generateCostOverrunTrendsReport(processedData, { logResults: false });
    const summary = generateSummaryReport(processedData, { report1, report2, report3 }, { logResults: false });
    
    console.log('Outputs saved to individual files...');
    
    // Display each report
    displayReport1(report1);
    displayReport2(report2);
    displayReport3(report3);
    displaySummary(summary);
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n[ERROR] Failed to generate reports:', error.message);
  }
}

/**
 * Display main menu
 */
function displayMenu() {
  console.log('\nSelect Language Implementation:');
  console.log('[1] Load the file');
  console.log('[2] Generate Reports');
  console.log('[3] Exit');
}

/**
 * Main interactive loop
 */
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('DPWH FLOOD CONTROL PROJECTS ANALYSIS');
  console.log('='.repeat(80));
  
  let running = true;
  
  while (running) {
    displayMenu();
    const choice = await prompt('Enter choice: ');
    
    switch (choice.trim()) {
      case '1':
        await loadFile();
        break;
        
      case '2':
        await generateReports();
        const continueChoice = await prompt('\nBack to Report Selection (Y/N): ');
        if (continueChoice.trim().toUpperCase() !== 'Y') {
          running = false;
        }
        break;
        
      case '3':
        console.log('\nExiting...');
        running = false;
        break;
        
      default:
        console.log('\nInvalid choice. Please enter 1, 2, or 3.');
    }
  }
  
  console.log('\nThank you for using DPWH Flood Control Analysis!');
  console.log('='.repeat(80) + '\n');
}

// Run main function if this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('[FATAL ERROR]', error);
      process.exit(1);
    });
}

module.exports = { main };