use std::collections::HashMap;
use std::error::Error;

use chrono::NaiveDate;
use csv::{ReaderBuilder, StringRecord};
use thousands::Separable;

use crate::models::Project;


/// Reads a CSV file and parses it into a vector of `Project` structs.
///
/// Returns a `Vec<Project>` containing all valid rows.
/// Prints summary statistics to stdout.
///
/// # Errors
///
/// Returns an error if the file cannot be read or parsed.
pub fn read_csv(path: &str) -> Result<Vec<Project>, Box<dyn Error>> {
    let mut rdr = ReaderBuilder::new().from_path(path)?;
    let headers = rdr.headers()?.clone();

    let header_map: HashMap<String, usize> = headers
        .iter()
        .enumerate()
        .map(|(i, h)| (h.to_string(), i))
        .collect();

    let mut total = 0usize;
    let mut valid = 0usize;
    let mut stored_projects: Vec<Project> = Vec::new();

    for result in rdr.records() {
        total += 1;
        let rec = match result {
            Ok(r) => r,
            Err(_) => continue,
        };

        let (proj_opt, errors) = parse_record_to_project(&rec, &header_map);

        if errors.is_empty() {
            // valid row: keep struct
            if let Some(proj) = proj_opt {
                stored_projects.push(proj);
            }
            valid += 1;
        }
    }

    println!(
        "Processing dataset... ({} rows loaded, {} rows filtered for 2021-2023",
        total.separate_with_commas(),
        valid.separate_with_commas()
    );

    Ok(stored_projects)
}


