// ============================================
// INTEREST CALCULATOR MODULE
// ============================================
// Calculates and displays daily compound interest
// Based on 5% annual interest rate

const accountManager = require('./accountManager');

// ============================================
// INTEREST CALCULATION
// ============================================
/**
 * Calculates daily interest for a given balance
 * Formula: Daily Interest = Balance × (Annual Rate / 365)
 * Annual Rate: 5% per annum
 * @param {number} balance - The current balance
 * @returns {number} The calculated daily interest
 */
function calculateInterest(balance) {
    const annualRate = 0.05; // 5% per annum
    const dailyRate = annualRate / 365;
    return balance * dailyRate;
}

// ============================================
// SHOW INTEREST RECORD FUNCTION
// ============================================
/**
 * Displays projected interest earnings over specified number of days
 * Shows day-by-day breakdown with compounding interest
 * @param {Object} rl - The readline interface for user input
 * @param {Function} mainMenu - Callback function to return to main menu
 */
function showInterestRecord(rl, mainMenu) {
    console.log("Show Interest Amount");
    
    // Check if an account exists
    const account = accountManager.getAccount();
    if (!account) {
        console.log("No account registered! Please register an account first.");
        mainMenu();
        return;
    }

    // Display account information
    console.log(`Account Name: ${account.name}`);
    console.log(`Current Balance: ${account.balance.toFixed(2)}`);
    console.log("Currency: PHP");
    console.log("Interest Rate: 5%");
    
    // Get number of days from user
    rl.question("Total Number of Days: ", function(daysInput) {
        const days = parseInt(daysInput.trim());
        
        // Validate number of days
        if (isNaN(days) || days <= 0) {
            console.log("Invalid number of days! Please enter a positive number.");
            askReturnToMenu(rl, mainMenu, () => showInterestRecord(rl, mainMenu));
            return;
        }
        
        console.log(`Total Number of Days: ${days} days`);
        
        // Display table header
        console.log("Day\t|\tInterest\t|\tBalance\t|");
        console.log("--------------------------------------------");
        
        let currentBalance = account.balance;
        
        // Calculate and display daily interest for each day
        for (let day = 1; day <= days; day++) {
            // Calculate interest with proper rounding to avoid floating-point errors
            const dailyInterest = parseFloat(calculateInterest(currentBalance).toFixed(2));
            // Update balance with compounded interest
            currentBalance = parseFloat((currentBalance + dailyInterest).toFixed(2));
            
            // Display day's interest and updated balance
            console.log(`${day}\t|\t${dailyInterest.toFixed(2)}\t|\t${currentBalance.toFixed(2)}\t|`);
        }
        
        askReturnToMenu(rl, mainMenu, () => showInterestRecord(rl, mainMenu));
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================
/**
 * Prompts user to return to main menu or retry current operation
 * @param {Object} rl - The readline interface for user input
 * @param {Function} mainMenu - Callback function to return to main menu
 * @param {Function} retryFunction - Function to retry current operation
 */
function askReturnToMenu(rl, mainMenu, retryFunction) {
    rl.question("Back to the Main Menu (Y/N): ", function(answer) {
        const response = answer.trim().toUpperCase();
        if (response === "Y" || response === "YES") {
            mainMenu();
        } else if (response === "N" || response === "NO") {
            retryFunction();
        } else {
            // Handle invalid Y/N response
            console.log("Please enter Y for Yes or N for No.");
            askReturnToMenu(rl, mainMenu, retryFunction);
        }
    });
}

// ============================================
// MODULE EXPORTS
// ============================================
module.exports = {
    showInterestRecord: showInterestRecord
};
