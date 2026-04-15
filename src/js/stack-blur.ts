const DATA = [
    0, 0, 0, 0, 0, 1, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

export function stackBlur(data: Array<number>, radius: number) {

    const width = radius + 1;
    const buffer_size = 2 * radius + 1;

    const buffer = new Array(buffer_size).fill(0);
    
    let left: number = 0, right: number = 0;
    let sum: number = 0;
    let bi: number = 0;
    for(let i = 0; i < data.length; i++) {

        let p = data[i];

        let old = buffer[bi];
        buffer[bi] = p;
        bi = bi == buffer_size - 1 ? 0 : bi + 1;

        // Get the old value and remove it, replacing with the new
        left -= old;

        // Pick mid point, remove from right and add to left
        let next = bi + 1 == buffer_size ? 0 : bi + 1;
        let rem = buffer[next];
        right += p;
        left += rem;
        sum += right;
        right -= rem;

        // Output
        const value = sum / (width * width);
        
        sum -= left;

        console.log(new Number(value).toFixed(2), p, sum, left, right, "{ " + buffer.join(", ") + "}");
    }
}
