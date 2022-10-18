const FPS = 60;
const bs_max = 10;
const bs_min = 3;
const speed_max = 1;
const speed_min = 0.2;
const error_margin = 1;
const start_pause_b = document.querySelector("#ss_button");
const one_frame_back_b = document.querySelector("#one_frame_back");
const one_frame_forward_b = document.querySelector("#one_frame_forward");
const five_frames_back_b = document.querySelector("#five_frames_back");
const five_frames_forward_b = document.querySelector("#five_frames_forward");
const reload_b = document.querySelector("#reload");
const canvas = document.getElementById("gameCanvas");
const c_width = canvas.width;
const c_height = canvas.height;
const context = canvas.getContext("2d");
let energy_loss = document.getElementById("energy_loss").value;
let ball_count = document.getElementById("ball_amount").value;
let grav = document.getElementById("gravity_amount").value;
let history = [];
let balls = [];
let interval = null;

function main() {
    create_balls();
    draw_canvas();
    balls.forEach(draw_balls);
    start_pause_b.addEventListener("click", start_pause);
    one_frame_forward_b.addEventListener("click", function() { forward(1); });
    five_frames_forward_b.addEventListener("click", function() { forward(10); });
    one_frame_back_b.addEventListener("click", function() { backward(1); });
    five_frames_back_b.addEventListener("click", function() { backward(10); });
    reload_b.addEventListener("click", reload);
}

function update() {
    balls.map(mutate_ball);
    balls.sort((a, b) => a[0][0] - b[0][0]);
    collision_manager();
    history.push(structuredClone(balls));
    draw_canvas();
    balls.forEach(draw_balls);
    if (history.length === 1000) {
        history.shift();
    }
}

// button event and related functions

function start_pause() {
    if (interval === null) {
        interval = setInterval(update, 1000 / FPS);
    } else {
        clearInterval(interval);
        interval = null;
    }
}

function reload() {
    pause();
    read_input_values();
    if (ball_count > 1000) { ball_count = 1000 };
    history = [];
    balls = [];
    create_balls();
    draw_canvas();
    balls.forEach(draw_balls);
}

function read_input_values() {
    ball_count = document.getElementById("ball_amount").value;
    grav = document.getElementById("gravity_amount").value;
    energy_loss = document.getElementById("energy_loss").value;
}

function backward(frames) {
    pause();
    let state = null;
    for (let i = 0; i < frames; i++) {
        state = history.pop();
        // when coming from forward the first popped frame is the current board
        // state. So pop again
        if (balls.every((ball, index) => ball[0][1] === state[index][0][1])) {
            state = history.pop();
        }
    }
    balls = state;
    draw_canvas();
    state.forEach(draw_balls);
}

function forward(frames) {
    pause();
    for (let i = 0; i < frames; i++) {
        update();
    }
}

function pause() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
}

// collision related functions

function collision_manager() {
    let collisions, x_intersections;
    x_intersections = collect_x_intersection();
    if (x_intersections.length > 0) {
        collisions = examine_x_intersections(x_intersections);
        if (collisions) {
            resolve_collision(collisions);
        }
    } else {
        return false;
    }
}

// check which balls intersect at x to further examine via manager
// reduces total amount of checks needed
function collect_x_intersection() {
    let intersections = [];
    let inter_i = 0;

    balls.forEach(function(ball, index) {
        if (!intersections[inter_i]) {
            intersections[inter_i] = [];
        }
        intersections[inter_i].push(index);
        if (!balls[index + 1]) {
            return;
        }
        const b1x = ball[0][0];
        const b1s = ball[2][0];
        const b2x = balls[index + 1][0][0];
        const b2s = balls[index + 1][2][0];
        const max_dist = b1s + b2s;
        const dist = Math.abs(b1x - b2x);
        if (!(dist >= 0 && dist <= max_dist + error_margin)) {
            inter_i += 1;
        }
    });
    intersections = intersections.filter((sub_arr) => sub_arr.length > 1);
    return intersections;
}

//https://www.youtube.com/watch?v=f1zLSpzCh9E
//i heard you like arrays
function examine_x_intersections(x_intersections) {
    let coll_return = [];
    x_intersections.forEach(function(x_inters_sub) {
        x_inters_sub.forEach(function(key, index, sub_arr) {
            for (let i = index + 1; i < sub_arr.length; i++) {
                let key2 = sub_arr[i];
                if (balls[key2]) {
                    if (verify_collision(balls[key], balls[key2])) {
                        coll_return.push([key, key2]);
                    }
                }
            }
        });
    });
    if (coll_return.length === 0) {
        return false;
    }
    return coll_return;
}

function verify_collision(ball1, ball2) {
    const b1x = ball1[0][0];
    const b1y = ball1[0][1];
    const b1s = ball1[2][0];
    const b2x = ball2[0][0];
    const b2y = ball2[0][1];
    const b2s = ball2[2][0];
    const max_dist = b1s + b2s;
    const dist = Math.sqrt((b1x - b2x) ** 2 + (b1y - b2y) ** 2);
    if (dist >= 0 && dist <= max_dist + error_margin) {
        return true;
    }
    return false;
}

