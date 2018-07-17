// client side socket

const socket = io();

let id;
let handle;

socket.on("load", (
  {
    connectionId,
    userCount,
    strokeHistory,
    chatHistory
  }
) => {
  id = connectionId;
  handle = `Client ${id}`;
  // load global state: canvas, chat messages, & user count
  for (const stroke of strokeHistory) draw(stroke);
  for (const chat of chatHistory) appendMessage(chat);
  updateCount(userCount);
});

socket.on("draw", ({ stroke }) => {
  draw(stroke);
});

socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on("chat", message => {
  appendMessage(message);
});

socket.on("count", userCount => {
  updateCount(userCount);
});

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

function initCanvas() {
  canvas = document.getElementById("whiteboard");
  ctx = canvas.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // emit client input to server
  canvas.addEventListener(
    "mousemove",
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
    "mousedown",
    e => {
      flag = true;
      updateXY(e);
      draw({ prevX, prevY, currX, currY, width, color });
      emitMouse("down", e);
    },
    false
  );
  canvas.addEventListener(
    "mouseup",
    e => {
      flag = false;
    },
    false
  );
  canvas.addEventListener(
    "mouseout",
    e => {
      flag = false;
    },
    false
  );
}

function updateXY(e) {
  if (e.type === "mousedown") {
    prevX = e.clientX - canvas.offsetLeft;
    prevY = e.clientY - canvas.offsetTop;
    currX = e.clientX - canvas.offsetLeft;
    currY = e.clientY - canvas.offsetTop;
  } else if (e.type === "mousemove") {
    prevX = currX;
    prevY = currY;
    currX = e.clientX - canvas.offsetLeft;
    currY = e.clientY - canvas.offsetTop;
  }
}

function emitMouse(type, e) {
  socket.emit("draw", {
    type,
    color,
    width,
    id,
    canvasX: e.clientX - canvas.offsetLeft,
    canvasY: e.clientY - canvas.offsetTop
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

// chat

$(() => {
  $("#h").focus();
});

$("#handleform").submit(() => {
  if ($("#h").val() !== "") {
    handle = $("#h").val();
  }
  $("#handlebox").addClass("hide");
  $("#chatbox").removeClass("hide");
  $("#messages").scrollTop($("#messages")[0].scrollHeight);
  $(() => {
    $("#m").focus();
  });
  return false; // cancel submit action
});

$("#chatform").submit(() => {
  socket.emit("chat", {
    handle,
    text: $("#m").val()
  });
  $("#m").val("");
  return false;
});

function appendMessage({ handle, text, color, date }) {
  const time = displayTime(date);
  const message = `<li><p id="time">[${time}]</p> <b class="${color}">${handle}</b>: ${text}</li>`;
  $("#messages").append($(message));
  $("#messages").scrollTop($("#messages")[0].scrollHeight);
}

function displayTime(dateMS) {
  const time = new Date(dateMS);
  let hours = time.getHours();
  let minutes = time.getMinutes();
  let seconds = time.getSeconds();
  let meridiem;
  if (minutes < 10) minutes = `0${minutes}`;
  if (seconds < 10) seconds = `0${seconds}`;
  if (hours >= 12) {
    meridiem = "pm";
    if (hours > 12) hours -= 12;
  } else {
    meridiem = "am";
    if (hours === 0) hours = 12;
  }
  return `${hours}:${minutes}${meridiem}`; // + ':' + seconds + ' ';
}

// online user counter

function updateCount(n) {
  $("#count").text(n);
}
