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
    0, 0, 0, 2, 3, 4, 10, 4, 3, 2, 0, 0, 0, 0, 2, 3, 4, 10, 4, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 4, 10
];

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

    const write = (x, v) => {
        console.log("write", x, v, data[x])
    };

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
    let o = 0;

    const getBuffer = (i) => {
        const index = wrap(bi + i, buffer_size);
        const v = buffer[index];
        // console.log(`read i=${i}, v=${v}`)
        return v;
    };

    // The core update function, decoupled from data access and from writing.
    
    const update = (rem, add, read, gen) => {
        left_out -= rem;
        left_in += read(mid);                // right += p;
        left += left_in;                       // sum += right;
        left_out += read(left_out_end);      // left += rem;
        left_in -= read(left_in_start);      // right -= rem;

        right_out -= read(mid - 1);
        right_in += add;
        right += right_in;
        right_out += read(right_out_end);
        right_in -= read(right_in_start);

        quad += right;

        gen(quad / weight);

        quad -= left;
        left -= left_out;           // sum -= left;
        right -= right_out;         // sum -= left;
    };

    // Step 1.
    buffer[mid] = data[0];
    for(let i = 1; i < width; i++) {
        buffer[mid - i] = buffer[mid + i] = data[i];
    }

    // Step 2. Initialize the rolling sums without writing, and flagging
    // buffer accesses to the right of `i` as zero. For this reason, our
    // buffer access function needs to be passed in.

    const initialRead = (i, j) => {
        const v = (i+j+1 < buffer_size ) ? 0 : buffer[(i+j+1) - buffer_size];
        // console.log(`read i=${i}, j=${j}, v=${v}`)
        return v;
    }

    for(let i = 0; i < 2 * radius + 1; i++) {
        let p = buffer[i];
        update(0, p, (j) => initialRead(i, j), (v) => {
            // console.log("step2", new Number(v).toFixed(2), `i=${i}, p=${p}, left=${left}, right=${right}`, "{" + buffer.join(",") + "}");
        });
    }

    bi = 0;
    // console.log(`step2 left=${left}, right=${right}`)

    // Step 3. The main data traverse, across the pixels. The output trails the
    // input by `radius+1`. Therefore, for the starting edge, we need to preload
    // `2*radius` values, but for symmetry, let's just fill the buffer.

    for(let i = radius; i < data.length; i++) {

        let p = data[i];

        // Get the old value and remove it, pushing the new to the end of
        // the queue. The old value is at the end of the buffer, and since we
        // write backwards, that is one below the current bi.

        let new_bi = wrap(bi + 1, buffer_size);
        let old = buffer[bi];
        buffer[bi] = p;
        bi = new_bi;

        update(old, p, getBuffer, (v) => {
            write(o++, v);
            // console.log("step3", new Number(v).toFixed(2), `i=${i}, p=${p}, old=${old}, left=${left}, right=${right}`, "{" + buffer.join(",") + "}");
        });
    }

    for(let i = 0; i < radius; i++) {
        // Read a value backwards
        const ix = wrap(buffer_size + bi - 2*(i + 1), buffer_size);
        const p = buffer[ix];

        let new_bi = wrap(bi + 1, buffer_size);
        let old = buffer[bi];
        buffer[bi] = p;
        bi = new_bi;

        update(old, p, getBuffer, (v) => {
            write(o++, v);
            // console.log("step4", new Number(v).toFixed(2), `i=${i}, p=${p}, old=${old}, left=${left}, right=${right}`, "{" + buffer.join(",") + "}");
        });
    }
}

quadratic_blur(EDGE_DATA, 5);
