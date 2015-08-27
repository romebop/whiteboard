/* client side socket */

var socket = io();

// assign connection id
socket.on('connection_id', function(connection_id) {
  id = connection_id;
});

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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateDataURL();

});

socket.on('chat message', function(params) {
  var connection_id = params['connection_id'];
  var msg = params['msg'];
  $('#messages').append($('<li>').text('[' + displayTime() + ']' + ' ' + 'client ' + connection_id + ': ' + msg));
  $('#messages').scrollTop( $('#messages')[0].scrollHeight );
});

/* canvas drawing logic */
// source: http://goo.gl/xxprq8

// global variables
var canvas,
  ctx,
  canvas_dataURL,
  flag = false, 
  prevX = 0, 
  currX = 0, 
  prevY = 0, 
  currY = 0, 
  dot_flag = false,
  myColor = 'black', 
  myWidth = 2,
  id,
  handle;

function init_canvas() {
    canvas = document.getElementById('whiteboard');
    ctx = canvas.getContext('2d');

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
    if (myColor == 'white') {
      myWidth = 14;
      $('.indicator').attr('id', null);
    } else {
      myWidth = 2;
      $('.indicator').attr('id', 'on' + myColor);
    }
}

function clear_canvas() {
  if (confirm("clear whiteboard?")) {
    socket.emit( 'clear');
  }
}

$('form').submit(function() {
  socket.emit('chat message', { 'connection_id': id, 'msg': $('#m').val() } );
  $('#m').val('');
  return false;
});

function updateDataURL() {
  canvas_dataURL = canvas.toDataURL();
}

function drawDataURL(dataURL) {
  var canvas_img = new Image();
  canvas_img.src = dataURL;
  ctx.drawImage(canvas_img, 0, 0);
}

function displayTime() {
    var str = '';
    var currentTime = new Date()
    var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()
    var seconds = currentTime.getSeconds()
    if (minutes < 10) {
        minutes = '0' + minutes
    }
    if (seconds < 10) {
        seconds = '0' + seconds
    }
    str += hours + ':' + minutes; // + ':' + seconds + ' ';
    if(hours > 11){
        str += 'pm'
    } else {
        str += 'am'
    }
    return str;
}