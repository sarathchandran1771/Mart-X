document.addEventListener('DOMContentLoaded', () => {
    const minusBtns = document.querySelectorAll('.btn-minus');
    const plusBtns = document.querySelectorAll('.btn-plus');
  
    minusBtns.forEach(minusBtn => {
      minusBtn.addEventListener('click', () => {
        const input = minusBtn.parentNode.parentNode.querySelector('.cart-quantity');
        updateQuantity(input, 0); // Decrease quantity by 1
      });
    });
  
    plusBtns.forEach(plusBtn => {
      plusBtn.addEventListener('click', () => {
        const input = plusBtn.parentNode.parentNode.querySelector('.cart-quantity');
        updateQuantity(input, 0); // Increase quantity by 1
      });
    });

    function updateQuantity(input, change) {
      const quantity = parseInt(input.value) + change;
      const price = parseFloat(input.getAttribute('data-price'));
      const totalCell = input.parentNode.parentNode.nextElementSibling;
      const totalPrice = quantity * price;
  
      input.value = quantity;
      totalCell.innerHTML = `$<span id="total-price">${totalPrice}</span>`;
  
      const cartItemId = input.getAttribute('data-cart-item-id');
      console.log("Error cartItemId", cartItemId);

      // Send the updated quantity and total price to the server
      fetch('/updateCartItem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItemId: cartItemId,
          quantity: quantity,
          totalPrice: totalPrice,
        }),
      })
        .then(response => response.json())
        .then(data => {
          console.log("Successfully updated quantity and total price");
        })
        .catch(error => {
          console.log("Error updating quantity and total price", error);
        });
    }
  });
    //old one****************
    document.addEventListener("DOMContentLoaded", function() {
      const successAlert = document.getElementById("successAlert");
      const dangerAlert = document.getElementById("dangerAlert");
    
      // Check if the URL contains a success message (e.g., "?success=true")
      const urlParams = new URLSearchParams(window.location.search);
      const successParam = urlParams.get("success");
      const dangerParam = urlParams.get("danger");
      const deletedSuccessParam = urlParams.get("deletedSuccess"); // Get the "deletedSuccess" query parameter
    
      // If the URL contains a success message and it's set to "true", show the success alert
      if (successParam === "true") {
        successAlert.style.display = "block";
        setTimeout(function() {
          successAlert.style.display = "none";
        }, 3000); // Show the alert for 3 seconds (adjust as needed)
      }
    
      // If the URL contains a danger message and it's set to "true", show the danger alert
      if (dangerParam === "true") {
        dangerAlert.style.display = "block";
        setTimeout(function() {
          dangerAlert.style.display = "none";
        }, 3000); // Show the alert for 3 seconds (adjust as needed)
      }
    
      // If the URL contains "deletedSuccess" and it's set to "true", show the danger alert for deleted cart item
      if (deletedSuccessParam === "true") {
        dangerAlert.style.display = "block";
        setTimeout(function() {
          dangerAlert.style.display = "none";
        }, 3000); // Show the alert for 3 seconds (adjust as needed)
      }
    });
    

    // /********************************* *