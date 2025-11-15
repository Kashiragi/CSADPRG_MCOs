//! Reports module — CSV report generators and summary exporter.
//!
//! This module provides functions to generate three CSV reports and a JSON
//! summary from a slice of `Project` records. Each report writes a CSV file
//! and prints a small preview to the CLI.
//!
//! The functions in this file:
//! - `generate_report_1` — Regional Flood Mitigation Efficiency Summary
//! - `generate_report_2` — Top Contractors Performance Ranking
//! - `generate_report_3` — Annual Project Type Cost Overrun Trends
//! - `generate_summary`  — Aggregated summary JSON + CLI preview

use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::cmp::Ordering;
use std::fs;
use tabled::{Table, settings::Style};
use thousands::Separable;
use csv::Writer;

use crate::models::{Project, EfficiencyRow, ContractorRow, AnnualProjectRow, Summary};

/// Generates "Regional Flood Mitigation Efficiency Summary" CSV.
///
/// Groups projects by `(Region, MainIsland)` and computes, per group:
/// - total approved budget (`TotalBudget`)
/// - median cost savings (`MedianSavings`)
/// - average completion delay in days (`AvgDelay`)
/// - percent of projects with delay > 30 days (`HighDelayPct`)
/// - an `EfficiencyScore` computed as `median_savings / avg_delay` (raw),
///   then normalized to 0..100 via min-max scaling across groups.
///
/// The report is exported as `report1_regional_summary.csv` and a top-10 preview
/// is printed to the CLI.
///
/// # Arguments
///
/// * `projects` - slice of `Project` records to aggregate.
///
/// # Returns
///
/// `Ok(())` on success, or an error if CSV writing fails.
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
        // treat avg_delay_days == 0 as raw = 0.0 (no delay -> neutral)
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

    // print preview table
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
/// Aggregates by the raw `Contractor` string. For each contractor:
/// - counts projects,
/// - sums total contract cost and total cost savings,
/// - computes average completion delay across projects that have delays,
/// - computes a `ReliabilityIndex = (1 - avg_delay/90) * (total_savings/total_cost) * 100`,
///   capped at 100. Contractors with `ReliabilityIndex < 50` are flagged "High Risk".
///
/// The report includes only contractors with >= 5 projects and writes
/// `report2_contractor_ranking.csv`. A preview (top 10 by total cost) is printed.
///
/// # Arguments
///
/// * `projects` - slice of `Project` records to aggregate.
///
/// # Returns
///
/// `Ok(())` on success or an error if writing the CSV fails.
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

        let contractor: String = contractor_field.trim().to_string();

        if contractor.is_empty() { continue; }

        let contract_cost_per = p.contract_cost.unwrap_or(0.0);
        let savings_per = p.cost_savings().unwrap_or(0.0);
        let delay_opt = p.completion_delay_days().map(|d| d as f64);

        let a = aggs.entry(contractor).or_default();
        a.proj_count += 1;
        a.total_cost += contract_cost_per;
        a.total_savings += savings_per;

        if let Some(d) = delay_opt {
            a.delay_sum += d;
            a.delay_count += 1;
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
    let preview_count = rows.len().min(10);
    let preview = &rows[..preview_count];
    let table = Table::new(preview).to_string();
    println!("\nReport 2: Top Contractors Performance Ranking");
    println!("\nTop Contractors Performance Ranking");
    println!("(Top 15 by TotalCost, >= 5 Projects)");
    println!("{table}");
    println!("(Full table exported to {})", output_path);

    Ok(())
}

