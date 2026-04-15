#include <stdio.h>
#include <stdint.h>
#include <assert.h>

/**
 * Quadratic stack blur implementation.
 * 
 * Copyright (c) Stuart Watt
 * 
 * The aims of this are:
 * 1. Efficient approximation to a gaussian blur
 * 2. Minimal memory access
 * 3. Use reflection at borders
 */

#define MAX_RADIUS (5)

#define WRITE_DATA(i,v) (data[stride*i] = v)

#define GET_BUFFER(i) buffer[]

#define INDEX_MID (r)

// A composable part of the update process. 
#define UPDATE(REM,ADD,GET_BUFFER,WRITE) \
    left_out -= REM; \
    left_in += GET_BUFFER(mid); \
    left += left_in; \
    left_out += GET_BUFFER(left_out_end); \
    left_in -= GET_BUFFER(left_in_start); \
    right_out -= GET_BUFFER(mid - 1); \
    right_in += ADD; \
    right += right_in; \
    right_out += GET_BUFFER(right_out_end); \
    right_in -= GET_BUFFER(right_in_start); \
    quad += right; \
    WRITE(quad / weight); \
    quad -= left; \
    left -= left_out; \
    right -= right_out; 

/**
 * The core quadratic_stack_blur function. This is a good approximation to a
 * gaussian blur, but we don't get a sigma value. The values are written back 
 * to the data source, i.e., the blurring filter works in-place.
 *
 * @param data the source of data
 * @param stride the offset between adjacent values, i.e., 1 for horizontal data
 * @param count the length of the data to be blurred
 * @param r the radius of the blur function
 */
void quadratic_stack_blur(int *data, size_t stride, size_t count, size_t r) {

    // Allow a buffer that's big enough
    int buffer[MAX_RADIUS << 1 + 1];

    const int buffer_size = r << 1 + 1;
    const int width = r + 1;
    const int acc_width = r >> 1;
    const int weight = acc_width * (width - acc_width + 1) * (width + 1);

    int i;
    int bi = 0;
    int left = 0, right = 0;
    int left_in = 0, left_out = 0;
    int right_in = 0, right_out = 0;
    int quad = 0;

    // Initialize the buffer
    buffer[r] = data[0];
    for(i = 1; i < width; i++) {
        buffer[r - i] = buffer[r + i] = data[i * stride];
    }

}
