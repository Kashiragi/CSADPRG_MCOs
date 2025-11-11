package org.mco2

import java.io.File
import org.jetbrains.kotlinx.dataframe.*
import org.jetbrains.kotlinx.dataframe.api.*
import org.jetbrains.kotlinx.dataframe.io.*
import java.time.temporal.ChronoUnit
import java.time.LocalDate

interface Schema{
    val MainIsland : String?
    val Region : String?
    val Province : String?
    val LegislativeDistrict : String?
    val Municipality : String?
    val DistrictEngineeringOffice : String?
    val ProjectId : String?
    val ProjectName : String?
    val TypeOfWork : String?
    val FundingYear: Int?
    val ContractId : String?
    val ApprovedBudgetForContract: Double?
    val ContractCost: Double?
    val ActualCompletionDate: LocalDate?
    val Contractor : String?
    val ContractorCount: Int?
    val StartDate: LocalDate?
    val ProjectLatitude:Double?
    val ProjectLongitude: Double?
    val ProvincialCapital : String?
    val ProvincialCapitalLatitude: Double?
    val ProvincialCapitalLongitude: Double?
}
fun ReadRawFile(path: String): DataFrame<*>{
    val raw = DataFrame
        .readCsv(
            File(path)
        )
    val ogCount = raw.count()
    val conv = raw
        .convert("FundingYear","ContractorCount").with{ it -> it.toString().toIntOrNull() }
        .convert("ApprovedBudgetForContract", "ContractCost", "ProjectLatitude", "ProjectLongitude", "ProvincialCapitalLatitude", "ProvincialCapitalLongitude").with{ it.toString().toDoubleOrNull() }
    val df = conv
        .convertTo<Schema>()
    //df.schema().print()
    print("${df.count()} rows loaded")
    return df
}
fun CleanDataFrame(df: DataFrame<*>): DataFrame<*>{
    // exclude invalid values
    //val columns = listOf("MainIsland","Region","Province","LegislativeDistrict","Municipality","DistrictEngineeringOffice","ProjectId","ProjectName","TypeOfWork","FundingYear","ContractId","ApprovedBudgetForContract","ContractCost","ActualCompletionDate","Contractor","ContractorCount","StartDate","ProjectLatitude","ProjectLongitude","ProvincialCapital","ProvincialCapitalLatitude","ProvincialCapitalLongitude")
    //
    //val cleanDf = df.filter { row ->
    //    columns.all{ col -> row[col] != null }
    //}

    // Remove all rows with empty values in at least 1 column
    // this makes life simpler oop-
    val cleanDf = df.dropNulls()

    val validYearsDf = cleanDf
        .filter { row ->
        val year = row["FundingYear"] as Int

        year!=null && (year in 2021..2023)
    }


    print("${validYearsDf.count()} filtered for 2021-2023")
    return validYearsDf
}

fun ComputeNewColumns(df: DataFrame<*>): DataFrame<*>{

    val withNewCols = df
        .add("CostSavings") { row ->
            val budget = row["ApprovedBudgetForContract"] as? Double ?: 0.0
            val cost = row["ContractCost"] as? Double ?: 0.0
            budget - cost
        }
        .add("CompletionDelayDays") {row ->
            val start = row["StartDate"] as? LocalDate
            val end = row["ActualCompletionDate"] as? LocalDate
            if(start!=null && end!=null) ChronoUnit.DAYS.between(start, end)
            else null
        }
    return withNewCols
}

fun OutputCSV(df: DataFrame<*>, filenameWExtension: String){
    try {
        val outCsv = File(filenameWExtension)
        df.writeCsv(outCsv)
        println("Full table exported to ${filenameWExtension}")
    } catch (e: Exception){
        println("Unable to export full table to ${filenameWExtension}")
    }
}