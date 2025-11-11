use std::collections::HashMap;
use std::error::Error;
use std::cmp::Ordering;

use crate::models::Project;
use csv::Writer;

/// Struct representing one row of the efficiency report.
#[derive(Debug)]
struct EfficiencyRow {
    region: Option<String>,
    main_island: Option<String>,
    total_budget: f64,
    median_savings: f64,
    avg_delay_days: f64,
    pct_delayed_over_30: f64,
    efficiency_score: f64,
}

/// Generates "Regional Flood Mitigation Efficiency Summary" CSV.
///
/// # Arguments
///
/// * `projects` - Vector of `Project`
pub fn generate_report_1(projects: &[Project]) -> Result<(), Box<dyn Error>> {
    // group projects by (region, main_island)
    let output_path = "report1_regional_summary.csv";
    let mut groups: HashMap<(Option<String>, Option<String>), Vec<&Project>> = HashMap::new();
    for proj in projects {
        let key = (proj.region.clone(), proj.main_island.clone());
        groups.entry(key).or_default().push(proj);
    }

    let mut report_rows: Vec<EfficiencyRow> = Vec::new();

    for ((region, main_island), group) in groups {
        if group.is_empty() { continue; }

        // total budget
        let total_budget: f64 = group.iter()
            .filter_map(|p| p.approved_budget_for_contract)
            .sum();

        // median cost savings
        let mut savings: Vec<f64> = group.iter()
            .filter_map(|p| p.cost_savings())
            .collect();
        savings.sort_by(|a, b| a.partial_cmp(b).unwrap_or(Ordering::Equal));
        let median_savings = if savings.is_empty() {
            0.0
        } else if savings.len() % 2 == 1 {
            savings[savings.len() / 2]
        } else {
            let mid = savings.len() / 2;
            (savings[mid - 1] + savings[mid]) / 2.0
        };

        // average completion delay
        let delays: Vec<f64> = group.iter()
            .filter_map(|p| p.completion_delay_days().map(|d| d as f64))
            .collect();
        let avg_delay_days = if delays.is_empty() {
            0.0
        } else {
            delays.iter().sum::<f64>() / (delays.len() as f64)
        };

        // percentage delayed > 30 days
        let delayed_count = group.iter()
            .filter(|p| p.completion_delay_days().map(|d| d > 30).unwrap_or(false))
            .count();
        let pct_delayed_over_30 = if group.is_empty() { 0.0 } else {
            (delayed_count as f64 / group.len() as f64) * 100.0
        };

        // efficiency score
        // TODO: FIX THIS PLZ, use statistical normalization
        let mut efficiency_score = if avg_delay_days != 0.0 {
            (median_savings / avg_delay_days) * 100.0
        } else {
            0.0
        };
        if efficiency_score < 0.0 { efficiency_score = 0.0; }
        if efficiency_score > 100.0 { efficiency_score = 100.0; }

        report_rows.push(EfficiencyRow {
            region,
            main_island,
            total_budget,
            median_savings,
            avg_delay_days,
            pct_delayed_over_30,
            efficiency_score,
        });
    }

    // sort descending by efficiency_score
    report_rows.sort_by(|a, b| b.efficiency_score.partial_cmp(&a.efficiency_score).unwrap_or(Ordering::Equal));

    // write CSV
    let mut wtr = Writer::from_path(output_path)?;
    wtr.write_record(&[
        "Region",
        "MainIsland",
        "TotalBudget",
        "MedianSavings",
        "AvgDelay",
        "HighDelayPct",
        "EfficiencyScore",
    ])?;

    for row in report_rows {
        wtr.write_record(&[
            row.region.unwrap_or_default(),
            row.main_island.unwrap_or_default(),
            format!("{:.2}", row.total_budget),
            format!("{:.2}", row.median_savings),
            format!("{:.2}", row.avg_delay_days),
            format!("{:.2}", row.pct_delayed_over_30),
            format!("{:.2}", row.efficiency_score),
        ])?;
    }

    wtr.flush()?;
    println!("(Full table exported to {})", output_path);
    Ok(())
}
