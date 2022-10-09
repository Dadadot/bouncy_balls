// declare variables
const FPS = 60;
const bs_max = 20;
const bs_min = 5;
const ball_count = 50;
const speed_max = 2;
const speed_min = 0.4;
let balls = [];
let canvas, context;
let interval = null;
let btn = document.querySelector("#ss_button");
// load canvas
canvas = document.getElementById("gameCanvas");
const c_width = canvas.width;
const c_height = canvas.height;
context = canvas.getContext("2d");

create_balls();
// set up interval (game loop)
update();
btn.addEventListener("click", function() {
    if (interval === null) {
        interval = setInterval(update, 1000 / FPS);
    } else {
        clearInterval(interval);
        interval = null;
    }
});

// update function
function update() {
    // draw background
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    balls.forEach(draw_balls);
    balls.sort((a, b) => a[0][0] - b[0][0]);
    collision_manager();
    balls.map(mutate_balls);
}

function collision_manager() {
    let collisions, x_intersections;
    x_intersections = collect_x_intersection();
    if (x_intersections.length > 0) {
        collisions = examine_x_intersections(x_intersections);
        if (collisions) {
            resolve_collisions(collisions);
        }
    } else {
        return false;
    }
}

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
        if (!(dist >= 0 && dist <= max_dist * 2)) {
            inter_i += 1;
        }
    });
    intersections = intersections.filter((sub_arr) => sub_arr.length > 1);
    return intersections;
}

//https://www.youtube.com/watch?v=f1zLSpzCh9E
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
    if (dist >= 0 && dist <= max_dist - 1) {
        return true;
    }
    return false;
}

// https://www.vobarian.com/collisions/2dcollisions2.pdf
function resolve_collisions(coll_in) {
    coll_in.forEach(function(coll) {
        let b1 = balls[coll[0]];
        let b1v0 = b1[1];
        let b1m = b1[2][0];
        let b2 = balls[coll[1]];
        let b2v0 = b2[1];
        let b2m = b2[2][0];
        let normal = [b1[0][0] - b2[0][0], b1[0][1] - b2[0][1]];
        let normal_magnitute = Math.sqrt(normal[0] ** 2 + normal[1] ** 2);
        let un = normal.map(val => val / normal_magnitute);
        let ut = [-un[1], un[0]];
        let b1vn0 = un[0] * b1v0[0] + un[1] * b1v0[1];
        let b1vt0 = ut[0] * b1v0[0] + ut[1] * b1v0[1];
        let b2vn0 = un[0] * b2v0[0] + un[1] * b2v0[1];
        let b2vt0 = ut[0] * b2v0[0] + ut[1] * b2v0[1];
        let b1vt1 = b1vt0;
        let b2vt1 = b2vt0;
        let b1vn1 = (b1vn0 * (b1m - b2m) + 2 * b2m * b2vn0) / (b1m + b2m);
        let b2vn1 = (b2vn0 * (b2m - b1m) + 2 * b1m * b1vn0) / (b1m + b2m);
        b1vn1 = un.map(val => val * b1vn1);
        b1vt1 = ut.map(val => val * b1vt1);
        b2vn1 = un.map(val => val * b2vn1);
        b2vt1 = ut.map(val => val * b2vt1);
        b1[1] = b1vn1.map((val, i) => val + b1vt1[i]);
        b2[1] = b2vn1.map((val, i) => val + b2vt1[i]);
    });
}

function mutate_balls(ball) {
    let [bx, by] = ball[0];
    let [xv, yv] = ball[1];
    const bs = ball[2][0];
    bx = bx + xv;
    by = by + yv;
    if (bx - bs < 0 && xv < 0) {
        xv = -xv;
    }
    if (bx + bs > canvas.width && xv > 0) {
        xv = -xv;
    }
    if (by - bs < 0 && yv < 0) {
        yv = -yv;
    }
    if (by + bs > canvas.height && yv > 0) {
        yv = -yv;
    }
    ball[0] = [bx, by];
    ball[1] = [xv, yv];
    return ball;
}

function draw_balls(ball) {
    let [bx, by] = ball[0];
    let color = ball[2][1];
    let bs = ball[2][0];
    context.beginPath();
    context.fillStyle = color;
    context.arc(bx, by, bs, 0, 2 * Math.PI, false);
    context.fill();
}

function create_balls() {
    for (let i = 0; i < ball_count; i++) {
        let new_ball, bx, by, xv, yv, bs, color;
        // ball starting position
        bs = Math.random() * (bs_max - bs_min) + bs_min;


        // random ball starting speed (between 25 and 100 pps)
        xv = Math.random() * speed_max + speed_min;
        yv = Math.random() * speed_max + speed_min;

        // random ball direction
        if (Math.floor(Math.random() * 2) == 0) {
            xv = -xv;
        }
        if (Math.floor(Math.random() * 2) == 0) {
            yv = -yv;
        }
        color = rand_color();
        let min = bs * 2;
        while (true) {
            bx = Math.random() * (c_width - min - min) + min;
            by = Math.random() * (c_height - min - min) + min;
            new_ball = [[bx, by], [xv, yv], [bs, "#0000FF"]];
            if (balls.length === 0) {
                balls.push(new_ball);
                break;
            }
            let coll_tmp = balls.filter(ball1 => verify_collision(ball1, new_ball));
            if (coll_tmp.length === 0) {
                balls.push(new_ball);
                break;
            }
        }
    }
}

function rand_color() {
    let r = Math.floor(Math.random() * 256).toString(16);
    let g = Math.floor(Math.random() * 256).toString(16);
    let b = Math.floor(Math.random() * 256).toString(16);
    return ["#", r, g, b].join("");
}
