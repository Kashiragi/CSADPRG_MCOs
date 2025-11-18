// Summary report generator
// Compiles aggregated summary data from all reports into summary.json

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { logInfo, logSection } = require('../services/loggingService');
const { ensureOutputDirectory } = require('../utils/csvUtils');

/**
 * Generates a comprehensive summary report in JSON format
 * @param {Array} data - Processed data with derived fields
 * @param {Object} reports - Results from all reports
 * @param {Object} options - Report options
 * @returns {Object} - Summary data and file path
 */
function generateSummaryReport(data, reports = {}, options = {}) {
  const { logResults = true } = options;
  
  if (logResults) {
    logSection('GENERATING SUMMARY REPORT');
    logInfo('Aggregating statistics across all reports...');
  }
  
  // Basic statistics
  const totalProjects = data.length;
  
  // Unique contractors
  const uniqueContractors = new Set(data.map(p => p.contractor)).size;
  
  // Unique provinces
  const uniqueProvinces = new Set(data.map(p => p.province)).size;
  
  // Unique regions
  const uniqueRegions = new Set(data.map(p => p.region)).size;
  
  // Global average delay
  const validDelays = data.filter(p => p.completionDelayDays !== null);
  const globalAvgDelay = validDelays.length > 0 
    ? _.mean(validDelays.map(p => p.completionDelayDays)) 
    : 0;
  
  // Total savings
  const validSavings = data.filter(p => p.costSavings !== null);
  const totalSavings = validSavings.length > 0 
    ? _.sum(validSavings.map(p => p.costSavings)) 
    : 0;
  
  // Average savings
  const avgSavings = validSavings.length > 0 
    ? _.mean(validSavings.map(p => p.costSavings)) 
    : 0;
  
  // Total budget and cost
  const totalApprovedBudget = _.sumBy(data, p => p.approvedBudgetForContract || 0);
  const totalContractCost = _.sumBy(data, p => p.contractCost || 0);
  
  // Budget utilization rate
  const budgetUtilizationRate = totalApprovedBudget > 0 
    ? (totalContractCost / totalApprovedBudget) * 100 
    : 0;
  
  // Projects by status
  const projectsOverBudget = data.filter(p => p.isOverBudget === true).length;
  const projectsUnderBudget = data.filter(p => p.isOverBudget === false).length;
  
  // Projects with long delays (> 30 days)
  const projectsWithLongDelay = data.filter(p => 
    p.completionDelayDays !== null && p.completionDelayDays > 30
  ).length;
  
  // Year distribution
  const projectsByYear = _.groupBy(data, 'fundingYear');
  const yearDistribution = {};
  Object.keys(projectsByYear).forEach(year => {
    yearDistribution[year] = projectsByYear[year].length;
  });
  
  // Island distribution
  const projectsByIsland = _.groupBy(data, 'mainIsland');
  const islandDistribution = {};
  Object.keys(projectsByIsland).forEach(island => {
    islandDistribution[island] = projectsByIsland[island].length;
  });
  
  // Type of work distribution (top 5)
  const projectsByType = _.groupBy(data, 'typeOfWork');
  const typeDistribution = Object.entries(projectsByType)
    .map(([type, projects]) => ({ type, count: projects.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .reduce((acc, item) => {
      acc[item.type] = item.count;
      return acc;
    }, {});
  
  // Compile simplified summary object (computed dynamically)
  const summary = {
    total_projects: totalProjects,
    total_contractors: uniqueContractors,
    total_provinces: uniqueProvinces,
    global_avg_delay: globalAvgDelay.toFixed(2),
    total_savings: totalSavings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
  };
  
  // Write to JSON file
  const outputDir = ensureOutputDirectory();
  const filePath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), 'utf8');
  
  if (logResults) {
    logInfo(`Summary report generated: ${filePath}`);
    logInfo(`Total projects: ${totalProjects.toLocaleString()}`);
    logInfo(`Total contractors: ${uniqueContractors.toLocaleString()}`);
    logInfo(`Total provinces: ${uniqueProvinces.toLocaleString()}`);
    logInfo(`Global avg delay: ${globalAvgDelay.toFixed(2)} days`);
    logInfo(`Total savings: PHP ${totalSavings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  }
  
  return {
    filePath,
    data: summary
  };
}

/**
 * Test function for summary report generation
 */
async function testSummaryReport() {
  try {
    console.log('\n[TEST] Testing Summary Report...\n');
    
    const { readData } = require('../ingestion/readData');
    const { validateData } = require('../ingestion/validateData');
    const { cleanData } = require('../ingestion/cleanData');
    const { deriveFields } = require('../ingestion/deriveFields');
    const { generateRegionalEfficiencyReport } = require('./report1_regionalEfficiency');
    const { generateContractorRankingReport } = require('./report2_contractorRanking');
    const { generateCostOverrunTrendsReport } = require('./report3_costOverrunTrends');
    
    const raw = await readData();
    const validationResults = validateData(raw);
    const validData = validationResults.validData;
    const cleaned = cleanData(validData, {
      startYear: 2021,
      endYear: 2023,
      dropMissingCoords: true,
      logResults: false,
      originalCount: raw.length
    });
    const processed = deriveFields(cleaned, { logResults: false });
    
    // Generate all reports
    const report1 = generateRegionalEfficiencyReport(processed, { logResults: false });
    const report2 = generateContractorRankingReport(processed, { logResults: false });
    const report3 = generateCostOverrunTrendsReport(processed, { logResults: false });
    
    // Generate summary
    const result = generateSummaryReport(processed, { report1, report2, report3 });
    
    console.log('\n[SUCCESS] Summary report generated!');
    console.log(`  File: ${result.filePath}`);
    console.log('\n[SUMMARY] Key Statistics:');
    console.log(`  Total Projects: ${result.data.total_projects}`);
    console.log(`  Total Contractors: ${result.data.total_contractors}`);
    console.log(`  Total Provinces: ${result.data.total_provinces}`);
    console.log(`  Global Avg Delay: ${result.data.global_avg_delay}`);
    console.log(`  Total Savings: ${result.data.total_savings}`);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Test failed:', error.message);
    throw error;
  }
}

module.exports = {
  generateSummaryReport,
  testSummaryReport
};

// If run directly, execute test
if (require.main === module) {
  testSummaryReport()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

