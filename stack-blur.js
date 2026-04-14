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
        const value = sum / (WIDTH * WIDTH);
        
        sum -= left;

        console.log(new Number(value).toFixed(2), sum, left, right, "{ " + buffer.join(", ") + "}");
    }
}

stack_blur(DATA);

