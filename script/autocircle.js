function rgbtoluma(rgb) {
    let [r, g, b] = rgb;
    return 0.299 * r / 255 + 0.587 * g / 255 + 0.114 * b / 255;
}
class Board {
    constructor(canvas_ori, canvas_cir) {
        this.canvas_ori = canvas_ori;
        this.ctx_ori = this.canvas_ori.getContext('2d', { willReadFrequently: true });
        this.imgdata_ori = this.ctx_ori.getImageData(0, 0, this.canvas_ori.width, this.canvas_ori.height);
        this.pixels_ori = this.imgdata_ori.data;
        this.canvas_cir = canvas_cir;
        this.ctx_cir = this.canvas_cir.getContext('2d', { willReadFrequently: true });
        this.canvas_scale = this.canvas_cir.width / this.canvas_ori.width;
        this.n = this.canvas_ori.width * this.canvas_ori.height;
        this.lumapixels = new Float32Array(this.n);
        this.whitexys = [];
        this.targetxys = [];
        this.min_luma = 0.8;
        this.maxdist = canvas_ori.width * canvas_ori.width + canvas_ori.height * canvas_ori.height;
        this.n_circle = 250;
        this.radius_circle = 1.5;
        this.circles = new Array(this.n_circle);
        // initialize all circles
        for (let i = 0; i < this.n_circle; i++) {
            this.circles[i] = new AutoCircle(this.circles, Math.random() * this.canvas_ori.width, Math.random() * this.canvas_ori.height, this.radius_circle);
        }
    }
    // calculate `this.whitexys`, storing (x,y) position of all white pixels
    calcWhitePixel() {
        // this.lumapixels = new Float32Array(this.n);
        this.whitexys = [];
        this.imgdata_ori = this.ctx_ori.getImageData(0, 0, this.canvas_ori.width, this.canvas_ori.height);
        this.pixels_ori = this.imgdata_ori.data;
        let nx = this.canvas_ori.width;
        // let ny = this.canvas.height;
        for (let i = 0; i < this.n; i++) {
            let p = 4 * i;
            let rgb = [this.pixels_ori[p + 0], this.pixels_ori[p + 1], this.pixels_ori[p + 2]];
            let luma = rgbtoluma(rgb);
            // this.lumapixels[i] = luma;
            if (luma >= this.min_luma) {
                // if (luma < this.min_luma){
                this.whitexys.push([i % nx, Math.floor(i / nx)]);
            }
        }
    }
    // calculate (x,y) position of the target
    calcTarget() {
        this.targetxys = [];
        // be generous, assume each circle fill the area of 3.3 r^2
        let area_circle = 3.3 * this.radius_circle * this.radius_circle;
        let n_target = Math.floor(this.whitexys.length / area_circle);
        n_target = Math.min(n_target, this.circles.length);
        let N_limit = 10 * n_target; // number of sample to take
        let rspace = 2 * this.radius_circle; // min distance from other target
        let rspace2 = rspace * rspace;
        // sample random point from `this.whitexys`
        for (let i = 0; i < N_limit; i++) {
            let id = ~~(Math.random() * this.whitexys.length);
            let [x, y] = this.whitexys[id];
            let valid = true;
            for (let j = 0; j < this.targetxys.length; j++) {
                let [ax, ay] = this.targetxys[j];
                let dist2 = (ax - x) * (ax - x) + (ay - y) * (ay - y);
                if (dist2 <= rspace2) {
                    // too close to another target
                    valid = false;
                    break;
                }
            }
            if (valid) {
                this.targetxys.push([x, y]);
                if (this.targetxys.length >= n_target)
                    break;
            }
        }
        this.applyTarget();
    }
    applyTarget() {
        let availcircles = [...this.circles];
        let availtarget = [];
        // if a circle (j) is close enough to a target (i), assign em
        let tol_dist = 2 * this.radius_circle;
        for (let i = 0; i < this.targetxys.length; i++) {
            let found = false;
            let [xt, yt] = this.targetxys[i];
            for (let j = 0; j < availcircles.length; j++) {
                let c = availcircles[j];
                let dist2 = (xt - c.x) * (xt - c.x) + (yt - c.y) * (yt - c.y);
                if (dist2 <= tol_dist * tol_dist) {
                    // found circle-target match
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
        // assign the rest of the circles and targets, assign the closest first
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
        // unused circles
        for (let i = 0; i < availcircles.length; i++) {
            availcircles[i].targetx = 0;
            availcircles[i].targety = 0;
        }
    }
    updateCircles() {
        for (let c of this.circles)
            c.update();
    }
    drawCircles() {
        for (let c of this.circles)
            c.draw(this.ctx_cir, this.canvas_scale);
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
    constructor(acs, x, y, r, max_vel = 5, max_vel_close = 1) {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 0;
        this.max_vel = 0;
        this.max_vel_close = 0;
        this.done = false;
        this.targetx = 0;
        this.targety = 0;
        this.close_dist2 = 0;
        this.is_close = false;
        this.x = x;
        this.y = y;
        this.targetx = x;
        this.targety = y;
        this.radius = r;
        this.max_vel = max_vel;
        this.max_vel_close = max_vel_close;
        this.acs = acs;
        this.close_dist2 = r * r;
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
        for (let i = 0; i < this.acs.length; i++) {
            let c = this.acs[i];
            let dx = this.x - c.x;
            let dy = this.y - c.y;
            let d2 = dx * dx + dy * dy;
            if (d2 == 0)
                continue;
            let rspace = c.radius * 2;
            if (d2 <= rspace * rspace) {
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
        let maxvel = this.is_close ? this.max_vel_close : this.max_vel;
        let scale = (v <= maxvel) ? 1 : maxvel / v;
        this.vx = vx * scale;
        this.vy = vy * scale;
    }
    calcVelToTarget() {
        let scale = 0.1;
        let dx = (this.targetx - this.x);
        let dy = (this.targety - this.y);
        this.is_close = (dx * dx + dy * dy <= this.close_dist2);
        return [dx * scale, dy * scale];
    }
    debugdone() {
        this.done = true;
    }
    debug_gotoTarget() {
        this.x = this.targetx;
        this.y = this.targety;
    }
    draw(ctx, cscale) {
        ctx.beginPath();
        // ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        let x = (this.x * cscale);
        let y = (this.y * cscale);
        let r = this.radius * cscale;
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        // ctx.fillStyle = this.done? 'white' : 'blue';
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.lineWidth = 0;
        // ctx.strokeStyle = '#aaaaaa';
        ctx.stroke();
    }
}
export { AutoCircle, Board };
