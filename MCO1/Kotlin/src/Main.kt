import java.math.RoundingMode
/********************
*  Author: Saguin, VL Kirsten "Kei"
*  Language: Kotlin
*  Paradigm(s): Object-Oriented, Functional, Imperative
********************/

/**
 * Represents an Account object
 *
 * @param name the name of the account
 * @param balance the balance of the account with this name
 *
 */
class Account(val name: String, var balance: Double){ }

/**
 * Registers an account in this program
 *
 * @return an Account object or null
 */
fun registerAccount(): Account? {
    val choice: ()->Boolean = {
        print("\nBack to the Main Menu (Y/N): ")
        val choice = readln().uppercase()
        when(choice){
            "Y" -> false
            "N" -> true
            else -> {
                println("Invalid input. Leaving transaction.")
                false
            }
        }
    }
    var register: Boolean = true
    var acc: Account? = null
    do{
        println("Please input your name: ")
        val inputName: String? = readlnOrNull();
        if (inputName != null){
            acc = Account(inputName.toString(), 0.0)
            register = choice()
        }
    } while (register)
    return acc
}

/**
 * Displays a main menu, asking the user to select a transaction.
 * Any option outside of 1-7 shall result in null
 * @return a value from 1-7
 */
fun mainMenu(): Int? {
    print(
        "Select Transaction: \n" +
                "[1] Register Account Name \n" +
                "[2] Deposit Amount \n" +
                "[3] Withdraw Amount \n" +
                "[4] Currency Exchange \n" +
                "[5] Record Exchange Rates \n" +
                "[6] Show Interest Computation \n" +
                "[7] Leave the application \n"
    )
    //todo:try-catch the input
    val initial = readln().toIntOrNull() // try-catch for non-Int
    return if (initial in 1..7) {
        initial
    } else 7
}

/**
 * Deposits a value to the account's balance, updating the said balance.
 * Valid amounts are those above 0 (positive numbers).
 *
 * @param acc the account the amount will be deposited to
 */
fun depositToAccount(acc: Account?){
    val choice: ()->Boolean = {
        print("\nBack to the Main Menu (Y/N): ")
        val choice = readln().uppercase()
        when(choice){
            "Y" -> false
            "N" -> true
            else -> {
                println("Invalid input. Leaving transaction.")
                false
            }
        }
    }
    var deposit: Boolean = true
    val bal: Double? = (acc?.balance)
    do{
        // will only happen if not null
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

            if(amt==null || amt < 0.0)
                println("Invalid input")
            else {
                amt = bal?.plus(amt)
                if (amt != null) {
                    acc.balance = amt
                }
            }
            print("Updated Balance: ${acc.balance} \n\n")
        } ?: run { // if null, this will run
            println("No account indicated.")
        }
        deposit = choice()
    } while (deposit)
}

/**
 * Withdraws a value to the account's balance, updating the said balance.
 * Valid amounts are those above 0 (positive numbers) and values that are
 * greater than the balance are rendered invalid amounts.
 *
 * @param acc the account the amount will be deposited to
 */
fun withdrawFromAccount(acc: Account?){
    val choice: ()->Boolean = {
        print("\nBack to the Main Menu (Y/N): ")
        val choice = readln().uppercase()
        when(choice){
            "Y" -> false
            "N" -> true
            else -> {
                println("Invalid input. Leaving transaction.")
                false
            }
        }
    }
    var withdraw: Boolean = true
    val bal: Double? = acc?.balance
    do {
        // happens when not null
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

            if(amt==null || acc.balance < amt || amt < 0.0)
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
        withdraw = choice()
    } while(withdraw)
}

/**
 * Computes the daily interest based on the amount given.
 * For this program, the annual interest is 5% or 0.05
 *
 * @param currAmt the principal amount that will gain interset
 *
 * @return the daily interest gained
 */
fun computeDailyInterest(currAmt: Double): Double {
    var dailyRate: Double = 0.05 / 365;
    return currAmt * dailyRate
}

/**
 * Displays the interest based on an accounts balance.
 * The interest is shown per day and the number of days to be displayed
 * is up to the user
 *
 * @param acc the account where the balance will gain interest
 */
fun dispInterest(acc: Account?) {
    val choice: ()->Boolean = {
        print("\nBack to the Main Menu (Y/N): ")
        val choice = readln().uppercase()
        when(choice){
            "Y" -> false
            "N" -> true
            else -> {
                println("Invalid input. Leaving transaction.")
                false
            }
        }
    }
    var compute: Boolean = true
    do{
        acc?.let { account ->
            print("Show Interest Amount \n" +
                    "Account Name: ${acc.name} \n" +
                    "Current Balance: ${acc.balance} \n" +
                    "Currency: PHP \n" +
                    "Interest Rate: 5% \n" +
                    "Total Number of Days: ")
            val days = readln().toIntOrNull()
            days.let {
                val interestDouble: Double = computeDailyInterest(acc.balance)
                var interest = interestDouble.toBigDecimal()
                var bal = acc.balance.toBigDecimal()
                println("Day\t\t\t| Interest\t| Balance |")
                for (i in 1..(days ?: 30)) {
                    interest = interest.setScale(2, RoundingMode.HALF_UP)
                    bal += interest
                    println("$i\t\t\t| ${interest}  \t| ${bal} |")
                }
            }
        } ?: run {
            println("No account indicated.")
        }
        compute = choice()
    } while (compute)
}

