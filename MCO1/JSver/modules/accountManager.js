// Single account system - only one account can exist at a time
let account = null;

function registerAccount(rl, callBack){

    console.log("Register Account Name");
    rl.question("Account Name: ", function(accountName) {
        if (!accountName.trim()) {
            console.log("Account name cannot be empty!");
            rl.question("Back to main menu? (Y/N) ", function(answer) {
                if (answer.trim().toUpperCase() === "Y") {
                    callBack();
                } else {
                    registerAccount(rl, callBack);
                }
            });
            return;
        }

        account = { 
            name: accountName.trim(), 
            balance: 0
        };
        console.log(`Account "${account.name}" registered successfully.`);
        rl.question("Back to main menu? (Y/N) ", function(answer) {
            if (answer.trim().toUpperCase() === "Y") {
                callBack();
            } else {
                registerAccount(rl, callBack);
            }
        });
    });
}

function getAccount() {
    return account;
}


function updateBalance(newBalance) {
    if (account !== null) {
        account.balance = newBalance;
        return true;
    }
    return false;
}

function getAccountName() {
    return account !== null ? account.name : null;
}

function getAccountBalance() {
    return account !== null ? account.balance : 0;
}

module.exports = {
    registerAccount: registerAccount,
    getAccount: getAccount,
    updateBalance: updateBalance,
    getAccountName: getAccountName,
    getAccountBalance: getAccountBalance
};

