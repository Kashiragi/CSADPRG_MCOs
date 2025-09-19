const readline = require('readline');
var accounts = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function registerAccount(){
    console.log("Register Account Name");
    rl.question("Account Name: ", function(accountName) {
        const newAccount = { 
            name: accountName, 
            balance: 0
        };
        accounts.push(newAccount);
        console.log(`Account "${accountName}" registered successfully.`);
        rl.close(); // Close the readline interface
    });
}

module.exports = {
    registerAccount: registerAccount,
    accounts: accounts
};

