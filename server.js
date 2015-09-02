var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var favicon = require('serve-favicon');

var connection_id = 1;
var canvas_dataURL; // dataURL representation of global canvas
var last_messenger_id = -1;

// variables to set chat background color
var chat_colors = ['white-msg','cloud-msg'];
var current_chat_color = 0;
var chat_history = [];     // used to store the last 20 messages
var chat_history_current  = 0;   // used to organize the chathistory

// variables set up for the pixel map representation of global canvas
var pixel_init = false;
var pixel_map  = [];
var canvas_width;
var colorbook = {'black' : [0,0,0],
		 'blue'  : [0,0,255],
		 'green' : [0,128,0],
                 'red'   : [255,0,0],
		 'orange': [255,165,0],
		 'yellow': [255,255,0]};

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
  socket.emit('load', { 'canvas_dataURL': canvas_dataURL, 'chat_history' : chat_history , 'pixel_map' : pixel_map} );

  // receive a client emission, save canvas state, & emit to all clients
  socket.on('draw', function(params) {
    canvas_dataURL = params['canvas_dataURL'];
    // update the pixel map
    var x = params['clientX'];
    var y = params['clientY'];
    var color = params['color'];
    var color_r = (colorbook[color])[0];
    var color_g = (colorbook[color])[1];
    var color_b = (colorbook[color])[2];
   
    for (var currX = x; currX < x + params['width']; currX++) {
	for (var currY = y; currY < y + params['width']; currY++) {
	    var pixel_id = 4*(currX + canvas_width * currY);
            pixel_map[pixel_id]   = color_r;
            pixel_map[pixel_id+1] = color_g;
            pixel_map[pixel_id+2] = color_b;
            pixel_map[pixel_id+3] = 255;
	}
    }
    io.emit('draw', params);
  });

  socket.on('clear', function() {
    canvas_dataURL = null;
    for (var j = 0; j < pixel_map.length; j++) {
	pixel_map[j] = 255;
    }
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
   
    // this is what gets added to the chatbox
    var msg_string = '<li class="' + color + '"> <p id="time">[' + display_time() + ']</p> <b>' + handle + '</b>: ' + msg + '</li>'; 

    // add to chat history
    chat_history.push(msg_string);
    if (chat_history.length > 20) {
       chat_history.shift();
    }
    io.emit('chat message', msg_string);
  });

 socket.on('init pixel map', function(params) {
   if (!pixel_init) {
     pixel_map_size = params['pixel_map_size'];
     canvas_width = params['canvas_width'];
     for (var j = 0; j < pixel_map_size; j++) {
         pixel_map[j] = 255;
     }

     pixel_init = true;
   }

  });
});

function display_time() {
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
    str += hours + ':' + minutes + am_pm; // + ':' + seconds + ' ';
    return str;
}
