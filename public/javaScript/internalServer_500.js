document.addEventListener("DOMContentLoaded", function() {
  document.body.addEventListener('mousemove', function(event) {
    var eyes = document.querySelectorAll('.eye');
    eyes.forEach(function(e) {
      var x = (e.offsetLeft) + (e.offsetWidth / 2);
      var y = (e.offsetTop) + (e.offsetHeight / 2);
      var rad = Math.atan2(event.pageX - x, event.pageY - y);
      var rot = (rad * (180 / Math.PI) * -1) + 180;
      e.style.transform = 'rotate(' + rot + 'deg)';
    });
  });
});