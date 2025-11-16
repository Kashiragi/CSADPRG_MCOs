import org.jetbrains.kotlinx.dataframe.*
import org.jetbrains.kotlinx.dataframe.api.*
import org.jetbrains.kotlinx.dataframe.io.*

fun displayMainMenu(){
    print("Select Language Implementation:\n" +
            "[1] Load the file\n" +
            "[2] Generate Reports\n" +
            "[3] Exit\n" +
            "Enter Choice: ")
}
fun main() {
    println("\n" + "=".repeat(80))
    println("DPWH FLOOD CONTROL PROJECTS ANALYSIS")
    println("=".repeat(80))
    var choice: Int
    var continueProgram: Boolean = true
    var df: DataFrame<*>? = null;

    try {
        do {
            displayMainMenu()
            choice = readln().toInt()

            when(choice){
                1->{
                    val path: String= "D:/01 KEI FILES/Academics and School/" +
                            "DLSU/TERM 4/CSADPRG S11/__MCO/MCO2/" +
                            "dpwh_flood_control_projects.csv"
                    print("(")
                    val rawDf = ReadRawFile(path)
                    print(", ")
                    val cleanDf = CleanDataFrame(rawDf)
                    print(")\n")
                    df = ComputeNewColumns(cleanDf)
                }
                2 -> {
                    if(df == null) println("Please select option 1 and load file.")
                    else {
                        val df1 = GenerateReport1(df)
                        val file1 = "report1_regional_efficiency.csv"
                        OutputCSV(df1, file1)
                        val df2 = GenerateReport2(df)
                        val file2 = "report2_contractor_ranking.csv"
                        OutputCSV(df2.take(15), file2)
                        val df3 = GenerateReport3(df)
                        val file3 = "report3_cost_overrun_trends.csv"
                        OutputCSV(df3, file3)
                        val jsonSummary: String = "summary.json"
                        generateSummary(df, df1, df2, df3, jsonSummary)
                    }
                }
                3 -> continueProgram = false
                else -> {
                    println("Invalid choice. Please try again.")
                }
            }
        } while(continueProgram)
    } catch (e: NumberFormatException) {
        println("Invalid input. Terminating...")
    }

    println("END")
}