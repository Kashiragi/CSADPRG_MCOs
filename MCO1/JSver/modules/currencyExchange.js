// ============================================
// CURRENCY EXCHANGE MODULE
// ============================================
// Manages exchange rates and currency conversion
// Supports 6 currencies: PHP, USD, JPY, GBP, EUR, CNY

// ============================================
// EXCHANGE RATES STORAGE
// ============================================
// Simple exchange rates storage - user will overwrite before using
// Rates are stored as simple list without base currency assumption
let exchangeRates = {
    PHP: null,        // Philippine Peso
    USD: null,        // United States Dollar
    JPY: null,        // Japanese Yen
    GBP: null,        // British Pound Sterling
    EUR: null,        // Euro
    CNY: null         // Chinese Yuan Renminbi
};

// ============================================
// RECORD EXCHANGE RATES FUNCTION
// ============================================
/**
 * Allows user to input and store exchange rates for currencies
 * @param {Object} rl - The readline interface for user input
 * @param {Function} mainMenu - Callback function to return to main menu
 */
function recordExchangeRates(rl, mainMenu){
    console.log("Record Exchange Rate");
    console.log("[1] Philippine Peso (PHP)");
    console.log("[2] United States Dollar (USD)");
    console.log("[3] Japanese Yen (JPY)");
    console.log("[4] British Pound Sterling (GBP)");
    console.log("[5] Euro (EUR)");
    console.log("[6] Chinese Yuan Renminbi (CNY)");
    
    // Get currency selection from user
    rl.question("Select Foreign Currency: ", function(choice) {
        const currency = getCurrencyFromChoice(choice.trim());
        
        // Validate currency selection
        if (!currency) {
            console.log("Invalid choice. Please try again.");
            recordExchangeRates(rl, mainMenu);
            return;
        }
        
        // Get exchange rate from user
        rl.question("Exchange Rate: ", function(rate) {
            const trimmedRate = rate.trim();
            
            // Validate that rate is not empty
            if (!trimmedRate) {
                console.log("No rate entered! Please enter a positive number.");
                askReturnToMenu(rl, mainMenu, () => recordExchangeRates(rl, mainMenu));
                return;
            }
            
            const exchangeRate = parseFloat(trimmedRate);
            
            // Validate that rate is a positive number
            if (isNaN(exchangeRate) || exchangeRate <= 0) {
                console.log("Invalid rate! Please enter a positive number.");
                askReturnToMenu(rl, mainMenu, () => recordExchangeRates(rl, mainMenu));
                return;
            }
            
            // Store the rate for the selected currency
            exchangeRates[currency] = exchangeRate;
            
            askReturnToMenu(rl, mainMenu, () => recordExchangeRates(rl, mainMenu));
        });
    });
}

// ============================================
// CURRENCY MAPPING HELPER
// ============================================
/**
 * Maps numeric choice to currency code
 * @param {string} choice - User's numeric choice (1-6)
 * @returns {string|null} Currency code or null if invalid
 */
function getCurrencyFromChoice(choice) {
    const currencyMap = {
        '1': 'PHP',
        '2': 'USD', 
        '3': 'JPY',
        '4': 'GBP',
        '5': 'EUR',
        '6': 'CNY'
    };
    return currencyMap[choice] || null;
}

// ============================================
// CURRENCY EXCHANGE FUNCTION
// ============================================
/**
 * Performs currency conversion using cross-rate calculation
 * Formula: (sourceAmount / sourceRate) * targetRate
 * @param {Object} rl - The readline interface for user input
 * @param {Function} mainMenu - Callback function to return to main menu
 */
function currencyExchange(rl, mainMenu) {
    console.log("Foreign Currency Exchange");
    console.log("Source Currency Option:");
    console.log("[1] Philippine Peso (PHP)");
    console.log("[2] United States Dollar (USD)");
    console.log("[3] Japanese Yen (JPY)");
    console.log("[4] British Pound Sterling (GBP)");
    console.log("[5] Euro (EUR)");
    console.log("[6] Chinese Yuan Renminbi (CNY)");
    
    // Get source currency selection
    rl.question("Source Currency: ", function(sourceChoice) {
        const sourceCurrency = getCurrencyFromChoice(sourceChoice.trim());
        
        // Validate source currency
        if (!sourceCurrency) {
            console.log("Invalid choice. Please try again.");
            currencyExchange(rl, mainMenu);
            return;
        }
        
        // Get source amount from user
        rl.question("Source Amount: ", function(amount) {
            const sourceAmount = parseFloat(amount.trim());
            
            // Validate source amount
            if (isNaN(sourceAmount) || sourceAmount <= 0) {
                console.log("Invalid amount! Please enter a positive number.");
                askReturnToMenu(rl, mainMenu, () => currencyExchange(rl, mainMenu));
                return;
            }
            
            // Display target currency options
            console.log("Exchanged Currency Options:");
            console.log("[1] Philippine Peso (PHP)");
            console.log("[2] United States Dollar (USD)");
            console.log("[3] Japanese Yen (JPY)");
            console.log("[4] British Pound Sterling (GBP)");
            console.log("[5] Euro (EUR)");
            console.log("[6] Chinese Yuan Renminbi (CNY)");
            
            // Get target currency selection
            rl.question("Exchange Currency: ", function(targetChoice) {
                const targetCurrency = getCurrencyFromChoice(targetChoice.trim());
                
                // Validate target currency
                if (!targetCurrency) {
                    console.log("Invalid choice. Please try again.");
                    currencyExchange(rl, mainMenu);
                    return;
                }
                
                // Prevent same currency conversion
                if (sourceCurrency === targetCurrency) {
                    console.log("Source and target currencies cannot be the same.");
                    askReturnToMenu(rl, mainMenu, () => currencyExchange(rl, mainMenu));
                    return;
                }
                
                // Check if exchange rates are available for conversion
                const sourceRate = exchangeRates[sourceCurrency];
                const targetRate = exchangeRates[targetCurrency];
                
                // Verify both rates have been set
                if (sourceRate === null || targetRate === null) {
                    console.log(`Exchange rates not set for ${sourceCurrency} or ${targetCurrency}!`);
                    console.log("Please set exchange rates first using option 5 (Record Exchange Rates).");
                    askReturnToMenu(rl, mainMenu, () => currencyExchange(rl, mainMenu));
                    return;
                }
                
                // Convert using cross rates: source → base → target
                // Formula: (sourceAmount / sourceRate) * targetRate
                const exchangeAmount = (sourceAmount / sourceRate) * targetRate;
                console.log(`Exchange Amount: ${exchangeAmount.toFixed(2)}`);
                
                // Ask if user wants to make another conversion
                rl.question("Convert another currency (Y/N)? ", function(answer) {
                    const response = answer.trim().toUpperCase();
                    if (response === "Y" || response === "YES") {
                        currencyExchange(rl, mainMenu);
                    } else {
                        mainMenu();
                    }
                });
            });
        });
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
    rl.question("Back to the main Menu (Y/N): ", function(answer) {
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
    recordExchangeRates: recordExchangeRates,
    currencyExchange: currencyExchange
};