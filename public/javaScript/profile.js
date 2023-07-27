function enableInput(fieldId) {
    var inputField = document.getElementById(fieldId);
    var editButton = inputField.nextElementSibling.firstElementChild;
    
    if (inputField.disabled) {
      inputField.disabled = false;
      editButton.textContent = 'Save';
    } else {
      inputField.disabled = true;
      editButton.textContent = 'Edit';
    }
  }

// myOrdersIcon**************

  var myOrdersIcon = document.getElementById('myOrdersIcon');
  var myOrdersContent = document.getElementById('myOrdersContent');

  myOrdersIcon.addEventListener('click', function() {
    if (myOrdersContent.style.display === 'none') {
      myOrdersContent.style.display = 'block';
    } else {
      myOrdersContent.style.display = 'none';
    }
  });

// myPersonalInfo***************
function enableEdit(fieldId) {
    var inputField = document.getElementById(fieldId);
    var editButton = inputField.parentNode.parentNode.querySelector('.edit-button');

    if (inputField.disabled) {
      inputField.disabled = false;
      editButton.textContent = 'Save';
    } else {
      inputField.disabled = true;
      editButton.textContent = 'Edit';
    }
  }
  
  var myOrdersIcon = document.getElementById('myPersonalInfo');
  var personalInfoContent = document.getElementById('personalInfoContent');

  myOrdersIcon.addEventListener('click', function() {
    if (personalInfoContent.style.display === 'none') {
      personalInfoContent.style.display = 'block';
    } else {
      personalInfoContent.style.display = 'none';
    }
  });

// myAddress*************
  var myOrdersIcon = document.getElementById('myAddress');
  var personalAddressContent = document.getElementById('personalAddressContent');

  myOrdersIcon.addEventListener('click', function() {
    if (personalAddressContent.style.display === 'none') {
      personalAddressContent.style.display = 'block';
    } else {
      personalAddressContent.style.display = 'none';
    }
  });