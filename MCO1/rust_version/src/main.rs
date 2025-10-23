//! MAJOR COURSE OUTPUT #1: BANKING AND CURRENCY EXCHANGE APPLICATION
//! RUST VERSION
//!
//! The application is designed to facilitate core banking operations, including
//! account creation, deposits, withdrawals, and currency exchange computations.
//!
//! Features:
//! - Record / register the current exchange rate for the following
//!   foreign currencies as PHP per 1 unit of foreign currency.:
//!     > United States Dollar (USD)
//!     > Japanese Yen (JPY)
//!     > British Pound Sterling (GBP)
//!     > Euro (EUR)
//!     > Chinese Yuan Renminni (CNY)
//! - Philippine peso (PHP) is set as the base currency.
//! - Convert between any two currencies chosen.
//! - Deposit money to the user's bank account.
//! - Show the expected daily interest based on the inputted number of days.
//! - Register user's details.

/**
**************************
Last name: Trinidad
Language: Rust
Paradigm: Imperative, Object Based Programming
**************************
*/
use std::io::{self, Write};

/// A simple bank account.
///
/// Fields:
/// - `name`: owner name (owned `String`)
/// - `balance`: current balance in PHP
/// - `registered`: whether the account has been registered by the user
struct Account {
    name: String,
    balance: f64,
    registered: bool,
}



impl Account {
    /// Create a new, unregistered account with zero balance.
    ///
    /// # Returns
    /// A new `Account` with `name` empty, `balance` set to `0.0`, and
    /// `registered` set to `false`.
    fn new() -> Self {
        Account {
            name: String::new(),
            balance: 0.0,
            registered: false,
        }
    }

    /// Register the account with the given `name`.
    ///
    /// This sets the account's name and marks it as registered.
    ///
    /// # Arguments
    /// * `name` - a borrowed string slice containing the account name to set
    fn register(&mut self, name: &str) {
        self.edit_name(name);
        self.registered = true;
    }

    /// Query whether the account has been registered.
    ///
    /// # Returns
    /// `true` if the account is registered, `false` otherwise.
    fn is_registered(&self) -> bool {
        self.registered
    }

    /// Change the account name.
    ///
    /// # Arguments
    /// * `name` - a borrowed string slice to copy into the account's `name` field
    fn edit_name(&mut self, name: &str) {
        self.name = name.to_string();
    }

    /// Deposit an amount into the account.
    ///
    /// # Arguments
    /// * `amount` - the amount (in PHP) to add to the balance. This function does
    /// not perform validation; callers should ensure the amount is positive.
    fn deposit(&mut self, amount: f64) {
        self.balance += amount;
    }

    /// Withdraw an amount from the account.
    ///
    /// # Arguments
    /// * `amount` - the amount (in PHP) to subtract from the balance. This function
    /// does not validate sufficient funds; callers should check the balance
    /// before calling.
    fn withdraw(&mut self, amount: f64) {
        self.balance -= amount;
    }
}

/// Stores exchange rates as PHP per 1 unit of foreign currency.
///
/// The `php` field is always `1.0` by convention.
struct Rates {
    php: f64, // always 1.0
    usd: f64,
    jpy: f64,
    gbp: f64,
    eur: f64,
    cny: f64,
}

impl Rates {
    /// Create a new `Rates` container.
    ///
    /// # Arguments
    /// * `usd`, `jpy`, `gbp`, `eur`, `cny` - initial rates expressed as PHP per 1 unit
    /// of the respective currency. The `php` field is initialized to `1.0`.
    ///
    /// # Returns
    /// A `Rates` instance with the supplied values and `php` = 1.0.
    fn new(usd: f64, jpy: f64, gbp: f64, eur: f64, cny: f64) -> Self {
        Self { php: 1.0, usd, jpy, gbp, eur, cny }
    }

    /// Set the exchange rate for a currency code.
    ///
    /// # Arguments
    /// * `currency` - currency code (e.g. "USD", "JPY"); case-insensitive
    /// * `new_rate` - new rate, interpreted as PHP per 1 unit of `currency`
    ///
    /// # Notes
    /// Attempting to set "PHP" will print a message and leave the PHP rate unchanged.
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

