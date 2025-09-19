function deposit(accounts, rl, mainMenu) {
    console.log("Deposit Amount");
    rl.question("Account Name: ", function(accountName) {
        const account = getAccount(accountName);
        if (account) {
            rl.question("Deposit Amount: ", function(amount) {
                account.balance += parseFloat(amount);
                console.log(`Deposited ${amount} to ${accountName}'s account.`);
                mainMenu();
            });
        } else {
            console.log("Account not found.");
            mainMenu();
        }
    });
}

function withdraw(accounts, rl, mainMenu) {
    console.log("Withdraw Amount");
    rl.question("Account Name: ", function(accountName) {
        const account = getAccount(accountName);
        if (account) {
            rl.question("Withdraw Amount: ", function(amount) {
                account.balance -= parseFloat(amount);
                console.log(`Withdrew ${amount} from ${accountName}'s account.`);
                mainMenu();
            });
        } else {
            console.log("Account not found.");
            mainMenu();
        }
    });
}