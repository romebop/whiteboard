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

var scale = 1;
var offset = { x: 0, y: 0 };

function translate() {
  var s = `transform: translate(${offset.x}px, ${offset.y}px) scale(${scale});`;
  document.querySelector("#whiteboard").style = s;
}

new Vue({
  el: "#app",
  data() {
    return {
      count: 0
    };
  },
  methods: {
    clearCanvas() {
      if (confirm("Clear Whiteboard?")) {
        socket.emit("clear");
      }
    },
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
    onPointerMove(e) {
      if (flag) {
        updateXY(e);
        draw({ prevX, prevY, currX, currY, width, color });
        emitMouse("move", e);
      }
    },
    onPointerDown(e) {
      flag = true;
      canvas.setPointerCapture(e.pointerId);
      updateXY(e);
      draw({ prevX, prevY, currX, currY, width, color });
      emitMouse("down", e);
    },
    onPointerUp(e) {
      flag = false;
    },

    initCanvas() {
      canvas = this.$refs.mainCanvas;
      ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
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
      this.count = userCount;
    });

    this.initCanvas();
  }
});
