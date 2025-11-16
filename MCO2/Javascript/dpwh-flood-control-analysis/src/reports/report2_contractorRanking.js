// Report 2: Contractor Ranking Analysis
// Generates ranking and performance analysis of contractors

const _ = require('lodash');
const { writeCSV, formatNumber } = require('../utils/csvUtils');
const { logInfo, logSection } = require('../services/loggingService');

/**
 * Calculates reliability index for a contractor
 * Formula: (1 - (avg delay / 90)) * (total savings / total cost) * 100, capped at 100
 * @param {number} avgDelay - Average completion delay in days
 * @param {number} totalSavings - Total cost savings
 * @param {number} totalCost - Total contract cost
 * @returns {number} - Reliability index (capped at 100, can be negative)
 */
function calculateReliabilityIndex(avgDelay, totalSavings, totalCost) {
  if (totalCost === 0) return 0;
  
  const delayFactor = 1 - (avgDelay / 90);
  const savingsRatio = totalSavings / totalCost;
  const index = delayFactor * savingsRatio * 100;
  
  // Cap at 100 (no lower bound - can be negative)
  return Math.min(index, 100);
}

/**
 * Determines risk level based on reliability index
 * @param {number} reliabilityIndex - Reliability index score
 * @returns {string} - Risk level ('High Risk' or 'Low Risk')
 */
function determineRiskLevel(reliabilityIndex) {
  return reliabilityIndex < 50 ? 'High Risk' : 'Low Risk';
}

/**
 * Generates Contractor Ranking Report
 * @param {Array} data - Processed data with derived fields
 * @param {Object} options - Report options
 * @returns {Object} - Report results with file path and data
 */
function generateContractorRankingReport(data, options = {}) {
  const { logResults = true, minProjects = 5, topN = 15 } = options;
  
  if (logResults) {
    logSection('GENERATING REPORT 2: CONTRACTOR RANKING');
    logInfo(`Processing ${data.length} projects...`);
    logInfo(`Filter: Minimum ${minProjects} projects per contractor`);
    logInfo(`Top: ${topN} contractors`);
  }
  
  // Group by contractor
  const grouped = _.groupBy(data, 'contractor');
  
  const contractorStats = [];
  
  Object.entries(grouped).forEach(([contractor, projects]) => {
    // Filter contractors with minimum project count
    if (projects.length < minProjects) return;
    
    // Calculate total contract cost
    const totalContractCost = _.sumBy(projects, p => p.contractCost || 0);
    
    // Calculate number of projects
    const projectCount = projects.length;
    
    // Calculate average completion delay
    const validDelays = projects
      .filter(p => p.completionDelayDays !== null)
      .map(p => p.completionDelayDays);
    const avgCompletionDelay = validDelays.length > 0 
      ? _.mean(validDelays) 
      : 0;
    
    // Calculate total cost savings
    const validSavings = projects
      .filter(p => p.costSavings !== null)
      .map(p => p.costSavings);
    const totalCostSavings = validSavings.length > 0 
      ? _.sum(validSavings) 
      : 0;
    
    // Calculate reliability index
    const reliabilityIndex = calculateReliabilityIndex(
      avgCompletionDelay,
      totalCostSavings,
      totalContractCost
    );
    
    // Determine risk level
    const riskLevel = determineRiskLevel(reliabilityIndex);
    
    contractorStats.push({
      contractor,
      projectCount,
      totalContractCost,
      avgCompletionDelay,
      totalCostSavings,
      reliabilityIndex,
      riskLevel
    });
  });
  
  // Sort by total contract cost descending and take top N
  const sortedStats = _.orderBy(contractorStats, ['totalContractCost'], ['desc'])
    .slice(0, topN);
  
  // Format for CSV output
  const formattedData = sortedStats.map((stat, index) => ({
    Rank: index + 1,
    Contractor: stat.contractor,
    ProjectCount: stat.projectCount,
    TotalContractCost: formatNumber(stat.totalContractCost, 2),
    AvgCompletionDelayDays: formatNumber(stat.avgCompletionDelay, 2),
    TotalCostSavings: formatNumber(stat.totalCostSavings, 2),
    ReliabilityIndex: formatNumber(stat.reliabilityIndex, 2),
    RiskLevel: stat.riskLevel
  }));
  
  // Write to CSV
  const filePath = writeCSV('report2_contractor_ranking.csv', formattedData);
  
  if (logResults) {
    logInfo(`Report generated with ${sortedStats.length} contractors`);
    logInfo(`Output file: ${filePath}`);
    logInfo(`Top contractor: ${sortedStats[0].contractor}`);
    logInfo(`  Total contract cost: PHP ${sortedStats[0].totalContractCost.toLocaleString()}`);
    logInfo(`  Reliability index: ${sortedStats[0].reliabilityIndex.toFixed(2)}`);
    
    const highRisk = sortedStats.filter(s => s.riskLevel === 'High Risk').length;
    logInfo(`High Risk contractors: ${highRisk} of ${sortedStats.length}`);
  }
  
  return {
    filePath,
    data: sortedStats,
    summary: {
      totalContractors: sortedStats.length,
      topContractor: sortedStats[0].contractor,
      highRiskCount: sortedStats.filter(s => s.riskLevel === 'High Risk').length
    }
  };
}

/**
 * Test function for report generation
 */
async function testReport2() {
  try {
    console.log('\n[TEST] Testing Contractor Ranking Report...\n');
    
    const { readData } = require('../ingestion/readData');
    const { cleanData } = require('../ingestion/cleanData');
    const { deriveFields } = require('../ingestion/deriveFields');
    
    const raw = await readData();
    const cleaned = cleanData(raw, { logResults: false });
    const processed = deriveFields(cleaned, { logResults: false });
    
    const result = generateContractorRankingReport(processed);
    
    console.log('\n[SUCCESS] Report 2 generated!');
    console.log(`  File: ${result.filePath}`);
    console.log(`  Top ${result.summary.totalContractors} contractors ranked`);
    console.log(`  High Risk: ${result.summary.highRiskCount}`);
    
    return result;
  } catch (error) {
    console.error('[ERROR] Test failed:', error.message);
    throw error;
  }
}

module.exports = {
  generateContractorRankingReport,
  calculateReliabilityIndex,
  determineRiskLevel,
  testReport2
};

// If run directly, execute test
if (require.main === module) {
  testReport2()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

