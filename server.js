var express    = require('express');
var app        = express();
var http       = require('http').Server(app);
var io         = require('socket.io')(http);
var favicon    = require('serve-favicon');
var stringHash = require('string-hash');
var async      = require('async');

var db         = require('./db');

app.use(favicon(__dirname + '/assets/images/favicon.ico'));

app.set('port', (process.env.PORT || 3000));
app.use(express.static(__dirname + '/assets'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// connect to mongodb on start up
db.connect(function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.');
    process.exit(1); // exit with failure code
  } else {
    http.listen(app.get('port'), function() {
      console.log('Server running on localhost:' + app.get('port'));
    });
  }
});

/* server side socket */

var connectionId = 1,
  strokeById = {}, // necessary since canvas only has 'single cursor'
  totalConnections = 0
  ;

io.on('connection', function(socket) {
  
  totalConnections++;
  console.log('A connection has been made! ID: ' + connectionId);
  socket.broadcast.emit('count', totalConnections);

  // initialize client
  async.parallel([
    db.getStrokes,
    db.getChats,
  ], function(err, results) {
    if (err) throw err;
    var [strokes, chats] = results;
    socket.emit('load', { 
      'connectionId': connectionId,
      'userCount': totalConnections, 
      'strokeHistory': strokes, 
      'chatHistory': chats,
    });
    strokeById[connectionId] = {};
    connectionId++;
  });

  // receive client emission, save canvas state, & emit to all clients
  socket.on('draw', function({ type, color, width, id, canvasX, canvasY }) {
    var prevStroke = strokeById[id];
    if (type === 'down') {
      var currStroke = {
        prevX: canvasX,
        prevY: canvasY,
        currX: canvasX,
        currY: canvasY,
        width,
        color,
      };
    } else if (type === 'move') {
      var currStroke = {
        prevX: prevStroke.currX,
        prevY: prevStroke.currY,
        currX: canvasX,
        currY: canvasY,
        width,
        color,
      };
    }
    strokeById[id] = currStroke;
    db.addStroke(currStroke);
    socket.broadcast.emit('draw', {'stroke': currStroke});
  });

  socket.on('clear', function() {
    db.clearStrokes();
    io.emit('clear');
  });

  socket.on('chat', function({ handle, text }) {
    var message = {
      handle,
      text,
      color: getColor(handle),
      date: Date.now(),
    };
    db.addChat(message);
    io.emit('chat', message);
  });

  socket.on('disconnect', function() {
    totalConnections--;
    io.emit('count', totalConnections);
    console.log('A user has disconnected.');
  });

});

function getColor(handle) {
  var colors = ['green', 'blue', 'red', 'black', 'orange'];
  var randomIndex = Math.abs(stringHash(handle) % colors.length);
  return colors[randomIndex];
}