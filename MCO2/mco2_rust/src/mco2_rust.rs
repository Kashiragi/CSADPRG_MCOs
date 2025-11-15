//! mco2_rust_mp — CLI entrypoint for MAJOR COURSE OUTPUT #2: DATA ANALYSIS PIPELINE
//! FOR FLOOD CONTROL PROJECTS
//!
//! ********************
//! Last names: Trinidad
//! Language: Rust
//! Paradigm(s): Imperative
//! ********************

mod csv_processing;
mod models;
mod reports;

use models::Project;
use csv_processing::read_csv;
use reports::{generate_report_1, generate_report_2};

use std::error::Error;
use std::path::Path;
use crate::reports::{generate_report_3, generate_summary};

/// Menu option user can pick from the CLI.
enum MenuOption {
    LoadFile,
    GenerateReports,
    Quit,
    Invalid(String),
}

impl MenuOption {
    /// Create a `MenuOption` from a raw user input string.
    ///
    /// Trims whitespace and matches on the textual choices:
    /// * `"1"` => `LoadFile`
    /// * `"2"` => `GenerateReports`
    /// * `"0"` => `Quit`
    /// Any other input becomes `Invalid`.
    fn from_input(s: &str) -> Self {
        match s.trim() {
            "1" => MenuOption::LoadFile,
            "2" => MenuOption::GenerateReports,
            "0" => MenuOption::Quit,
            other => MenuOption::Invalid(other.to_string()),
        }
    }
}

/// Program entrypoint.
///
/// Presents a small menu to the user to load the CSV and run reports.
/// Errors are propagated via `Box<dyn Error>` so the caller (cargo run) will show them.
fn main() -> Result<(), Box<dyn Error>> {
    let path = "dpwh_flood_control_projects.csv";
    if !Path::new(path).exists() {
        eprintln!("CSV file not found at {:?} (cwd: {:?})", path, std::env::current_dir()?);
        std::process::exit(1);
    }

    let mut projects: Vec<Project> = Vec::new();

    loop {
        print_menu();
        let choice = match get_input("Enter choice: ") {
            Ok(c) => MenuOption::from_input(&c),
            Err(e) => {
                eprintln!("Failed to read input: {}", e);
                continue;
            }
        };

        match choice {
            MenuOption::LoadFile => projects = read_csv(path)?,

            MenuOption::GenerateReports => {
                if projects.is_empty() {
                    println!("Please load the CSV first (option 1) before generating reports.");
                    continue;
                }
                generate_reports(&projects)?;
            }

            MenuOption::Quit => {
                println!("Exiting...");
                break;
            }

            MenuOption::Invalid(s) => {
                println!("Invalid choice: '{}'", s);
            }
        }
    }

    Ok(())
}

/// Generate all configured reports and the summary.
///
/// This function:
/// - calls each report generator in sequence,
/// - prints progress messages,
/// - returns `Ok(())` on success or an error if any report writer fails.
///
/// # Arguments
///
/// * `projects` - the loaded list of `Project` structs to aggregate.
fn generate_reports(projects: &Vec<Project>) -> Result<(), Box<dyn Error>> {
    println!("Generating reports...");
    println!("Outputs saved to individual files");
    generate_report_1(&projects)?;
    generate_report_2(&projects)?;
    generate_report_3(&projects)?;
    generate_summary(&projects)?;

    loop {
        if return_to_main_menu() {
            break;
        }
    }
    Ok(())
}

/// Print the main menu to stdout.
fn print_menu() {
    println!();
    println!("Select Language Implementation:");
    println!("[1] Load the file");
    println!("[2] Generate reports");
    println!("[0] Quit");
}

/// Ask user whether to return to main menu.
///
/// Loops until the user enters a valid Y/N response.
///
/// # Returns
/// `true` if user answered yes, `false` otherwise.
fn return_to_main_menu() -> bool {
    loop {
        let input = get_input("Back to Report Selection (Y/N): ");
        match input.expect("Panicked because").to_ascii_uppercase().as_str() {
            "Y" | "YES" => return true,
            "N" | "NO" => return false,
            _ => println!("Please enter Y or N."),
        }
    }
}

/// Prompt the user and read a trimmed input line from stdin.
///
/// # Arguments
///
/// * `prompt` - message printed before reading stdin
///
/// # Returns
///
/// `Ok(String)` containing the trimmed user input, or an `io::Error`.
fn get_input(prompt: &str) -> std::io::Result<String> {
    use std::io::{self, Write};

    print!("{}", prompt);
    io::stdout().flush()?;

    let mut input = String::new();
    io::stdin().read_line(&mut input)?;
    Ok(input.trim().to_string())
}
