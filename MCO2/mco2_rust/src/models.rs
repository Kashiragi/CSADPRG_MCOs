//! Models & report row representations used throughout the system.
//!
//! This module defines:
//! - `Project`: raw CSV-mapped project data.
//! - `EfficiencyRow`: aggregated region/main-island efficiency metrics.
//! - `ContractorRow`: contractor performance ranking rows.
//! - `AnnualProjectRow`: yearly cost-overrun trend rows.
//! - `Summary`: global dataset summary for `summary.json`.
//!
//! Formatting helpers are also included so [`tabled`] can render numbers
//! with comma separators, currency format, percent flags, etc.

use chrono::NaiveDate;
use thousands::Separable;
use tabled::Tabled;
use serde::Serialize;

/// Format a floating-point currency value to 2 decimals
/// and insert comma delimiters (e.g. `1200000.5 → "1,200,000.50"`).
fn fmt_currency(v: &f64) -> String {
    format!("{:.2}", v).separate_with_commas()
}

/// Format a floating-point number with 2 decimals.
fn fmt_flt(v: &f64) -> String {
    format!("{:.2}", v)
}

/// Format an integer without commas.
fn fmt_int(v: &usize) -> String {
    format!("{}", v)
}

/// Converts a numeric reliability score into `"High Risk"`
/// when `< 50`, otherwise `"Low Risk"`.
///
/// Used only for table display.
/// The underlying numeric value is still stored separately.
fn fmt_risk(v: &f64) -> String {
    if *v < 50.0 {
        "High Risk".into()
    } else {
        "Low Risk".into()
    }
}

/// Row representation for **Regional Flood Mitigation Efficiency Summary**
/// (Report 1).
///
/// Each row is grouped by `(Region, MainIsland)` and contains:
/// - total budget
/// - median cost savings
/// - average completion delay
/// - % delayed > 30 days
/// - computed efficiency score
#[derive(Debug, Tabled, Clone)]
pub struct EfficiencyRow {
    /// Project region (group key)
    #[tabled(display = "String::from")]
    pub(crate) region: String,

    /// Main island (group key)
    #[tabled(display = "String::from")]
    pub(crate) main_island: String,

    /// Total approved budget across all grouped projects
    #[tabled(display = "fmt_currency")]
    pub(crate) total_budget: f64,

    /// Median `cost_savings` for the region
    #[tabled(display = "fmt_currency")]
    pub(crate) median_savings: f64,

    /// Average completion delay (days, may be negative)
    #[tabled(display = "fmt_flt")]
    pub(crate) avg_delay: f64,

    /// % of projects where delay > 30 days
    #[tabled(display = "fmt_flt")]
    pub(crate) high_delay_pct: f64,

    /// Normalized efficiency score (0–100)
    #[tabled(display = "fmt_flt")]
    pub(crate) efficiency_score: f64,
}

/// Row representation for **Top Contractors Performance Ranking** (Report 2).
///
/// Sorted descending by total contract cost.
/// Only contractors with ≥ 5 projects are included.
///
/// Fields:
/// - `rank` – assigned index (1-based)
/// - totals and averages derived from grouped `Project` rows
/// - `reliability_index` capped at 100
/// - `risk_flag` is `"High Risk"` if score < 50
#[derive(Debug, Tabled, Clone)]
pub struct ContractorRow {
    /// Ranking index (1 = best)
    #[tabled(display = "fmt_int")]
    pub(crate) rank: usize,

    /// Contractor name (possibly merged from multi-contractor rows)
    #[tabled(display = "String::from")]
    pub(crate) contractor: String,

    /// Sum of all cost savings for this contractor
    #[tabled(display = "fmt_currency")]
    pub(crate) total_cost_savings: f64,

    /// Number of projects attributed to the contractor
    #[tabled(display = "fmt_int")]
    pub(crate) projects: usize,

    /// Mean completion delay (days)
    #[tabled(display = "fmt_flt")]
    pub(crate) avg_delay: f64,

    /// Total contract cost across projects
    #[tabled(display = "fmt_currency")]
    pub(crate) total_contract_cost: f64,

