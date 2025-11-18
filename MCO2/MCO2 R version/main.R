#********************
#Last names: Inocencio
#Language: R
#Paradigm(s): Procedural, Imperative, Functional
#********************

library(tidyverse)
library(lubridate)
library(jsonlite)
library(janitor)

DATA_FILE <- "dpwh_flood_control_projects.csv"
OUTPUT_DIR <- "outputs"


## ---------------------------------------------
## Data Loading, Cleaning, and Pre-processing
## ---------------------------------------------

#' Loads, cleans, validates, and prepares the project data for analysis.
#'
#' This function performs necessary type conversions, handles missing data,
#' and calculates base metrics like 'main_island' grouping.
#'
#' @param file_path The location of the raw CSV file.
#' @return A list containing the final prepared data (\code{data}) and
#'         statistics on the cleaning process (\code{stats}).
load_and_clean_data <- function(file_path) {
  data <- read_csv(file_path, show_col_types = FALSE)
  total_rows <- nrow(data)
  
  data_validated <- data %>%
    janitor::clean_names() %>% 
    mutate(
      approved_budget_for_contract = as.numeric(approved_budget_for_contract),
      contract_cost = as.numeric(contract_cost),
      start_date = as_date(start_date),
      actual_completion_date = as_date(actual_completion_date),
      
      main_island = case_when(
        region %in% c("NCR", "CAR", "Region I", "Region II", "Region III", "Region IV-A", "Region IV-B", "Region V") ~ "Luzon",
        region %in% c("Region VI", "Region VII", "Region VIII") ~ "Visayas",
        region %in% c("Region IX", "Region X", "Region XI", "Region XII", "Region XIII", "BARMM") ~ "Mindanao",
        TRUE ~ "Unknown"
      )
    ) %>%
    
    drop_na(
      approved_budget_for_contract, contract_cost, start_date, 
      actual_completion_date, region, contractor, type_of_work, province
    )
  
  valid_rows_count <- nrow(data_validated)
  
  
  data_filtered <- data_validated %>%
    mutate(funding_year = year(start_date)) %>%
    filter(funding_year %in% c(2021, 2022, 2023))
  
  filtered_rows_count <- nrow(data_filtered)
  
  
  data_final <- data_filtered %>%
    mutate(
      cost_savings = approved_budget_for_contract - contract_cost,
      completion_delay_days = as.numeric(actual_completion_date - start_date)
    )
  
  stats <- list(
    original_rows = total_rows,
    valid_rows = valid_rows_count,
    filtered_rows = filtered_rows_count,
    invalid_removed = total_rows - valid_rows_count,
    year_filter_removed = valid_rows_count - filtered_rows_count
  )
  
  return(list(data = data_final, stats = stats))
}

## ---------------------------------------------
## Report Generation Functions
## ---------------------------------------------

#' Report 1: Regional Flood Mitigation Efficiency Summary
#'
#' Summarizes project performance by region and calculates a normalized 
#' Efficiency Score based on cost savings relative to completion delays.
#'
#' @param data The cleaned and filtered project data.
#' @return A regional summary tibble, sorted by Efficiency Score (descending).
generate_report1 <- function(data) {
  regional_raw_data <- data %>%
    group_by(region, main_island) %>%
    summarise(
      TotalBudget = sum(approved_budget_for_contract, na.rm = TRUE),
      MedianSavings = median(cost_savings, na.rm = TRUE),
      AvgDelay = mean(completion_delay_days, na.rm = TRUE),
      HighDelayPct = mean(completion_delay_days > 30, na.rm = TRUE) * 100,
      ProjectCount = n(), 
      .groups = 'drop'
    ) %>%
    mutate(
      RawEfficiencyScore = ifelse(
        AvgDelay == 0 | is.na(AvgDelay), 
        0, 
        (MedianSavings / AvgDelay) * 100
      )
    )
  
  min_score <- min(regional_raw_data$RawEfficiencyScore, na.rm = TRUE)
  max_score <- max(regional_raw_data$RawEfficiencyScore, na.rm = TRUE)
  
  report1 <- regional_raw_data %>%
    mutate(
      EfficiencyScore = case_when(
        max_score == min_score ~ 50, 
        TRUE ~ ((RawEfficiencyScore - min_score) / (max_score - min_score)) * 100
      )
    ) %>%
    mutate(
      EfficiencyScore = pmin(pmax(EfficiencyScore, 0), 100)
    ) %>%
    select(
      region, main_island, ProjectCount, TotalBudget, MedianSavings, 
      AvgDelay, HighDelayPct, EfficiencyScore
    ) %>%
    arrange(desc(EfficiencyScore))
  
  
  report1_out <- report1 %>%
    mutate(across(where(is.numeric), ~round(., 2)))
  
  write_csv(report1_out, file.path(OUTPUT_DIR, "report1_regional_summary.csv"))
  return(report1_out)
}

