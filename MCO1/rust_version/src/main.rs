/**
**************************
Last name: Trinidad
Language: Rust
Paradigm: Imperative, Object Based Programming
**************************
*/
use std::io::{self, Write};

struct Account {
    name: String,
    balance: f64,
    registered: bool,
}

impl Account {
    fn new() -> Self {
        Account {
            name: String::new(),
            balance: 0.0,
            registered: false,
        }
    }

    fn register(&mut self, name: &str) {
        self.edit_name(name);
        self.registered = true;
    }

    fn is_registered(&self) -> bool {
        self.registered
    }

    fn edit_name(&mut self, name: &str) {
        self.name = name.to_string();
    }

    fn deposit(&mut self, amount: f64) {
        self.balance += amount;
    }

    fn withdraw(&mut self, amount: f64) {
        self.balance -= amount;
    }
}

// Stores the exchange rates as Php per Currency
struct Rates {
    php: f64, // always 1.0
    usd: f64,
    jpy: f64,
    gbp: f64,
    eur: f64,
    cny: f64,
}

impl Rates {
    fn new(usd: f64, jpy: f64, gbp: f64, eur: f64, cny: f64) -> Self {
        Self { php: 1.0, usd, jpy, gbp, eur, cny }
    }

    fn set_rate(&mut self, currency: &str, new_rate: f64) {
        match currency.to_uppercase().as_str() {
            "PHP" => println!("Cannot modify PHP rate — it's fixed at 1.0."),
            "USD" => self.usd = new_rate,
            "JPY" => self.jpy = new_rate,
            "GBP" => self.gbp = new_rate,
            "EUR" => self.eur = new_rate,
            "CNY" => self.cny = new_rate,
            _ => println!("Unknown currency: {}", currency),
        }
    }

    fn get_rate(&self, currency: &str) -> Option<f64> {
        match currency.to_uppercase().as_str() {
            "PHP" => Some(self.php),
            "USD" => Some(self.usd),
            "JPY" => Some(self.jpy),
            "GBP" => Some(self.gbp),
            "EUR" => Some(self.eur),
            "CNY" => Some(self.cny),
            _ => None,
        }
    }
}

/// Prints the main menu options
fn print_main_menu() {
    println!("Select Transaction:");
    println!("[1] Register Account Name");
    println!("[2] Deposit Amount");
    println!("[3] Withdraw Amount");
    println!("[4] Currency Exchange");
    println!("[5] Record Exchange Rates");
    println!("[6] Show Interest Computation");
    println!("[0] Exit");
}

/// Prompts the user to input a string, similar to python's input() function
///
/// # Arguments
/// * `prompt` - A message to display before the user input
///
/// # Returns
/// A `String` containing the user's input with surrounding whitespace removed
fn get_input(prompt: &str) -> String {
    print!("{}", prompt);
    io::stdout().flush().unwrap();
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    input.trim().to_string()
}

fn return_to_main_menu() -> bool {
    loop {
        let input = get_input("Back to Main Menu (Y/N): ");
        match input.trim().to_ascii_uppercase().as_str() {
            "Y" | "YES" => return true,
            "N" | "NO" => return false,
            _ => println!("Please enter Y or N."),
        }
    }
}


fn register_account(account: &mut Account) {
    loop {
        println!("Register Account Name");
        let name = get_input("Account Name: ");
        account.register(name.as_str());
        if return_to_main_menu() {
            break;
        }
    }
}

fn deposit_amount(account: &mut Account) {
    loop {
        println!("Deposit Amount");
        println!("Account Name: {}", account.name);
        println!("Current Balance: {:.2}", account.balance);
        println!("Currency: PHP");

        let input = get_input("Deposit Amount: ");

        // parse the input safely
        match input.parse::<f64>() {
            // the given amount is a positive numerical value
            Ok(amount) if amount > 0.0 => {
                account.deposit(amount);
                println!("Updated Balance: {:.2}", account.balance);
            }
            // user inputted a 0 or negative value
            Ok(_) => println!("Please enter a positive amount."),
            // user inputted a non numerical value
            Err(_) => println!("Invalid input. Please enter a valid number."),
        }

        if return_to_main_menu() {
            break;
        }
    }
}

