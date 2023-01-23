import { Board } from "./autocircle.js"

var video      : HTMLVideoElement  = document.getElementById('video') as HTMLVideoElement;
var canvas     : HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
var canvas_ori : HTMLCanvasElement = document.getElementById('canvas_ori') as HTMLCanvasElement;
var ctx_ori    : CanvasRenderingContext2D;

var board        : Board; 
var justseeked   : boolean = false;
var donesetupvid : boolean = false;

var input_vid  : HTMLInputElement  = document.getElementById('input_vid') as HTMLInputElement
input_vid.onchange = () => {
    donesetupvid = false;
    let file = input_vid.files[0]
    var fileURL = URL.createObjectURL(file)
    video.src = fileURL
}

// var button_debug : HTMLButtonElement = document.getElementById("button_debug") as HTMLButtonElement;

video.onseeked = () => {
    justseeked = true;
}
video.oncanplay = () => {
    if (donesetupvid) return;
    donesetupvid = true;

    let aspect_ratio = video.videoWidth / video.videoHeight;
    canvas_ori.width  = 100;
    canvas_ori.height = canvas_ori.width / aspect_ratio;
    ctx_ori = canvas_ori.getContext('2d', {willReadFrequently: true}) as CanvasRenderingContext2D;

    canvas.width  = 400;
    canvas.height = canvas.width / aspect_ratio;

    setup();
}

function setup(){
    console.log('setup');
    board = new Board(canvas_ori, canvas);
    board.drawCircles();
    board.calcWhitePixel();
    board.calcTarget();
    loop();
}

function loop(){
    ctx_ori.drawImage(video, 0,0, canvas_ori.width, canvas_ori.height);

    if (!video.paused || justseeked){
        board.calcWhitePixel();
        board.calcTarget();
        board.applyTarget();
        if (justseeked) justseeked = false;
    }

    board.update();
    board.draw();
    requestAnimationFrame(loop);
}
