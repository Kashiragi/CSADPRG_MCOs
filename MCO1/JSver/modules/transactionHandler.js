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
    
    rl.question("Deposit Amount: ", function(amount) {
        const depositAmount = parseFloat(amount);
        
        if (isNaN(depositAmount) || depositAmount <= 0) {
            console.log("Invalid amount! Please enter a positive number.");
            rl.question("Back to the main Menu (Y/N): ", function(answer) {
                if (answer.trim().toUpperCase() === "Y") {
                    mainMenu();
                } else {
                    deposit(rl, mainMenu);
                }
            });
            return;
        }

        const newBalance = account.balance + depositAmount;
        accountManager.updateBalance(newBalance);
        
        console.log(`Updated Balance: ${newBalance}`);
        
        rl.question("Back to the main Menu (Y/N): ", function(answer) {
            if (answer.trim().toUpperCase() === "Y") {
                mainMenu();
            } else {
                deposit(rl, mainMenu);
            }
        });
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
    
    rl.question("Withdraw Amount: ", function(amount) {
        const withdrawAmount = parseFloat(amount);
        
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
        
        rl.question("Back to the main Menu (Y/N): ", function(answer) {
            if (answer.trim().toUpperCase() === "Y") {
                mainMenu();
            } else {
                withdraw(rl, mainMenu);
            }
        });
    });
}

module.exports = {
    deposit: deposit,
    withdraw: withdraw
};