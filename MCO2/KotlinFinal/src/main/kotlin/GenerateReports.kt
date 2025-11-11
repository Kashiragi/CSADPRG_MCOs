package org.mco2
import java.io.File
import org.jetbrains.kotlinx.dataframe.*
import org.jetbrains.kotlinx.dataframe.api.*
import org.jetbrains.kotlinx.dataframe.io.*
import java.time.temporal.ChronoUnit
import java.time.LocalDate

fun normalizeScore(score: Double, min: Double, max: Double): Double {
    if (max == min) return 50.0;
    return ((score - min) / (max - min)) * 100.0;
}

fun GenerateReport1(data: DataFrame<*>): DataFrame<*>{
    // https://kotlin.github.io/dataframe/groupby.html#aggregation
    val df_1 = data
        .convert("ApprovedBudgetForContract","CostSavings","CompletionDelayDays")
            .with { (it as Number).toDouble() }
        .select("Region", "MainIsland", "ApprovedBudgetForContract", "CostSavings", "CompletionDelayDays")

    val groupedByRegion = df_1
        .groupBy("Region", "MainIsland")
        .aggregate{
            sum( "ApprovedBudgetForContract" ) into "TotalBudget"
            median ("CostSavings") into "MedianSavings"
            mean ("CompletionDelayDays") into "AvgDelay"

            //percentage of projects with delays >30 days by Region and MainIsland
            val totalProjects: Double = rowsCount().toDouble()
            val delayAbove30: Double = count { row ->
                val days = row["CompletionDelayDays"] as Double
                days > 30.0
            }.toDouble()
            ((delayAbove30 / totalProjects) * 100.00) into "HighDelayPct"

        }
        .add("EfficiencyScore") {
            val median = it["MedianSavings"] as Double
            val avg = it["AvgDelay"] as Double

            if (avg>0) (median/avg * 100.00).toDouble()
            else 0.toDouble()
        }
        .sortByDesc("EfficiencyScore")

    val minScore: Double = groupedByRegion.min("EfficiencyScore") as Double
    val maxScore: Double = groupedByRegion.max("EfficiencyScore") as Double
    val processedDf = groupedByRegion
        .update("EfficiencyScore").with {
            val rawScore = this["EfficiencyScore"] as Double
            // Normalize each score
            normalizeScore(rawScore, minScore, maxScore);
        }
    print(processedDf)
    return processedDf
}

fun GenerateReport2(data: DataFrame<*>): DataFrame<*>{
    val df = data
        .convert("ContractCost","CostSavings").with { (it as Number).toDouble() }
        .select("Contractor", "ContractCost", "ContractorCount","CompletionDelayDays", "CostSavings")
        .split("Contractor").by(" / ".toRegex()).intoRows()

    val df_2 = df
        .update("ContractCost").with {
            val cost = this["ContractCost"] as Double
            val count = this["ContractorCount"] as Int

            if (count <= 0)
                0.0
            else
                cost / count.toDouble()
        }

    val groupedByContractor = df_2
        .groupBy("Contractor")
        .aggregate{
            sum("ContractCost") into "TotalCost"
            count() into "NumProjects"
            mean("CompletionDelayDays") into "AvgDelay"
            sum("CostSavings") into "TotalSavings"
        }
        .add("ReliabilityIndex") {
            val avgDelay = it["AvgDelay"] as? Double?:0.0
            val totalSavings = it["TotalSavings"] as? Double?:0.0
            val totalCost = it["TotalCost"] as? Double?:0.0

            if(totalSavings != 0.0) {
                val value = (1 - (avgDelay / 90.0)) * (totalSavings / totalCost) * 100.0
                if (value > 100.0) 100.0
                else value
            }
            else
                0.0
        }
        .add("RiskFlag"){
            val index = it["ReliabilityIndex"] as? Double?: 0.0
            if (index<50.0) "High Risk"
            else "Low Risk"
        }
        .convert("TotalCost").with { (it as Number).toDouble()}
        .filter { it ->
            (it["NumProjects"] as? Int?: 0) >= 5
        }
        .sortByDesc("TotalCost")
        .take(15)
        .add("Rank") { it.index() + 1}
        .select("Rank","Contractor", "TotalCost", "NumProjects", "AvgDelay", "TotalSavings", "ReliabilityIndex", "RiskFlag")


    println(groupedByContractor)
    return groupedByContractor
//print(df_2)
//print(new)
}

fun GenerateReport3(data: DataFrame<*>): DataFrame<*>{
    val df_3 = data
        .convert("CostSavings").with { (it as Number).toDouble() }
        .select("FundingYear", "TypeOfWork", "CostSavings")
    var groupedByYear = df_3
        .groupBy("FundingYear", "TypeOfWork")
        .aggregate {
            count() into "TotalProjects"
            mean("CostSavings") into "AvgSavings"
            val overrunCount = filter {
                val savings = it["CostSavings"] as Double
                savings<0.0
            }.count().toDouble()
            val totalCount = count()
            overrunCount / totalCount  into "OverrunRate"
        }

    // current-previous/previous/100

    val baselineDf = groupedByYear
        .filter{
            (it["FundingYear"] as Int)  == 2021
        }
        .select ("TypeOfWork","AvgSavings")
        .rename("AvgSavings").into("BaseLineAvgSavings")

    val df_3WithYOY = groupedByYear
        .leftJoin(baselineDf) { column<String>("TypeOfWork") }
        .add ("YoYChange") {
            val curr = it["AvgSavings"] as? Double
            val baseline = it["BaseLineAvgSavings"] as? Double

            if(curr!=null && baseline!=null && baseline!=0.0)
                (curr - baseline)/baseline * 100.00
            else
                null
        }
        .select (
            "FundingYear",
            "TypeOfWork",
            "TotalProjects",
            "AvgSavings",
            "OverrunRate",
            "YoYChange",
        )
        .sortBy{ "FundingYear" and "AvgSavings".desc() }

    print(df_3WithYOY.rows().toDataFrame())
    return(df_3WithYOY)
}