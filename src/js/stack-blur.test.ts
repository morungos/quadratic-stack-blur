import { describe, it, expect } from 'vitest';

import fs from 'node:fs';
import path from 'node:path';
import { decode, encode } from "fast-png";
import { fromHex, toHex } from "uint8array-tools"

import { quadraticStackBlur } from './quadratic-stack-blur';

describe('quadratic stack blur', () => {

    it('simple test in row middle', () => {
        const data = fromHex("000000000000000203040a0403020000000000000000000000000000");
        const count = data.length;
        quadraticStackBlur(data, 0, 1, count, 5);
        expect(toHex(data)).toBe("00000000000102020304040403020201000000000000000000000000");
    });

    it('simple test on edges', () => {
        const data = fromHex("0000000203040a040302000000000203040a040302000000000000000000000000000203040a");
        const count = data.length;
        quadraticStackBlur(data, 0, 1, count, 5);
        expect(toHex(data)).toBe("0101020304040404030202010102020304040403020201000000000000000000010202030404");
    });

    it('basic stack blur', async () => {
        
        const test_file = path.join(__dirname, '..', '..', 'data', 'image.png')
        const data = fs.readFileSync(test_file);
        const png = decode(data);

        // This is greyscale data, 1 byte per pixel.

        png.data[0] = 12;
        png.data[1] = 12;
        png.data[3] = 12;

        const buffer = encode(png);
        const output_file = path.join(__dirname, '..', '..', 'output.png')
        fs.writeFileSync(output_file, buffer);
    });

});
