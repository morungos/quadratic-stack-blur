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

