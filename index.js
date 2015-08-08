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

  var id = setInterval(function() {
    ws.send(JSON.stringify(new Date()), function() {  })
  }, 1000)

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });

  io.on("close", function() {
    console.log("websocket connection close")
    clearInterval(id)
  })
});

// http.listen(3000, function(){
//   console.log('listening on *:3000');
// });