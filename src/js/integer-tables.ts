/**
 * It would be handy to compute our scaling factors using integer tables. This
 * code takes an array of weight factors, divisors, and builds a table of
 * small-ish numbers and shift factors that are close approximations.
 */

type Estimate = {
    multiplier: number;
    shift: number;
    epsilon: number;
};

// Note that shifting rounds down, which is annoying, because it means
// that an exact value might well end up being lost. For example, if we
// want to do division by 12 (a real example), we get a multiplier of
// 341 and a shift of 12. Try that on 12 itself, and you get zero. not
// one. So strictly, we should handle that.

function tryFactors(estimate: Estimate, weight: number, multiplier: number, shift: number) {
    const epsilon = (multiplier * 1.0/(1 << shift) - weight) / weight;
    if (epsilon >= 0 && multiplier <= MAX_MULTIPLIER && epsilon < estimate.epsilon) {
        estimate.multiplier = multiplier;
        estimate.shift = shift;
        estimate.epsilon = epsilon;
    }
}

const MAX_MULTIPLIER = 512;

/**
 * Finds the best usable estiimate assuming a 24-bit shift maximum, and a
 * multiplier within a given range. The basic process involves iterating through
 * shifts and choosing adjacent multipliers, checking both for accuracy, picking 
 * the best, and repeating. The weight will generally be a number between 1 and 
 * zero, closer to zero.
 *
 * @param divisor 
 */
export function getBestEstimate(weight: number): Estimate {
    let estimate: Estimate = {
        multiplier: 0,
        shift: 0,
        epsilon: Number.POSITIVE_INFINITY
    };
    for(let shift = 0; shift <= 24; shift++) {
        const shift_factor = 1.0 / (1 << shift);
        const above = Math.ceil(weight / shift_factor);
        const below = Math.floor(weight / shift_factor);
        tryFactors(estimate, weight, above, shift);
        tryFactors(estimate, weight, below, shift);
    }
    return estimate;
}

type WeightTables = {
    multipliers: Array<number>,
    shifts: Array<number>
};

export function makeTables(): WeightTables {
    const table: WeightTables = {
        multipliers: new Array(64).fill(0),
        shifts: new Array(64).fill(0),
    }
    for(let r = 2; r < 64; r++) {
        const width = r + 1;
        const acc_width = (r) >> 1;
        const weight = acc_width * (width - acc_width + 1) * (width + 1);

        const estimate = getBestEstimate(1.0 / (weight));
        table.multipliers[r] = estimate.multiplier;
        table.shifts[r] = estimate.shift;
    }
    return table;
}