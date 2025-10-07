import java.math.RoundingMode
import java.text.DecimalFormat

class Account(val name: String, var balance: Double){ }

fun registerAccount(): Account{
    println("Please input your name: ")
    //todo:try-catch the input
    val inputName: String = readln();
    val acc = Account(inputName.toString(), 0.0)
    return acc
}

fun mainMenu(): Int {
    print(
        "Select Transaction: \n" +
                "[1] Register Account Name \n" +
                "[2] Deposit Amount \n" +
                "[3] Withdraw Amount \n" +
                "[4] Currency Exchange \n" +
                "[5] Record Exchange Rates \n" +
                "[6] Show Interest Computation \n" +
                "[7] Leave \n"
    )
    //todo:try-catch the input
    val initial = readln().toInt() // try-catch for non-Int
    return if (initial in 1..7) {
        initial
    } else 7
}
fun depositToAccount(acc: Account?){
    acc?.let { account ->
        print(
            "Deposit Amount \n" +
            "Account Name: ${acc.name} \n" +
            "Current Balance: ${acc.balance} \n" +
            "Currency: PHP \n" +
            " \n" +
            "Deposit Amount: "
        )
        //todo:try-catch the input
        var amt = readln().toDouble()

        acc.balance += amt

        print("Updated Balance: ${acc.balance} \n\n")
    } ?: run {
        println("No account indicated.")
    }
}

fun withdrawFromAccount(acc: Account?){
    acc?.let { account ->
        print(
            "Withdraw Amount \n" +
            "Account Name: ${acc.name} \n" +
            "Current Balance: ${acc.balance} \n" +
            "Currency: PHP \n" +
            " \n" +
            "Withdraw Amount: "
        )
        //todo:try-catch the input
        var amt = readln().toDouble()

        acc.balance -= amt

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
        //todo:try-catch the input
        var days = readln().toInt()
        var interest = computeDailyInterest(acc.balance)
        var bal = acc.balance
        val df = DecimalFormat("#.##")
        df.roundingMode = RoundingMode.CEILING
        println("Day  \t| Interest \t| Balance |")
        for (i in 1..days){
            bal += interest
            println("$i  \t\t| ${df.format(interest)}  \t| ${df.format(bal)} |")
        }
    } ?: run { println("No account indicated.")}


}
fun recordExchangeRate(rates: MutableMap<String, Double>){
    // select currency to add rate
    print("Record Exchange Rate \n" +
            " \n" +
            "[1] Philippine Peso (PHP) \n" +
            "[2] United States Dollar (USD) \n" +
            "[3] Japanese Yen (JPY) \n" +
            "[4] British Pound Sterling (GBP) \n" +
            "[5] Euro (EUR) \n" +
            "[6] Chinese Yuan Renminni (CNY) \n" +
            " \n" +
            "Select Foreign Currency: ")
    //todo:try-catch the input/s
    var choice = readln().toInt()
    print("Exchange Rate: ")
    var recordedRate = readln().toDouble()
    when(choice){
        1 -> rates.put("1", recordedRate)
        2 -> rates.put("2", recordedRate)
        3 -> rates.put("3", recordedRate)
        4 -> rates.put("4", recordedRate)
        5 -> rates.put("5", recordedRate)
        6 -> rates.put("6", recordedRate)
    }
}
fun main() {
//    println("Hello World")
    var acc: Account? = null
    var ratesMap = mutableMapOf<String, Double>()
    do{
        var choice = mainMenu()
        when(choice){
            1 -> {
                if(acc == null)
                    acc = registerAccount()
                else println("An account has already been logged in: ${acc.name}. Cannot register a new one.")
            }
            2 -> {
                depositToAccount(acc)
            }
            3 -> withdrawFromAccount(acc)
            5 -> recordExchangeRate(ratesMap)
            6 -> dispInterest(acc)
        }

    }
    while(choice!=7)

}
