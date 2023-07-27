function clickEvent(first,last){
  if(first.value.length){
    document.getElementById(last).focus();
  }
}
// ***************************
        const form = document.querySelector("form");
          const username = document.querySelector("input[type=text]");
          const email = document.querySelector("input[type=email]");
          const password = document.querySelector("input[type=password]");
          
          form.addEventListener("submit", onsubmitfunction)
          
          function onsubmitfunction(event){
             if(username.value==="") {
              event.preventDefault()
              alert("Please Enter the Username");
              return false;
            }else if(password.value===""){
              event.preventDefault()
              alert("Please Enter the Password");
              return false;
            }
          }
          



        
          

