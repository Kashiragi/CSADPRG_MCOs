// ============================================
// ACCOUNT MANAGER MODULE
// ============================================
// Manages single user account registration and information
// Only one account can exist at a time in this banking system
// Single account system - only one account can exist at a time
let account = null;

// ============================================
// ACCOUNT STORAGE
// ============================================
// Single account system - only one account can exist at a time
let account = null;

// ============================================
// ACCOUNT REGISTRATION
// ============================================
/**
 * Registers a new account with a user-provided name
 * @param {Object} rl - The readline interface for user input
 * @param {Function} callBack - Callback function to return to main menu
 */
function registerAccount(rl, callBack){

    console.log("Register Account Name");
    rl.question("Account Name: ", function(accountName) {
        // Validate that account name is not empty
        if (!accountName.trim()) {
            console.log("Account name cannot be empty!");
            rl.question("Back to main menu? (Y/N) ", function(answer) {
                if (answer.trim().toUpperCase() === "Y") {
                    callBack();
                } else {
                    // Retry registration if user chooses not to return
                    registerAccount(rl, callBack);
                }
            });
            return;
        }

        // Create new account with provided name and zero initial balance
        account = { 
            name: accountName.trim(), 
            balance: 0
        };
        console.log(`Account "${account.name}" registered successfully.`);
        
        // Ask user if they want to return to main menu
        rl.question("Back to main menu? (Y/N) ", function(answer) {
            if (answer.trim().toUpperCase() === "Y") {
                callBack();
            } else {
                // Allow user to register another account (overwrites existing)
                registerAccount(rl, callBack);
            }
        });
    });
}

// ============================================
// ACCOUNT RETRIEVAL
// ============================================
/**
 * Retrieves the current account object
 * @returns {Object|null} The account object or null if no account exists
 */
function getAccount() {
    return account;
}

// ============================================
// BALANCE MANAGEMENT
// ============================================
/**
 * Updates the balance of the current account
 * @param {number} newBalance - The new balance to set
 * @returns {boolean} True if update successful, false if no account exists
 */

function updateBalance(newBalance) {
    if (account !== null) {
        account.balance = newBalance;
        return true;
    }
    return false;
}

/**
 * Retrieves the name of the current account
 * @returns {string|null} The account name or null if no account exists
 */
function getAccountName() {
    return account !== null ? account.name : null;
}

/**
 * Retrieves the balance of the current account
 * @returns {number} The account balance or 0 if no account exists
 */
function getAccountBalance() {
    return account !== null ? account.balance : 0;
}

// ============================================
// MODULE EXPORTS
// ============================================
module.exports = {
    registerAccount: registerAccount,
    getAccount: getAccount,
    updateBalance: updateBalance,
    getAccountName: getAccountName,
    getAccountBalance: getAccountBalance
};

