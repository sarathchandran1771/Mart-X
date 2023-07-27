  // Assuming you have jQuery loaded or use the native JavaScript equivalent if preferred

  // Function to calculate and display the offered price
  function calculateOfferedPrice(offer) {
    const totalAmount = parseFloat($('#totalAmount').text());
    if (offer.priceType === 'percentage') {
      const discountAmount = (totalAmount * (offer.price / 100)).toFixed(2);
      const offeredPrice = (totalAmount - discountAmount).toFixed(2);
      $('#offerPrice').text(offeredPrice);
    } else {
      const offeredPrice = (totalAmount - offer.price).toFixed(2);
      $('#offerPrice').text(offeredPrice);
    }
  }

  $(document).ready(function() {
    const offer = <% if (offer) { %> <%= JSON.stringify(offer) %> <% } else { %> null <% } %>;

    // Display the offered price if an offer is available
    if (offer) {
      calculateOfferedPrice(offer);
    }

    // Apply the offer when the "Apply Offer" button is clicked
    $('#applyOfferBtn').on('click', function() {
      if (offer) {
        // Assuming you have an API endpoint to apply the offer server-side
        // and return the new total amount after applying the offer
        // Replace 'YOUR_API_ENDPOINT' with the actual API endpoint
        $.get('YOUR_API_ENDPOINT', function(response) {
          // Assuming the response from the server contains the new totalAmount
          const newTotalAmount = parseFloat(response.newTotalAmount);
          $('#totalAmount').text(newTotalAmount.toFixed(2));

          // Recalculate and display the offered price based on the updated totalAmount
          calculateOfferedPrice(offer);
        });
      }
    });
  });
