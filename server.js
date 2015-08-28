var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var favicon = require('serve-favicon');

var connection_id = 1;
var canvas_dataURL; // dataURL representation of global canvas
var last_messenger_id = -1;
var chat_colors = ['white-msg','cloud-msg'];
var current_chat_color = 0;
var chat_history;     // used to store the last 20 messages
var chat_history_start = 0;  // used to organize the chathistory
var chat_history_current  = -1;   // used to organize the chathistory

app.use(favicon(__dirname + '/assets/images/favicon.ico'));

app.set('port', (process.env.PORT || 3000));
app.use(express.static(__dirname + '/assets'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(app.get('port'), function() {
  console.log('Server running on localhost:' + app.get('port'));
});

// per connection to client:
io.on('connection', function(socket) {
  
  console.log("a connection has been made. id: " + connection_id);
  // assign id to client
  socket.emit('connection_id', connection_id);
  connection_id++;

  // emit canvas state for client to load
  socket.emit('load', { 'canvas_dataURL': canvas_dataURL, 'chat_history' : chat_history, 'chat_history_start' : chat_history_start } );

  // receive a client emission, save canvas state, & emit to all clients
  socket.on('draw', function(params) {
    canvas_dataURL = params['canvas_dataURL'];
    io.emit('draw', params);
  });

  socket.on('clear', function() {
    canvas_dataURL = null;
    io.emit('clear');
  });

  socket.on('chat message', function(params) {
    next_messenger_id = params['connection_id'];
    var color;
    var msg = params['msg'];
    var handle = params['handle'];
    // Assign chat background color
    // change chat color if next msg sender is different from last one
    if (last_messenger_id != next_messenger_id) {
        current_chat_color = (current_chat_color+1)%2;
    }
    last_messenger_id = next_messenger_id;
    color = chat_colors[current_chat_color];	  

    var msg_string = '<li class="' + color + '"> [' + displayTime() + '] <b>' + handle + '</b>: ' + msg + '</li>'; 
    var output = {};
    output['msg'] = msg_string;

/*
    chat_history_current = (chat_history_current+1) % 20;
    if (chat_history_current == chat_history_start) {
         chat_history_start = (chat_history_start+1) % 20; 
    }
    chat_history[chat_history_current] = msg_string;
*/

    io.emit('chat message', output);
  });

});

function displayTime() {
    var str = '';
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    var seconds = currentTime.getSeconds();
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
    str += hours + ':' + minutes + ' ' + am_pm; // + ':' + seconds + ' ';
    return str;
}
