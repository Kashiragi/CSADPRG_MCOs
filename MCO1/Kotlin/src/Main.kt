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
    val initial = readln().toInt()
    return if (initial in 1..7) {
        initial
    } else 7
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
                else println("An account has already been logged in: ${acc.accName}. Cannot register a new one.")
            }
//            2 -> {
//                var depAmt = getDepositValue()
//                acc?.deposit(depAmt) ?: println("Transaction Failed: Cannot deposit $depAmt")
//            }
        }

    }
    while(choice!=7)

}