#' Report 2: Top Contractors Performance Ranking
#'
#' Ranks the top 15 contractors (by total contract cost, min 5 projects) 
#' based on a Reliability Index, which factors in savings and delay performance.
#'
#' @param data The cleaned and filtered project data.
#' @return A tibble with the performance ranking and risk assessment.
generate_report2 <- function(data) {
  contractor_data <- data %>%
    group_by(contractor) %>%
    summarise(
      NumProjects = n(),
      TotalCost = sum(contract_cost, na.rm = TRUE),
      AvgDelay = mean(completion_delay_days, na.rm = TRUE),
      TotalSavings = sum(cost_savings, na.rm = TRUE),
      .groups = 'drop'
    ) %>%
    filter(NumProjects >= 5) %>%
    arrange(desc(TotalCost)) %>%
    slice_head(n = 15) %>%
    mutate(
      DelayTerm = 1 - (AvgDelay / 90), 
      CostRatio = ifelse(TotalCost == 0 | is.na(TotalCost), 0, TotalSavings / TotalCost),
      ReliabilityIndex_Uncap = DelayTerm * CostRatio * 100,
      ReliabilityIndex = pmin(ReliabilityIndex_Uncap, 100), 
      RiskFlag = ifelse(ReliabilityIndex < 50, "High Risk", "Low Risk"),
      Rank = row_number()
    ) %>%
    
    select(
      Rank, 
      Contractor = contractor, 
      ProjectCount = NumProjects, 
      TotalContractCost = TotalCost, 
      AvgCompletionDelayDays = AvgDelay, 
      TotalCostSavings = TotalSavings, 
      ReliabilityIndex, 
      RiskLevel = RiskFlag
    ) %>%
    arrange(Rank)
  
  report2_out <- contractor_data %>%
    mutate(across(where(is.numeric), ~round(., 2)))
  
  write_csv(report2_out, file.path(OUTPUT_DIR, "report2_contractor_ranking.csv"))
  return(report2_out)
}

#' Report 3: Annual Project Type Cost Overrun Trends
#'
#' Tracks how different work types perform over the years (2021, 2022, 2023)
#' in terms of cost savings and overruns, including year-over-year change.
#'
#' @param data The cleaned and filtered project data.
#' @return A tibble detailing annual trends by work type.
generate_report3 <- function(data) {
  
  report3_summarized <- data %>%
    group_by(funding_year, type_of_work) %>%
    summarise(
      TotalProjects = n(),
      AvgCostSavings = mean(cost_savings, na.rm = TRUE),
      OverrunRate = mean(cost_savings < 0, na.rm = TRUE) * 100,
      .groups = 'drop'
    )
  
  report3 <- report3_summarized %>%
    group_by(type_of_work) %>%
    arrange(funding_year) %>% 
    mutate(
      PreviousAvgSavings = lag(AvgCostSavings), 
      
      YoYChangePercent = case_when(
        is.na(PreviousAvgSavings) | PreviousAvgSavings == 0 ~ 0,
        TRUE ~ ((AvgCostSavings - PreviousAvgSavings) / PreviousAvgSavings) * 100
      )
    ) %>%
    ungroup() %>%
    
    select(
      FundingYear = funding_year, 
      TypeOfWork = type_of_work, 
      TotalProjects, 
      AvgCostSavings, 
      OverrunRate, 
      YoYChangePercent
    ) %>%
    arrange(FundingYear, desc(AvgCostSavings))
  
  report3_out <- report3 %>%
    mutate(across(where(is.numeric), ~round(., 2)))
  
  write_csv(report3_out, file.path(OUTPUT_DIR, "report3_annual_trends.csv"))
  return(report3_out)
}


