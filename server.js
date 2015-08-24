var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connection_number = 0;
var canvas_dataURL; // dataURL representation of global canvas

app.set('port', (process.env.PORT || 3000));
app.use(express.static(__dirname + '/assets'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(app.get('port'), function() {
  console.log('Server running on localhost:' + app.get('port'));
});

io.on('connection', function(socket) {
  console.log("a connection has been made. number: " + connection_number);
  connection_number++;

  // emit canvas state for client to load
  socket.emit('load', { 'canvas_dataURL': canvas_dataURL });

  // receive a client emission, save canvas state, & emit to all clients
  socket.on('draw', function(params) {
    canvas_dataURL = params['canvas_dataURL'];
    io.emit('draw', params);
  });

  socket.on('color', function(color) {
    io.emit('color', color);
  });

  socket.on('clear', function() {
    canvas_dataURL = null;
    io.emit('clear');
  });

});