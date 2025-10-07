import java.math.RoundingMode
import java.text.DecimalFormat

class Account(val name: String, var balance: Double){ }

fun registerAccount(): Account? {
    println("Please input your name: ")
    val inputName: String? = readlnOrNull();
    if (inputName != null){
        val acc = Account(inputName.toString(), 0.0)
        return acc
    }
    return null
}
fun returnToMain(): Boolean {
    print("\nBack to the Main Menu (Y/N): ")
    val choice = readln().uppercase()
    if(choice=="Y") {
        return true
    } else if (choice=="N") {
        return false
    } else {
        println("Invalid input. Leaving program.")
        return false
    }
}
fun mainMenu(): Int? {
    print(
        "Select Transaction: \n" +
                "[1] Register Account Name \n" +
                "[2] Deposit Amount \n" +
                "[3] Withdraw Amount \n" +
                "[4] Currency Exchange \n" +
                "[5] Record Exchange Rates \n" +
                "[6] Show Interest Computation \n"
    )
    //todo:try-catch the input
    val initial = readln()?.toIntOrNull() // try-catch for non-Int
    return if (initial in 1..7) {
        initial
    } else 7
}
fun depositToAccount(acc: Account?){
    val bal: Double? = (acc?.balance)
    acc?.let { account ->
        print(
            "Deposit Amount \n" +
            "Account Name: ${acc.name} \n" +
            "Current Balance: ${acc.balance} \n" +
            "Currency: PHP \n" +
            " \n" +
            "Deposit Amount: "
        )
        var amt = readln().toDoubleOrNull()

        if(amt==null)
            println("Invalid input")
        else {
            amt = bal?.plus(amt)
            if (amt != null) {
                acc.balance = amt
            }
        }
        print("Updated Balance: ${acc.balance} \n\n")
    } ?: run {
        println("No account indicated.")
    }
}

fun withdrawFromAccount(acc: Account?){
    val bal: Double? = acc?.balance
    acc?.let { account ->
        print(
            "Withdraw Amount \n" +
            "Account Name: ${acc.name} \n" +
            "Current Balance: ${acc.balance} \n" +
            "Currency: PHP \n" +
            " \n" +
            "Withdraw Amount: "
        )
        var amt = readln().toDoubleOrNull()

        if(amt==null)
            println("Invalid input")
        else {
            amt = bal?.minus(amt)
            if (amt != null) {
                acc.balance = amt
            }
        }
        print("Updated Balance: ${acc.balance} \n\n")
    } ?: run {
        println("No account indicated.")
    }
}

fun computeDailyInterest(currAmt: Double): Double {
    var dailyRate = 0.05 / 365;
    return currAmt * dailyRate
}

fun dispInterest(acc: Account?) {
    acc?.let { account ->
        print("Show Interest Amount \n" +
                "Account Name: ${acc.name} \n" +
                "Current Balance: ${acc.balance} \n" +
                "Currency: PHP \n" +
                "Interest Rate: 5% \n" +
                "Total Number of Days: ")
        var days = readln().toIntOrNull()
        days.let{
            var interest = computeDailyInterest(acc.balance)
            var bal = acc.balance
            val df = DecimalFormat("#.##")
            df.roundingMode = RoundingMode.CEILING
            println("Day  \t| Interest \t| Balance |")
            for (i in 1..(days?.toInt() ?: 30)) {
                bal += interest
                println("$i  \t\t| ${df.format(interest)}  \t| ${df.format(bal)} |")
            }
        }
    } ?: run { println("No account indicated.")}
}
fun recordExchangeRate(rates: MutableMap<Int, Double>) {
    // select currency to add rate
    print(
        "Record Exchange Rate \n" +
                " \n" +
                "[1] Philippine Peso (PHP) \n" +
                "[2] United States Dollar (USD) \n" +
                "[3] Japanese Yen (JPY) \n" +
                "[4] British Pound Sterling (GBP) \n" +
                "[5] Euro (EUR) \n" +
                "[6] Chinese Yuan Renminni (CNY) \n" +
                " \n" +
                "Select Foreign Currency: "
    )
    var choice = readln().toInt()
    print("Exchange Rate: ")
    var recordedRate: Double? = readln().toDoubleOrNull()
    if (choice !in 1..6 && recordedRate == null) { // or, not and
        println("Please recheck your inputs.")
        return
    }
    when (choice) {
        1 -> recordedRate?.let { rates.put(1, it) } //run block to show invalid exchange rate
        2 -> recordedRate?.let { rates.put(2, it) }
        3 -> recordedRate?.let { rates.put(3, it) }
        4 -> recordedRate?.let { rates.put(4, it) }
        5 -> recordedRate?.let { rates.put(5, it) }
        6 -> recordedRate?.let { rates.put(6, it) }
    }
}