#' Generates a comprehensive summary of key project metrics.
#'
#' This function compiles high-level financial, performance, and distribution
#' statistics into a single list and exports it as a JSON file.
#'
#' @param data The clean project data.
#' @param report1_data Summary data from Report 1.
#' @param report2_data Summary data from Report 2.
#' @param report3_data Summary data from Report 3.
#' @return A list containing all calculated summary statistics.
generate_summary_report <- function(data, report1_data, report2_data, report3_data) {
  
  # --- Project Overview ---
  total_projects <- nrow(data)
  unique_contractors <- n_distinct(data$contractor)
  unique_provinces <- n_distinct(data$province)
  unique_regions <- n_distinct(data$region)
  
  # --- Financial Summary ---
  total_approved_budget <- sum(data$approved_budget_for_contract, na.rm = TRUE)
  total_contract_cost <- sum(data$contract_cost, na.rm = TRUE)
  total_savings <- sum(data$cost_savings, na.rm = TRUE)
  
  avg_savings <- mean(data$cost_savings, na.rm = TRUE)
  
  budget_utilization_rate <- ifelse(total_approved_budget > 0, 
                                    (total_contract_cost / total_approved_budget) * 100, 
                                    0)
  
  projects_over_budget <- sum(data$cost_savings < 0, na.rm = TRUE)
  projects_under_budget <- sum(data$cost_savings >= 0, na.rm = TRUE)
  
  over_budget_rate <- ifelse(total_projects > 0, (projects_over_budget / total_projects) * 100, 0)
  
  # --- Performance (Delay) Summary ---
  global_avg_delay_days <- mean(data$completion_delay_days, na.rm = TRUE)
  global_avg_delay_months <- global_avg_delay_days / 30.44
  projects_with_long_delay <- sum(data$completion_delay_days > 30, na.rm = TRUE)
  long_delay_rate <- ifelse(total_projects > 0, (projects_with_long_delay / total_projects) * 100, 0)
  
  # --- Distribution Counts (converted to named lists for JSON) ---
  year_counts <- data %>% count(funding_year) %>% mutate(funding_year = as.character(funding_year))
  year_distribution <- setNames(as.list(year_counts$n), year_counts$funding_year)
  
  island_counts <- data %>% count(main_island)
  island_distribution <- setNames(as.list(island_counts$n), island_counts$main_island)
  
  type_counts <- data %>% count(type_of_work, sort = TRUE) %>% slice_head(n = 5)
  type_distribution <- setNames(as.list(type_counts$n), type_counts$type_of_work)
  
  # --- Summaries from Detailed Reports ---
  report1_summary <- list(
    totalRegions = nrow(report1_data),
    highestEfficiencyRegion = report1_data$region[1],
    highestEfficiencyScore = round(report1_data$EfficiencyScore[1], 2)
  )
  
  report2_summary <- list(
    totalContractors = nrow(report2_data),
    topContractor = report2_data$Contractor[1],
    highRiskCount = sum(report2_data$RiskLevel == 'High Risk', na.rm = TRUE)
  )
  
  report3_summary <- list(
    totalEntries = nrow(report3_data),
    yearsCount = n_distinct(report3_data$FundingYear),
    typesCount = n_distinct(report3_data$TypeOfWork)
  )
  
  
  # 5. Build the final structured summary list
  summary_stats <- list(
    metadata = list(
      generatedAt = format(Sys.time(), format = "%Y-%m-%dT%H:%M:%S%Z"),
      dataYears = list(2021, 2022, 2023),
      reportVersion = '1.0.0'
    ),
    overview = list(
      totalProjects = total_projects,
      totalContractors = unique_contractors,
      totalProvinces = unique_provinces,
      totalRegions = unique_regions
    ),
    financial = list(
      totalApprovedBudget = round(total_approved_budget, 2),
      totalContractCost = round(total_contract_cost, 2),
      totalSavings = round(total_savings, 2),
      avgSavingsPerProject = round(avg_savings, 2),
      budgetUtilizationRate = round(budget_utilization_rate, 2),
      projectsOverBudget = projects_over_budget,
      projectsUnderBudget = projects_under_budget,
      overBudgetRate = round(over_budget_rate, 2)
    ),
    performance = list(
      globalAvgDelayDays = round(global_avg_delay_days, 2),
      globalAvgDelayMonths = round(global_avg_delay_months, 2),
      projectsWithLongDelay = projects_with_long_delay,
      longDelayRate = round(long_delay_rate, 2)
    ),
    distribution = list(
      byYear = year_distribution,
      byIsland = island_distribution,
      byTypeOfWork = type_distribution
    ),
    reports = list(
      report1 = report1_summary,
      report2 = report2_summary,
      report3 = report3_summary
    )
  )
  
  # 6. Save the summary as a readable JSON file
  summary_json_path <- file.path(OUTPUT_DIR, "summary.json")
  write_json(summary_stats, summary_json_path, pretty = TRUE, auto_unbox = TRUE)
  
  return(summary_stats)
}


