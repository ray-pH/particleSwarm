import { Board } from "./autocircle.js";
var video = document.getElementById('video');
var canvas = document.getElementById('canvas');
var canvas_ori = document.getElementById('canvas_ori');
var ctx_ori;
// var ctx_ori    = canvas_ori.getContext('2d', {willReadFrequently: true}) as CanvasRenderingContext2D;
// let img : HTMLImageElement = new Image();
// img.src = "../bapp.png";
// img.onload = () => {
//     ctx_ori.drawImage(img, 0, 0, canvas.width, canvas.height);
//     setup();
// }
var board;
// var button_debug : HTMLButtonElement = document.getElementById("button_debug") as HTMLButtonElement;
video.oncanplay = () => {
    let aspect_ratio = video.videoWidth / video.videoHeight;
    canvas_ori.width = 100;
    canvas_ori.height = canvas_ori.width / aspect_ratio;
    ctx_ori = canvas_ori.getContext('2d', { willReadFrequently: true });
    canvas.width = 300;
    canvas.height = canvas.width / aspect_ratio;
    setup();
};
function setup() {
    console.log('setup');
    board = new Board(canvas_ori, canvas);
    board.drawCircles();
    board.calcWhitePixel();
    board.calcTarget();
    loop();
}
function loop() {
    ctx_ori.drawImage(video, 0, 0, canvas_ori.width, canvas_ori.height);
    board.calcWhitePixel();
    board.calcTarget();
    board.applyTarget();
    board.update();
    board.draw();
    requestAnimationFrame(loop);
}
