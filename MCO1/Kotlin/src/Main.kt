import java.math.RoundingMode
import java.text.DecimalFormat

class Account(val name: String, var balance: Double){ }

fun registerAccount(): Account{
    println("Please input your name: ")
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
fun main() {
//    println("Hello World")
    var acc: Account? = null
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
            6 -> dispInterest(acc)
        }

    }
    while(choice!=7)

}
