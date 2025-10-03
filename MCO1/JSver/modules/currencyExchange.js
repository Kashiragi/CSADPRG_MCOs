// Simple exchange rates storage - user will overwrite before using
let exchangeRates = {
    PHP: null,        // Philippine Peso
    USD: null,        // United States Dollar
    JPY: null,        // Japanese Yen
    GBP: null,        // British Pound Sterling
    EUR: null,        // Euro
    CNY: null         // Chinese Yuan Renminbi
};

function recordExchangeRates(rl, mainMenu){
    console.log("Record Exchange Rate");
    console.log("[1] Philippine Peso (PHP)");
    console.log("[2] United States Dollar (USD)");
    console.log("[3] Japanese Yen (JPY)");
    console.log("[4] British Pound Sterling (GBP)");
    console.log("[5] Euro (EUR)");
    console.log("[6] Chinese Yuan Renminbi (CNY)");
    
    rl.question("Select Foreign Currency: ", function(choice) {
        const currency = getCurrencyFromChoice(choice.trim());
        
        if (!currency) {
            console.log("Invalid choice. Please try again.");
            recordExchangeRates(rl, mainMenu);
            return;
        }
        
        rl.question("Exchange Rate: ", function(rate) {
            const trimmedRate = rate.trim();
            
            if (!trimmedRate) {
                console.log("No rate entered! Please enter a positive number.");
                askReturnToMenu(rl, mainMenu, () => recordExchangeRates(rl, mainMenu));
                return;
            }
            
            const exchangeRate = parseFloat(trimmedRate);
            
            if (isNaN(exchangeRate) || exchangeRate <= 0) {
                console.log("Invalid rate! Please enter a positive number.");
                askReturnToMenu(rl, mainMenu, () => recordExchangeRates(rl, mainMenu));
                return;
            }
            
            // Simply store the rate for the selected currency
            exchangeRates[currency] = exchangeRate;
            
            askReturnToMenu(rl, mainMenu, () => recordExchangeRates(rl, mainMenu));
        });
    });
}

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

function currencyExchange(rl, mainMenu) {
    console.log("Foreign Currency Exchange");
    console.log("Source Currency Option:");
    console.log("[1] Philippine Peso (PHP)");
    console.log("[2] United States Dollar (USD)");
    console.log("[3] Japanese Yen (JPY)");
    console.log("[4] British Pound Sterling (GBP)");
    console.log("[5] Euro (EUR)");
    console.log("[6] Chinese Yuan Renminbi (CNY)");
    
    rl.question("Source Currency: ", function(sourceChoice) {
        const sourceCurrency = getCurrencyFromChoice(sourceChoice.trim());
        
        if (!sourceCurrency) {
            console.log("Invalid choice. Please try again.");
            currencyExchange(rl, mainMenu);
            return;
        }
        
        rl.question("Source Amount: ", function(amount) {
            const sourceAmount = parseFloat(amount.trim());
            
            if (isNaN(sourceAmount) || sourceAmount <= 0) {
                console.log("Invalid amount! Please enter a positive number.");
                askReturnToMenu(rl, mainMenu, () => currencyExchange(rl, mainMenu));
                return;
            }
            
            console.log("Exchanged Currency Options:");
            console.log("[1] Philippine Peso (PHP)");
            console.log("[2] United States Dollar (USD)");
            console.log("[3] Japanese Yen (JPY)");
            console.log("[4] British Pound Sterling (GBP)");
            console.log("[5] Euro (EUR)");
            console.log("[6] Chinese Yuan Renminbi (CNY)");
            
            rl.question("Exchange Currency: ", function(targetChoice) {
                const targetCurrency = getCurrencyFromChoice(targetChoice.trim());
                
                if (!targetCurrency) {
                    console.log("Invalid choice. Please try again.");
                    currencyExchange(rl, mainMenu);
                    return;
                }
                
                if (sourceCurrency === targetCurrency) {
                    console.log("Source and target currencies cannot be the same.");
                    askReturnToMenu(rl, mainMenu, () => currencyExchange(rl, mainMenu));
                    return;
                }
                
                // Check if exchange rates are available for conversion
                const sourceRate = exchangeRates[sourceCurrency];
                const targetRate = exchangeRates[targetCurrency];
                
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

// Helper function to handle the "Back to main menu" question
function askReturnToMenu(rl, mainMenu, retryFunction) {
    rl.question("Back to the main Menu (Y/N): ", function(answer) {
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
    recordExchangeRates: recordExchangeRates,
    currencyExchange: currencyExchange
};