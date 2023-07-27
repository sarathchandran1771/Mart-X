// Initialize Cropper.js
var image = document.getElementById('productImage');
var cropper;

// Display a preview of the selected image
image.addEventListener('change', function(event) {
  var files = event.target.files;
  var reader = new FileReader();
  reader.onload = function() {
    var img = document.createElement('img');
    img.src = reader.result;
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imagePreview').appendChild(img);

    // Initialize Cropper.js after the image has been loaded
    cropper = new Cropper(img, {
      aspectRatio: 1, // Set the aspect ratio as desired
      viewMode: 1, // Adjust the view mode as needed
      dragMode: 'move', // Change the drag mode as needed
      autoCropArea: 0.8, // Adjust the auto crop area as desired
      cropBoxResizable: false, // Set whether the crop box can be resized
      crop: function(event) {
        // Update the hidden field with the cropped image data
        var croppedCanvas = cropper.getCroppedCanvas();
        var croppedImageDataURL = croppedCanvas.toDataURL();
        // Do something with the cropped image data
        console.log(croppedImageDataURL);
      }
    });
  };
  reader.readAsDataURL(files[0]);
});
