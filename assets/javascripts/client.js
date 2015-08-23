/* client side socket */

var socket = io();

// load global canvas
socket.on('load', function(params) {
  canvas_dataURL = params['canvas_dataURL'];
  var canvas_img = new Image();
  canvas_img.src = canvas_dataURL;
  ctx.drawImage(canvas_img, 0, 0);
});

// receive io emission from server
socket.on('draw', function(params) {
  var type = params['type'];
  var clientX = params['clientX'];
  var clientY = params['clientY'];
  findxy(type, clientX, clientY);
});

/* canvas drawing logic */
// source: http://goo.gl/xxprq8

var canvas,
  canvas_dataURL,
  ctx, 
  flag = false, 
  prevX = 0, 
  currX = 0, 
  prevY = 0, 
  currY = 0, 
  dot_flag = false,
  x = 'black', 
  y = 2;

function init() {
    canvas = document.getElementById('whiteboard');
    ctx = canvas.getContext('2d');

    w = canvas.width;
    h = canvas.height;

    // emit client input to server
    canvas.addEventListener('mousemove', function (e) {
        socket.emit( 'draw', { 'type': 'move', 'clientX': e.clientX, 'clientY': e.clientY, 'canvas_dataURL': canvas_dataURL } )
    }, false);
    canvas.addEventListener('mousedown', function (e) {
        socket.emit( 'draw', { 'type': 'down', 'clientX': e.clientX, 'clientY': e.clientY, 'canvas_dataURL': canvas_dataURL } )
    }, false);
    canvas.addEventListener('mouseup', function (e) {
        socket.emit( 'draw', { 'type': 'up', 'clientX': e.clientX, 'clientY': e.clientY, 'canvas_dataURL': canvas_dataURL } )        
    }, false);
    canvas.addEventListener('mouseout', function (e) {
        socket.emit( 'draw', { 'type': 'out', 'clientX': e.clientX, 'clientY': e.clientY, 'canvas_dataURL': canvas_dataURL } )        
    }, false);
}

function findxy(res, clientX, clientY) {
    if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = clientX - canvas.offsetLeft;
        currY = clientY - canvas.offsetTop;

        flag = true;
        dot_flag = true;
        if (dot_flag) {
            ctx.beginPath();
            ctx.fillStyle = x;
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
            draw();
        }
    }
}

function draw() {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = x;
    ctx.lineWidth = y;
    ctx.stroke();
    ctx.closePath();
    updateDataURL()
}

function color(obj) {
    switch (obj.id) {
        case "green":
            x = "green";
            break;
        case "blue":
            x = "blue";
            break;
        case "red":
            x = "red";
            break;
        case "yellow":
            x = "yellow";
            break;
        case "orange":
            x = "orange";
            break;
        case "black":
            x = "black";
            break;
        case "white":
            x = "white";
            break;
    }
    if (x == "white") y = 14;
    else y = 2;
}

function updateDataURL() {
  canvas_dataURL = canvas.toDataURL();
}

