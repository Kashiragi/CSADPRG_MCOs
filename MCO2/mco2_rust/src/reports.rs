use std::collections::HashMap;
use std::error::Error;
use std::cmp::Ordering;

use tabled::{Table, settings::Style};
use thousands::Separable;
use csv::Writer;

use crate::models::{Project, EfficiencyRow, ContractorRow};

/// Generates "Regional Flood Mitigation Efficiency Summary" CSV.
///
/// # Arguments
///
/// * `projects` - Vector of `Project`
pub fn generate_report_1(projects: &[Project]) -> Result<(), Box<dyn Error>> {
    // group projects by (region, main_island)
    let output_path = "report1_regional_summary.csv";
    let mut groups: HashMap<(String, String), Vec<&Project>> = HashMap::new();
    for proj in projects {
        let key = (
            proj.region.clone().unwrap_or_default(),
            proj.main_island.clone().unwrap_or_default(),
        );
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

        // raw score: median_savings / avg_delay_days
        // treat avg_delay_days == 0 as raw = 0.0 (no delay → neutral)
        let efficiency_score = if avg_delay_days == 0.0 {
            0.0
        } else {
            median_savings / avg_delay_days
        };

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

    // collect min/max of efficiency_score
    let (min_raw, max_raw) = report_rows.iter().fold((f64::INFINITY, f64::NEG_INFINITY), |(min, max), r| {
        let v = if r.efficiency_score.is_finite() { r.efficiency_score } else { 0.0 };
        (min.min(v), max.max(v))
    });

    // normalize raw scores into efficiency_score 0..100 using min-max scaling
    if min_raw.is_finite() && max_raw.is_finite() && (max_raw - min_raw).abs() > f64::EPSILON {
        let range = max_raw - min_raw;
        for r in report_rows.iter_mut() {
            let v = if r.efficiency_score.is_finite() { r.efficiency_score } else { 0.0 };
            let mut norm = (v - min_raw) / range * 100.0;
            if !norm.is_finite() { norm = 0.0; }
            if norm < 0.0 { norm = 0.0; }
            if norm > 100.0 { norm = 100.0; }
            r.efficiency_score = norm;
        }
    } else {
        // all raw scores equal or not finite -> assign neutral 50.0
        for r in report_rows.iter_mut() {
            r.efficiency_score = 50.0;
        }
    }

    // sort descending by efficiency_score
    report_rows.sort_by(|a, b| b.efficiency_score.partial_cmp(&a.efficiency_score).unwrap_or(Ordering::Equal));

    // --- CLI table (preview top 10 rows)
    let preview_count = report_rows.len().min(10);
    let preview = &report_rows[..preview_count];
    let table = Table::new(preview).with(Style::ascii()).to_string();
    println!("\nReport 1: Regional Flood Mitigation Efficiency Summary");
    println!("\nRegional Flood Mitigation Efficiency Summary");
    println!("(Filtered: 2021-2023 Projects)");
    println!("{table}");

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
            row.region,
            row.main_island,
            format!("{:.2}", row.total_budget).separate_with_commas(),
            format!("{:.2}", row.median_savings).separate_with_commas(),
            format!("{:.2}", row.avg_delay_days),
            format!("{:.2}", row.pct_delayed_over_30),
            format!("{:.2}", row.efficiency_score),
        ])?;
    }

    wtr.flush()?;
    println!("(Full table exported to {})", output_path);
    Ok(())
}

/// Generate Report 2: Top Contractors Performance Ranking.
///
/// - `projects`: slice of Project
/// - `output_path`: path to write CSV
pub fn generate_report_2(projects: &[Project]) -> Result<(), Box<dyn Error>> {
    let output_path = "report2_contractor_ranking.csv";
    // per-contractor accumulators
    #[derive(Default)]
    struct Agg {
        proj_count: usize,
        delay_sum: f64,
        delay_count: usize,
        total_savings: f64,
        total_cost: f64,
    }

    let mut aggs: HashMap<String, Agg> = HashMap::new();

    for p in projects.iter() {
        let contractor_field = match &p.contractor {
            Some(s) => s,
            None => continue,
        };

        let parts: Vec<String> = contractor_field
            .split('/')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        if parts.is_empty() { continue; }

        let n = parts.len() as f64;
        let contract_cost_per = p.contract_cost.unwrap_or(0.0) / n;
        let savings_per = p.cost_savings().unwrap_or(0.0) / n;
        let delay_opt = p.completion_delay_days().map(|d| d as f64);

        for contractor in parts {
            let a = aggs.entry(contractor).or_default();
            a.proj_count += 1;
            a.total_cost += contract_cost_per;
            a.total_savings += savings_per;
            if let Some(d) = delay_opt {
                a.delay_sum += d;
                a.delay_count += 1;
            }
        }
    }

    // build rows for contractors with >= 5 projects
    let mut rows: Vec<ContractorRow> = aggs.into_iter()
        .filter(|(_name, a)| a.proj_count >= 5)
        .map(|(name, a)| {
            let avg_delay = if a.delay_count == 0 { 0.0 } else { a.delay_sum / a.delay_count as f64 };
            let reliability_raw = if a.total_cost.abs() < f64::EPSILON {
                0.0
            } else {
                let delay_factor = 1.0 - (avg_delay / 90.0);
                let savings_ratio = a.total_savings / a.total_cost;
                (delay_factor * savings_ratio) * 100.0
            };
            let reliability = reliability_raw.min(100.0);

            ContractorRow {
                rank: 0, // filled in after sorting
                contractor: name,
                total_contract_cost: a.total_cost,
                projects: a.proj_count,
                avg_delay_days: avg_delay,
                total_cost_savings: a.total_savings,
                reliability_index: reliability,
                risk_flag: reliability,
            }
        })
        .collect();

    // sort by total_contract_cost desc and take top 15
    rows.sort_by(|a, b| b.total_contract_cost.partial_cmp(&a.total_contract_cost).unwrap_or(Ordering::Equal));
    if rows.len() > 15 { rows.truncate(15); }

    // assign ranks (1-based)
    for (i, row) in rows.iter_mut().enumerate() {
        row.rank = i + 1;
    }

    // write CSV in requested column order:
    // Rank, Contractor, TotalCost, NumProjects, AvgDelay, TotalSavings, ReliabilityIndex, RiskFlag
    let mut wtr = Writer::from_path(output_path)?;
    wtr.write_record(&[
        "Rank",
        "Contractor",
        "TotalCost",
        "NumProjects",
        "AvgDelay",
        "TotalSavings",
        "ReliabilityIndex",
        "RiskFlag",
    ])?;

    for r in &rows {
        let risk_flag = if r.reliability_index < 50.0 { "High Risk" } else { "" };
        wtr.write_record(&[
            &r.rank.to_string(),
            &r.contractor,
            &format!("{:.2}", r.total_contract_cost).separate_with_commas(),
            &r.projects.to_string(),
            &format!("{:.2}", r.avg_delay_days),
            &format!("{:.2}", r.total_cost_savings).separate_with_commas(),
            &format!("{:.2}", r.reliability_index),
            risk_flag,
        ])?;
    }
    wtr.flush()?;

    // print preview table
    let preview_count = rows.len().min(15);
    let preview = &rows[..preview_count];
    let table = Table::new(preview).to_string();
    println!("\nReport 2: Top Contractors Performance Ranking");
    println!("\nTop Contractors Performance Ranking");
    println!("(Top 15 by TotalCost, >= 5 Projects)");
    println!("{table}");
    println!("(Full table exported to {})", output_path);

    Ok(())
}