    /// Reliability score (0–100 capped)
    #[tabled(display = "fmt_flt")]
    pub(crate) reliability_index: f64,

    /// `"High Risk"` if reliability_index < 50, `"Low Risk"` otherwise
    #[tabled(display = "fmt_risk")]
    pub(crate) risk_flag: f64,
}

/// Row representation for **Annual Project Type Cost Overrun Trends** (Report 3).
///
/// Grouped by `(FundingYear, TypeOfWork)`.
///
/// Includes:
/// - total projects
/// - average cost savings (negative = overrun)
/// - overrun rate (`% saving < 0`)
/// - YoY % change from 2021 baseline
#[derive(Debug, Tabled, Clone)]
pub struct AnnualProjectRow {
    /// Calendar funding year (usize for easy sorting)
    #[tabled(display = "fmt_int")]
    pub(crate) funding_year: usize,

    /// Type of civil work (e.g., Drainage, Dike, Bridge)
    #[tabled(display = "String::from")]
    pub(crate) type_of_work: String,

    /// Total projects for this year & type
    #[tabled(display = "fmt_int")]
    pub(crate) total_projects: usize,

    /// Mean cost savings (maybe negative)
    #[tabled(display = "fmt_currency")]
    pub(crate) avg_savings: f64,

    /// % of projects where cost savings < 0
    #[tabled(display = "fmt_flt")]
    pub(crate) overrun_rate: f64,

    /// Year-over-year % change in avg savings, baseline = 2021
    #[tabled(display = "fmt_flt")]
    pub(crate) yoy_change: f64,
}

/// JSON export structure containing **global dataset statistics**.
///
/// Values stored as strings so they can be printed directly
/// without further formatting.
#[derive(Serialize)]
pub struct Summary {
    pub(crate) total_projects: String,
    pub(crate) total_contractors: String,
    pub(crate) total_provinces: String,
    pub(crate) global_avg_delay: String,
    pub(crate) total_savings: String,
}

/// Raw CSV-mapped project struct.
///
/// All fields are optional because many rows contain blanks.
///
/// Provides helper methods:
/// - [`Project::cost_savings`] → `budget - cost`
/// - [`Project::completion_delay_days`] → `(end - start).days()`
#[allow(dead_code)]
#[derive(Debug)]
pub struct Project {
    pub main_island: Option<String>,
    pub region: Option<String>,
    pub province: Option<String>,
    pub legislative_district: Option<String>,
    pub municipality: Option<String>,
    pub district_engineering_office: Option<String>,
    pub project_id: Option<String>,
    pub project_name: Option<String>,
    pub type_of_work: Option<String>,
    pub funding_year: Option<u32>,
    pub contract_id: Option<String>,
    pub approved_budget_for_contract: Option<f64>,
    pub contract_cost: Option<f64>,
    pub actual_completion_date: Option<NaiveDate>,
    pub contractor: Option<String>,
    pub contractor_count: Option<u32>,
    pub start_date: Option<NaiveDate>,
    pub project_latitude: Option<f64>,
    pub project_longitude: Option<f64>,
    pub provincial_capital: Option<String>,
    pub provincial_capital_latitude: Option<f64>,
    pub provincial_capital_longitude: Option<f64>,
}

impl Project {
    /// Computes the cost savings for a project.
    ///
    /// Returns `ApprovedBudgetForContract - ContractCost`.
    /// Returns `None` if either value is missing.
    pub fn cost_savings(&self) -> Option<f64> {
        match (self.approved_budget_for_contract, self.contract_cost) {
            (Some(budget), Some(cost)) => Some(budget - cost),
            _ => None,
        }
    }

    /// Computes the completion delay in days.
    ///
    /// Returns `ActualCompletionDate - StartDate` in days.
    /// Positive = project finished late, negative = project finished early.
    /// Returns `None` if either date is missing.
    pub fn completion_delay_days(&self) -> Option<i64> {
        match (self.start_date, self.actual_completion_date) {
            (Some(start), Some(end)) => Some((end - start).num_days()),
            _ => None,
        }
    }
}