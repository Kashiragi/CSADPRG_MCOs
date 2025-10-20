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
}

impl Account {
    fn new() -> Self {
        Self { name: "N/A".parse().unwrap(), balance: 0.0 }
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
    let input = get_input("Back to Main Menu (Y/N): ");
    matches!(input.to_uppercase().as_str(), "Y" | "YES")
}

fn register_account(account: &mut Account) {
    loop {
        println!("Register Account Name");
        let name = get_input("Account Name: ");
        account.edit_name(name.as_str());
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
            // The prints are placeholders
            "1" => register_account(&mut account),
            "2" => println!("Depositing amount..."),
            "3" => println!("Withdrawing amount..."),
            "4" => println!("Currency exchange..."),
            "5" => println!("Recording exchange rates..."),
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
