/* client side socket */

var socket = io(),
  myId, 
  myHandle;

// assign connection id
socket.on('connection_id', function(connection_id) {
  myId = connection_id;
  myHandle = "Client " + myId;
});

// load global canvas and past 20 chats
socket.on('load', function(params) {
  canvas_dataURL = params['canvas_dataURL'];
  if (canvas_dataURL == null) ctx.clearRect(0, 0, canvas.width, canvas.height);
  else draw_data_URL(canvas_dataURL);

  var chat_history = params['chat_history'];

  for (i = 0; i < chat_history.length; i++) {
     write_chat( chat_history[i] );
  } 

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
  update_data_URL();
});

socket.on('chat message', function(msg_obj) {
  write_chat(msg_obj);
});

$(function() {
  $("#h").focus();
});

$('#handleform').submit(function() {
  if (!( $('#h').val() == '') ) {
     myHandle = $('#h').val();
  }
  $('#handlebox').addClass('hide');
  $('#chatbox').removeClass('hide');
  $('#messages').scrollTop( $('#messages')[0].scrollHeight );
  $(function() {
    $("#m").focus();
  });
  return false;
});

$('#chatform').submit(function() {
  socket.emit('chat message', { 'connection_id': myId, 'handle': myHandle, 'msg': $('#m').val() } );
  $('#m').val('');
  return false;
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
  myWidth = 2;

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
            update_data_URL()
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
    update_data_URL()
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

function update_data_URL() {
  canvas_dataURL = canvas.toDataURL();
}

function draw_data_URL(dataURL) {
  var canvas_img = new Image();
  canvas_img.src = dataURL;
  ctx.drawImage(canvas_img, 0, 0);
}

function grid_mode() {
  if ( $('#whiteboard').hasClass('gridMode')) {
    $('#whiteboard').removeClass('gridMode');
  } else {
    $('#whiteboard').addClass('gridMode');
  }
}

function write_chat(msg_obj) {
  var msg = msg_obj.sub_string_1 + display_time(msg_obj.date_ms) + msg_obj.sub_string_2;
  $('#messages').append($(msg));
  $('#messages').scrollTop( $('#messages')[0].scrollHeight );
}

function display_time(date_ms) {
    var str = '';
    var time = new Date(date_ms);
    var hours = time.getHours();
    var minutes = time.getMinutes();
    var seconds = time.getSeconds();
    var am_pm;
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    if(hours > 11) {
        am_pm = 'pm'
        if (hours > 12) {
          hours -= 12
        }
    } else {
        am_pm = 'am'
    }
    str += hours + ':' + minutes + am_pm; // + ':' + seconds + ' ';
    return str;
}