/// Looks up a field in a CSV record by PascalCase header name.
///
/// Returns `Some(String)` if the field exists and is not empty, else `None`.
fn get_field(rec: &StringRecord, header_map: &HashMap<String, usize>, header: &str) -> Option<String> {
    header_map.get(header).and_then(|&idx| rec.get(idx))
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

/// Parses a string token into a `f64` with tolerance for commas, currency symbols, parentheses, etc.
///
/// Returns:
/// - `Ok(Some(f64))` if successfully parsed,
/// - `Ok(None)` if blank or placeholder (e.g. `"NA"`, `"-"`),
/// - `Err(String)` if unrecoverable parse failure (e.g. letters in a numeric field).
fn parse_f64_tolerant(token_opt: Option<String>) -> Result<Option<f64>, String> {
    let s = match token_opt {
        None => return Ok(None),
        Some(s) => s.trim().to_string(),
    };

    if s.is_empty() {
        return Ok(None);
    }

    let sl = s.to_ascii_lowercase();
    if sl == "n/a" || sl == "na" || sl == "-" {
        return Ok(None);
    }

    // reject if there are any alphabetic letters (e.g. "MYCA with Project ID P00421301LZ")
    if s.chars().any(|c| c.is_alphabetic()) {
        return Err(format!("invalid float token (contains letters): '{}'", s));
    }

    let cleaned: String = s.chars()
        .filter(|c| matches!(c, '0'..='9' | '.' | '-' ))
        .collect();

    if cleaned.is_empty() {
        return Ok(None);
    }

    match cleaned.parse::<f64>() {
        Ok(v) => {
            Ok(Some(v))
        },
        Err(_) => Err(format!("invalid float token '{}'", s)),
    }
}

/// Parses a string token into a `u32`.
///
/// Returns `Ok(Some(u32))` if successfully parsed,
/// `Ok(None)` if blank or placeholder,
/// `Err(String)` if negative or fractional.
fn parse_u32_tolerant(token_opt: Option<String>) -> Result<Option<u32>, String> {
    match parse_f64_tolerant(token_opt)? {
        None => Ok(None),
        Some(f) => {
            if f < 0.0 {
                Err("negative integer".to_string())
            } else if f.fract() != 0.0 {
                Err(format!("not an integer: {}", f))
            } else {
                Ok(Some(f as u32))
            }
        }
    }
}

/// Parses a date string in `YYYY-MM-DD` format.
///
/// Returns `Ok(Some(NaiveDate))` if successful,
/// `Ok(None)` if empty,
/// `Err(String)` if invalid format.
fn parse_date_yyyy_mm_dd(token_opt: Option<String>) -> Result<Option<NaiveDate>, String> {
    let s = match token_opt {
        None => return Ok(None),
        Some(s) => s.trim().to_string(),
    };
    if s.is_empty() {
        return Ok(None);
    }
    match NaiveDate::parse_from_str(&s, "%Y-%m-%d") {
        Ok(d) => Ok(Some(d)),
        Err(e) => Err(format!("invalid date '{}': {}", s, e)),
    }
}

/// Validates that a funding year falls within [2021, 2023].
///
/// Returns `Ok(())` if valid, `Err(String)` otherwise.
fn validate_funding_year_range(funding_year_opt: &Option<u32>) -> Result<(), String> {
    match funding_year_opt {
        None => Err("missing FundingYear".to_string()),
        Some(y) => {
            if (2021..=2023).contains(y) {
                Ok(())
            } else {
                Err(format!("FundingYear {} out of accepted range 2021-2023", y))
            }
        }
    }
}

/// Parses a CSV record into a `Project` struct and collects validation errors.
///
/// Returns a tuple:
/// - `Some(Project)` if parse succeeds (even partially),
/// - `Vec<String>` containing any validation errors.
fn parse_record_to_project(rec: &StringRecord, header_map: &HashMap<String, usize>) -> (Option<Project>, Vec<String>) {
    let mut errors: Vec<String> = Vec::new();

    // helper closure to get by PascalCase header name (as in the CSV)
    let get = |h: &str| get_field(rec, header_map, h);

    // list required fields here
    let required = [
        "MainIsland", "Region", "Province", "LegislativeDistrict",
        "DistrictEngineeringOffice", "ProjectId", "ProjectName", "TypeOfWork", "FundingYear",
        "ContractId", "ApprovedBudgetForContract", "ContractCost", "ActualCompletionDate",
        "Contractor", "ContractorCount", "StartDate", "ProjectLatitude", "ProjectLongitude",
        "ProvincialCapital", "ProvincialCapitalLatitude", "ProvincialCapitalLongitude",
    ];

    // check for an empty field
    for field in required.iter() {
        if get(field).is_none() {
            errors.push(format!("missing {}", field));
        }
    }

    // parse numerics with tolerant parsers
    let funding_year = match parse_u32_tolerant(get("FundingYear")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("FundingYear: {}", e)); None }
    };

    // funding_year must be present and inside 2021-2023
    if let Err(e) = validate_funding_year_range(&funding_year) {
        errors.push(e);
    }

    let approved_budget_for_contract = match parse_f64_tolerant(get("ApprovedBudgetForContract")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("ApprovedBudgetForContract: {}", e)); None }
    };

    let contract_cost = match parse_f64_tolerant(get("ContractCost")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("ContractCost: {}", e)); None }
    };

    let contractor_count = match parse_u32_tolerant(get("ContractorCount")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("ContractorCount: {}", e)); None }
    };

    let project_lat = match parse_f64_tolerant(get("ProjectLatitude")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("ProjectLatitude: {}", e)); None }
    };
    let project_lon = match parse_f64_tolerant(get("ProjectLongitude")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("ProjectLongitude: {}", e)); None }
    };

    let provcap_lat = match parse_f64_tolerant(get("ProvincialCapitalLatitude")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("ProvincialCapitalLatitude: {}", e)); None }
    };
    let provcap_lon = match parse_f64_tolerant(get("ProvincialCapitalLongitude")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("ProvincialCapitalLongitude: {}", e)); None }
    };

    // parse dates
    let actual_completion_date = match parse_date_yyyy_mm_dd(get("ActualCompletionDate")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("ActualCompletionDate: {}", e)); None }
    };
    let start_date = match parse_date_yyyy_mm_dd(get("StartDate")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("StartDate: {}", e)); None }
    };

    // build project struct (even if some fields are None) — we still keep it
    let project = Project {
        main_island: get("MainIsland"),
        region: get("Region"),
        province: get("Province"),
        legislative_district: get("LegislativeDistrict"),
        municipality: get("Municipality"),
        district_engineering_office: get("DistrictEngineeringOffice"),
        project_id: get("ProjectId"),
        project_name: get("ProjectName"),
        type_of_work: get("TypeOfWork"),
        funding_year,
        contract_id: get("ContractId"),
        approved_budget_for_contract,
        contract_cost,
        actual_completion_date,
        contractor: get("Contractor"),
        contractor_count,
        start_date,
        project_latitude: project_lat,
        project_longitude: project_lon,
        provincial_capital: get("ProvincialCapital"),
        provincial_capital_latitude: provcap_lat,
        provincial_capital_longitude: provcap_lon,
    };

    (Some(project), errors)
}
