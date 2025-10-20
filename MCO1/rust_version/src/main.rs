/**
**************************
Last name: Trinidad
Language: Rust
Paradigm: Imperative
**************************
*/
use std::io::{self, Write};

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

fn main() {
    loop {
        print_main_menu();

        let choice = get_input("Enter choice: ");

        match choice.as_str() {
            // The printlns are placeholders
            "1" => println!("Registering account..."),
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
