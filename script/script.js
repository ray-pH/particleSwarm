import { Board } from "./autocircle.js";
var canvas = document.getElementById('canvas');
var canvas_ori = document.getElementById('canvas_ori');
var ctx_ori = canvas_ori.getContext('2d', { willReadFrequently: true });
let img = new Image();
img.src = "../bapp.png";
img.onload = () => {
    ctx_ori.drawImage(img, 0, 0, canvas.width, canvas.height);
    setup();
};
var board = new Board(canvas_ori, canvas);
var button_debug = document.getElementById("button_debug");
button_debug.onclick = () => {
    let img = new Image();
    img.src = "../bapp2.png";
    img.onload = () => {
        ctx_ori.drawImage(img, 0, 0, canvas.width, canvas.height);
        board.calcWhitePixel();
        board.calcTarget();
        board.applyTarget();
    };
};
function setup() {
    board.drawCircles();
    board.calcWhitePixel();
    board.calcTarget();
    loop();
}
var i = 0;
function loop() {
    board.update();
    board.draw();
    i++;
    if (i < 1000)
        requestAnimationFrame(loop);
}
