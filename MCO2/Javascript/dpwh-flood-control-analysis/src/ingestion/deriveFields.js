// Derived fields calculation module
// Computes calculated fields like CostSavings, CompletionDelayDays, and other metrics

const { logInfo, logSection } = require('../services/loggingService');

/**
 * Calculates the number of days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number|null} - Number of days or null if dates are invalid
 */
function calculateDaysBetween(startDate, endDate) {
  if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
    return null;
  }
  
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffTime / millisecondsPerDay);
  
  return diffDays;
}

/**
 * Calculates cost savings (budget - actual cost)
 * @param {number} approvedBudget - Approved budget for contract
 * @param {number} contractCost - Actual contract cost
 * @returns {number|null} - Cost savings (positive = under budget, negative = over budget)
 */
function calculateCostSavings(approvedBudget, contractCost) {
  if (approvedBudget === null || contractCost === null) {
    return null;
  }
  
  return approvedBudget - contractCost;
}

/**
 * Calculates cost overrun percentage
 * @param {number} approvedBudget - Approved budget for contract
 * @param {number} contractCost - Actual contract cost
 * @returns {number|null} - Percentage overrun (positive = over budget, negative = under budget)
 */
function calculateCostOverrunPercentage(approvedBudget, contractCost) {
  if (approvedBudget === null || contractCost === null || approvedBudget === 0) {
    return null;
  }
  
  return ((contractCost - approvedBudget) / approvedBudget) * 100;
}

/**
 * Determines if project is over budget
 * @param {number} costSavings - Cost savings value
 * @returns {boolean|null} - True if over budget, false if under/on budget
 */
function isOverBudget(costSavings) {
  if (costSavings === null) {
    return null;
  }
  
  return costSavings < 0;
}

/**
 * Calculates completion time in months
 * @param {number} completionDelayDays - Completion delay in days
 * @returns {number|null} - Completion time in months
 */
function calculateCompletionMonths(completionDelayDays) {
  if (completionDelayDays === null) {
    return null;
  }
  
  return parseFloat((completionDelayDays / 30.44).toFixed(2)); // Average days per month
}

/**
 * Adds derived fields to a single data row
 * @param {Object} row - Cleaned data row
 * @returns {Object} - Row with derived fields added
 */
function deriveRowFields(row) {
  // Calculate cost savings
  const costSavings = calculateCostSavings(
    row.approvedBudgetForContract,
    row.contractCost
  );
  
  // Calculate completion delay in days
  const completionDelayDays = calculateDaysBetween(
    row.startDate,
    row.actualCompletionDate
  );
  
  // Calculate cost overrun percentage
  const costOverrunPercentage = calculateCostOverrunPercentage(
    row.approvedBudgetForContract,
    row.contractCost
  );
  
  // Calculate completion in months
  const completionMonths = calculateCompletionMonths(completionDelayDays);
  
  // Determine budget status
  const overBudget = isOverBudget(costSavings);
  
  return {
    ...row,
    // Derived financial metrics
    costSavings: costSavings,
    costOverrunPercentage: costOverrunPercentage,
    isOverBudget: overBudget,
    
    // Derived time metrics
    completionDelayDays: completionDelayDays,
    completionMonths: completionMonths,
    
    // Additional computed fields
    budgetUtilizationRate: row.approvedBudgetForContract && row.contractCost
      ? parseFloat(((row.contractCost / row.approvedBudgetForContract) * 100).toFixed(2))
      : null
  };
}

/**
 * Adds derived fields to all data rows
 * @param {Array} cleanedData - Array of cleaned data rows
 * @param {Object} options - Options for field derivation
 * @returns {Array} - Array with derived fields added
 */
