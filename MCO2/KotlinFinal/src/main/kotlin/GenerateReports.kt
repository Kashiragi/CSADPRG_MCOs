import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject
import java.io.File
import org.jetbrains.kotlinx.dataframe.*
import org.jetbrains.kotlinx.dataframe.api.*
import org.jetbrains.kotlinx.dataframe.api.forEach
import org.jetbrains.kotlinx.dataframe.io.*
import java.time.temporal.ChronoUnit
import java.time.LocalDate
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import javax.xml.crypto.Data
import kotlin.math.roundToInt

fun formatTableRow(values: List<*>, widths: IntArray): String {
    return values.mapIndexed { i, v ->
        val str = v?.toString() ?: ""
        str.padEnd(widths.getOrElse(i) { 0 })
    }.joinToString(" | ", prefix = "| ", postfix = " |")
}

fun formatTableSeparator(widths: IntArray): String {
    return widths.joinToString(separator = "+", prefix = "+", postfix = "+") { w -> "-".repeat(w + 2) }
}

fun normalizeScore(score: Double, min: Double, max: Double): Double {
    if (max == min) return 50.0;
    return ((score - min) / (max - min)) * 100.0;
}

fun GenerateReport1(data: DataFrame<*>): DataFrame<*>{
    // https://kotlin.github.io/dataframe/groupby.html#aggregation
    val widths = intArrayOf(45, 12, 18, 15, 10, 14, 17);
    val headers = listOf("Region", "MainIsland", "TotalBudget", "MedianSavings", "AvgDelay",
            "HighDelayPct", "EfficiencyScore");

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

    // displaying
    println("\n\nReport 1: Regional Flood Mitigation Efficiency Summary");
    println("=".repeat(140));
    println("Regional Flood Mitigation Efficiency Summary");
    println("(Filtered: 2021-2023 Projects)");
    println();
    println(formatTableSeparator(widths))
    println(formatTableRow(headers, widths))
    println(formatTableSeparator(widths))
    val displayDf = processedDf.take(10)
    displayDf.forEach { row->
        val values = listOf(
            row["Region"],
            row["MainIsland"],
            "%,.2f".format(row["TotalBudget"]),
            "%,.2f".format(row["MedianSavings"]),
            "%,.2f".format(row["AvgDelay"]),
            "%,.2f".format(row["HighDelayPct"]),
            "%,.2f".format(row["EfficiencyScore"])
        )
        println(formatTableRow(values,widths))
    }
    println(formatTableSeparator(widths))
    return processedDf
}

fun GenerateReport2(data: DataFrame<*>): DataFrame<*>{
    val widths = intArrayOf(6, 55, 18, 13, 10, 15, 18, 12);
    val headers = listOf("Rank",
        "Contractor", "TotalCost", "NumProjects", "AvgDelay", "TotalSavings", "ReliabilityIndex", "RiskFlag");

    val df = data
        .convert("ContractCost","CostSavings").with { (it as Number).toDouble() }
        .select("Contractor", "ContractCost", "ContractorCount","CompletionDelayDays", "CostSavings")
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
        .add("Rank") { it.index() + 1 }
        .select("Rank","Contractor", "TotalCost", "NumProjects", "AvgDelay", "TotalSavings", "ReliabilityIndex", "RiskFlag")

    // printing
    println("\n\nReport 2: Top Contractors Performance Ranking");
    println("=".repeat(140));
    println("Top Contractors Performance Ranking (Top 15 by TotalCost, >=5 Projects)");
    println();
    println(formatTableSeparator(widths))
    println(formatTableRow(headers, widths))
    println(formatTableSeparator(widths))
    val displayDf = groupedByContractor.take(10)
    displayDf.forEach { row->
        val values = listOf(
            row["Rank"],
            row["Contractor"].toString().take(53),
            "%,.2f".format(row["TotalCost"]),
            row["NumProjects"],
            "%,.2f".format(row["AvgDelay"]),
            "%,.2f".format(row["TotalSavings"]),
            "%,.2f".format(row["ReliabilityIndex"]),
            row["RiskFlag"]
        )
        println(formatTableRow(values,widths))
    }
    println(formatTableSeparator(widths))
    return groupedByContractor
//print(df_2)
//print(new)
}

fun GenerateReport3(data: DataFrame<*>): DataFrame<*>{
    val widths = intArrayOf(13, 50, 15, 15, 13, 12);
    val headers = listOf("FundingYear", "TypeOfWork", "TotalProjects", "AvgSavings", "OverrunRate", "YoYChange");

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
            (overrunCount / totalCount) * 100.0  into "OverrunRate"
        }
    val previous_year = groupedByYear
        .select("TypeOfWork", "AvgSavings")
        .rename("AvgSavings").into("PrevAvgSavings")
        .update("FundingYear").with { (this["FundingYear"] as Int) +1 }
    // current-previous/previous/100

//    val baselineDf = groupedByYear
//        .filter{
//            (it["FundingYear"] as Int)  == 2021
//        }
//        .select ("TypeOfWork","AvgSavings")
//        .rename("AvgSavings").into("BaseLineAvgSavings")

    val df_3WithYOY = groupedByYear
        .leftJoin(previous_year) {
            column<String>("TypeOfWork") and column<Int>("FundingYear")
        }
        .add ("YoYChange") {
            val curr = it["AvgSavings"] as? Double
            val baseline = it["PrevAvgSavings"] as? Double

            if(curr!=null && baseline!=null && baseline!=0.0)
                (curr - baseline)/baseline * 100.00
            else
                0.00
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
    //

    println("\n\nReport 3: Annual Project Type Cost Overrun Trends");
    println("=".repeat(140));
    println("Annual Project Type Cost Overrun Trends (Grouped by FundingYear and TypeOfWork)");
    println();
    println(formatTableSeparator(widths))
    println(formatTableRow(headers, widths))
    println(formatTableSeparator(widths))
    val displayDf = df_3WithYOY.take(10)
    displayDf.forEach { row->
        val values = listOf(
            row["FundingYear"],
            row["TypeOfWork"].toString().take(48),
            row["TotalProjects"],
            "%,.2f".format(row["AvgSavings"]),
            "%,.2f".format(row["OverrunRate"]),
            "%,.2f".format(row["YoYChange"])
        )
        println(formatTableRow(values,widths))
    }
    println(formatTableSeparator(widths))

    return(df_3WithYOY)
}

fun generateSummary(r: DataFrame<*>, r1: DataFrame<*>, r2: DataFrame<*>, r3: DataFrame<*>, filenameWExtension: String){
    val df = r
        .convert("ApprovedBudgetForContract", "ContractCost", "CostSavings", "CompletionDelayDays")
        .with { (it as Number).toDouble() }
    val totalProjects = df.count()
    val uniqContractors = df.countDistinct("Contractor")
    val uniqProvinces = r.countDistinct("Province")
    val globalAvgDelay = df.mean("CompletionDelayDays")
    val totalSavings = df.sum("CostSavings")

    val summaryJson = buildJsonObject {
        put("total_projects", totalProjects)
        put("total_contractors", uniqContractors)
        put("total_provinces", uniqProvinces)
        put("global_avg_delay", "%,.2f".format(globalAvgDelay))
        put("total_savings", "%,.2f".format(totalSavings))
    }

    val jsonString = Json.encodeToString(JsonObject.serializer(), summaryJson)

    File(filenameWExtension).writeText(jsonString)
//    print(jsonString)
}