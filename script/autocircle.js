function rgbtoluma(rgb) {
    let [r, g, b] = rgb;
    return 0.299 * r / 255 + 0.587 * g / 255 + 0.114 * b / 255;
}
function mapclamp(x, a, b, m, n) {
    if (x <= a)
        return m;
    if (x >= b)
        return n;
    return m + (x - a) * (n - m) / (b - a);
}
function popRandom(array) {
    let i = ~~(Math.random() * array.length);
    return array.splice(i, 1)[0];
}
// function arraysEqual(arr1 : any[], arr2 : any[]) {
//     if(arr1.length !== arr2.length) return false;
//     for (let i = 0; i < arr1.length; i++){
//         if(arr1[i] !== arr2[i]) return false
//     }
//     return true;
// }
// function isInArr(elem : any[], arr : any[][]) : boolean{
//     for (let a of arr) { if (arraysEqual(elem, a)) return true; };
//     return false;
// }
function isInArr2(elem, arr) {
    for (let [x, y] of arr) {
        if (x == elem[0] && y == elem[1])
            return true;
    }
    ;
    return false;
}
class Board {
    constructor(canvas_ori, canvas_cir) {
        this.canvas_ori = canvas_ori;
        this.ctx_ori = this.canvas_ori.getContext('2d', { willReadFrequently: true });
        this.imgdata_ori = this.ctx_ori.getImageData(0, 0, this.canvas_ori.width, this.canvas_ori.height);
        this.pixels_ori = this.imgdata_ori.data;
        this.canvas_cir = canvas_cir;
        this.ctx_cir = this.canvas_cir.getContext('2d', { willReadFrequently: true });
        this.n = this.canvas_ori.width * this.canvas_ori.height;
        this.lumapixels = new Float32Array(this.n);
        this.whitexys = [];
        this.targetxys = [];
        this.min_luma = 0.8;
        this.maxdist = canvas_ori.width * canvas_ori.width + canvas_ori.height * canvas_ori.height;
        this.n_circle = 200;
        this.radius_circle = 2;
        this.circles = new Array(this.n_circle);
        for (let i = 0; i < this.n_circle; i++) {
            this.circles[i] = new AutoCircle(this.circles, Math.random() * this.canvas_ori.width, Math.random() * this.canvas_ori.height, this.radius_circle);
        }
        this.calcNeigh_dpos();
    }
    calcNeigh_dpos() {
        this.neighs_dpos = [];
        let rspace = 2 * this.radius_circle;
        for (let dx = -rspace; dx <= rspace; dx++) {
            for (let dy = -rspace; dy <= rspace; dy++) {
                if (dx * dx + dy * dy <= rspace * rspace)
                    this.neighs_dpos.push([dx, dy]);
            }
        }
    }
    calcWhitePixel() {
        this.lumapixels = new Float32Array(this.n);
        this.whitexys = [];
        this.imgdata_ori = this.ctx_ori.getImageData(0, 0, this.canvas_ori.width, this.canvas_ori.height);
        this.pixels_ori = this.imgdata_ori.data;
        let nx = this.canvas_ori.width;
        // let ny = this.canvas.height;
        for (let i = 0; i < this.n; i++) {
            let p = 4 * i;
            let rgb = [this.pixels_ori[p + 0], this.pixels_ori[p + 1], this.pixels_ori[p + 2]];
            let luma = rgbtoluma(rgb);
            this.lumapixels[i] = luma;
            if (luma >= this.min_luma) {
                // if (luma < this.min_luma){
                this.whitexys.push([i % nx, Math.floor(i / nx)]);
            }
        }
    }
    calcTarget() {
        this.targetxys = [];
        let area_circle = 4 * this.radius_circle * this.radius_circle;
        let n_target = Math.floor(this.whitexys.length / area_circle);
        for (let i = 0; i < n_target; i++) {
            let id = ~~(Math.random() * this.whitexys.length);
            let [x, y] = this.whitexys[id];
            // let [x,y] = popRandom(this.whitexys);
            this.targetxys.push([x, y]);
            let neighs = this.neighs_dpos.map(([dx, dy]) => [x + dx, y + dy]);
            // this.whitexys = this.whitexys.filter(t => !(neighs.includes(t)));
            this.whitexys = this.whitexys.filter(t => !isInArr2(t, neighs));
            if (this.whitexys.length <= 0)
                break;
        }
        this.applyTarget();
    }
    applyTarget() {
        let availcircles = [...this.circles];
        let availtarget = [];
        // if circle is close enough to target, assign em
        let tol_dist = 2 * this.radius_circle;
        for (let i = 0; i < this.targetxys.length; i++) {
            let found = false;
            let [xt, yt] = this.targetxys[i];
            for (let j = 0; j < availcircles.length; j++) {
                let c = availcircles[j];
                let dist2 = (xt - c.x) * (xt - c.x) + (yt - c.y) * (yt - c.y);
                if (dist2 <= tol_dist * tol_dist) {
                    // found match
                    c.targetx = xt;
                    c.targety = yt;
                    availcircles.splice(j, 1);
                    found = true;
                    break;
                }
            }
            if (!found)
                availtarget.push([xt, yt]);
        }
        // console.log(availcircles.length, availtarget.length);
        let n = Math.min(availcircles.length, availtarget.length);
        for (let k = 0; k < n; k++) {
            let closestdist2 = this.maxdist * this.maxdist;
            let ci = 0;
            let cj = 0;
            for (let i = 0; i < availtarget.length; i++) {
                let [xt, yt] = availtarget[i];
                for (let j = 0; j < availcircles.length; j++) {
                    let c = availcircles[j];
                    let dist2 = (xt - c.x) * (xt - c.x) + (yt - c.y) * (yt - c.y);
                    if (dist2 < closestdist2) {
                        closestdist2 = dist2;
                        ci = i;
                        cj = j;
                    }
                }
            }
            // after found closest
            availcircles[cj].targetx = availtarget[ci][0];
            availcircles[cj].targety = availtarget[ci][1];
            availcircles.splice(cj, 1);
            availtarget.splice(ci, 1);
        }
        for (let i = 0; i < availcircles.length; i++) {
            availcircles[i].targetx = 0;
            availcircles[i].targety = 0;
        }
        // ---------------------------------------------------
        // if (availcircles.length <= availtarget.length){
        //     for (let i = 0; i < availcircles.length; i++){
        //         // loop for all targets
        //         let [x,y] = availtarget[i];
        //         // search closest circle
        //         availcircles[i].targetx = x;
        //         availcircles[i].targety = y;
        //     }
        // }
        // else if (availcircles.length > availtarget.length){
        //     for (let i = 0; i < availtarget.length; i++){
        //         let [x,y] = availtarget[i];
        //         availcircles[i].targetx = x;
        //         availcircles[i].targety = y;
        //     }
        //     for (let i = availtarget.length; i < availcircles.length; i++){
        //         availcircles[i].targetx = 0;
        //         availcircles[i].targety = 0;
        //     }
        // }
    }
    updateCircles() {
        for (let c of this.circles)
            c.update();
    }
    drawCircles() {
        for (let c of this.circles)
            c.draw(this.ctx_cir);
    }
    update() {
        // for (let c of this.circles) c.debug_gotoTarget();
        this.updateCircles();
    }
    draw() {
        this.ctx_cir.fillStyle = "black";
        this.ctx_cir.fillRect(0, 0, this.canvas_cir.width, this.canvas_cir.height);
        this.drawCircles();
    }
}
class AutoCircle {
    constructor(acs, x, y, r, max_vel = 5) {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 0;
        this.max_vel = 0;
        this.done = false;
        this.targetx = 0;
        this.targety = 0;
        this.x = x;
        this.y = y;
        this.targetx = x;
        this.targety = y;
        this.radius = r;
        this.max_vel = max_vel;
        this.acs = acs;
    }
    update() {
        this.applyVel();
        this.x += this.vx;
        this.y += this.vy;
    }
    calcVelRepulsion() {
        let vx = 0;
        let vy = 0;
        let scale = 3;
        for (let c of this.acs) {
            let dx = this.x - c.x;
            let dy = this.y - c.y;
            let d2 = dx * dx + dy * dy;
            if (d2 == 0)
                continue;
            if (d2 <= Math.pow(c.radius * 2.2, 2)) {
                let s = 1 / d2;
                vx += dx * s * scale;
                vy += dy * s * scale;
            }
        }
        return [vx, vy];
    }
    applyVel() {
        let [vx1, vy1] = this.calcVelToTarget();
        let [vx2, vy2] = this.calcVelRepulsion();
        let vx = vx1 + vx2;
        let vy = vy1 + vy2;
        let v2 = vx * vx + vy * vy;
        let v = Math.sqrt(v2);
        let scale = (v <= this.max_vel) ? 1 : this.max_vel / v;
        this.vx = vx * scale;
        this.vy = vy * scale;
    }
    calcVelToTarget() {
        let scale = 0.1;
        let dx = (this.targetx - this.x);
        let dy = (this.targety - this.y);
        return [dx * scale, dy * scale];
    }
    debugdone() {
        this.done = true;
    }
    debug_gotoTarget() {
        this.x = this.targetx;
        this.y = this.targety;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        // ctx.fillStyle = this.done? 'white' : 'blue';
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.lineWidth = 0;
        // ctx.strokeStyle = '#aaaaaa';
        ctx.stroke();
    }
}
export { AutoCircle, Board };
