import { describe, test, expect } from 'vitest';

import fs from 'node:fs';
import path from 'node:path';
import { decode, encode } from "fast-png";
import { fromHex, toHex } from "uint8array-tools"

import { quadraticStackBlur } from './quadratic-stack-blur';
import { stackBlurOne } from './stack-blur';
import { makeTables } from './integer-tables';

describe('quadraticStackBlur', () => {

    test('simple test in row middle', () => {
        const data = fromHex("000000000000000203040a0403020000000000000000000000000000");
        const count = data.length;
        quadraticStackBlur(data, 0, 1, count, 5);
        expect(toHex(data)).toBe("00000000000102020304040403020201000000000000000000000000");
    });

    test('bigger tests in row middle', () => {
        const data = fromHex("000000000000000000000203040a040a04030200000000000000000000000203040a040302000000000000000000000203040a0403040a04030200000000000");
        const count = data.length;
        quadraticStackBlur(data, 0, 1, count, 5);
        expect(toHex(data)).toBe("000000000000000001020304050506050504030201000000000000000102020304040403020201000000000000010202030405050505050403020201000000");
    });

    test('edge tests', () => {
        const data = fromHex("040a04030200000000000000000000000203040a040302000000000000000000000203040a0403");
        const count = data.length;
        quadraticStackBlur(data, 0, 1, count, 5);
        expect(toHex(data)).toBe("060505040302010000000000000001020203040404030202010000000000000102020304050505");
    });

    test('simple test on edges', () => {
        const data = fromHex("0000000203040a040302000000000203040a040302000000000000000000000000000203040a");
        const count = data.length;
        quadraticStackBlur(data, 0, 1, count, 5);
        expect(toHex(data)).toBe("0101020203040404030202010102020304040403020201000000000000000000010202030404");
    });

    test('works on an entire image', async () => {
        
        const test_file = path.join(__dirname, '..', '..', 'data', 'image.png')
        const data = fs.readFileSync(test_file);
        const png = decode(data);

        // This is greyscale data, 1 byte per pixel.
        const image = new Uint8Array(png.data.buffer);

        // Now we get do a more interesting test, at last
        for(let y = 0; y < png.height; y++) {
            quadraticStackBlur(image, y*png.width, 1, png.width, 5);
        }
        for(let x = 0; x < png.width; x++) {
            quadraticStackBlur(image, x, png.width, png.height, 5);
        }

        const buffer = encode(png);
        const output_file = path.join(__dirname, '..', '..', 'output.png')
        fs.writeFileSync(output_file, buffer);
    });

});

describe('stackBlurOne', () => {
    test('is correct in body data', () => {
        const data = fromHex("000000000000000203040a0403020000000000000000000000000000");
        const count = data.length;
        stackBlurOne(data, 0, 1, count);
        expect(toHex(data)).toBe("00000000000001020305070503020100000000000000000000000000");
    });
    test('is correct on data edges', () => {
        const data = fromHex("0a0200000000000000020a020000000003040b04030000000003040b");
        const count = data.length;
        stackBlurOne(data, 0, 1, count);
        expect(toHex(data)).toBe("06040100000000000104060401000001030608060301000001030608");
    });
});

describe('makeTables', () => {
    test('creates the quadratic weights table', () => {
        const table = makeTables();
        expect(table.multipliers[2]).toBe(171);
        expect(table.shifts[2]).toBe(11);
    })
});
