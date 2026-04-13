// Working file for the stack blur

const RADIUS = 2;
const WIDTH = RADIUS + 1;
const BUFFER_SIZE = 2 * RADIUS + 1;
const ACC_WIDTH = Math.floor((WIDTH + 1) / 2);
const WEIGHT = ACC_WIDTH * (WIDTH - ACC_WIDTH) * WIDTH;

// To start, assume we are zero to infinity

const DATA = [
    0, 0, 0, 0, 0, 10, 0, 0, 10, 20, 15, 11, 12, 5, 0, 0, 0, 0, 0, 0, 20, 10, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0
];

const EDGE_DATA = [
    0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
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
    return x - (x > limit ? limit : 0);
}

function quadratic_blur(data, radius) {
    const buffer = new Array(2 * radius + 1).fill(0);

    const width = radius + 1;
    const acc_width = (radius) >> 1;
    const weight = acc_width * (width - acc_width + 1) * (width + 1);

    let left = 0, right = 0;
    let left_in = 0, left_out = 0;
    let right_in = 0, right_out = 0;
    let quad = 0;

    // in and out are coded as follows:
    // left_out, left_in, right_out, right_in

    let mid = radius;
    let right_limit = 2 * radius;
    let left_limit = 0;
    let left_out_end = left_limit + acc_width;
    let left_in_start = mid - acc_width;
    let right_out_end = mid + acc_width;
    let right_in_start = right_limit - acc_width;

    // console.log(`acc_width=${acc_width}, left_limit=${left_limit}, left_out_end=${left_out_end}, mid=${mid}, right_mid=${right_mid}, right_limit=${right_limit}`)
    
    for(let i = 0; i < data.length; i++) {

        let p = data[i];

        // Get the old value and remove it, replacing with the new
        let old = buffer.shift();
        buffer.push(p);

        // Now the counts. We want the left and rights to be effectively
        // their own small stack blurs, although they won't be symmetric.
        // That is not an issue. Start with the lefts alone.

        // let left_move = buffer[left_mid];
        // let right_move = buffer[right_mid];
        
        left_out -= old;
        left_in += buffer[mid];                // right += p;
        left_out += buffer[left_out_end];      // left += rem;
        left += left_in;                       // sum += right;
        left_in -= buffer[left_in_start];      // right -= rem;

        // Right side follows a similar pattern, but is parallel

        right_out -= buffer[mid - 1];
        right_in += p;
        right_out += buffer[right_out_end];
        right += right_in;
        right_in -= buffer[right_in_start];

        quad += right;

        console.log(
            new Number(quad / weight).toFixed(2),
            // 'p', left_limit, left_mid, mid, right_mid, right_limit,
            // 'v', left_move, mid_move,
            // 'left:', left, 'left_in:', left_in, 'left_out:', left_out, 
            // 'right:', right, 'right_in:', right_in, 'right_out:', right_out, 
            // 'left:', left, 'left_in:', left_in, 'left_out:', left_out, 
            // 'v', mid_move, right_move, p,
            // 'right:', right, 'right_in:', right_in, 'right_out:', right_out, 
            // format_subseq(buffer, left_limit, left_out_end),
            // format_subseq(buffer, left_in_start, mid),
            // format_subseq(buffer, mid, right_out_end),
            // format_subseq(buffer, right_in_start, right_limit)
        );

        quad -= left;
        left -= left_out;           // sum -= left;
        right -= right_out;         // sum -= left;
    }
}

quadratic_blur(EDGE_DATA, 5);
