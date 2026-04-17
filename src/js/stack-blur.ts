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

    const radius = 1;
    const width = radius + 1;
    const buffer_size = 2 * radius + 1;
    const weight = (width * width);

    const buffer = new Array(buffer_size).fill(0);
    
    let left: number = 0, right: number = 0;
    let sum: number = 0;
    let bi: number = 0;
    let o: number = 0;

    // Initialization here is relatively simple, but we still need to 
    // write the first pixel. However, it looks like we might have slightly
    // messed this transition in the quadratic.

    buffer[1] = data[origin];
    buffer[0] = data[origin + 1*stride];

    left = buffer[0];
    right = buffer[1];
    sum = left + right;

    //data[origin + (o++)*stride] = Math.round((2 * buffer[0] + buffer[1]) / weight);
    // // data[origin + (o++)*stride] = Math.round((2 * buffer[0] + 2 * buffer[1]) / weight);
    //console.log("output o=0", 2 * buffer[0] + buffer[1], `left=${left}, right=${right}, sum=${sum}`, buffer);
    // // console.log("output", 1, 2 * buffer[0] + 2 * buffer[1], `left=${left}, right=${right}, sum=${sum}`, buffer);
    bi = 2;

    for(let i = 1; i < count; i++) {

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
        const osum = sum;
        const out = Math.round(sum / weight);
        const outi = o++;
        data[origin + outi*stride] = out;
        
        sum -= left;

        console.log(`stat o=${outi}`, `p=${p}, i=${i}, left=${left}, right=${right}, sum=${sum}, osum=${osum}, bi=${bi}`, buffer)

        // console.log(new Number(value).toFixed(2), p, sum, left, right, "{ " + buffer.join(", ") + "}");
    }

    // At the end, we need a slightly different calculation -- again one which 
    // matches the mirroring logic, and again one which doesn't require additional
    // memory accesses.

    let next = bi + 1 == buffer_size ? 0 : bi + 1;
    sum = right + sum + buffer[next];
    const out = Math.round(sum / weight);
    console.log("end", o, count, out, sum);
    data[origin + (o++)*stride] = out;
}
