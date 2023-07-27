// Assuming you have jQuery available for AJAX requests
    $('.form-check-input').on('change', function() {
  var isChecked = $(this).is(':checked');
  var productId = $(this).attr('id').replace('flexSwitchCheck', '');
  var label = $(this).closest('.form-check').find('.form-check-label span');
  
  // Send the AJAX request to update the product statusx
  $.ajax({
    url: '/admin/items/' + productId,
    method: 'PATCH',
    data: { isDeleted: isChecked },
    success: function(response) {
      label.text(isChecked ? 'Active' : 'Deleted');
    },
    error: function(error) {
    }
  });
});
    document.addEventListener("DOMContentLoaded", function() {
      const checkboxes = document.querySelectorAll("[id^=flexSwitchCheck]");
      checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener("change", function() {
          const index = checkbox.id.substring(13);
          const label = document.getElementById(`label${index}`);
          label.textContent = checkbox.checked ? "Listed" : "Unlisted";
        });
      });
    });


    
    
    $('.form-check-input').on('change', function() {
      var isChecked = $(this).is(':checked');
      var userId = $(this).attr('id').replace('flexSwitchCheck', '');
      var label = $(this).closest('.form-check').find('.form-check-label span');
      
      // Send the AJAX request to update the user status
      $.ajax({
        url: '/admin/userManagement/' + userId,
        method: 'PATCH',
        data: { isDeleted: isChecked },
        success: function(response) {
          label.text(isChecked ? 'Blocked' : 'Unblocked');
        },
        error: function(error) {
        }
      });
    });

    document.addEventListener("DOMContentLoaded", function() {
      const checkboxes = document.querySelectorAll("[id^=flexSwitchCheck]");
      checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener("change", function() {
          const index = checkbox.id.substring(13);
          const label = document.getElementById(`label${index}`);
          label.textContent = checkbox.checked ? "Listed" : "Unlisted";
        });
      });
    });
  
    // orde management table***********************

  //   $(document).ready(function () {
  //     $('.orderStatus').on('change', function () {
  //         const orderId = $(this).data('order.id');
  //         const newStatus = $(this).val();

  //         $.ajax({
  //             url: '/admin/updateOrderStatus/' + orderId,
  //             method: 'PATCH',
  //             data: { newStatus: newStatus },
  //             cache: false,
  //             success: function (response) {
  //                 console.log("orderStatus", response.message); // Order status updated successfully
  //             },
  //             error: function (err) {
  //                 console.error("responseText error", err.responseText); // Error message
  //             },
  //         });
  //     });
  // });
    