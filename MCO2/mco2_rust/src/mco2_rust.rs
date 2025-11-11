mod csv_processing;
mod models;
mod reports;

use models::Project;
use csv_processing::read_csv;
use reports::generate_report_1;

use std::error::Error;
use std::path::Path;

enum MenuOption {
    LoadFile,
    GenerateReports,
    Quit,
    Invalid(String),
}

impl MenuOption {
    fn from_input(s: &str) -> Self {
        match s.trim() {
            "1" => MenuOption::LoadFile,
            "2" => MenuOption::GenerateReports,
            "0" => MenuOption::Quit,
            other => MenuOption::Invalid(other.to_string()),
        }
    }
}

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
                generate_report_1(&projects)?;
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

fn print_menu() {
    println!();
    println!("Select Language Implementation:");
    println!("[1] Load the file");
    println!("[2] Generate reports");
    println!("[0] Quit");
}

fn get_input(prompt: &str) -> std::io::Result<String> {
    use std::io::{self, Write};

    print!("{}", prompt);
    io::stdout().flush()?;

    let mut input = String::new();
    io::stdin().read_line(&mut input)?;
    Ok(input.trim().to_string())
}
