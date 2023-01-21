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
        this.min_luma = 0.8;
        this.maxdist = canvas_ori.width * canvas_ori.width + canvas_ori.height * canvas_ori.height;
        this.radius_circle = 2;
        this.n_circle = 200;
        this.circles = new Array(this.n_circle);
        for (let i = 0; i < this.n_circle; i++) {
            this.circles[i] = new AutoCircle(Math.random() * this.canvas_ori.width, Math.random() * this.canvas_ori.height, this.radius_circle);
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
                this.whitexys.push([i % nx, Math.floor(i / nx)]);
            }
        }
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
        // this.updateLumaPixels();
        // this.applyAccCircles();
        // this.updateCircles();
    }
    draw() {
        this.ctx_cir.fillStyle = "black";
        this.ctx_cir.fillRect(0, 0, this.canvas_cir.width, this.canvas_cir.height);
        this.drawCircles();
    }
    updateLumaPixels() {
        for (let c of this.circles) {
            let id = Math.floor(c.x) + this.canvas_ori.width * Math.floor(c.y);
            if (this.lumapixels[id] >= this.min_luma)
                this.lumapixels[id] = 0;
        }
    }
    calcVelToWhite(ac) {
        let x = ac.x;
        let y = ac.y;
        if (this.lumapixels[Math.floor(x) + this.canvas_ori.width * Math.floor(y)] >= this.min_luma) {
            // ac.debugdone();
            return [0, 0];
        }
        let nearest_d2 = this.maxdist;
        let nearest_x = x;
        let nearest_y = y;
        for (let [xp, yp] of this.whitexys) {
            let d2 = (xp - x) * (xp - x) + (yp - y) * (yp - y);
            if (d2 < nearest_d2) {
                nearest_d2 = d2;
                nearest_x = xp;
                nearest_y = yp;
            }
        }
        // let nearest_d = Math.sqrt(nearest_d2);
        // console.log(nearest_d2);
        let scale = 0.1;
        let dx = (nearest_x - x);
        let dy = (nearest_y - y);
        return [dx * scale, dy * scale];
    }
    calcVelRepulsion(ac) {
        let vx = 0;
        let vy = 0;
        let scale = 3;
        for (let c of this.circles) {
            let dx = ac.x - c.x;
            let dy = ac.y - c.y;
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
    applyAccCircles() {
        for (let c of this.circles) {
            let [vx1, vy1] = this.calcVelToWhite(c);
            let [vx2, vy2] = this.calcVelRepulsion(c);
            c.setvel(vx1 + vx2, vy1 + vy2);
        }
    }
}
class AutoCircle {
    constructor(x, y, r, max_vel = 5) {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 0;
        this.max_vel = 0;
        this.done = false;
        this.x = x;
        this.y = y;
        this.radius = r;
        this.max_vel = max_vel;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    setvel(vx, vy) {
        let v2 = vx * vx + vy * vy;
        let v = Math.sqrt(v2);
        let scale = (v <= this.max_vel) ? 1 : this.max_vel / v;
        this.vx = vx * scale;
        this.vy = vy * scale;
    }
    debugdone() {
        this.done = true;
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
