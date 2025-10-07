const accountManager = require('./modules/accountManager');
const transactionHandler = require('./modules/transactionHandler');
const currencyExchange = require('./modules/currencyExchange');
const interestCalculator = require('./modules/interestCalculator');
const readline = require('readline');

// Create a single interface for reading input from the console.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function mainMenu() {
  const menu = `
Welcome to the Main Menu

Please select an option:

1. Register Account Name
2. Deposit Amount
3. Withdraw Amount
4. Currency Exchange
5. Record Exchange Rates
6. Show Interest Record
7. Exit
`;

  console.log(menu);

  rl.question('Enter your choice: ', (choice) => {
    switch (choice.trim()) { // Use .trim() to remove whitespace
      case "1":
        accountManager.registerAccount(rl, mainMenu);
        break;
      case "2":
        transactionHandler.deposit(rl, mainMenu);
        break;
      case "3":
        transactionHandler.withdraw(rl, mainMenu);
        break;
      case "4":
        currencyExchange.currencyExchange(rl, mainMenu);
        break;
      case "5":
        currencyExchange.recordExchangeRates(rl, mainMenu);
        break;
      case "6":
        interestCalculator.showInterestRecord(rl, mainMenu);
        break;
      case "7":
        console.log("Exiting the application. Goodbye!");
        rl.close(); // Close the readline interface and exit the process
        break;
      default:
        console.log("Invalid choice. Please try again.");
        mainMenu();
    }
  });
}

// Start the application by calling the main menu for the first time
mainMenu();