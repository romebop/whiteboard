'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var favicon = require('serve-favicon');
var stringHash = require('string-hash');
var async = require('async');
var bob = require('./poop');

var db = require('./db');

app.use(favicon(__dirname + '/assets/images/favicon.ico'));

app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// connect to mongodb on start up
db.connect(function (err) {
  if (err) {
    console.log('Unable to connect to Mongo.');
    process.exit(1); // exit with failure code
  } else {
      http.listen(app.get('port'), function () {
        console.log('Server running on localhost:' + app.get('port'));
      });
    }
});

/* server side socket */

var connectionId = 1,
    strokeById = {},
    // necessary since canvas only has 'single cursor'
totalConnections = 0;

io.on('connection', function (socket) {

  totalConnections++;
  console.log('A connection has been made! ID: ' + connectionId);
  socket.broadcast.emit('count', totalConnections);

  // initialize client
  async.parallel([db.getStrokes, db.getChats], function (err, results) {
    if (err) throw err;

    var _results = _slicedToArray(results, 2);

    var strokes = _results[0];
    var chats = _results[1];

    socket.emit('load', {
      'connectionId': connectionId,
      'userCount': totalConnections,
      'strokeHistory': strokes,
      'chatHistory': chats
    });
    strokeById[connectionId] = {};
    connectionId++;
  });

  // receive client emission, save canvas state, & emit to all clients
  socket.on('draw', function (_ref) {
    var type = _ref.type;
    var color = _ref.color;
    var width = _ref.width;
    var id = _ref.id;
    var canvasX = _ref.canvasX;
    var canvasY = _ref.canvasY;

    var prevStroke = strokeById[id];
    if (type === 'down') {
      var currStroke = {
        prevX: canvasX,
        prevY: canvasY,
        currX: canvasX,
        currY: canvasY,
        width: width,
        color: color
      };
    } else if (type === 'move') {
      var currStroke = {
        prevX: prevStroke.currX,
        prevY: prevStroke.currY,
        currX: canvasX,
        currY: canvasY,
        width: width,
        color: color
      };
    }
    strokeById[id] = currStroke;
    db.addStroke(currStroke);
    socket.broadcast.emit('draw', { 'stroke': currStroke });
  });

  socket.on('clear', function () {
    db.clearStrokes();
    io.emit('clear');
  });

  socket.on('chat', function (_ref2) {
    var handle = _ref2.handle;
    var text = _ref2.text;

    var message = {
      handle: handle,
      text: text,
      color: getColor(handle),
      date: Date.now()
    };
    db.addChat(message);
    io.emit('chat', message);
  });

  socket.on('disconnect', function () {
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
