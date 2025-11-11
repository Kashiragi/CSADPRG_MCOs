use chrono::NaiveDate;

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