fn withdraw_amount(account: &mut Account) {
    loop {
        println!("Withdraw Amount");
        println!("Account Name: {}", account.name);
        println!("Current Balance: {:.2}", account.balance);
        println!("Currency: PHP");

        let input = get_input("Withdraw Amount: ");

        match input.parse::<f64>() {
            // valid positive number and must not exceed balance
            Ok(amount) if amount > 0.0 && amount <= account.balance => {
                account.withdraw(amount);
                println!("Updated Balance: {:.2}", account.balance);
            }

            // amount withdrawn is too large
            Ok(amount) if amount > account.balance => {
                println!("Insufficient funds. You only have {:.2}.", account.balance);
            }

            // negative or zero
            Ok(_) => println!("Please enter a positive amount."),

            // not a number
            Err(_) => println!("Invalid input. Please enter a valid number."),
        }

        if return_to_main_menu() {
            break;
        }
    }
}

fn parse_rate_input(s: &str) -> Option<f64> {
    let s = s.trim();
    if s.is_empty() {
        return None;
    }
    if let Some(pos) = s.find('/') { // handle fractional inputs
        let a = s[..pos].trim().parse::<f64>().ok()?;
        let b = s[pos + 1..].trim().parse::<f64>().ok()?;
        if b == 0.0 { return None; }
        Some(a / b)
    } else {
        s.parse::<f64>().ok()
    }
}

fn record_exchange_rates(rates: &mut Rates) {
    loop {
        println!("Record Exchange Rate\n");
        println!("[1] Philippine Peso (PHP)");
        println!("[2] United States Dollar (USD)");
        println!("[3] Japanese Yen (JPY)");
        println!("[4] British Pound Sterling (GBP)");
        println!("[5] Euro (EUR)");
        println!("[6] Chinese Yuan Renminni (CNY)\n");

        let choice = get_input("Select Foreign Currency: ");

        // read rate
        let new_rate = get_input("Exchange Rate: ");

        // parse and validate
        let rate_value = match parse_rate_input(&new_rate) {
            Some(v) if v > 0.0 => v,
            Some(_) => {
                println!("Please enter a positive number.");
                if return_to_main_menu() { break; } else { continue; }
            }
            None => {
                println!("Invalid input. Please enter a valid number.");
                if return_to_main_menu() { break; } else { continue; }
            }
        };

        // conver input choice to code &str
        let choice_code = match choice_to_code(&choice) {
            Some(c) => c,
            None => {
                println!("Invalid choice. Please select 1-6.");
                if return_to_main_menu() { break; } else { continue; }
            }
        };
        rates.set_rate(choice_code, rate_value);

        if return_to_main_menu() {
            break;
        }
    }
}

fn choice_to_code(choice: &str) -> Option<&'static str> {
    match choice.trim() {
        "1" => Some("PHP"),
        "2" => Some("USD"),
        "3" => Some("JPY"),
        "4" => Some("GBP"),
        "5" => Some("EUR"),
        "6" => Some("CNY"),
        // permit direct codes too:
        "PHP" | "php" => Some("PHP"),
        "USD" | "usd" => Some("USD"),
        "JPY" | "jpy" => Some("JPY"),
        "GBP" | "gbp" => Some("GBP"),
        "EUR" | "eur" => Some("EUR"),
        "CNY" | "cny" => Some("CNY"),
        _ => None,
    }
}

