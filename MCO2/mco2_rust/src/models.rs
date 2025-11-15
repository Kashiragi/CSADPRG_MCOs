use chrono::NaiveDate;
use thousands::Separable;
use tabled::Tabled;
use serde::Serialize;

/// format helpers — signatures must be `fn(&T) -> String`
fn fmt_currency(v: &f64) -> String {
    format!("{:.2}", v).separate_with_commas()
}

fn fmt_flt(v: &f64) -> String {
    format!("{:.2}", v)
}

fn fmt_int(v: &usize) -> String {
    format!("{}", v)
}

fn fmt_risk(v: &f64) -> String {
    let risk = if *v < 50.0 {
        "High Risk".to_string()
    } else { "Low Risk".to_string() };
    risk
}

#[derive(Debug, Tabled, Clone)]
pub struct EfficiencyRow {
    #[tabled(display = "String::from")]
    pub(crate) region: String,

    #[tabled(display = "String::from")]
    pub(crate) main_island: String,

    #[tabled(display = "fmt_currency")]
    pub(crate) total_budget: f64,

    #[tabled(display = "fmt_currency")]
    pub(crate) median_savings: f64,

    #[tabled(display = "fmt_flt")]
    pub(crate) avg_delay_days: f64,

    #[tabled(display = "fmt_flt")]
    pub(crate) pct_delayed_over_30: f64,

    #[tabled(display = "fmt_flt")]
    pub(crate) efficiency_score: f64,
}


#[derive(Debug, Tabled, Clone)]
pub struct ContractorRow {
    #[tabled(display = "fmt_int")]
    pub(crate) rank: usize,

    #[tabled(display = "String::from")]
    pub(crate) contractor: String,

    #[tabled(display = "fmt_currency")]
    pub(crate) total_cost_savings: f64,

    #[tabled(display = "fmt_int")]
    pub(crate) projects: usize,

    #[tabled(display = "fmt_flt")]
    pub(crate) avg_delay_days: f64,

    #[tabled(display = "fmt_currency")]
    pub(crate) total_contract_cost: f64,

    #[tabled(display = "fmt_flt")]
    pub(crate) reliability_index: f64,

    #[tabled(display = "fmt_risk")]
    pub(crate) risk_flag: f64, // duplicate of reliability in pct for quick inspection
}

#[derive(Debug, Tabled, Clone)]
pub struct AnnualProjectRow {
    #[tabled(display = "fmt_int")]
    pub(crate) funding_year: usize,

    #[tabled(display = "String::from")]
    pub(crate) type_of_work: String,

    #[tabled(display = "fmt_int")]
    pub(crate) total_projects: usize,

    #[tabled(display = "fmt_currency")]
    pub(crate) avg_savings: f64,

    #[tabled(display = "fmt_flt")]
    pub(crate) overrun_rate: f64,

    #[tabled(display = "fmt_flt")]
    pub(crate) yoy_change: f64,
}

#[derive(Serialize)]
pub struct Summary {
    pub(crate) total_projects: String,
    pub(crate) total_contractors: String,
    pub(crate) total_provinces: String,
    pub(crate) global_avg_delay: String,
    pub(crate) total_savings: String,
}

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