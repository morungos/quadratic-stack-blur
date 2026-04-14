// Working file for the stack blur

const RADIUS = 2;
const WIDTH = RADIUS + 1;
const BUFFER_SIZE = 2 * RADIUS + 1;
const ACC_WIDTH = Math.floor((WIDTH + 1) / 2);
const WEIGHT = ACC_WIDTH * (WIDTH - ACC_WIDTH) * WIDTH;

// To start, assume we are zero to infinity

const DATA = [
    0, 0, 0, 0, 0, 0, 0, 2, 3, 4, 10, 4, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

const EDGE_DATA = [
    10, 4, 3, 2, 0, 0, 0, 2, 3, 4, 10, 4, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

function stack_blur(data) {
    const buffer = new Array(BUFFER_SIZE).fill(0);
    
    let left = 0, right = 0;
    let sum = 0;
    for(let i = 0; i < data.length; i++) {

        let p = data[i];

        // Get the old value and remove it, replacing with the new
        let old = buffer.shift();
        buffer.push(p);
        left -= old;

        // Pick mid point, remove from right and add to left
        let rem = buffer[RADIUS];
        right += p;
        left += rem;
        sum += right;
        right -= rem;

        // Output
        console.log(new Number(sum / (WIDTH * WIDTH)).toFixed(2), sum, left, right, "{ " + buffer.join(", ") + "}");
        
        sum -= left;
    }
}

// stack_blur(DATA);

/**
 * The primary difference between a regular stack blur and a quadratic one is
 * that we need to have four main blocks, rather than two, and an additional
 * level to the pyramid of sums. It would be nice if we could make all this very
 * much simpler, but that is definitely a challenge.
 *
 * Another way to think about it is two offset stack blurs each generating a
 * value and then as per usual summing the differences. They all operate in
 * basically the same way, but now we need to move four points across four
 * running sums (not two), then propagate upwards to two levels (not one). Or,
 * you can think of it as two mini stack blurs running across the image like a
 * train, with a running super-sum tracking the overall sum.
 *
 * At this point, we are still not worried about edge effects. We will handle
 * those later, by carefully assessing how we track a mirrored edge. My guess is
 * a mirrored edge will be fairly simple, as the sums should be symmetric, so we
 * should be able to process them in a single pass over the edge.
 */

function format_subseq(a, start, end) {
    return "{" + a.slice(start, end + 1).join(",") + "}";
}

// Handle buffer wrapping -- assuming x is within bounds.
// This is an alternative to modulo/remainder
function wrap(x, limit) {
    let r = x - (x >= limit ? limit : 0);
    return r;
}

// Edge handling. Due to the way we sum sums, we cannot really compute by any
// sensible method other than actually working through the data. Fortunately,
// our main update step is relatively simple. Mainly, it is a case of decoupling
// the update from data generation.

function quadratic_blur(data, radius) {
    const buffer_size = 2 * radius + 1;
    const buffer = new Array(buffer_size).fill(0);

    const width = radius + 1;
    const acc_width = (radius) >> 1;
    const weight = acc_width * (width - acc_width + 1) * (width + 1);

    let bi = 0;

    let left = 0, right = 0;
    let left_in = 0, left_out = 0;
    let right_in = 0, right_out = 0;
    let quad = 0;

    let mid = radius;
    let right_limit = radius << 1;
    let left_limit = 0;
    let left_out_end = left_limit + acc_width;
    let left_in_start = mid - acc_width;
    let right_out_end = mid + acc_width;
    let right_in_start = right_limit - acc_width;

    const getBuffer = (i) => {
        const index = wrap(bi + i, buffer_size);
        const v = buffer[index];
        return v;
    };

    // The core update function, decoupled from data access and from writing.
    
    const update = (rem, add, gen) => {
        left_out -= rem;
        left_in += getBuffer(mid);                // right += p;
        left += left_in;                       // sum += right;
        left_out += getBuffer(left_out_end);      // left += rem;
        left_in -= getBuffer(left_in_start);      // right -= rem;

        right_out -= getBuffer(mid - 1);
        right_in += add;
        right += right_in;
        right_out += getBuffer(right_out_end);
        right_in -= getBuffer(right_in_start);

        quad += right;

        gen(quad / weight);

        quad -= left;
        left -= left_out;           // sum -= left;
        right -= right_out;         // sum -= left;
    };

    // The main data traverse, across the pixels. 
    for(let i = 0; i < data.length; i++) {

        let p = data[i];

        // Get the old value and remove it, pushing the new to the end of
        // the queue. The old value is at the end of the buffer, and since we
        // write backwards, that is one below the current bi.

        let new_bi = wrap(bi + 1, buffer_size);
        let old = buffer[bi];
        buffer[bi] = p;
        bi = new_bi;

        update(old, p, (v) => console.log("step3", new Number(v).toFixed(2), `left=${left}, right=${right}`, "{" + buffer.join(",") + "}"));
    }
}

quadratic_blur(DATA, 5);
