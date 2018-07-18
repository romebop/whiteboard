const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const favicon = require("serve-favicon");
const stringHash = require("string-hash");
const async = require("async");

const db = require("./db");

app.use(favicon(`${__dirname}/assets/images/favicon.ico`));

app.set("port", process.env.PORT || 3000);
app.use(express.static(`${__dirname}/assets`));

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

// connect to mongodb on start up
db.connect(err => {
  if (err) {
    console.log("Unable to connect to Mongo.");
    process.exit(1); // exit with failure code
  } else {
    http.listen(app.get("port"), () => {
      console.log(`Server running on localhost:${app.get("port")}`);
    });
  }
});

/* server side socket */

let connectionId = 1;

const // necessary since canvas only has 'single cursor'
strokeById = {};

let totalConnections = 0;

io.on("connection", socket => {
  totalConnections++;
  console.log(`A connection has been made! ID: ${connectionId}`);
  socket.broadcast.emit("count", totalConnections);

  // initialize client
  async.parallel([db.getStrokes, db.getChats], (err, results) => {
    if (err) throw err;
    const [strokes, chats] = results;
    socket.emit("load", {
      connectionId: connectionId,
      userCount: totalConnections,
      strokeHistory: strokes,
      chatHistory: chats
    });
    strokeById[connectionId] = {};
    connectionId++;
  });

  // receive client emission, save canvas state, & emit to all clients
  socket.on("draw", ({ type, color, width, id, canvasX, canvasY }) => {
    const prevStroke = strokeById[id];
    if (type === "down") {
      var currStroke = {
        prevX: canvasX,
        prevY: canvasY,
        currX: canvasX,
        currY: canvasY,
        width,
        color
      };
    } else if (type === "move") {
      var currStroke = {
        prevX: prevStroke.currX,
        prevY: prevStroke.currY,
        currX: canvasX,
        currY: canvasY,
        width,
        color
      };
    }
    strokeById[id] = currStroke;
    db.addStroke(currStroke);
    socket.broadcast.emit("draw", { stroke: currStroke });
  });

  socket.on("clear", () => {
    db.clearStrokes();
    io.emit("clear");
  });

  socket.on("chat", ({ handle, text }) => {
    const message = {
      handle,
      text,
      color: getColor(handle),
      date: Date.now()
    };
    db.addChat(message);
    io.emit("chat", message);
  });

  socket.on("disconnect", () => {
    totalConnections--;
    io.emit("count", totalConnections);
    console.log("A user has disconnected.");
  });
});

function getColor(handle) {
  const colors = ["green", "blue", "red", "black", "orange"];
  const randomIndex = Math.abs(stringHash(handle) % colors.length);
  return colors[randomIndex];
}
