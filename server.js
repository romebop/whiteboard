/* server config */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var favicon = require('serve-favicon');

app.use(favicon(__dirname + '/assets/images/favicon.ico'));

app.set('port', (process.env.PORT || 3000));
app.use(express.static(__dirname + '/assets'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(app.get('port'), function() {
  console.log('Server running on localhost:' + app.get('port'));
});

/* server side socket */

var connection_id = 1;
var last_messenger_id = -1;
var chat_colors = ['white-msg','cloud-msg'];
var current_chat_color = 0;
var chat_history = [];
var chat_history_current = 0;

var stroke_history = [];
var current_stroke = [];

io.on('connection', function(socket) {
  
  console.log("a connection has been made. id: " + connection_id);

  // initialize client
  socket.emit('load', { 'connection_id': connection_id, 'stroke_history' : stroke_history, 'chat_history' : chat_history });
  // prevX, prevY, currX, currY, width, color
  current_stroke[connection_id] = [0,0,0,0,0,''];
  connection_id++;
  // receive a client emission, save canvas state, & emit to all clients
  socket.on('draw', function(params) {
    var drawer_id = params['id'];
    var type      = params['type'];
    var canvasX   = params['canvasX'];
    var canvasY   = params['canvasY'];
    var width     = params['width'];
    var color     = params['color'];
    if (type == 'down') {
    	current_stroke[drawer_id][0] = canvasX;
    	current_stroke[drawer_id][1] = canvasY;
    	current_stroke[drawer_id][2] = canvasX;
    	current_stroke[drawer_id][3] = canvasY;	
      current_stroke[drawer_id][4] = width;
      current_stroke[drawer_id][5] = color;
	    socket.broadcast.emit('draw', {'stroke' : current_stroke[drawer_id]});
    } else if (type == 'move') {
      current_stroke[drawer_id][0] = current_stroke[drawer_id][2];
      current_stroke[drawer_id][1] = current_stroke[drawer_id][3];
    	current_stroke[drawer_id][2] = canvasX;
    	current_stroke[drawer_id][3] = canvasY;
    	socket.broadcast.emit('draw', {'stroke' : current_stroke[drawer_id]});
    	stroke_history[stroke_history.length] = (current_stroke[drawer_id]).slice(0);
    }
  });

  socket.on('clear', function() {
    stroke_history = [];
    io.emit('clear');
  });

  socket.on('chat message', function(params) {
    var color = get_chat_color(params['connection_id']);
    var msg = params['msg'];
    var handle = params['handle'];
    var msg_obj = make_msg_obj(color, handle, msg);
    update_chat_history(msg_obj);
    io.emit('chat message', msg_obj);
  });

  socket.on('disconnect', function(){
    console.log('a user has disconnected.');
  });

});

/* helper functions */

function get_chat_color(next_messenger_id) {
  // assign message color & change color if new sender
  if (last_messenger_id != next_messenger_id) {
    current_chat_color = (current_chat_color+1)%2;
  }
  last_messenger_id = next_messenger_id;
  return chat_colors[current_chat_color];
}

function make_msg_obj(color, handle, msg) {
  var sub_string_1 = '<li class="' + color + '"> <p id="time">[';
  var date_ms = Date.now();
  var sub_string_2 = ']</p> <b>' + handle + '</b>: ' + msg + '</li>';
  // array of string + date object + string
  return { 'sub_string_1': sub_string_1, 'date_ms': date_ms, 'sub_string_2': sub_string_2 };
}

function update_chat_history(msg_obj) {
  chat_history.push(msg_obj);
  if (chat_history.length > 20) {
     chat_history.shift();
  }
}