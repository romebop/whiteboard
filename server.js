var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var favicon = require('serve-favicon');

var connection_id = 1;
var canvas_dataURL; // dataURL representation of global canvas

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
  socket.emit('client_id', connection_id);
  connection_id++;

  // emit canvas state for client to load
  socket.emit('load', { 'canvas_dataURL': canvas_dataURL });

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
    io.emit('chat message', params);
  });

});
