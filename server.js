var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 3000));
app.use(express.static(__dirname + '/assets'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(app.get('port'), function() {
  console.log('Server running on localhost:'+app.get('port'));
});

io.on('connection', function(socket){
  socket.on('draw', function(params) {
     io.emit('draw', params);
  });
});