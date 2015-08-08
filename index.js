var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 5000

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');

  var id = setInterval(function() {
    socket.send(JSON.stringify(new Date()), function() {  })
  }, 1000)

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });

  socket.on("close", function() {
    console.log("websocket connection close")
    clearInterval(id)
  })
});

http.listen(5000, function(){
  console.log('listening on *:5000');
});