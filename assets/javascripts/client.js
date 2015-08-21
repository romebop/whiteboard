$( document ).ready(function() {

  var whiteboard =  document.getElementById("whiteboard");
  var ctx = whiteboard.getContext('2d');
  ctx.fillStyle = 'rgb(255,255,0)';
  ctx.fillRect(0,0,600,480);

});