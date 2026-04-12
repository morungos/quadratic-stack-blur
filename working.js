// Working file for the stack blur

const RADIUS = 2;
const WIDTH = RADIUS + 1;
const BUFFER_SIZE = 2 * RADIUS + 1;
const ACC_WIDTH = Math.floor((WIDTH + 1) / 2);
const WEIGHT = ACC_WIDTH * (WIDTH - ACC_WIDTH) * WIDTH;

// To start, assume we are zero to infinity
const BUFFER = new Array(BUFFER_SIZE).fill(0);

const DATA = [
    0, 0, 0, 0, 0, 10, 0, 0, 10, 20, 15, 11, 12, 5, 0, 0, 0, 0, 0, 0, 20, 10, 0, 0, 10, 0, 0, 0, 0, 0, 0
];

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
    sum += right;

    // Output
    console.log(new Number(sum / (WIDTH * WIDTH)).toFixed(2), sum, left, right, "{ " + BUFFER.join(", ") + "}");
    
    sum -= left;
    right -= rem;
}

/**
 * The primary difference between a regular stack blur and a quadratic one is
 * that we need to have four main blocks, rather than two, and an additional
 * level to the pyramid of sums. It would be nice if we could make all this very
 * much simpler, but that is definitely a challenge.
 *
 * Another way to think about it is two offset stack blurs each generating a
 * value and then as per usual summing the differences.
 */

