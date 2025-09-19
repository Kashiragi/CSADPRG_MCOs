var accounts = [];

function registerAccount(rl, callBack){
    console.log("Register Account Name");
    rl.question("Account Name: ", function(accountName) {
        const newAccount = { 
            name: accountName, 
            balance: 0
        };
        accounts.push(newAccount);
        console.log(`Account "${accountName}" registered successfully.`);
        callBack();
    });
}

function getAccount(name) {
    return accounts.find(account => account.name === name);
}

module.exports = {
    registerAccount: registerAccount,
    getAccount: getAccount
};

