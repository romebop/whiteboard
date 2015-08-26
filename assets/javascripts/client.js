/* client side socket */

var socket = io();

// load global canvas
socket.on('load', function(params) {
  canvas_dataURL = params['canvas_dataURL'];
  if (canvas_dataURL == null) ctx.clearRect(0, 0, canvas.width, canvas.height);
  else drawDataURL(canvas_dataURL);
});

// receive io emissions from server
socket.on('draw', function(params) {
  var type = params['type'];
  var clientX = params['clientX'];
  var clientY = params['clientY'];
  var color = params['color'];
  var width = params['width'];
  findxy(type, clientX, clientY, color, width);
});

socket.on('clear', function() {
  console.log("we make it to clear");
  drawDataURL(blank_dataURL);
  updateDataURL();
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('chat message', function(msg) {
  $('#messages').append($('<li>').text(msg));
});

/* canvas drawing logic */
// source: http://goo.gl/xxprq8

// global variables
var canvas,
  ctx,
  canvas_dataURL,
  blank_dataURL, 
  flag = false, 
  prevX = 0, 
  currX = 0, 
  prevY = 0, 
  currY = 0, 
  dot_flag = false,
  myColor = 'black', 
  myWidth = 2;

function init_canvas() {
    canvas = document.getElementById('whiteboard');
    ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.closePath();

    blank_dataURL = canvas.toDataURL();

    w = canvas.width;
    h = canvas.height;

    // emit client input to server
    canvas.addEventListener('mousemove', function (e) {
        emit_mouse('move', e);
    }, false);
    canvas.addEventListener('mousedown', function (e) {
        emit_mouse('down', e);
    }, false);
    canvas.addEventListener('mouseup', function (e) {
        emit_mouse('up', e);
    }, false);
    canvas.addEventListener('mouseout', function (e) {
        emit_mouse('out', e);
    }, false);
}

function emit_mouse(type, e) {
  socket.emit( 'draw', { 'type': type, 'clientX': e.clientX, 'clientY': e.clientY, 'color': myColor, 'width': myWidth, 'canvas_dataURL': canvas_dataURL } )
}

function findxy(res, clientX, clientY, color, width) {
    if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = clientX - canvas.offsetLeft;
        currY = clientY - canvas.offsetTop;
        flag = true;
        dot_flag = true;
        if (dot_flag) {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.fillRect(currX, currY, 2, 2);
            ctx.closePath();
            dot_flag = false;
            updateDataURL()
        }
    }
    if (res == 'up' || res == 'out') {
        flag = false;
    }
    if (res == 'move') {
        if (flag) {
            prevX = currX;
            prevY = currY;
            currX = clientX - canvas.offsetLeft;
            currY = clientY - canvas.offsetTop;
            draw(color, width);
        }
    }
}

function draw(color, width) {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
    updateDataURL()
}

function color(obj) {
    myColor = obj.id;
    if (myColor == 'white') myWidth = 14;
    else myWidth = 2;
}

function clear_canvas() {
  if (confirm("clear whiteboard?")) {
    socket.emit( 'clear', blank_dataURL );
  }
}

function send_msg() {
  socket.emit( 'chat message', $('#m').val() );
  $('#m').val('');
}

function updateDataURL() {
  canvas_dataURL = canvas.toDataURL();
}

function drawDataURL(dataURL) {
  var canvas_img = new Image();
  canvas_img.src = dataURL;
  ctx.drawImage(canvas_img, 0, 0);
}