fun mainMenu(): Int {
    print("Select Transaction: \n" +
            "[1] Register Account Name \n" +
            "[2] Deposit Amount \n" +
            "[3] Withdraw Amount \n" +
            "[4] Currency Exchange \n" +
            "[5] Record Exchange Rates \n" +
            "[6] Show Interest Computation \n" +
            "[7] Leave \n")
    return readln().toInt()
}
fun main() {
//    println("Hello World")
    var choice = mainMenu()

}