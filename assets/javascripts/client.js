// client side socket

const socket = io();

let id;
let handle;

// drawing

var canvas;

var ctx;
let flag = false;
let prevX = 0;
let prevY = 0;
let currX = 0;
let currY = 0;
let width = 2;
let color = "black";

function updateXY(e) {
  const mouseX = applyZoomX(e.clientX - canvas.offsetLeft);
  const mouseY = applyZoomY(e.clientY - canvas.offsetTop);
  if (e.type === "pointerdown") {
    prevX = mouseX;
    prevY = mouseY;
    currX = mouseX;
    currY = mouseY;
  } else if (e.type === "pointermove") {
    prevX = currX;
    prevY = currY;
    currX = mouseX;
    currY = mouseY;
  }
}

function applyZoomX(x) {
  return (x - offset.x) / scale;
}
function applyZoomY(x) {
  return (x - offset.y) / scale;
}

function emitMouse(type, e) {
  const mouseX = e.clientX - canvas.offsetLeft;
  const mouseY = e.clientY - canvas.offsetTop;
  socket.emit("draw", {
    type,
    color,
    width,
    id,
    canvasX: applyZoomX(mouseX),
    canvasY: applyZoomY(mouseY)
  });
}

function draw(stroke) {
  ctx.beginPath();
  ctx.moveTo(stroke.prevX, stroke.prevY);
  ctx.lineTo(stroke.currX, stroke.currY);
  ctx.lineWidth = stroke.width;
  ctx.strokeStyle = stroke.color;
  ctx.stroke();
  ctx.closePath();
}

function chooseColor({ id }) {
  color = id;
  width = 2;
}

function erase() {
  color = "white";
  width = 14;
}

function clearCanvas() {
  if (confirm("Clear Whiteboard?")) {
    socket.emit("clear");
  }
}

var scale = 1;
var offset = { x: 0, y: 0 };

function translate() {
  var s = `transform: translate(${offset.x}px, ${offset.y}px) scale(${scale});`;
  console.log(s);
  document.querySelector("#whiteboard").style = s;
}

function updateCount(n) {
  $("#count").text(n);
}

new Vue({
  el: "#app",
  data() {
    return {
      count: 0
    };
  },
  methods: {
    zoom(s) {
      scale *= s;
      translate();
      return false;
    },
    move(x, y) {
      offset.x += x;
      offset.y += y;
      translate();
      return false;
    },
    reset() {
      offset.x = 0;
      offset.y = 0;
      scale = 1;
      translate();
    },
    initCanvas() {
      canvas = document.getElementById("whiteboard");
      ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // emit client input to server
      canvas.addEventListener(
        "pointermove",
        e => {
          if (flag) {
            updateXY(e);
            draw({ prevX, prevY, currX, currY, width, color });
            emitMouse("move", e);
          }
        },
        false
      );
      canvas.addEventListener(
        "pointerdown",
        e => {
          flag = true;
          canvas.setPointerCapture(e.pointerId);
          updateXY(e);
          draw({ prevX, prevY, currX, currY, width, color });
          emitMouse("down", e);
        },
        false
      );
      canvas.addEventListener(
        "pointerup",
        e => {
          flag = false;
        },
        false
      );
    }
  },
  mounted() {
    socket.on(
      "load",
      ({ connectionId, userCount, strokeHistory, chatHistory }) => {
        id = connectionId;
        handle = `Client ${id}`;
        // load global state: canvas, chat messages, & user count
        for (const stroke of strokeHistory) draw(stroke);
        // for (const chat of chatHistory) appendMessage(chat);

        this.count = userCount;
      }
    );

    socket.on("draw", ({ stroke }) => {
      draw(stroke);
    });

    socket.on("clear", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on("chat", message => {
      // appendMessage(message);
    });

    socket.on("count", userCount => {
      updateCount(userCount);
    });

    this.initCanvas();
  }
});
