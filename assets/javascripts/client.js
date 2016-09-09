/* client side socket */

var socket = io(),
  myId, 
  myHandle;

socket.on('load', function(params) {
  // assign id and default handle
  myId = params['connection_id'];
  myHandle = "Client " + myId;
  // load global canvas
  var stroke_history = params['stroke_history'];
  for (var stroke in stroke_history) {
    draw(stroke_history[stroke]);
  }
  // load past 20 chats
  var chat_history = params['chat_history'];
  for (i = 0; i < chat_history.length; i++) {
    write_chat( chat_history[i] );
  }

  var user_count = params['user_count'];
  update_count(user_count);
});

socket.on('draw', function(params) {
  draw(params['stroke']);
});

socket.on('clear', function() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('chat message', function(msg_obj) {
  write_chat(msg_obj);
});

socket.on('count', function(user_count) {
  update_count(user_count);
});

/* whiteboard drawing behavior */

var canvas,
  ctx,
  flag = false, 
  prevX = 0, 
  prevY = 0, 
  currX = 0, 
  currY = 0, 
  myWidth = 2,
  myColor = 'black'; 

function init_canvas() {
  canvas = document.getElementById('whiteboard');
  ctx = canvas.getContext('2d');
  // emit client input to server
  canvas.addEventListener('mousemove', function (e) {
    if (flag) {
      update_xy(e);
      draw([prevX, prevY, currX, currY, myWidth, myColor]);
      emit_mouse('move', e);
    }
  }, false);
  canvas.addEventListener('mousedown', function (e) {
    flag = true;
    update_xy(e);
    draw([prevX, prevY, currX, currY, myWidth, myColor]);
    emit_mouse('down', e);
  }, false);
  canvas.addEventListener('mouseup', function (e) {
    flag = false;
  }, false);
  canvas.addEventListener('mouseout', function (e) {
    flag = false;
  }, false);
}

function update_xy(e){
  if (e.type === 'mousedown') {
    prevX = e.clientX - canvas.offsetLeft;
    prevY = e.clientY - canvas.offsetTop;
    currX = e.clientX - canvas.offsetLeft;
    currY = e.clientY - canvas.offsetTop;
  } else if (e.type === 'mousemove') {
    prevX = currX;
    prevY = currY;
    currX = e.clientX - canvas.offsetLeft;
    currY = e.clientY - canvas.offsetTop;
  }
}

function emit_mouse(type, e) {
  socket.emit( 'draw', { 'type': type, 'color': myColor, 'width': myWidth, 'id' : myId , 'canvasX' : e.clientX - canvas.offsetLeft , 'canvasY' : e.clientY - canvas.offsetTop} )
}

function draw(stroke) {
  ctx.beginPath();
  if ((stroke[0] === stroke[2]) && (stroke[1] === stroke[3])) {
    ctx.fillStyle = stroke[5];
    ctx.fillRect(stroke[0], stroke[1], 2, 2);
  } else {
    ctx.moveTo(stroke[0], stroke[1]);
    ctx.lineTo(stroke[2], stroke[3]);
    ctx.strokeStyle = stroke[5];
    ctx.lineWidth = stroke[4];
    ctx.stroke();
  }
  ctx.closePath();
}

function color(obj) {
  myColor = obj.id;
  myWidth = 2;
  $('.indicator').attr('id', 'on' + myColor);
}

function erase() {
  myColor = 'white';
  myWidth = 14;
}

function clear_canvas() {
  if (confirm('Clear Whiteboard?')) {
    socket.emit('clear');
  }
}

/* chat messaging behavior */

$(function() {
  $("#h").focus();
});

$('#handleform').submit(function() {
  if (!( $('#h').val() === '') ) {
    myHandle = $('#h').val();
  }
  $('#handlebox').addClass('hide');
  $('#chatbox').removeClass('hide');
  $('#messages').scrollTop( $('#messages')[0].scrollHeight );
  $(function() {
    $("#m").focus();
  });
  return false; // cancel submit action
});

$('#chatform').submit(function() {
  socket.emit('chat message', { 'connection_id': myId, 'handle': myHandle, 'msg': $('#m').val() } );
  $('#m').val('');
  return false;
});

function write_chat(msg_obj) {
  var msg = msg_obj.sub_string_1 + display_time(msg_obj.date_ms) + msg_obj.sub_string_2;
  $('#messages').append($(msg));
  $('#messages').scrollTop( $('#messages')[0].scrollHeight );
}

function update_count(n) {
  $('#count').text(n);
}

function display_time(date_ms) {
  var time = new Date(date_ms);
  var hours = time.getHours();
  var minutes = time.getMinutes();
  var seconds = time.getSeconds();
  var am_pm;
  if (minutes < 10) minutes = '0' + minutes;
  if (seconds < 10) seconds = '0' + seconds;
  if (hours >= 12) {
    am_pm = 'pm';
    if (hours > 12) hours -= 12;
  } else {
    am_pm = 'am';
    if (hours == 0) hours = 12;
  }
  return hours + ':' + minutes + am_pm; // + ':' + seconds + ' ';
}