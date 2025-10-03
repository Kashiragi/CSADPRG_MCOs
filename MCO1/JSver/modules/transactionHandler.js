const accountManager = require('./accountManager');

function deposit(rl, mainMenu) {
    console.log("Deposit Amount");
    
    const account = accountManager.getAccount();
    if (!account) {
        console.log("No account registered! Please register an account first.");
        mainMenu();
        return;
    }

    console.log(`Account Name: ${account.name}`);
    console.log(`Current Balance: ${account.balance}`);
    console.log("Currency: PHP");
    
    // Use a more direct approach
    rl.question("Deposit Amount: ", (amount) => {
        const trimmedAmount = amount.trim();
        
        if (!trimmedAmount) {
            console.log("No amount entered! Please enter a positive number.");
            askReturnToMenu(rl, mainMenu, () => deposit(rl, mainMenu));
            return;
        }
        
        const depositAmount = parseFloat(trimmedAmount);
        
        if (isNaN(depositAmount) || depositAmount <= 0) {
            console.log("Invalid amount! Please enter a positive number.");
            askReturnToMenu(rl, mainMenu, () => deposit(rl, mainMenu));
            return;
        }

        const newBalance = account.balance + depositAmount;
        accountManager.updateBalance(newBalance);
        
        console.log(`Updated Balance: ${newBalance}`);
        askReturnToMenu(rl, mainMenu, () => deposit(rl, mainMenu));
    });
}

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
    
    rl.question("Withdraw Amount: ", (amount) => {
        const trimmedAmount = amount.trim();
        
        if (!trimmedAmount) {
            console.log("No amount entered! Please enter a positive number.");
            askReturnToMenu(rl, mainMenu, () => withdraw(rl, mainMenu));
            return;
        }
        
        const withdrawAmount = parseFloat(trimmedAmount);
        
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            console.log("Invalid amount! Please enter a positive number.");
            askReturnToMenu(rl, mainMenu, () => withdraw(rl, mainMenu));
            return;
        }

        if (withdrawAmount > account.balance) {
            console.log("Insufficient funds! Cannot withdraw more than current balance.");
            askReturnToMenu(rl, mainMenu, () => withdraw(rl, mainMenu));
            return;
        }

        const newBalance = account.balance - withdrawAmount;
        accountManager.updateBalance(newBalance);
        
        console.log(`Updated Balance: ${newBalance}`);
        askReturnToMenu(rl, mainMenu, () => withdraw(rl, mainMenu));
    });
}

// Helper function to handle the "Back to main menu" question
function askReturnToMenu(rl, mainMenu, retryFunction) {
    rl.question("Back to the main Menu (Y/N): ", (answer) => {
        const response = answer.trim().toUpperCase();
        if (response === "Y" || response === "YES") {
            mainMenu();
        } else if (response === "N" || response === "NO") {
            retryFunction();
        } else {
            console.log("Please enter Y for Yes or N for No.");
            askReturnToMenu(rl, mainMenu, retryFunction);
        }
    });
}

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