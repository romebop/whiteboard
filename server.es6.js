const express    = require('express');
const app        = express();
const http       = require('http').Server(app);
const io         = require('socket.io')(http);
const favicon    = require('serve-favicon');
const stringHash = require('string-hash');
const async      = require('async');

const db         = require('./db');

app.use(favicon(__dirname + '/client/images/favicon.ico'));

app.set('port', (process.env.PORT || 3000));
app.use(express.static(__dirname + '/client'));

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

let connectionId = 1,
  strokeById = {}, // necessary since canvas only has 'single cursor'
  totalConnections = 0
  ;

io.on('connection', function(socket) {

  totalConnections++;
  console.log('connection made. ID: ' + connectionId);
  socket.broadcast.emit('count', totalConnections);

  // initialize client
  async.parallel([
    db.getStrokes,
    db.getChats,
  ], function(err, results) {
    if (err) throw err;
    let [strokes, chats] = results;
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
    let prevStroke = strokeById[id];
    let currStroke;
    if (type === 'down') {
      currStroke = {
        prevX: canvasX,
        prevY: canvasY,
        currX: canvasX,
        currY: canvasY,
        width,
        color,
      };
    } else if (type === 'move') {
      currStroke = {
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
    let message = {
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
  let colors = ['green', 'blue', 'red', 'black', 'orange'];
  let randomIndex = Math.abs(stringHash(handle) % colors.length);
  return colors[randomIndex];
}