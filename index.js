var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var socket = io.connect(window.location.hostname);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.configure(function () {  
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});