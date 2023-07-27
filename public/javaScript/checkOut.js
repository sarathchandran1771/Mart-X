      // Get the selected address and submit the form
      var shippingAddressForm = document.getElementById('shippingAddressForm');
      var radioButtons = document.getElementsByName('selectedAddress');
    
      shippingAddressForm.addEventListener('submit', function(event) {
        event.preventDefault();
        var selectedAddressId = null;
        radioButtons.forEach(function(radioButton) {
          if (radioButton.checked) {
            selectedAddressId = radioButton.value;
          }
        });
    
        if (selectedAddressId) {
          postShippingAddress(selectedAddressId);
        }
      });
      if (radioButtons.length === 1) {
        radioButtons[0].checked = true;
      }
      function postShippingAddress(addressId) {
        fetch('/saveShippingAddress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ addressId: addressId })
        })
        .then(function(response) {
          if (response.ok) {
            window.location.href = '/checkout';
          } else {
            console.error('An error occurred');
          }
        })
        .catch(function(error) {
          console.error(error);
        });
      }

// ------------------------------------

const shiptoCheckbox = document.getElementById('shipto');
  const shippingAddressSection = document.getElementById('shipping-address');
  const billingAddressSection = document.getElementById('billing-address');
  const addressContainers = document.querySelectorAll('.address-container');

  shiptoCheckbox.addEventListener('change', function() {
    if (this.checked) {
      const selectedAddressId = document.querySelector('input[name="selectedAddress"]:checked').value;
      const selectedAddressContainer = document.getElementById('shipping-address-container-' + selectedAddressId);
      selectedAddressContainer.style.display = 'block';
      billingAddressSection.style.display = 'block';
    } else {
      // Hide the selected shipping address and billing address
      const selectedAddressId = document.querySelector('input[name="selectedAddress"]:checked').value;
      const selectedAddressContainer = document.getElementById('shipping-address-container-' + selectedAddressId);
      selectedAddressContainer.style.display = 'none';
      billingAddressSection.style.display = 'none';
    }
  });
  // Check if the shipto checkbox should be checked initially
  const selectedAddressId = document.querySelector('input[name="selectedAddress"]:checked').value;
  const selectedAddressContainer = document.getElementById('shipping-address-container-' + selectedAddressId);
  if (selectedAddressContainer) {
    shiptoCheckbox.checked = true;
    selectedAddressContainer.style.display = 'block';
    billingAddressSection.style.display = 'block';
  } else {
    shiptoCheckbox.checked = false;
    billingAddressSection.style.display = 'none';
  }




//************************************  GPT
    
  function updatePaymentMethod(paymentMethod) {
    document.getElementById('selectedPaymentMethod').value = paymentMethod;
   } 


   