#' The main function to run the application's menu interface.
#'
#' This handles user input, manages the data state, and calls the report 
#' generation functions.
#'
#' @return Executes the interactive loop; no explicit return value.
main <- function() {
  
  # Initialize variables to hold the data and tracking stats
  flood_data <- NULL
  data_loaded <- FALSE
  stats <- NULL
  
  # Check if the output folder exists, and create it if not
  if (!dir.exists(OUTPUT_DIR)) {
    dir.create(OUTPUT_DIR)
  }
  
  # Start the interactive loop
  while(TRUE) {
    
    
    if (data_loaded) {
      message("\n--- Data Processing Summary ---")
      message(paste("Original rows:", stats$original_rows))
      message(paste("Valid rows after validation:", stats$valid_rows))
      message(paste("Filtered rows (2021-2023):", stats$filtered_rows))
      message(paste("Rows removed due to missing data:", stats$invalid_removed))
      message(paste("Rows removed by year filter:", stats$year_filter_removed))
    }
    
    message("\n--- Main Menu ---")
    message("[1] Load and Clean the Project Data")
    message("[2] Generate All Reports")
    message("[3] Exit Application")
    
    choice <- readline("Enter choice: ")
    
    switch(choice,
           "1" = {
             message("\nProcessing dataset. This may take a moment...")
             result <- load_and_clean_data(DATA_FILE)
             flood_data <- result$data
             stats <- result$stats
             data_loaded <- TRUE
             message("Data loaded and cleaned successfully.")
           },
           "2" = {
             if (data_loaded) {
               message("\nGenerating Reports and Saving to Files...")
               
               report1_data <- generate_report1(flood_data)
               report2_data <- generate_report2(flood_data)
               report3_data <- generate_report3(flood_data)
               
               summary_data <- generate_summary_report(flood_data, report1_data, report2_data, report3_data)
               
               message("\n--- Report Previews ---")
               
               message("\nReport 1: Regional Efficiency Summary (Top 2)")
               print(head(report1_data, 2))
               message(paste0("(Full table saved to ", file.path(OUTPUT_DIR, "report1_regional_summary.csv"), ")"))
               
               message("\nReport 2: Top Contractors Performance Ranking (Top 2)")
               print(head(report2_data, 2))
               message(paste0("(Full table saved to ", file.path(OUTPUT_DIR, "report2_contractor_ranking.csv"), ")"))
               
               message("\nReport 3: Annual Project Type Cost Trends (Top 2)")
               print(head(report3_data, 2))
               message(paste0("(Full table saved to ", file.path(OUTPUT_DIR, "report3_annual_trends.csv"), ")"))
               
               message("\nSummary Stats Snippet:")
               message(paste0('{"totalProjects": ', summary_data$overview$totalProjects, 
                              ', "globalAvgDelayDays": ', summary_data$performance$globalAvgDelayDays, 
                              ', "totalSavings": ', summary_data$financial$totalSavings, '}'))
               
               message("\nAll reports and summary saved successfully.")
               
               message("\nReturn to Main Menu (Y/N)?")
               user_confirm <- tolower(readline())
               if (user_confirm == "n") {
                 break
               }
               
             } else {
               message("\nError: Please load the data first (Option 1) before generating reports.")
             }
           },
           "3" = {
             message("\nExiting application. Goodbye!")
             break
           },
           {
             message(paste("\nInvalid choice:", choice, ". Please enter 1, 2, or 3."))
           }
    )
  }
}

main()