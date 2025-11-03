// Report 1: Regional Efficiency Analysis
// Generates analysis of project efficiency across different regions

const _ = require('lodash');
const { writeCSV, formatNumber } = require('../utils/csvUtils');
const { logInfo, logSection } = require('../services/loggingService');

/**
 * Calculates median of an array of numbers
 * @param {Array} values - Array of numbers
 * @returns {number} - Median value
 */
function calculateMedian(values) {
  if (!values || values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

/**
 * Normalizes efficiency score to 0-100 range
 * @param {number} score - Raw efficiency score
 * @param {number} min - Minimum score in dataset
 * @param {number} max - Maximum score in dataset
 * @returns {number} - Normalized score (0-100)
 */
function normalizeScore(score, min, max) {
  if (max === min) return 50;
  return ((score - min) / (max - min)) * 100;
}

/**
 * Generates Regional Efficiency Report
 * @param {Array} data - Processed data with derived fields
 * @param {Object} options - Report options
 * @returns {Object} - Report results with file path and data
 */
function generateRegionalEfficiencyReport(data, options = {}) {
  const { logResults = true } = options;
  
  if (logResults) {
    logSection('GENERATING REPORT 1: REGIONAL EFFICIENCY');
    logInfo(`Processing ${data.length} projects...`);
  }
  
  // Group data by Region and MainIsland
  const grouped = _.groupBy(data, row => `${row.mainIsland}|${row.region}`);
  
  const regionalStats = [];
  
  Object.entries(grouped).forEach(([key, projects]) => {
    const [mainIsland, region] = key.split('|');
    
    // Filter projects with valid cost savings
    const validCostSavings = projects
      .filter(p => p.costSavings !== null)
      .map(p => p.costSavings);
    
    // Calculate aggregate budget
    const totalApprovedBudget = _.sumBy(projects, p => p.approvedBudgetForContract || 0);
    
    // Calculate median cost savings
    const medianCostSavings = calculateMedian(validCostSavings);
    
    // Calculate average completion delay
    const validDelays = projects
      .filter(p => p.completionDelayDays !== null)
      .map(p => p.completionDelayDays);
    const avgCompletionDelay = validDelays.length > 0 
      ? _.mean(validDelays) 
      : 0;
    
    // Calculate percentage of projects with delays > 30 days
    const projectsWithLongDelay = projects.filter(p => 
      p.completionDelayDays !== null && p.completionDelayDays > 30
    ).length;
    const delayPercentage = projects.length > 0 
      ? (projectsWithLongDelay / projects.length) * 100 
      : 0;
    
    // Calculate raw efficiency score: (median savings / average delay) * 100
    const rawEfficiencyScore = avgCompletionDelay > 0 
      ? (medianCostSavings / avgCompletionDelay) * 100 
      : 0;
    
    regionalStats.push({
      mainIsland,
      region,
      projectCount: projects.length,
      totalApprovedBudget,
      medianCostSavings,
      avgCompletionDelay,
      delayPercentage,
      rawEfficiencyScore
    });
  });
  
  // Normalize efficiency scores to 0-100
  const rawScores = regionalStats.map(r => r.rawEfficiencyScore);
  const minScore = Math.min(...rawScores);
  const maxScore = Math.max(...rawScores);
  
  regionalStats.forEach(stat => {
    stat.efficiencyScore = normalizeScore(stat.rawEfficiencyScore, minScore, maxScore);
  });
  
  // Sort by efficiency score descending
  const sortedStats = _.orderBy(regionalStats, ['efficiencyScore'], ['desc']);
  
  // Format for CSV output
  const formattedData = sortedStats.map(stat => ({
    MainIsland: stat.mainIsland,
    Region: stat.region,
    ProjectCount: stat.projectCount,
    TotalApprovedBudget: formatNumber(stat.totalApprovedBudget, 2),
    MedianCostSavings: formatNumber(stat.medianCostSavings, 2),
    AvgCompletionDelayDays: formatNumber(stat.avgCompletionDelay, 2),
    DelayPercentageOver30Days: formatNumber(stat.delayPercentage, 2),
    EfficiencyScore: formatNumber(stat.efficiencyScore, 2)
  }));
  
  // Write to CSV
  const filePath = writeCSV('report1_regional_efficiency.csv', formattedData);
  
  if (logResults) {
    logInfo(`Report generated with ${sortedStats.length} regional entries`);
    logInfo(`Output file: ${filePath}`);
    logInfo(`Top region: ${sortedStats[0].mainIsland} - ${sortedStats[0].region}`);
    logInfo(`  Efficiency Score: ${sortedStats[0].efficiencyScore.toFixed(2)}`);
  }
  
  return {
    filePath,
    data: sortedStats,
    summary: {
      totalRegions: sortedStats.length,
      topRegion: `${sortedStats[0].mainIsland} - ${sortedStats[0].region}`,
      topScore: sortedStats[0].efficiencyScore
    }
  };
}

/**
 * Test function for report generation
 */
async function testReport1() {
  try {
    console.log('\n[TEST] Testing Regional Efficiency Report...\n');
    
    const { readData } = require('../ingestion/readData');
    const { cleanData } = require('../ingestion/cleanData');
    const { deriveFields } = require('../ingestion/deriveFields');
    
    const raw = await readData();
    const cleaned = cleanData(raw, { logResults: false });
    const processed = deriveFields(cleaned, { logResults: false });
    
    const result = generateRegionalEfficiencyReport(processed);
    
    console.log('\n[SUCCESS] Report 1 generated!');
    console.log(`  File: ${result.filePath}`);
    console.log(`  Regions analyzed: ${result.summary.totalRegions}`);
    console.log(`  Top region: ${result.summary.topRegion}`);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Test failed:', error.message);
    throw error;
  }
}

module.exports = {
  generateRegionalEfficiencyReport,
  calculateMedian,
  normalizeScore,
  testReport1
};

// If run directly, execute test
if (require.main === module) {
  testReport1()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