    /// Return the stored rate (PHP per 1 unit) for a currency code.
    ///
    /// # Arguments
    /// * `currency` - currency code (case-insensitive)
    ///
    /// # Returns
    /// `Some(rate)` if the code is recognized, otherwise `None`.
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

/// Prompts the user to input a string and returns the trimmed result.
///
/// # Arguments
/// * `prompt` - message printed before reading stdin
///
/// # Returns
/// A `String` containing the user's input with surrounding whitespace removed.
///
/// # Panics
/// This function uses `.unwrap()` on IO operations and will panic if reading from
/// stdin or flushing stdout fails.
fn get_input(prompt: &str) -> String {
    print!("{}", prompt);
    io::stdout().flush().unwrap();
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    input.trim().to_string()
}

/// Ask user whether to return to main menu.
///
/// Loops until the user enters a valid Y/N response.
///
/// # Returns
/// `true` if user answered yes, `false` otherwise.
fn return_to_main_menu() -> bool {
    loop {
        let input = get_input("Back to the Main Menu (Y/N): ");
        match input.trim().to_ascii_uppercase().as_str() {
            "Y" | "YES" => return true,
            "N" | "NO" => return false,
            _ => println!("Please enter Y or N."),
        }
    }
}

/// Interactive flow to register an account name.
///
/// Prompts until the user chooses to return to the main menu.
fn register_account(account: &mut Account) {
    loop {
        println!("\nRegister Account Name");
        let name = get_input("Account Name: ");
        account.register(name.as_str());
        if return_to_main_menu() {
            break;
        }
    }
}

/// Interactive deposit flow.
///
/// Shows account information, accepts a deposit amount, validates it, and
/// updates the account balance. Loops until the user chooses to return to the
/// main menu.
fn deposit_amount(account: &mut Account) {
    loop {
        println!("\nDeposit Amount");
        println!("Account Name: {}", account.name);
        println!("Current Balance: {:.2}", account.balance);
        println!("Currency: PHP");

        let input = get_input("Deposit Amount: ");

        // parse the input safely
        match input.parse::<f64>() {
            // the given amount is a positive numerical value
            Ok(amount) if amount > 0.0 => {
                account.deposit(amount);
                println!("\nUpdated Balance: {:.2}", account.balance);
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

/// Interactive withdraw flow.
///
/// Shows account information, accepts a withdrawal amount, validates it (must
/// be positive and not exceed the balance), and updates the account balance.
/// Loops until the user chooses to return to the main menu.
fn withdraw_amount(account: &mut Account) {
    loop {
        println!("\nWithdraw Amount");
        println!("Account Name: {}", account.name);
        println!("Current Balance: {:.2}", account.balance);
        println!("Currency: PHP");

        let input = get_input("Withdraw Amount: ");

        match input.parse::<f64>() {
            // valid positive number and must not exceed balance
            Ok(amount) if amount > 0.0 && amount <= account.balance => {
                account.withdraw(amount);
                println!("\nUpdated Balance: {:.2}", account.balance);
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

/// Parse a rate input string into an `f64`.
///
/// The function accepts either a plain number (e.g. "58", "58.0") or a
/// fractional form ("a/b"). On success, it returns `Some(value)`, otherwise
/// `None`.
///
/// # Examples
///
/// - "58" -> Some(58.0)
/// - "1/0.38" -> Some(2.6315789...)
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

/// Interactive flow to record exchange rates.
///
/// Prompts the user to select a currency and enter the new exchange rate.
/// The rate is parsed and validated before being stored in `rates`.
fn record_exchange_rates(rates: &mut Rates) {
    loop {
        println!("\nRecord Exchange Rate\n");
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

/// Convert a menu choice or direct code into a canonical currency code.
///
/// Accepts numerical choices "1".."6" or direct codes (case-insensitive).
///
/// # Returns
/// `Some(&str)` containing the canonical code on success, or `None` for an
/// unrecognized input.
fn choice_to_code(choice: &str) -> Option<&str> {
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

/// Interactive currency exchange flow.
///
/// Prompts for source currency and amount, then target currency. Uses the
/// stored `rates` (PHP per 1 unit) to perform conversion. The inner helper
/// `convert_another_currency()` asks whether the user wants to perform another
/// conversion.
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
        // input validation :(
        let source_code = match choice_to_code(&source_opt) {
            Some(c) => c,
            None => {
                println!("Invalid source currency selection.");
                if return_to_main_menu() { break; } else { continue; }
            }
        };

        let source_amt_str = get_input("Source Amount: ");
        // parse and validate
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

        // get rates via rates.get_rate(code) -> Option<f64>
        // perform a check if the rate is set
        let rate_from = match rates.get_rate(source_code) {
            Some(r) if r > 0.0 => r,
            _ => {
                println!("Rate for {} is not set", source_code);
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
        // validate input
        let exchange_code = match choice_to_code(&exchange_opt) {
            Some(c) => c,
            None => {
                println!("Invalid exchange currency selection.");
                if return_to_main_menu() { break; } else { continue; }
            }
        };

        // get rates via rates.get_rate(code) -> Option<f64>
        // perform a check if the rate is set
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

/// Show simple interest computation.
///
/// Prompts for total number of days and prints a daily table of interest and
/// balance. The function uses a hard-coded annual interest rate constant and
/// rounds the daily interest to two decimal places when applied.
fn show_interest_amount(account: &Account) {
    loop {
        const ANNUAL_INTEREST_RATE: f64 = 0.05;
        let mut amount = account.balance;
        let interest = ((amount * (ANNUAL_INTEREST_RATE / 365.0)) * 100.0).round() / 100.0;
        println!("\nShow Interest Amount");
        println!("Account Name: {}", account.name);
        println!("Current Balance: {:.2}", account.balance);
        println!("Currency: PHP");
        println!("Interest Rate: {}", ANNUAL_INTEREST_RATE);

        let input_days = get_input("\nTotal Number of Days: ");
        let total_days : i32 = match input_days.trim().parse::<i32>() {
            Ok(days) if days > 0 => days,
            Ok(_) => {
                println!("Please enter a positive amount.");
                if return_to_main_menu() { break; } else { continue; }
            }
            Err(_) => {
                println!("Invalid input. Please enter a valid number.");
                if return_to_main_menu() { break; } else { continue; }
            }
        };
        println!("\n Day  |   Interest   |   Balance   ");

        for day in 1..=total_days {
            amount += interest;
            println!("{:<5} | {:>12.2} | {:>12.2}", day, interest, amount);
        }
        println!();
        if return_to_main_menu() {
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
            "1" => {
                if !account.is_registered() {
                    register_account(&mut account);
                } else {
                    println!("You already registered an account");
                }
            }
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
            "6" => if !account.is_registered() {
                println!("You must register an account before viewing the interest calculation.");
            } else {
                show_interest_amount(&account);
            }
            "0" => {
                println!("Exiting program. Goodbye!");
                break; // exits the loop and ends program
            }
            _ => println!("Invalid option. Please try again."),
        }

        println!(); // add blank line before redisplay menu
    }
}
