use std::collections::HashMap;
use std::error::Error;
use std::fs::File;
use std::path::Path;

use chrono::NaiveDate;
use csv::{ReaderBuilder, StringRecord, WriterBuilder};

#[derive(Debug)]
struct Project {
    main_island: Option<String>,
    region: Option<String>,
    province: Option<String>,
    legislative_district: Option<String>,
    municipality: Option<String>,
    district_engineering_office: Option<String>,
    project_id: Option<String>,
    project_name: Option<String>,
    type_of_work: Option<String>,
    funding_year: Option<u32>,
    contract_id: Option<String>,
    approved_budget_for_contract: Option<f64>,
    contract_cost: Option<f64>,
    actual_completion_date: Option<NaiveDate>,
    contractor: Option<String>,
    contractor_count: Option<u32>,
    start_date: Option<NaiveDate>,
    project_latitude: Option<f64>,
    project_longitude: Option<f64>,
    provincial_capital: Option<String>,
    provincial_capital_latitude: Option<f64>,
    provincial_capital_longitude: Option<f64>,
}

fn main() -> Result<(), Box<dyn Error>> {
    let path = "dpwh_flood_control_projects.csv";
    if !Path::new(path).exists() {
        eprintln!("CSV file not found at {:?} (cwd: {:?})", path, std::env::current_dir()?);
        std::process::exit(1);
    }

    // reader with flexible config
    let mut rdr = ReaderBuilder::new().from_path(path)?;
    let headers = rdr.headers()?.clone();

    // map header name -> index for fast lookup
    let header_map: HashMap<String, usize> = headers
        .iter()
        .enumerate()
        .map(|(i, h)| (h.to_string(), i))
        .collect();

    // prepare writers for valid and invalid rows
    let mut valid_wtr = WriterBuilder::new().from_path("valid_rows.csv")?;
    let mut invalid_wtr = WriterBuilder::new().from_path("invalid_rows.csv")?;

    // write the same headers for valid rows
    valid_wtr.write_record(&headers)?;
    // invalid rows: original headers + "Error"
    let mut invalid_headers = headers.clone();
    invalid_headers.push_field("Error");
    invalid_wtr.write_record(&invalid_headers)?;

    let mut total = 0usize;
    let mut valid = 0usize;
    let mut invalid = 0usize;
    let mut stored_projects: Vec<Project> = Vec::new();

    for (i, result) in rdr.records().enumerate() {
        total += 1;
        let rec = match result {
            Ok(r) => r,
            Err(e) => {
                // If the CSV reader itself fails on a record, write the raw bytes (if any) to invalid.
                eprintln!("CSV parse error at record {}: {}", i + 1, e);
                let mut row = StringRecord::new();
                row.push_field(&format!("CSV parse error: {}", e));
                invalid_wtr.write_record(&row)?;
                invalid += 1;
                continue;
            }
        };

        let (proj_opt, errors) = parse_record_to_project(&rec, &header_map);

        if errors.is_empty() {
            // valid row
            if let Some(proj) = proj_opt {
                stored_projects.push(proj);
            }
            valid_wtr.write_record(&rec)?;
            valid += 1;
        } else {
            // invalid row: write original record plus joined errors
            let joined = errors.join("; ");
            let mut out = rec.clone();
            out.push_field(&joined);
            invalid_wtr.write_record(&out)?;
            eprintln!("Row {} invalid: {}", i + 1, joined);
            invalid += 1;
        }
    }

    valid_wtr.flush()?;
    invalid_wtr.flush()?;

    println!("Total rows processed: {}", total);
    println!("Valid rows: {}", valid);
    println!("Invalid rows: {}", invalid);
    println!("Stored {} Project structs in memory.", stored_projects.len());

    // Example: do something with stored_projects if you want
    // println!("{:#?}", stored_projects.get(0));

    Ok(())
}

/// Look up a field in a record by PascalCase CSV header name, return trimmed Option<String>
/// (treat empty strings as None).
fn get_field(rec: &StringRecord, header_map: &HashMap<String, usize>, header: &str) -> Option<String> {
    header_map.get(header).and_then(|&idx| rec.get(idx))
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

/// Parse a numeric token tolerant of commas, currency marks, parentheses, etc.
/// Returns Some(f64) on success, None if blank or placeholder, Err(msg) on unrecoverable parse failure.
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

    // Remove common non-numeric decorations (commas, currency symbols, spaces, parentheses)
    let cleaned: String = s.chars()
        .filter(|c| matches!(c, '0'..='9' | '.' | '-' ))
        .collect();

    if cleaned.is_empty() {
        return Ok(None);
    }

    match cleaned.parse::<f64>() {
        Ok(v) => Ok(Some(v)),
        Err(_) => Err(format!("invalid float token '{}'", s)),
    }
}

/// Parse a u32-like token (year, count) tolerant; returns Option<u32> or Err message.
fn parse_u32_tolerant(token_opt: Option<String>) -> Result<Option<u32>, String> {
    match parse_f64_tolerant(token_opt)? {
        None => Ok(None),
        Some(f) => {
            if f < 0.0 {
                Err("negative integer".to_string())
            } else {
                Ok(Some(f as u32))
            }
        }
    }
}

/// Parse a date token in YYYY-MM-DD format. Empty -> Ok(None). Invalid -> Err(msg)
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

/// Parse a CSV record into Project and collect validation errors.
/// Returns (Some(Project) or None if major failure, Vec<error_msgs>).
fn parse_record_to_project(rec: &StringRecord, header_map: &HashMap<String, usize>) -> (Option<Project>, Vec<String>) {
    let mut errors: Vec<String> = Vec::new();

    // helper closure to get by PascalCase header name (as in the CSV)
    let get = |h: &str| get_field(rec, header_map, h);

    // required fields
    let project_id = get("ProjectId");
    if project_id.as_ref().map(|s| s.is_empty()).unwrap_or(true) {
        errors.push("missing ProjectId".to_string());
    }

    let project_name = get("ProjectName");
    if project_name.as_ref().map(|s| s.is_empty()).unwrap_or(true) {
        errors.push("missing ProjectName".to_string());
    }

    // parse numerics with tolerant parsers
    let funding_year = match parse_u32_tolerant(get("FundingYear")) {
        Ok(v) => v,
        Err(e) => { errors.push(format!("FundingYear: {}", e)); None }
    };

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
        project_id: project_id.clone(),
        project_name: project_name.clone(),
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

    // If we had missing required fields or parse errors, return errors.
    (Some(project), errors)
}
