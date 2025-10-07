
#new environment (storage)
app_state <- new.env(parent = emptyenv())

#kinda like global vals but in environment so safe siya
app_state$acc_name <- 'N/A'
app_state$acc_balance <- 0.00
app_state$base_currency <- "PHP"

app_state$annual_interest_rate <- 0.05
app_state$daily_interest_rate <- app_state$annual_interest_rate / 365

app_state$exchange_rate <- list(PHP = 1.00,
                                USD = 55.00, #NA_integer_
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
  
  exchange_present <- FALSE
  exchange <- app_state$exchange_rate
  currency_codes <- names(exchange)
  
  for(code in currency_codes){
    if(is.na(exchange[[code]])){
      exchange_present <- TRUE
      break
    }
  }
  
  
  if(app_state$acc_name == 'N/A'){
    cat('Register an account first!\n\n')
    return()
  }
  else if(exchange_present){
    cat('Set Up Exchange rates first!\n\n')
    return()
  }
  else{
    back <- TRUE
    main
    while(back){
      cat('Deposit Amount\n')
      cat(sprintf("Account Name: %s\n", app_state$acc_name))
      cat(sprintf("Current Balance: %.2f\n", app_state$acc_balance))
      
      currency <- toupper(user_input('Currency: '))
      cat('\n')
      codes <- names(app_state$exchange_rate)
      currency_exists <- FALSE
      for(i in 1:length(codes)){
        if(currency == codes[i]){
          currency_exists <- TRUE
        } 
      }
      
      if(currency_exists){
        dep_am <- num_input('Deposit Amount: ')
        if (dep_am <= 0) {
          cat("\nDeposit cancelled. Amount must be greater than zero.\n")
          return()
        }
        
        to_php <- app_state$exchange_rate[[currency]]
        amount <- dep_am * to_php
        cat(sprintf("Depositing %.2f PHP\n", amount))
        app_state$acc_balance <- app_state$acc_balance + amount
        cat(sprintf("Updated Balance: %.2f\n", app_state$acc_balance))
        back_main <- toupper(user_input('Back to the Main Menu (Y/N): '))
        
        if(back_main == 'Y'){
          back <- FALSE
          cat('Going Back To Main\n')
        }else if(back_main == 'N'){
          
        }
        else{
          cat('Invalid input!\n\n')
          back_main <- user_input('Back to the Main Menu (Y/N): ')
          back <- FALSE
        }
      }
      else{
        cat('Invalid input, type the proper curency options\n')
        cat('PHP, USD, JPY, GBP, EUR, CYN\n\n')
      }
    }
  }
}

#[3] Withdraw Amount
with_amount <- function(){
  
  exchange_present <- FALSE
  exchange <- app_state$exchange_rate
  currency_codes <- names(exchange)
  
  for(code in currency_codes){
    if(is.na(exchange[[code]])){
      exchange_present <- TRUE
      break
    }
  }
  
  if(app_state$acc_name == 'N/A'){
    cat('Register an account first!\n\n')
    return()
  }else if(exchange_present){
    cat('Set Up Exchange rates first!\n\n')
    return()
  }
  else{
    back <- TRUE
    main
    while(back){
      cat('Withdraw Amount\n')
      cat(sprintf("Account Name: %s\n", app_state$acc_name))
      cat(sprintf("Current Balance: %.2f\n", app_state$acc_balance))
      
      currency <- toupper(user_input('Currency: '))
      cat('\n')
      codes <- names(app_state$exchange_rate)
      currency_exists <- FALSE
      for(i in 1:length(codes)){
        if(currency == codes[i]){
          currency_exists <- TRUE
        } 
      }
      
      if(currency_exists){
        with_am <- num_input('Widthdraw Amount: ')
        if (with_am  > app_state$acc_balance) {
          cat("\nWithdraw cancelled. You do not have enough balance in your account.\n")
          return()
        }
        
        to_php <- app_state$exchange_rate[[currency]]
        amount <- with_am * to_php
        cat(sprintf("Withdrawing %.2f PHP\n", amount))
        app_state$acc_balance <- app_state$acc_balance - amount
        cat(sprintf("Updated Balance: %.2f\n", app_state$acc_balance))
        back_main <- toupper(user_input('Back to the Main Menu (Y/N): '))
        
        if(back_main == 'Y'){
          back <- FALSE
          cat('Going Back To Main\n')
        }else if(back_main == 'N'){
          
        }
        else{
          cat('Invalid input!\n\n')
          back_main <- user_input('Back to the Main Menu (Y/N): ')
          back <- FALSE
        }
      }
      else{
        cat('Invalid input, type the proper curency options\n')
        cat('PHP, USD, JPY, GBP, EUR, CYN\n\n')
      }
    }
  }
}


