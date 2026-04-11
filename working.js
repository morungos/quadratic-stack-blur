// Working file for the stack blur

const RADIUS = 3;
const WIDTH = RADIUS + 1;
const BUFFER_SIZE = 2 * RADIUS + 1;
const ACC_WIDTH = Math.floor((WIDTH + 1) / 2);
const WEIGHT = ACC_WIDTH * (WIDTH - ACC_WIDTH) * WIDTH;

const BUFFER = new Array(BUFFER_SIZE).fill(0);

const DATA = [
    0, 0, 0, 0, 0, 10, 0, 0, 10, 20, 15, 11, 12, 5, 0, 0, 0, 0, 0, 0, 20, 10, 0, 0, 10, 0, 0, 0, 0, 0, 0
];

let qi = 0;
let left = 0, right = 0;
let sum = 0;
for(let i = 0; i < DATA.length; i++) {
    let p = DATA[i];
    let old = BUFFER.shift();
    left -= old;

    BUFFER.push(p);

    let rem = BUFFER[RADIUS];
    right += p;
    left += rem;

    sum += right - left;

    right -= rem;

    qi = (qi + 1) % BUFFER.length;
    console.log(sum / (WIDTH * WIDTH), left, right, "{ " + BUFFER.join(", ") + "}");
}