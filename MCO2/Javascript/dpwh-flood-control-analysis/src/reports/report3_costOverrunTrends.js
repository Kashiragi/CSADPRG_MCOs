// Report 3: Cost Overrun Trends Analysis
// Analyzes trends in cost overruns across projects and time periods

const _ = require('lodash');
const { writeCSV, formatNumber } = require('../utils/csvUtils');
const { logInfo, logSection } = require('../services/loggingService');

/**
 * Calculates year-over-year change percentage
 * @param {number} currentValue - Current year value
 * @param {number} baselineValue - Baseline (2021) value
 * @returns {number|null} - YoY change percentage
 */
function calculateYoYChange(currentValue, baselineValue) {
  if (!baselineValue || baselineValue === 0) return null;
  return ((currentValue - baselineValue) / baselineValue) * 100;
}

/**
 * Generates Cost Overrun Trends Report
 * @param {Array} data - Processed data with derived fields
 * @param {Object} options - Report options
 * @returns {Object} - Report results with file path and data
 */
function generateCostOverrunTrendsReport(data, options = {}) {
  const { logResults = true } = options;
  
  if (logResults) {
    logSection('GENERATING REPORT 3: COST OVERRUN TRENDS');
    logInfo(`Processing ${data.length} projects...`);
  }
  
  // Group by funding year and type of work
  const grouped = _.groupBy(data, row => `${row.fundingYear}|${row.typeOfWork}`);
  
  const trendsData = [];
  const baselineByType = {}; // Store 2021 baseline for each type
  
  Object.entries(grouped).forEach(([key, projects]) => {
    const [fundingYear, typeOfWork] = key.split('|');
    const year = parseInt(fundingYear);
    
    // Calculate total projects
    const totalProjects = projects.length;
    
    // Calculate average cost savings
    const validSavings = projects
      .filter(p => p.costSavings !== null)
      .map(p => p.costSavings);
    const avgCostSavings = validSavings.length > 0 
      ? _.mean(validSavings) 
      : 0;
    
    // Calculate overrun rate (% with negative savings)
    const projectsWithOverrun = projects.filter(p => 
      p.costSavings !== null && p.costSavings < 0
    ).length;
    const overrunRate = validSavings.length > 0 
      ? (projectsWithOverrun / validSavings.length) * 100 
      : 0;
    
    // Store 2021 as baseline
    if (year === 2021) {
      baselineByType[typeOfWork] = avgCostSavings;
    }
    
    trendsData.push({
      fundingYear: year,
      typeOfWork,
      totalProjects,
      avgCostSavings,
      overrunRate,
      baselineValue: baselineByType[typeOfWork] || null
    });
  });
  
  // Calculate YoY change for each entry
  trendsData.forEach(entry => {
    const baseline = baselineByType[entry.typeOfWork];
    if (entry.fundingYear === 2021) {
      entry.yoyChange = 0; // Baseline year
    } else if (baseline !== undefined && baseline !== null) {
      entry.yoyChange = calculateYoYChange(entry.avgCostSavings, baseline);
    } else {
      entry.yoyChange = null;
    }
  });
  
  // Sort by year ascending, then by average savings descending
  const sortedData = _.orderBy(trendsData, 
    ['fundingYear', 'avgCostSavings'], 
    ['asc', 'desc']
  );
  
  // Format for CSV output
  const formattedData = sortedData.map(entry => ({
    FundingYear: entry.fundingYear,
    TypeOfWork: entry.typeOfWork,
    TotalProjects: entry.totalProjects,
    AvgCostSavings: formatNumber(entry.avgCostSavings, 2),
    OverrunRate: formatNumber(entry.overrunRate, 2),
    YoYChangePercent: entry.yoyChange !== null ? formatNumber(entry.yoyChange, 2) : 'N/A (Baseline)'
  }));
  
  // Write to CSV
  const filePath = writeCSV('report3_cost_overrun_trends.csv', formattedData);
  
  if (logResults) {
    logInfo(`Report generated with ${sortedData.length} trend entries`);
    logInfo(`Output file: ${filePath}`);
    logInfo(`Years covered: ${Math.min(...sortedData.map(e => e.fundingYear))} - ${Math.max(...sortedData.map(e => e.fundingYear))}`);
    logInfo(`Project types: ${new Set(sortedData.map(e => e.typeOfWork)).size}`);
  }
  
  return {
    filePath,
    data: sortedData,
    summary: {
      totalEntries: sortedData.length,
      yearsCount: new Set(sortedData.map(e => e.fundingYear)).size,
      typesCount: new Set(sortedData.map(e => e.typeOfWork)).size
    }
  };
}

/**
 * Test function for report generation
 */
async function testReport3() {
  try {
    console.log('\n[TEST] Testing Cost Overrun Trends Report...\n');
    
    const { readData } = require('../ingestion/readData');
    const { cleanData } = require('../ingestion/cleanData');
    const { deriveFields } = require('../ingestion/deriveFields');
    
    const raw = await readData();
    const cleaned = cleanData(raw, { logResults: false });
    const processed = deriveFields(cleaned, { logResults: false });
    
    const result = generateCostOverrunTrendsReport(processed);
    
    console.log('\n[SUCCESS] Report 3 generated!');
    console.log(`  File: ${result.filePath}`);
    console.log(`  Years analyzed: ${result.summary.yearsCount}`);
    console.log(`  Project types: ${result.summary.typesCount}`);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Test failed:', error.message);
    throw error;
  }
}

module.exports = {
  generateCostOverrunTrendsReport,
  calculateYoYChange,
  testReport3
};

// If run directly, execute test
if (require.main === module) {
  testReport3()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

