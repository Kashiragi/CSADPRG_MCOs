const accountManager = require('./modules/accountManager');
const transactionHandler = require('./modules/transactionHandler');
const currencyExchange = require('./modules/currencyExchange');
const interestCalculator = require('./modules/interestCalculator');
const readline = require('readline');

// Create an interface for reading input from the console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function mainMenu() {
    console.log("Welcome to the Main Menu\n");
    console.log("Please select an option:\n");
    console.log("1. Register Account Name\n");
    console.log("2. Deposit Amount\n");
    console.log("3. Withdraw Amount\n");
    console.log("4. Currency Exchange\n");
    console.log("5. Record Exchange Rates\n");
    console.log("6. Show Interest Record\n");
    console.log("7. Exit\n");

    rl.question('Enter your choice: ', (choice) => {
        switch (choice) {
            case "1":
                //accountManager.registerAccount();
                mainMenu(); // Call mainMenu again to loop back
                break;
            case "2":
                //transactionHandler.depositAmount();
                mainMenu(); // Call mainMenu again to loop back
                break;
            case "3":
                //transactionHandler.withdrawAmount();
                mainMenu(); // Call mainMenu again to loop back
                break;
            case "4":
                //currencyExchange.currencyExchange();
                mainMenu(); // Call mainMenu again to loop back
                break;
            case "5":
                //currencyExchange.recordExchangeRates();
                mainMenu(); // Call mainMenu again to loop back
                break;
            case "6":
                //interestCalculator.showInterestRecord();
                mainMenu(); // Call mainMenu again to loop back
                break;
            case "7":
                console.log("Exiting the application. Goodbye!");
                rl.close(); // Close the readline interface
                break;
            default:
                console.log("Invalid choice. Please try again.");
                mainMenu(); // Call mainMenu again to loop back
                break;
        }
    });
}

// Start the application by calling the main menu for the first time
mainMenu();