/**
 * Records the exchange rate for foreign currencies into a map.
 * The currencies to be recorded are PHP, USD, JPY, GBP, EUR, and CNY
 */
fun recordExchangeRate(rates: MutableMap<Int, Double>) {
    val choice: ()->Boolean = {
        print("\nBack to the Main Menu (Y/N): ")
        val choice = readln().uppercase()
        when(choice){
            "Y" -> false
            "N" -> true
            else -> {
                println("Invalid input. Leaving transaction.")
                false
            }
        }
    }
    var record: Boolean = true
    // select currency to add rate
    do {
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
        var choice = readln().toIntOrNull()
        print("Exchange Rate: ")
        var recordedRate: Double? = readln().toDoubleOrNull()
        if (choice !in 1..6 || (recordedRate == null || recordedRate < 0.0)) { // or, not and
            println("Please recheck your inputs.")
            record = choice()
            continue
        }
        when (choice) {
            1 -> recordedRate.let { rates.put(1, it) }
            2 -> recordedRate.let { rates.put(2, it) }
            3 -> recordedRate.let { rates.put(3, it) }
            4 -> recordedRate.let { rates.put(4, it) }
            5 -> recordedRate.let { rates.put(5, it) }
            6 -> recordedRate.let { rates.put(6, it) }
        }
        record = choice()
    } while(record)
}

/**
 * Displays a list of options and returns the source currency option.
 * A helper function for exchangeCurrencies()
 *
 * @return the selected currency option or null if not an integer
 */
fun getSourceCurrency(): Int?{
    print("Source Currency Option: \n" +
            "[1] Philippine Peso (PHP) \n" +
            "[2] United States Dollar (USD) \n" +
            "[3] Japanese Yen (JPY) \n" +
            "[4] British Pound Sterling (GBP) \n" +
            "[5] Euro (EUR) \n" +
            "[6] Chinese Yuan Renminni (CNY) \n" +
            " \n" +
            "Source Currency: ")
    var srcChoice = readln().toIntOrNull()
    return srcChoice
}

/**
 * Displays a list of options and returns the goal currency option.
 * A helper function for exchangeCurrencies()
 *
 * @return the selected currency option or null if not an integer
 */
fun getGoalCurrency(): Int?{
    print("Exchanged Currency Option: \n" +
            "[1] Philippine Peso (PHP) \n" +
            "[2] United States Dollar (USD) \n" +
            "[3] Japanese Yen (JPY) \n" +
            "[4] British Pound Sterling (GBP) \n" +
            "[5] Euro (EUR) \n" +
            "[6] Chinese Yuan Renminni (CNY) \n" +
            " \n" +
            "Goal Currency: ") //exchange currency
    var goalChoice = readln().toIntOrNull()
    return goalChoice
}

/**
 * Exchanges the currency of the inputted amount and prints the converted value.
 * The value is converted based on the rates from the map provided.
 *
 * @param rates the MutableMap containing the rates for each currency when
 * being converted from PHP
 */
fun exchangeCurrency(rates: MutableMap<Int, Double>){
    var exchange: ()->Boolean = {
        print("\nConvert another currency (Y/N)? . . . ")
        val choice = readln().uppercase()
        when(choice){
            "Y" -> true
            "N" -> false
            else -> {
                println("Invalid input. Leaving transaction.")
                false
            }
        }
    }
    var stillContinue: Boolean = true
    do {
        print("Foreign Currency Exchange\n")
        val srcChoice = getSourceCurrency()
        if(srcChoice !in 1..6) {
            println("Invalid currency selected")
            stillContinue = exchange()
            continue
        }

        print("Source Amount: ")
        val srcAmt = readln().toDoubleOrNull()
        if (srcAmt == null || srcAmt < 0.0){
            println("Invalid amount provided.")
            stillContinue = exchange()
            continue
        }
        var converted: Double = 0.0

        print("\n")

        val goalChoice = getGoalCurrency()
        if(goalChoice !in 1..6) {
            println("Invalid currency selected")
            stillContinue = exchange()
            continue
        }

        if (srcChoice==goalChoice){
            println("Cannot select the same currency for exchange.")
            stillContinue = exchange()
            continue
        }

        if(goalChoice==1){
                //to PHP
                converted = srcAmt * (rates[srcChoice] ?: 0.0)
                println("Exchange Amount: $converted")
        } else if (srcChoice==1) {
            //from PHP
            val rate: Double = rates[goalChoice] ?: 0.0
            converted = if(rate != 0.0){
                srcAmt.div(rate)
            } else {
                0.0
            }
            println("Exchange Amount: $converted")
        } else {
            // to php
            var toPhp = srcAmt * (rates[srcChoice] ?: 0.0)
            //from php
            val rateGoal = rates[goalChoice] ?:0.0
            converted = if(rateGoal!=0.0){
                toPhp.div(rateGoal)
            }
            else {
                0.0
            }

            println("Exchange Amount: $converted")
        }
        if(converted == 0.0){
            println("\n***The rates may not have been set or the amount provided is 0.0.")
        }
        stillContinue = exchange()
    } while (stillContinue)
}

fun main() {
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
            }
            2 -> {
                depositToAccount(acc)
            }
            3 -> {
                withdrawFromAccount(acc)
            }
            4 -> {
                exchangeCurrency(ratesMap)
            }
            5 -> {
                recordExchangeRate(ratesMap)
            }
            6 -> {
                dispInterest(acc)
            }
            7 -> leaveProgram = false
        }
    }
    while(leaveProgram)

    println("Thank you using this program!")
}
