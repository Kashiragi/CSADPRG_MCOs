# DPWH Flood Control Analysis

## Project Overview
This project analyzes DPWH (Department of Public Works and Highways) flood control projects data containing 9,800+ rows of project information. The system generates three comprehensive reports on regional efficiency, contractor rankings, and cost overrun trends.

## Project Structure
```
dpwh-flood-control-analysis/
│
├── data/                                      # Data directory
│   └── dpwh_flood_control_projects.csv       # Main data source (9,800+ rows)
│
├── output/                                    # Generated reports
│   ├── report1_regional_efficiency.csv       # Report 1 output
│   ├── report2_contractor_ranking.csv        # Report 2 output
│   ├── report3_cost_overrun_trends.csv       # Report 3 output
│   └── summary.json                          # Aggregated summary output
│
├── logs/                                      # Application logs
│   └── ingestion.log                         # Data validation and parsing logs
│
└── src/                                       # Source code
    ├── index.js                              # Main entry point
    ├── config/                               # Configuration
    ├── utils/                                # Utility functions
    ├── ingestion/                            # Data ingestion pipeline
    ├── reports/                              # Report generators
    └── services/                             # Shared services
```

## Installation
```bash
npm install
```

## Usage
Run the analysis:
```bash
node src/index.js
```
or
```bash
npm start
```

## Dependencies
- **papaparse**: CSV parsing library
- **dayjs**: Date manipulation library

## Reports Generated
1. **Regional Efficiency Report**: Analysis of project efficiency across different regions
2. **Contractor Ranking Report**: Performance ranking of contractors
3. **Cost Overrun Trends Report**: Trends in cost overruns across projects

## Output
All generated reports are saved in the `output/` directory, and logs are maintained in the `logs/` directory.
