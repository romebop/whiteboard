/* client side socket */

var socket = io(),
  myId, 
  myHandle;

// assign connection id
socket.on('connection_id', function(connection_id) {
  myId = connection_id;
  myHandle = "Client " + myId;
});

// load global canvas and past 20 chats
socket.on('load', function(params) {
  canvas_dataURL = params['canvas_dataURL'];
  var global_pixel_map = params['pixel_map'];
  if (!global_pixel_map.length) {
 //     ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.fillStyle = 'white';
            ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.closePath();
      var imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
      socket.emit('init pixel map',{'pixel_map_size' : canvas.width * canvas.height * 4, 'canvas_width' : canvas.width});
  }
  else draw_from_pixelMap(global_pixel_map);

  var chat_history = params['chat_history'];

 
  for (i = 0; i < chat_history.length; i++) {
     write_chat( chat_history[i] );
  } 

//    test_pixel_map();
});

// receive io emissions from server
socket.on('draw', function(params) {
  var type = params['type'];
  var clientX = params['clientX'];
  var clientY = params['clientY'];
  var color = params['color'];
  var width = params['width'];
  findxy(type, clientX, clientY, color, width);
});

socket.on('clear', function() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.closePath();
//    update_data_URL();

});

socket.on('chat message', function(msg) {
  write_chat(msg);
});

$(function() {
  $("#h").focus();
});

$('#handleform').submit(function() {
  if (!( $('#h').val() == '') ) {
     myHandle = $('#h').val();
  }
  $('#handlebox').addClass('hide');
  $('#chatbox').removeClass('hide');
  $('#messages').scrollTop( $('#messages')[0].scrollHeight );
  $(function() {
    $("#m").focus();
  });
  return false;
});

$('#chatform').submit(function() {
  socket.emit('chat message', { 'connection_id': myId, 'handle': myHandle, 'msg': $('#m').val() } );
  $('#m').val('');
  return false;
});

function write_chat(msg) {
  $('#messages').append($(msg));
  $('#messages').scrollTop( $('#messages')[0].scrollHeight );
}

/* canvas drawing logic */
// source: http://goo.gl/xxprq8

// global variables
var canvas,
  ctx,
  canvas_dataURL,
  flag = false, 
  prevX = 0, 
  currX = 0, 
  prevY = 0, 
  currY = 0, 
  dot_flag = false,
  myColor = 'black', 
  myWidth = 2;

function init_canvas() {
    canvas = document.getElementById('whiteboard');
    ctx = canvas.getContext('2d');


    // emit client input to server
    canvas.addEventListener('mousemove', function (e) {
        emit_mouse('move', e);
    }, false);
    canvas.addEventListener('mousedown', function (e) {
        emit_mouse('down', e);
    }, false);
    canvas.addEventListener('mouseup', function (e) {
        emit_mouse('up', e);
    }, false);
    canvas.addEventListener('mouseout', function (e) {
        emit_mouse('out', e);
    }, false);
}

function emit_mouse(type, e) {
  socket.emit( 'draw', { 'type': type, 'clientX': e.clientX, 'clientY': e.clientY, 'color': myColor, 'width': myWidth, 'canvas_dataURL': canvas_dataURL, 'canvasX' : e.clientX - canvas.offsetLeft, 'canvasY' : e.clientY - canvas.offsetTop , 'drawFlag' : flag} )
}

function findxy(res, clientX, clientY, color, width) {
    if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = clientX - canvas.offsetLeft;
        currY = clientY - canvas.offsetTop;
        flag = true;
        dot_flag = true;
        if (dot_flag) {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.fillRect(currX, currY, 2, 2);
            ctx.closePath();
            dot_flag = false;
            update_data_URL()
        }
    }
    if (res == 'up' || res == 'out') {
        flag = false;
    }
    if (res == 'move') {
        if (flag) {
            prevX = currX;
            prevY = currY;
            currX = clientX - canvas.offsetLeft;
            currY = clientY - canvas.offsetTop;
            draw(color, width);
        }
    }
}

function draw(color, width) {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
    update_data_URL();
}

function color(obj) {
    myColor = obj.id;
    if (myColor == 'white') {
      myWidth = 14;
      $('.indicator').attr('id', null);
    } else {
      myWidth = 2;
      $('.indicator').attr('id', 'on' + myColor);
    }
}

function clear_canvas() {
  if (confirm("clear whiteboard?")) {
    socket.emit( 'clear');
  }
}

function update_data_URL() {
//  canvas_dataURL = canvas.toDataURL();
}

function draw_data_URL(dataURL) {
  var canvas_img = new Image();
  canvas_img.src = dataURL;
  ctx.drawImage(canvas_img, 0, 0);
}

function grid_mode() {
  if ( $('#whiteboard').hasClass('gridMode')) {
    $('#whiteboard').removeClass('gridMode');
  } else {
    $('#whiteboard').addClass('gridMode');
  }
}

// pixelMap must conform to how imageData expects pixel data
// 1.  Pixels are counted starting from top left and row major
// 2.  Format is [r1,b1,g1,a1,r2,b2,g2,a2,....]
function draw_from_pixelMap(pixelMap) {
    var imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    var pixels    = imageData.data;

    // I don't understand why but pixels = pixelMap does not work, I think it has to do with pixels should be in int32 and pixelMap could be in int64?
    for (var pos = 0; pos < canvas.height*canvas.width*4; pos++) {
	    pixels[pos] = pixelMap[pos];
    }	

    ctx.putImageData(imageData,0,0);
}

// tests the function draw_from_pixelMap
function test_pixel_map() {
    console.log("testing pixel map");
    var pixelMap = [];

    var pos = 0;

    var xoff = canvas.width / 3;
    var yoff = canvas.height/3;

    for (var y = 0; y < canvas.height; y++) {
	for (var x = 0; x < canvas.width; x++) {
	    var x2 = x - xoff;
	    var y2 = y - yoff;
	    var d  = Math.sqrt(x2*x2+y2*y2);
	    var t  = Math.sin(d/6.0);

	    var r = t*200;
	    var g = 125 + t * 80;
	    var b = 235 + t * 20;

	    pixelMap[pos] = Math.max(0,Math.min(255,r));
	    pos++;
	    pixelMap[pos] = Math.max(0,Math.min(255,g));
	    pos++;
	    pixelMap[pos] = Math.max(0,Math.min(255,b));
	    pos++;
	    pixelMap[pos] = 255;
	    pos++;
	}
    }	
    draw_from_pixelMap(pixelMap);
}
