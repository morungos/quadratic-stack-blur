/**
 * A fixed stack blur, of radius one. This is a fallback for when someone tries
 * a quadratic stack blur with a radius of one, which doesn't work. This is
 * simpler than the quadratic stack blur, but we still need to handle the
 * reflecting edge cases. Fortunately, because there is no accumulating needed,
 * this is much simpler, but apart from the radius, we keep the API just as
 * simple.
 *
 * @param data 
 * @param origin 
 * @param stride 
 * @param count 
 */
export function stackBlurOne(data: Uint8Array, origin: number, stride: number, count: number) {

    const width = 2;
    const buffer_size = 2 * 1 + 1;
    const weight = (width * width);

    const buffer = new Array(buffer_size).fill(0);
    
    let left: number = 0, right: number = 0;
    let sum: number = 0;
    let bi: number = 0;
    let o: number = 0;

    for(let i = 0; i < count; i++) {

        let p = data[origin + i*stride];

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
        data[origin + (o++)*stride] = Math.round(sum / weight);
        
        sum -= left;

        // console.log(new Number(value).toFixed(2), p, sum, left, right, "{ " + buffer.join(", ") + "}");
    }
}
