// ============================================
// ACCOUNT MANAGER MODULE
// ============================================
// Manages single user account registration and information
// Only one account can exist at a time in this banking system

// Single account storage
let account = null;

// Registers a new account with a user-provided name
function registerAccount(rl, callBack) {
    // Check if an account already exists
    if (account !== null) {
        console.log("An account is already registered!");
        console.log(`Existing account: "${account.name}"`);
        rl.question("Back to main menu? (Y/N) ", function(answer) {
            if (answer && answer.trim().toUpperCase() === "Y") {
                callBack();
            } else {
                // Re-prompt if user chooses not to return
                registerAccount(rl, callBack);
            }
        });
        return;
    }

    console.log("Register Account Name");
    rl.question("Account Name: ", function(accountName) {
        if (!accountName || !accountName.trim()) {
            console.log("Account name cannot be empty!");
            rl.question("Back to main menu? (Y/N) ", function(answer) {
                if (answer && answer.trim().toUpperCase() === "Y") {
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
            if (answer && answer.trim().toUpperCase() === "Y") {
                callBack();
            } else {
                // Allow user to register another account (overwrites existing)
                registerAccount(rl, callBack);
            }
        });
    });
}

// Retrieves the current account object
function getAccount() {
    return account;
}

// Updates the balance of the current account
function updateBalance(newBalance) {
    if (account !== null) {
        account.balance = newBalance;
        return true;
    }
    return false;
}

// Retrieves the name of the current account
function getAccountName() {
    return account !== null ? account.name : null;
}

// Retrieves the balance of the current account
function getAccountBalance() {
    return account !== null ? account.balance : 0;
}

// Module exports
module.exports = {
    registerAccount: registerAccount,
    getAccount: getAccount,
    updateBalance: updateBalance,
    getAccountName: getAccountName,
    getAccountBalance: getAccountBalance
};

