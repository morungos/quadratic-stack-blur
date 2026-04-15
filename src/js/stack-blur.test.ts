import { describe, it, expect } from 'vitest';

import fs from 'node:fs';
import path from 'node:path';
import { decode, encode } from "fast-png";

describe('image test', () => {

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