fn currency_exchange(rates: &Rates) {
    fn convert_another_currency() -> bool {
        loop {
            let input = get_input("Convert another currency (Y/N)? ");
            match input.trim().to_uppercase().as_str() {
                "Y" | "YES" => return true,   // same as "continue"
                "N" | "NO" => return false,   // same as "break"
                _ => println!("Please enter Y or N."),
            }
        }
    }


    loop {
        println!("\nForeign Currency Exchange");

        println!("Source Currency Option:");
        println!("[1] Philippine Peso (PHP)");
        println!("[2] United States Dollar (USD)");
        println!("[3] Japanese Yen (JPY)");
        println!("[4] British Pound Sterling (GBP)");
        println!("[5] Euro (EUR)");
        println!("[6] Chinese Yuan Renminni (CNY)\n");

        let source_opt = get_input("Source Currency: ");
        let source_code = match choice_to_code(&source_opt) {
            Some(c) => c,
            None => {
                println!("Invalid source currency selection.");
                if return_to_main_menu() { break; } else { continue; }
            }
        };

        let source_amt_str = get_input("Source Amount: ");
        let source_amt = match source_amt_str.trim().parse::<f64>() {
            Ok(v) if v >= 0.0 => v,
            Ok(_) => {
                println!("Please enter a positive amount.");
                if return_to_main_menu() { break; } else { continue; }
            }
            Err(_) => {
                println!("Invalid input. Please enter a valid number.");
                if return_to_main_menu() { break; } else { continue; }
            }
        };

        println!("\nExchanged Currency Option:");
        println!("[1] Philippine Peso (PHP)");
        println!("[2] United States Dollar (USD)");
        println!("[3] Japanese Yen (JPY)");
        println!("[4] British Pound Sterling (GBP)");
        println!("[5] Euro (EUR)");
        println!("[6] Chinese Yuan Renminni (CNY)\n");

        let exchange_opt = get_input("Exchange Currency: ");
        let exchange_code = match choice_to_code(&exchange_opt) {
            Some(c) => c,
            None => {
                println!("Invalid exchange currency selection.");
                if return_to_main_menu() { break; } else { continue; }
            }
        };

        // get rates via rates.get_rate(code) -> Option<f64>
        let rate_from = match rates.get_rate(source_code) {
            Some(r) if r > 0.0 => r,
            _ => {
                println!("Rate for {} is not set", source_code);
                if return_to_main_menu() { break; } else { continue; }
            }
        };

        let rate_to = match rates.get_rate(exchange_code) {
            Some(r) if r > 0.0 => r,
            _ => {
                println!("Rate for {} is not set", exchange_code);
                if return_to_main_menu() { break; } else { continue; }
            }
        };

        // perform conversion using PHP as pivot:
        // amount_in_php = source_amt * php_per_from
        // result = amount_in_php / php_per_to
        let amount_in_php = source_amt * rate_from;
        let converted = amount_in_php / rate_to;

        println!("Exchange Amount: {:.2}",converted);


        if !convert_another_currency() {
            break;
        }
    }
}


fn main() {
    let mut rates = Rates::new(-1.0, -1.0, -1.0, -1.0, -1.0);
    let mut account = Account::new();
    loop {
        print_main_menu();

        let choice = get_input("Enter choice: ");

        match choice.as_str() {
            // The prints are placeholders
            "1" => register_account(&mut account),
            "2" => {
                if !account.is_registered() {
                    println!("You must register an account before making a deposit.");
                } else {
                    deposit_amount(&mut account);
                }
            }
            "3" => {
                if !account.is_registered() {
                    println!("You must register an account before making a withdrawal.");
                } else {
                    withdraw_amount(&mut account);
                }
            }
            "4" => currency_exchange(&rates),
            "5" => record_exchange_rates(&mut rates),
            "6" => println!("Showing interest computation..."),
            "0" => {
                println!("Exiting program. Goodbye!");
                break; // exits the loop and ends program
            }
            _ => println!("Invalid option. Please try again."),
        }

        println!(); // add blank line before redisplay menu
    }
}