// https://www.vobarian.com/collisions/2dcollisions2.pdf
// the above with some additions from myself (the ugly bits)
function resolve_collision(coll_in) {
    coll_in.forEach(function(coll) {
        const b1 = balls[coll[0]];
        const b1v0 = b1[1];
        const b1m = b1[2][0];
        const b1s = b1[2][0];
        const b2 = balls[coll[1]];
        const b2v0 = b2[1];
        const b2m = b2[2][0];
        const b2s = b2[2][0];
        let normal = [b1[0][0] - b2[0][0], b1[0][1] - b2[0][1]];
        let normal_magnitute = Math.sqrt(normal[0] ** 2 + normal[1] ** 2);
        // if (check_near_collision(b1, b2)) {
        //     return;
        // }
        if (normal_magnitute < b1s + b2s + error_margin) {
            let n_mag_tmp = (normal_magnitute - (b1s + b2s + error_margin)) / normal_magnitute;
            let normal_x_tmp = Math.abs(normal[0] * n_mag_tmp);
            let normal_y_tmp = Math.abs(normal[1] * n_mag_tmp);
            if (b1[0][0] > b2[0][0]) {
                b1[0][0] += normal_x_tmp / 2;
                b2[0][0] -= normal_x_tmp / 2;
            } else {
                b1[0][0] -= normal_x_tmp / 2;
                b2[0][0] += normal_x_tmp / 2;
            }
            if (b1[0][1] > b2[0][1]) {
                b1[0][1] += normal_y_tmp / 2;
                b2[0][1] -= normal_y_tmp / 2;
            } else {
                b1[0][1] -= normal_y_tmp / 2;
                b2[0][1] += normal_y_tmp / 2;
            }
        }
        const un = normal.map((val) => val / normal_magnitute);
        const ut = [-un[1], un[0]];
        const b1vn0 = un[0] * b1v0[0] + un[1] * b1v0[1];
        const b1vt0 = ut[0] * b1v0[0] + ut[1] * b1v0[1];
        const b2vn0 = un[0] * b2v0[0] + un[1] * b2v0[1];
        const b2vt0 = ut[0] * b2v0[0] + ut[1] * b2v0[1];
        let b1vt1 = b1vt0;
        let b2vt1 = b2vt0;
        let b1vn1 = (b1vn0 * (b1m - b2m) + 2 * b2m * b2vn0) / (b1m + b2m);
        let b2vn1 = (b2vn0 * (b2m - b1m) + 2 * b1m * b1vn0) / (b1m + b2m);
        b1vn1 = un.map((val) => val * b1vn1);
        b1vt1 = ut.map((val) => val * b1vt1);
        b2vn1 = un.map((val) => val * b2vn1);
        b2vt1 = ut.map((val) => val * b2vt1);
        b1[1] = b1vn1.map((val, i) => val + b1vt1[i]);
        b2[1] = b2vn1.map((val, i) => val + b2vt1[i]);
        //if balls are overlapping push them apart along the normal vector
        //(or something like that)
        //seems to work, no clue if that's the correct way to do it
        // normal = [b1[0][0] - b2[0][0], b1[0][1] - b2[0][1]];
        // normal_magnitute = Math.sqrt(normal[0] ** 2 + normal[1] ** 2) * energy_loss;
    });
}

// misc functions 

function create_balls() {
    for (let i = 0; i < ball_count; i++) {
        let new_ball, bx, by, xv, yv, bs, color;
        bs = Math.random() * (bs_max - bs_min) + bs_min;
        xv = Math.random() * speed_max + speed_min;
        yv = Math.random() * speed_max + speed_min;
        if (Math.floor(Math.random() * 2) == 0) {
            xv = -xv;
        }
        if (Math.floor(Math.random() * 2) == 0) {
            yv = -yv;
        }
        color = rand_color();
        const min = bs * 2;
        while (true) {
            bx = Math.random() * (c_width - min - min) + min;
            by = Math.random() * (c_height - min - min) + min;
            new_ball = [
                [bx, by],
                [xv, yv],
                [bs, color, i],
            ];
            if (balls.length === 0) {
                balls.push(new_ball);
                break;
            }
            let coll_tmp = balls.filter((ball1) =>
                verify_collision(ball1, new_ball)
            );
            if (coll_tmp.length === 0) {
                balls.push(new_ball);
                break;
            }
        }
    }
}

function rand_color() {
    let rgb = [];
    for (let i = 0; i < 3; i++) {
        //create random Hex string for each r/g/b
        rgb.push(Math.floor(Math.random() * 256).toString(16));
    }
    //make every color string 2 symbols long
    rgb = rgb.map((val) => ("0" + val).slice(-2));
    //adds # to the front
    rgb.splice(0, 0, "#");
    //returns array as string
    return rgb.join("");
}

function mutate_ball(ball) {
    let [bx, by] = ball[0];
    let [xv, yv] = ball[1];
    const bs = ball[2][0];
    yv -= grav;
    bx = bx + xv;
    by = by + yv;
    if (bx - bs < 0 && xv < 0) {
        xv = -xv;
    }
    if (bx + bs > canvas.width && xv > 0) {
        xv = -xv;
    }
    if (by - bs < 0 && yv < 0) {
        if (grav > 0) {
            yv = -(yv - grav / energy_loss);
        } else {
            yv = -yv
        }
    }
    if (by + bs > canvas.height && yv > 0) {
        yv = -yv;
    }
    ball[0] = [bx, by];
    ball[1] = [xv, yv];
    return ball;
}

function draw_canvas() {
    context.fillStyle = "#12161f";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function draw_balls(ball) {
    let [bx, by] = ball[0];
    let color = ball[2][1];
    let bs = ball[2][0];
    context.beginPath();
    context.fillStyle = color;
    context.arc(bx, by, bs, 0, 2 * Math.PI, false);
    context.fill();
    // context.fillStyle = "red";
    // context.textAlign = "center";
    // context.fillText("", bx, by);
}

main();
