/**
 * It would be handy to compute our scaling factors using integer tables
 */

export function makeTables() {
    for(let r = 2; r < 64; r++) {
        const width = r + 1;
        const acc_width = (r) >> 1;
        const weight = acc_width * (width - acc_width + 1) * (width + 1);

        let n: number = 0
        let f: number = 0;
        let v: number = 0;
        for(f = 0; f <= 24; f++) {
            n = 1 << f;
            v = Math.round((1/weight) * n);
            if (v >= 128) {
                break;
            }
        }

        console.log("Value", r, weight, f, v, Math.abs(1.0/weight - (1.0 * v / (1 << f))));
    }
}