function deriveFields(cleanedData, options = {}) {
  const { logResults = true } = options;
  
  if (logResults) {
    logSection('DERIVING CALCULATED FIELDS');
    logInfo(`Processing ${cleanedData.length} rows...`);
  }
  
  // Add derived fields to each row
  const dataWithDerivedFields = cleanedData.map(row => deriveRowFields(row));
  
  if (logResults) {
    // Calculate statistics
    const validCostSavings = dataWithDerivedFields.filter(r => r.costSavings !== null).length;
    const validCompletionDays = dataWithDerivedFields.filter(r => r.completionDelayDays !== null).length;
    const overBudgetCount = dataWithDerivedFields.filter(r => r.isOverBudget === true).length;
    const underBudgetCount = dataWithDerivedFields.filter(r => r.isOverBudget === false).length;
    
    // Calculate averages
    const avgCostSavings = dataWithDerivedFields
      .filter(r => r.costSavings !== null)
      .reduce((sum, r) => sum + r.costSavings, 0) / validCostSavings;
    
    const avgCompletionDays = dataWithDerivedFields
      .filter(r => r.completionDelayDays !== null)
      .reduce((sum, r) => sum + r.completionDelayDays, 0) / validCompletionDays;
    
    logInfo(`\nDerived Fields Summary:`);
    logInfo(`  Rows with valid CostSavings: ${validCostSavings}`);
    logInfo(`  Rows with valid CompletionDelayDays: ${validCompletionDays}`);
    logInfo(`  Projects over budget: ${overBudgetCount}`);
    logInfo(`  Projects under/on budget: ${underBudgetCount}`);
    logInfo(`  Average cost savings: PHP ${avgCostSavings.toFixed(2)}`);
    logInfo(`  Average completion time: ${avgCompletionDays.toFixed(2)} days (${(avgCompletionDays / 30.44).toFixed(2)} months)`);
  }
  
  return dataWithDerivedFields;
}

/**
 * Test function to demonstrate derived fields
 */
async function testDeriveFields() {
  try {
    console.log('\n[TEST] Testing deriveFields function...\n');
    
    // Import dependencies
    const { readData } = require('./readData');
    const { validateData } = require('./validateData');
    const { cleanData } = require('./cleanData');
    const { clearLog } = require('../services/loggingService');
    
    // Clear log
    clearLog();
    
    // Read, validate, and clean data
    const rawData = await readData();
    const validationResults = validateData(rawData);
    const cleanedData = cleanData(validationResults.validData, { 
      logResults: true,
      originalCount: rawData.length
    });
    
    // Derive fields
    const dataWithDerivedFields = deriveFields(cleanedData, { logResults: true });
    
    console.log('\n[RESULT] Field derivation completed!');
    console.log(`  Original CSV rows: ${rawData.length}`);
    console.log(`  Valid rows after validation: ${validationResults.validData.length}`);
    console.log(`  Cleaned rows after filters: ${cleanedData.length}`);
    console.log(`  Final processed rows: ${dataWithDerivedFields.length}`);
    
    // Show sample record with derived fields
    console.log('\n[SAMPLE] First record with derived fields:');
    console.log(JSON.stringify(dataWithDerivedFields[0], null, 2));
    
    // Show derived field verification
    console.log('\n[VERIFY] Derived fields:');
    const sample = dataWithDerivedFields[0];
    console.log(`  Cost Savings: PHP ${sample.costSavings?.toLocaleString() || 'N/A'}`);
    console.log(`  Cost Overrun %: ${sample.costOverrunPercentage?.toFixed(2) || 'N/A'}%`);
    console.log(`  Is Over Budget: ${sample.isOverBudget}`);
    console.log(`  Completion Delay: ${sample.completionDelayDays} days (${sample.completionMonths} months)`);
    console.log(`  Budget Utilization: ${sample.budgetUtilizationRate}%`);
    
    // Show some statistics
    console.log('\n[STATS] Quick Statistics:');
    const overBudget = dataWithDerivedFields.filter(r => r.isOverBudget === true).length;
    const underBudget = dataWithDerivedFields.filter(r => r.isOverBudget === false).length;
    console.log(`  Over Budget Projects: ${overBudget} (${(overBudget / dataWithDerivedFields.length * 100).toFixed(2)}%)`);
    console.log(`  Under Budget Projects: ${underBudget} (${(underBudget / dataWithDerivedFields.length * 100).toFixed(2)}%)`);
    
    return dataWithDerivedFields;
  } catch (error) {
    console.error('[ERROR] Test failed:', error.message);
    throw error;
  }
}

module.exports = {
  deriveFields,
  deriveRowFields,
  calculateDaysBetween,
  calculateCostSavings,
  calculateCostOverrunPercentage,
  calculateCompletionMonths,
  isOverBudget,
  testDeriveFields
};

// If this file is run directly, execute the test
if (require.main === module) {
  testDeriveFields()
    .then(() => {
      console.log('\n[SUCCESS] deriveFields.js test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n[ERROR] deriveFields.js test failed!');
      process.exit(1);
    });
}

