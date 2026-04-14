const RADIUS = 1;
const WIDTH = RADIUS + 1;
const BUFFER_SIZE = 2 * RADIUS + 1;

const DATA = [
    0, 0, 0, 0, 0, 1, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

function stack_blur(data) {
    const buffer = new Array(BUFFER_SIZE).fill(0);
    
    let left = 0, right = 0;
    let sum = 0;
    let bi = 0;
    for(let i = 0; i < data.length; i++) {

        let p = data[i];

        let old = buffer[bi];
        buffer[bi] = p;
        bi = bi == BUFFER_SIZE - 1 ? 0 : bi + 1;

        // Get the old value and remove it, replacing with the new
        left -= old;

        // Pick mid point, remove from right and add to left
        let next = bi + 1 == BUFFER_SIZE ? 0 : bi + 1;
        let rem = buffer[next];
        right += p;
        left += rem;
        sum += right;
        right -= rem;

        // Output
        const value = sum / (WIDTH * WIDTH);
        
        sum -= left;

        console.log(new Number(value).toFixed(2), p, sum, left, right, "{ " + buffer.join(", ") + "}");
    }
}

stack_blur(DATA);

