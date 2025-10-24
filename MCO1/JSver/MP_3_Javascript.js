/********************
Last names: Reyes, Saguin, Trinidad, Inocencio
Language: JavaScript
Paradigm(s): Object-Oriented, Functional
********************/

// ============================================
// MODULE IMPORTS
// ============================================
const accountManager = require('./modules/accountManager');
const transactionHandler = require('./modules/transactionHandler');
const currencyExchange = require('./modules/currencyExchange');
const interestCalculator = require('./modules/interestCalculator');
const readline = require('readline');

// ============================================
// READLINE INTERFACE SETUP
// ============================================
// Create a single interface for reading input from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ============================================
// MAIN MENU FUNCTION
// ============================================
/**
 * Displays the main menu and handles user input
 * Routes user to appropriate banking functions
 */
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

  // Get user's menu choice
  rl.question('Enter your choice: ', (choice) => {
    switch (choice.trim()) { 
      case "1":
        // Navigate to account registration
        accountManager.registerAccount(rl, mainMenu);
        break;
      case "2":
        // Navigate to deposit transaction
        transactionHandler.deposit(rl, mainMenu);
        break;
      case "3":
        // Navigate to withdrawal transaction
        transactionHandler.withdraw(rl, mainMenu);
        break;
      case "4":
        // Navigate to currency exchange
        currencyExchange.currencyExchange(rl, mainMenu);
        break;
      case "5":
        // Navigate to exchange rate management
        currencyExchange.recordExchangeRates(rl, mainMenu);
        break;
      case "6":
        // Navigate to interest calculator
        interestCalculator.showInterestRecord(rl, mainMenu);
        break;
      case "7":
        // Exit the application
        console.log("Exiting the application. Goodbye!");
        rl.close(); // Close the readline interface and exit the process
        break;
      default:
        // Handle invalid input
        console.log("Invalid choice. Please try again.");
        mainMenu();
    }
  });
}

// ============================================
// APPLICATION ENTRY POINT
// ============================================
// Start the application by calling the main menu for the first time
mainMenu();