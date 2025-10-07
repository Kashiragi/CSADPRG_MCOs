const accountManager = require('./accountManager');

function calculateInterest(balance) {
    const annualRate = 0.05; // 5% per annum
    const dailyRate = annualRate / 365;
    return balance * dailyRate;
}

function showInterestRecord(rl, mainMenu) {
    console.log("Show Interest Amount");
    
    const account = accountManager.getAccount();
    if (!account) {
        console.log("No account registered! Please register an account first.");
        mainMenu();
        return;
    }

    console.log(`Account Name: ${account.name}`);
    console.log(`Current Balance: ${account.balance.toFixed(2)}`);
    console.log("Currency: PHP");
    console.log("Interest Rate: 5%");
    
    rl.question("Total Number of Days: ", function(daysInput) {
        const days = parseInt(daysInput.trim());
        
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
            const dailyInterest = parseFloat(calculateInterest(currentBalance).toFixed(2));
            currentBalance = parseFloat((currentBalance + dailyInterest).toFixed(2));
            
            console.log(`${day}\t|\t${dailyInterest.toFixed(2)}\t|\t${currentBalance.toFixed(2)}\t|`);
        }
        
        askReturnToMenu(rl, mainMenu, () => showInterestRecord(rl, mainMenu));
    });
}

// Helper function to handle the "Back to main menu" question
function askReturnToMenu(rl, mainMenu, retryFunction) {
    rl.question("Back to the Main Menu (Y/N): ", function(answer) {
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
    showInterestRecord: showInterestRecord
};