#[4]Currency Exchange
curr_ex <- function(){
  check_menu <- TRUE
  exchange <- app_state$exchange_rate
  currency_codes <- names(exchange)
  count <- 0
  while(check_menu){
      cat('Foreign Currency Exchange\n')
      cat('Source Currency Option:\n')
      for(code in currency_codes){
        count <- count + 1
        
        switch(code,
               "PHP" = cat(sprintf("[%d] Philippine Peso (%s)\n", count, code)),
               "USD" = cat(sprintf("[%d] United States Dollar (%s)\n", count, code)),
               "JPY" = cat(sprintf("[%d] Japanese Yen  (%s)\n", count, code)),
               "GBP" = cat(sprintf("[%d] British Pound Sterling (%s)\n", count, code)),
               "EUR" = cat(sprintf("[%d] Euro (%s)\n", count, code)),
               "CNY" = cat(sprintf("[%d] Chinese Yuan Renminni (%s)\n", count, code)),
               {
                 cat("Invalid choice.\n\n")
                 return()
               }
               )
        
      }
      
      source_curr <- user_input("Source Currency: ")
      switch(source_curr,
             "1" = cat("Philippine Peso\n"),
             "2" = cat("United States Dollar\n"),
             "3" = cat("Japanese Yen \n"),
             "4" = cat("British Pound Sterling\n"),
             "5" = cat("Euro \n"),
             "6" = cat("Chinese Yuan Renminni \n"),
             {
               cat("Invalid choice.\n\n")
               return()
             }
      )
      
      switch(source_curr,
             "1" = rate <- app_state$exchange_rate[["PHP"]],
             "2" = rate <- app_state$exchange_rate[["USD"]],
             "3" = rate <- app_state$exchange_rate[["JPY"]],
             "4" = rate <- app_state$exchange_rate[["GBP"]],
             "5" = rate <- app_state$exchange_rate[["EUR"]],
             "6" = rate <- app_state$exchange_rate[["CNY"]],
             {
               cat("Invalid choice.\n\n")
               return()
             }
      )
      
      source_am <- num_input("Source Amount: ")
      
      count <- 0
      cat('\n\nExchanged Currency Options:\n')
      for(code in currency_codes){
        count <- count + 1
        
        switch(code,
               "PHP" = cat(sprintf("[%d] Philippine Peso (%s)\n", count, code)),
               "USD" = cat(sprintf("[%d] United States Dollar (%s)\n", count, code)),
               "JPY" = cat(sprintf("[%d] Japanese Yen  (%s)\n", count, code)),
               "GBP" = cat(sprintf("[%d] British Pound Sterling (%s)\n", count, code)),
               "EUR" = cat(sprintf("[%d] Euro (%s)\n", count, code)),
               "CNY" = cat(sprintf("[%d] Chinese Yuan Renminni (%s)\n", count, code)),
               {
                 cat("Invalid choice.\n\n")
                 return()
               }
        )
        
      }
      
      exch_curr <- user_input("Exchange Currency: ")
      switch(exch_curr,
             "1" = cat("Philippine Peso\n"),
             "2" = cat("United States Dollar\n"),
             "3" = cat("Japanese Yen \n"),
             "4" = cat("British Pound Sterling\n"),
             "5" = cat("Euro \n"),
             "6" = cat("Chinese Yuan Renminni \n"),
             {
               cat("Invalid choice.\n\n")
               return()
             }
      )
      
      switch(exch_curr,
             "1" = exch <- app_state$exchange_rate[["PHP"]],
             "2" = exch <- app_state$exchange_rate[["USD"]],
             "3" = exch <- app_state$exchange_rate[["JPY"]],
             "4" = exch <- app_state$exchange_rate[["GBP"]],
             "5" = exch <- app_state$exchange_rate[["EUR"]],
             "6" = exch <- app_state$exchange_rate[["CNY"]],
             {
               cat("Invalid choice.\n\n")
               return()
             }
      )
      
      total <- source_am * (rate / exch)
      cat(sprintf("Exchange Amount: %.2f\n\n", total))
      
      total <- 0
      count <- 0
      
      back_main <- toupper(user_input("Convert another currency (Y/N)? "))
      if(back_main == 'Y'){
       
      }else if(back_main == 'N'){
        check_menu <- FALSE
        cat('Going Back To Main\n')
      }
      else{
        cat('Invalid input!\n\n')
        back_main <- user_input('Back to the Main Menu (Y/N): ')
        check_menu <- FALSE
      }
  }
}