/// Generate Report 3: Annual Project Type Cost Overrun Trends.
///
/// Groups projects by `(FundingYear, TypeOfWork)` and computes per group:
/// - `TotalProjects`
/// - `AVG savings` (average cost savings; negative means overrun)
/// - `Overrun rate` (percent of those with negative savings among projects reporting savings)
/// - `YoY Change` — percent change in `avg_savings` relative to 2021 baseline for the same `TypeOfWork`.
///
/// Writes `report3_annual_trends.csv` and prints a small preview table.
///
/// # Arguments
///
/// * `projects` - slice of `Project` records to aggregate.
///
/// # Returns
///
/// `Ok(())` on success or an error if CSV write fails.
pub fn generate_report_3(projects: &[Project]) -> Result<(), Box<dyn Error>> {
    let output_path = "report3_annual_trends.csv";
    // group by (funding_year, type_of_work)
    let mut groups: HashMap<(usize, String), Vec<&Project>> = HashMap::new();

    for p in projects.iter() {
        let year = match p.funding_year {
            Some(y) => y as usize,
            None => continue, // skip projects without funding year
        };
        let typ = p.type_of_work.clone().unwrap_or_default();
        groups.entry((year, typ)).or_default().push(p);
    }

    // compute avg_savings and overruns per group
    // first produce raw rows
    let mut rows: Vec<AnnualProjectRow> = Vec::new();
    // map for baseline 2021 by type_of_work -> avg_savings
    let mut baseline_2021: HashMap<String, f64> = HashMap::new();

    for ((year, typ), group) in groups.iter() {
        let total_projects = group.len();

        // collect savings available
        let savings_vals: Vec<f64> = group.iter()
            .filter_map(|p| p.cost_savings())
            .collect();

        let avg_savings = if savings_vals.is_empty() {
            0.0
        } else {
            savings_vals.iter().sum::<f64>() / (savings_vals.len() as f64)
        };

        // overrun rate: percent of projects with negative savings among those with savings
        let overrun_count = savings_vals.iter().filter(|&&s| s < 0.0).count();
        let overrun_rate = if savings_vals.is_empty() {
            0.0
        } else {
            (overrun_count as f64 / savings_vals.len() as f64) * 100.0
        };

        // push temporary row (yoy calculated later)
        rows.push(AnnualProjectRow {
            funding_year: *year,
            type_of_work: typ.clone(),
            total_projects,
            avg_savings,
            overrun_rate,
            yoy_change: 0.0, // placeholder
        });

        // store baseline if year == 2021
        if *year == 2021 {
            baseline_2021.insert(typ.clone(), avg_savings);
        }
    }

    // compute YoY change relative to 2021 baseline per type_of_work
    for row in rows.iter_mut() {
        let typ = &row.type_of_work;
        let baseline = baseline_2021.get(typ).copied().unwrap_or(0.0);
        if baseline.abs() < f64::EPSILON {
            // baseline zero or missing => define YoY as 0.0 to avoid division by zero
            row.yoy_change = 0.0;
        } else {
            row.yoy_change = ((row.avg_savings - baseline) / baseline) * 100.0;
        }
    }

    // sort ascending by year, and within year descending by avg_savings
    rows.sort_by(|a, b| {
        a.funding_year.cmp(&b.funding_year)
            .then_with(|| b.avg_savings.partial_cmp(&a.avg_savings).unwrap_or(Ordering::Equal))
    });

    // write CSV
    let mut wtr = Writer::from_path(output_path)?;
    wtr.write_record(&[
        "FundingYear",
        "TypeOfWork",
        "TotalProjects",
        "AvgSavings",
        "OverrunRate",
        "YoYChange",
    ])?;

    for r in &rows {
        wtr.write_record(&[
            &r.funding_year.to_string(),
            &r.type_of_work,
            &r.total_projects.to_string(),
            &format!("{:.2}", r.avg_savings).separate_with_commas(),
            &format!("{:.2}", r.overrun_rate),
            &format!("{:.2}", r.yoy_change),
        ])?;
    }
    wtr.flush()?;

    // print preview table
    let preview_count = rows.len().min(10);
    let preview = &rows[..preview_count];
    let table = Table::new(preview).to_string();
    println!("\nReport 3: Annual Project Type Cost Overrun Trends");
    println!("\nAnnual Project Type Cost Overrun Trends");
    println!("Grouped by FundingYear and TypeOfWork");
    println!("{table}");
    println!("(Full table exported to {})", output_path);

    Ok(())
}

/// Generate summary.json and print a preview to CLI.
///
/// Aggregates high-level statistics across all projects:
/// - `total_projects`
/// - `total_contractors` (unique raw `Contractor` strings, no splitting)
/// - `total_provinces` (unique non-empty `Province` values)
/// - `global_avg_delay` (average over projects that report delays)
/// - `total_savings` (sum of cost_savings, treating missing as 0)
///
/// The summary is written to `summary.json` in pretty JSON form and printed.
///
/// # Arguments
///
/// * `projects` - slice of `Project` records to aggregate.
///
/// # Returns
///
/// `Ok(())` on success, or an error if writing the JSON fails.
pub fn generate_summary(projects: &[Project]) -> Result<(), Box<dyn Error>> {
    // total projects
    let output_path = "summary.json";
    let total_projects = projects.len();

    // total unique contractors (no splitting) - skip empty / None
    let mut contractors: HashSet<String> = HashSet::new();
    for p in projects.iter() {
        if let Some(c) = &p.contractor {
            let s = c.trim();
            if !s.is_empty() {
                contractors.insert(s.to_string());
            }
        }
    }
    let total_contractors = contractors.len();

    // total unique provinces (non-empty)
    let mut provinces: HashSet<String> = HashSet::new();
    for p in projects.iter() {
        if let Some(pr) = &p.province {
            let s = pr.trim();
            if !s.is_empty() {
                provinces.insert(s.to_string());
            }
        }
    }
    let total_provinces = provinces.len();

    // global average delay (only projects that have a delay)
    let mut delay_sum: f64 = 0.0;
    let mut delay_count: usize = 0;
    for p in projects.iter() {
        if let Some(d) = p.completion_delay_days() {
            delay_sum += d as f64;
            delay_count += 1;
        }
    }
    let global_avg_delay = if delay_count == 0 {
        0.0
    } else {
        delay_sum / (delay_count as f64)
    };

    // total savings (sum of cost_savings(), treat missing as 0)
    let total_savings: f64 = projects.iter()
        .map(|p| p.cost_savings().unwrap_or(0.0))
        .sum();

    // build summary and write JSON
    let summary = Summary {
        total_projects: format!("{}", total_projects).separate_with_commas(),
        total_contractors: format!("{}", total_contractors).separate_with_commas(),
        total_provinces: format!("{}", total_provinces).separate_with_commas(),
        global_avg_delay: format!("{:.2}", global_avg_delay).separate_with_commas(),
        total_savings: format!("{:.2}", total_savings).separate_with_commas(),
    };

    let json = serde_json::to_string_pretty(&summary)?;
    fs::write(output_path, &json)?;

    // CLI preview
    println!("\nSummary Stats (summary.json)");
    println!("{}", json);

    Ok(())
}