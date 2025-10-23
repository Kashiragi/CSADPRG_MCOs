// ============================================
// TRANSACTION HANDLER MODULE
// ============================================
// Handles deposit and withdrawal transactions
// All transactions are in PHP currency

const accountManager = require('./accountManager');

// ============================================
// DEPOSIT FUNCTION
// ============================================
/**
 * Handles deposit transactions to the user's account
 * @param {Object} rl - The readline interface for user input
 * @param {Function} mainMenu - Callback function to return to main menu
 */
function deposit(rl, mainMenu) {
    console.log("Deposit Amount");
    
    // Check if an account exists
    const account = accountManager.getAccount();
    if (!account) {
        console.log("No account registered! Please register an account first.");
        mainMenu();
        return;
    }

    // Display current account information
    console.log(`Account Name: ${account.name}`);
    console.log(`Current Balance: ${account.balance}`);
    console.log("Currency: PHP");
    
    // Prompt for deposit amount
    rl.question("Deposit Amount: ", (amount) => {
        const trimmedAmount = amount.trim();
        
        // Validate that amount is not empty
        if (!trimmedAmount) {
            console.log("No amount entered! Please enter a positive number.");
            askReturnToMenu(rl, mainMenu, () => deposit(rl, mainMenu));
            return;
        }
        
        const depositAmount = parseFloat(trimmedAmount);
        
        // Validate that amount is a positive number
        if (isNaN(depositAmount) || depositAmount <= 0) {
            console.log("Invalid amount! Please enter a positive number.");
            askReturnToMenu(rl, mainMenu, () => deposit(rl, mainMenu));
            return;
        }

        // Calculate and update new balance
        const newBalance = account.balance + depositAmount;
        accountManager.updateBalance(newBalance);
        
        console.log(`Updated Balance: ${newBalance}`);
        askReturnToMenu(rl, mainMenu, () => deposit(rl, mainMenu));
    });
}

// ============================================
// WITHDRAWAL FUNCTION
// ============================================
/**
 * Handles withdrawal transactions from the user's account
 * @param {Object} rl - The readline interface for user input
 * @param {Function} mainMenu - Callback function to return to main menu
 */
function withdraw(rl, mainMenu) {
    console.log("Withdraw Amount");
    
    // Check if an account exists
    const account = accountManager.getAccount();
    if (!account) {
        console.log("No account registered! Please register an account first.");
        mainMenu();
        return;
    }

    // Display current account information
    console.log(`Account Name: ${account.name}`);
    console.log(`Current Balance: ${account.balance}`);
    console.log("Currency: PHP");
    
    // Prompt for withdrawal amount
    rl.question("Withdraw Amount: ", (amount) => {
        const trimmedAmount = amount.trim();
        
        // Validate that amount is not empty
        if (!trimmedAmount) {
            console.log("No amount entered! Please enter a positive number.");
            askReturnToMenu(rl, mainMenu, () => withdraw(rl, mainMenu));
            return;
        }
        
        const withdrawAmount = parseFloat(trimmedAmount);
        
        // Validate that amount is a positive number
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            console.log("Invalid amount! Please enter a positive number.");
            askReturnToMenu(rl, mainMenu, () => withdraw(rl, mainMenu));
            return;
        }

        // Check for sufficient funds
        if (withdrawAmount > account.balance) {
            console.log("Insufficient funds! Cannot withdraw more than current balance.");
            askReturnToMenu(rl, mainMenu, () => withdraw(rl, mainMenu));
            return;
        }

        // Calculate and update new balance
        const newBalance = account.balance - withdrawAmount;
        accountManager.updateBalance(newBalance);
        
        console.log(`Updated Balance: ${newBalance}`);
        askReturnToMenu(rl, mainMenu, () => withdraw(rl, mainMenu));
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
    rl.question("Back to the main Menu (Y/N): ", (answer) => {
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
    deposit: deposit,
    withdraw: withdraw
};

function withdraw(rl, mainMenu) {
    console.log("Withdraw Amount");
    
    const account = accountManager.getAccount();
    if (!account) {
        console.log("No account registered! Please register an account first.");
        mainMenu();
        return;
    }

    console.log(`Account Name: ${account.name}`);
    console.log(`Current Balance: ${account.balance}`);
    console.log("Currency: PHP");
    
    rl.question("Withdraw Amount: ", function(amount) {
        // Trim the input to remove any whitespace
        const trimmedAmount = amount.trim();
        
        if (!trimmedAmount) {
            console.log("No amount entered! Please enter a positive number.");
            rl.question("Back to the main Menu (Y/N): ", function(answer) {
                if (answer.trim().toUpperCase() === "Y") {
                    mainMenu();
                } else {
                    withdraw(rl, mainMenu);
                }
            });
            return;
        }
        
        const withdrawAmount = parseFloat(trimmedAmount);
        
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            console.log("Invalid amount! Please enter a positive number.");
            rl.question("Back to the main Menu (Y/N): ", function(answer) {
                if (answer.trim().toUpperCase() === "Y") {
                    mainMenu();
                } else {
                    withdraw(rl, mainMenu);
                }
            });
            return;
        }

        if (withdrawAmount > account.balance) {
            console.log("Insufficient funds! Cannot withdraw more than current balance.");
            rl.question("Back to the main Menu (Y/N): ", function(answer) {
                if (answer.trim().toUpperCase() === "Y") {
                    mainMenu();
                } else {
                    withdraw(rl, mainMenu);
                }
            });
            return;
        }

        const newBalance = account.balance - withdrawAmount;
        accountManager.updateBalance(newBalance);
        
        console.log(`Updated Balance: ${newBalance}`);
        
        // Add a small delay to ensure the output is properly displayed
        process.nextTick(() => {
            rl.question("Back to the main Menu (Y/N): ", function(answer) {
                const response = answer.trim().toUpperCase();
                if (response === "Y" || response === "YES") {
                    mainMenu();
                } else if (response === "N" || response === "NO") {
                    withdraw(rl, mainMenu);
                } else {
                    console.log("Please enter Y for Yes or N for No.");
                    // Re-ask the question
                    rl.question("Back to the main Menu (Y/N): ", function(retryAnswer) {
                        if (retryAnswer.trim().toUpperCase() === "Y") {
                            mainMenu();
                        } else {
                            withdraw(rl, mainMenu);
                        }
                    });
                }
            });
        });
    });
}

module.exports = {
    deposit: deposit,
    withdraw: withdraw
};