#[5] Recormad Exchange Rates
rec_ex_rate <- function(){
  check_menu <- TRUE
  exchange <- app_state$exchange_rate
  currency_codes <- names(exchange)
  count <- 0
  
  while(check_menu){
  cat('Record Exchange Rate\n')
  
  for(code in currency_codes){
    count <- count + 1
    
    switch(code,
           "PHP" = cat(sprintf("[%d] Philippine Peso (%s)\n", count, code)),
           "USD" = cat(sprintf("[%d] United States Dollar (%s)\n", count, code)),
           "JPY" = cat(sprintf("[%d] Japanese Yen  (%s)\n", count, code)),
           "GBP" = cat(sprintf("[%d] British Pound Sterling (%s)\n", count, code)),
           "EUR" = cat(sprintf("[%d] Euro (%s)\n", count, code)),
           "CNY" = cat(sprintf("[%d] Chinese Yuan Renminni (%s)\n", count, code)),
           {
             cat("Invalid choice.\n\n")
             return()
           }
    )
    
  }
  
     selected_curr <- user_input("Select Foreign Currency: ")

     cat("\n")
     exch_rate <- num_input("Exchange Rate: ")
     
     switch(selected_curr,
            "1" = app_state$exchange_rate[["PHP"]] <- exch_rate,
            "2" = app_state$exchange_rate[["USD"]] <- exch_rate,
            "3" = app_state$exchange_rate[["JPY"]] <- exch_rate,
            "4" = app_state$exchange_rate[["GBP"]] <- exch_rate,
            "5" = app_state$exchange_rate[["EUR"]] <- exch_rate,
            "6" = app_state$exchange_rate[["CNY"]] <- exch_rate,
            {
              cat("Invalid choice.\n\n")
              return()
            }
     )
     
     count <- 0
     back_main <- toupper(user_input("Back to the Main Menu (Y/N) "))
     if(back_main == 'Y'){
       check_menu <- FALSE
       cat('Going Back To Main\n')
     }else if(back_main == 'N'){
       
     }
     else{
       cat('Invalid input!\n\n')
       back_main <- user_input('Back to the Main Menu (Y/N): ')
       check_menu <- FALSE
     }
  }
 
  
  
}


#[6] Show Interest Computation
show_interest_computation <- function() {
  check_menu <- TRUE
  if (app_state$acc_name == "N/A") {
    cat("Please register an account name first!\n")
    return()
  }
  
  while(check_menu){
    cat("\n--- Show Interest Computation ---\n")
    cat(sprintf("Account Name: %s\n", app_state$acc_name))
    cat(sprintf("Current Balance: PHP %.2f\n", app_state$balance))
    cat("Currency: PHP \n") 
    cat("Interest Rate: 5% \n")
    
    total_days <- as.integer(get_numeric_input("Total Number of Days: "))
    if (total_days <= 0) {
      cat("Invalid number of days. Operation cancelled.\n")
      return()
    }
    
    # Initialize
    curr_balance <- app_state$acc_balance
    daily_rate <- app_state$daily_interest_rate
    
    cat(sprintf("%-5s | %-10s | %-12s\n", "Day", "Interest", "Balance (PHP)"))
    cat("-----------------------------------\n")
    
    for (i in 1:5){
      daily_interest <- curr_balance * daily_rate
      daily_interest_rounded <- round(daily_interest, 2)
      curr_balance <- curr_balance + daily_interest_rounded
      cat(sprintf("%-5d | %-10.2f | %-12.2f\n", i, daily_interest, curr_balance))
    }
    
    back_main <- toupper(user_input("Back to the Main Menu (Y/N) "))
    if(back_main == 'Y'){
      check_menu <- FALSE
      cat('Going Back To Main\n')
    }else if(back_main == 'N'){
      
    }
    else{
      cat('Invalid input!\n\n')
      back_main <- user_input('Back to the Main Menu (Y/N): ')
      check_menu <- FALSE
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
            "3" = with_amount(),
            "4" = curr_ex(),
            "5" = rec_ex_rate(),
            "6" = show_interest_computation(),
            {
              cat("\nInvalid choice. Please enter a number from 1 to 6.\n")
              running <- FALSE
            }
    )
    
  }
}