fun getSourceCurrency(): Int{
    print("Source Currency Option: \n" +
            "[1] Philippine Peso (PHP) \n" +
            "[2] United States Dollar (USD) \n" +
            "[3] Japanese Yen (JPY) \n" +
            "[4] British Pound Sterling (GBP) \n" +
            "[5] Euro (EUR) \n" +
            "[6] Chinese Yuan Renminni (CNY) \n" +
            " \n" +
            "Source Currency: ")
    var srcChoice = readln().toInt()
    return srcChoice
}
fun getGoalCurrency(): Int{
    print("Exchanged Currency Option: \n" +
            "[1] Philippine Peso (PHP) \n" +
            "[2] United States Dollar (USD) \n" +
            "[3] Japanese Yen (JPY) \n" +
            "[4] British Pound Sterling (GBP) \n" +
            "[5] Euro (EUR) \n" +
            "[6] Chinese Yuan Renminni (CNY) \n" +
            " \n" +
            "Source Currency: ") //exchange currency
    var goalChoice = readln().toInt()
    return goalChoice
}
fun exchangeCurrency(rates: MutableMap<Int, Double>){
    print("Foreign Currency Exchange")
    var srcChoice = getSourceCurrency()
    print("Source Amount: ")
    var srcAmt = readln().toDouble()
    var converted: Double = 0.0
    print("\n")
    var goalChoice = getGoalCurrency()

    if(srcChoice !in 1..6 && goalChoice !in 1..6) {
        println("Invalid currencies selected.")
    } else if (srcChoice==goalChoice){
        println("Cannot select the same currency for exchange.")
    } else if(goalChoice==1){
        //to PHP
        converted = srcAmt * (rates[srcChoice] ?: 0.0)
        println("Exchange Amount: $converted")
    } else if (srcChoice==1) {
        //from PHP
        converted = srcAmt / (rates[goalChoice] ?: 0.0)
        println("Exchange Amount: $converted")
    } else {
        var toPhp = srcAmt * (rates[srcChoice] ?: 0.0)
        converted = toPhp / (rates[goalChoice] ?: 0.0)
        println("Exchange Amount: $converted")
    }
}
fun main() {
//    println("Hello World")
    var acc: Account? = null
    var leaveProgram: Boolean = true
    var ratesMap = mutableMapOf<Int, Double>()
    do{
        var choice = mainMenu()
        when(choice){
            1 -> {
                if(acc == null)
                    acc = registerAccount()
                else println("An account has already been logged in: ${acc.name}. Cannot register a new one.")
                leaveProgram = returnToMain()
            }
            2 -> {
                depositToAccount(acc)
                leaveProgram = returnToMain()
            }
            3 -> {
                withdrawFromAccount(acc)
                leaveProgram = returnToMain()
            }
            4 -> {
                exchangeCurrency(ratesMap)
                leaveProgram = returnToMain()
            }
            5 -> {
                recordExchangeRate(ratesMap)
                leaveProgram = returnToMain()
            }
            6 -> {
                dispInterest(acc)
                leaveProgram = returnToMain()
            }
        }
    }
    while(leaveProgram)
}
