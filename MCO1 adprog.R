
#new environment (storage)
app_state <- new.env(parent = emptyenv())

#kinda like global vals but in environment so safe siya
app_state$acc_name <- 'N/A'
app_state$acc_balance <- 0.00
app_state$base_currency <- "PHP"

app_state$exchange_rate <- list(PHP = 1.00,
                                USD = 55.00,
                                JPY = 0.38,
                                GBP = 68.00,
                                EUR = 60.00,
                                CNY = 7.50)

#----------------------------------------------------------------------------------------------------------------

#helper Functions
#String Input
user_input <- function(answer){
  input <- trimws(readline(answer))
  return(input)
}

#num input
num_input <- function(answer){
  while(TRUE){
    input <- user_input(answer)
    if(!is.na(suppressWarnings(as.numeric(input))) & as.numeric(input) >= 0){
      return(as.numeric(input))
    }
    cat("Invalid input. Please enter a valid non-negative number.\n")
  }
}

#----------------------------------------------------------------------------------------------------------------

#Main menu functions
#[1] register account
reg_acc <- function(){
  back <- TRUE
  
  while(back){
     cat('Register Account Name\n')
     app_state$acc_name <- user_input('Account Name: ')
     back_main <- toupper(user_input('Back to the Main Menu (Y/N): '))
     
     if(back_main == 'Y'){
       back <- FALSE
       cat('Going Back To Main\n')
     }else if(back_main == 'N'){
       
     }
     else{
       cat('Invalid input!\n')
       back_main <- user_input('Back to the Main Menu (Y/N): ')
       back <- FALSE
     }
  }
}

#[2]Deposit Amount
dep_amount <- function(){
  back <- TRUE
  
  while(back){
    cat('Deposit Amount\n')
    cat(sprintf("Account Name: %s\n", app_state$acc_name))
    cat(sprintf("Current Balance: %.2f\n", app_state$acc_balance))
    
    currency <- toupper(user_input('Currency: '))
    
    dep_am <- num_input('Deposit Amount: ')
    if (dep_am <= 0) {
      cat("\nDeposit cancelled. Amount must be greater than zero.\n")
      return()
    }
    
    to_php <- app_state$exchange_rate[[currency]]
    amount <- dep_am * to_php
    
    app_state$acc_balance <- app_state$acc_balance + amount
    cat(sprintf("Updated Balance: %.2f\n", app_state$acc_balance))
    back_main <- toupper(user_input('Back to the Main Menu (Y/N): '))
    
    if(back_main == 'Y'){
      back <- FALSE
      cat('Going Back To Main\n')
    }else if(back_main == 'N'){
      
    }
    else{
      cat('Invalid input!\n')
      back_main <- user_input('Back to the Main Menu (Y/N): ')
      back <- FALSE
    }
  }
}

#----------------------------------------------------------------------------------------------------------------

#main
main <- function(){
  running <- TRUE
  while(running){
    cat(sprintf("Account Name: %s\n", app_state$acc_name))
    cat(sprintf("Current Balance: %.2f\n", app_state$acc_balance))
    cat('Select Transaction:\n')
    cat('[1] Register Account Name\n')
    cat('[2] Deposit Amount\n')
    cat('[3] Withdraw Amount\n')
    cat('[4] Currency Exchange\n')
    cat('[5] Recormad Exchange Rates\n')
    cat('[6] Show Interest Computation\n')
    
    answer <- user_input('Enter Choice: ')
    
    switch (answer,
      "1" = reg_acc(),
      "2" = dep_amount(),
      "3" = cat('you entered [3] Withdraw Amount\n'),
      "4" = cat('you entered [4] Currency Exchange\n'),
      "5" = cat('you entered [5] Recormad Exchange Rates\n'),
      "6" = cat('you entered [6] Show Interest Computation\n'),
      {
        cat("\nInvalid choice. Please enter a number from 1 to 6.\n")
        running <- FALSE
      }
    )
    
  }
}