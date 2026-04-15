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

#define INDEX_MID (r)
#define INDEX_LEFT_LIMIT (0)
#define INDEX_RIGHT_LIMIT (r << 1)
#define INDEX_LEFT_OUT_END (INDEX_LEFT_LIMIT + acc_width)
#define INDEX_LEFT_IN_START (INDEX_MID - acc_width)
#define INDEX_RIGHT_OUT_END (INDEX_MID + acc_width)
#define INDEX_RIGHT_IN_START (INDEX_RIGHT_LIMIT - acc_width)

#define INITIAL_BUFFER(i) i

// A composable part of the update process. The GET_BUFFER and WRITE values are
// expected to be macros in their own right, which vary between the startup,
// main, and closedown stages. REM and ADD are the values to remove and add.
// GET_BUFFER is used with a buffer index, and WRITE is used with a value and 
// writes elements strictly sequentially.

#define UPDATE(REM,ADD,GET_BUFFER,WRITE) \
    left_out -= REM; \
    left_in += GET_BUFFER(INDEX_MID); \
    left += left_in; \
    left_out += GET_BUFFER(INDEX_LEFT_OUT_END); \
    left_in -= GET_BUFFER(INDEX_LEFT_IN_START); \
    right_out -= GET_BUFFER(INDEX_MID - 1); \
    right_in += ADD; \
    right += right_in; \
    right_out += GET_BUFFER(INDEX_RIGHT_OUT_END); \
    right_in -= GET_BUFFER(INDEX_RIGHT_IN_START); \
    quad += right; \
    WRITE(quad / weight); \
    quad -= left; \
    left -= left_out; \
    right -= right_out; 

#ifndef __OPENCL_VERSION__

/**
 * On OpenCL, select is better than a ternary conditional, for processor
 * pipelining reasons. We can model it with bit operations if we choose, but it
 * is more important that it is handy for standard C.
 */
static inline int select(int a, int b, int c) {
    return c ? b : a;
}
#endif

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
    int buffer[(MAX_RADIUS << 1) + 1];

    const int buffer_size = (r << 1) + 1;
    const int width = r + 1;
    const int acc_width = r >> 1;
    const int weight = acc_width * (width - acc_width + 1) * (width + 1);

    int i, o = 0;
    int bi = 0;
    int left = 0, right = 0;
    int left_in = 0, left_out = 0;
    int right_in = 0, right_out = 0;
    int quad = 0;

#define WRAP(index,limit) ((index) % limit)
#define WRITE_DATA(v) (data[stride*o++] = v)
#define WRITE_DUMMY(v) ;
#define GET_BUFFER(i) (buffer[WRAP(bi + i, buffer_size)])

    // Initialize the buffer
    buffer[r] = data[0];
    for(i = 1; i < width; i++) {
        buffer[r - i] = buffer[r + i] = data[i * stride];
    }

    // process the left/top edge
    for(i = 0; i < 2 * r + 1; i++) {
        UPDATE(0, buffer[i], INITIAL_BUFFER, WRITE_DUMMY);
    }

    for(i = r; i < count; i++) {
        int p = data[i*stride];

        int new_bi = WRAP(bi + 1, buffer_size);
        int old = buffer[bi];
        buffer[bi] = p;
        bi = new_bi;

        UPDATE(old, p, GET_BUFFER, WRITE_DATA);
    }

    for(i = 0; i < r; i++) {
        int bx = buffer_size + bi - 2*(i + 1);
        int p = buffer[WRAP(bx, buffer_size)];

        int new_bi = WRAP(bi + 1, buffer_size);
        int old = buffer[bi];
        buffer[bi] = p;
        bi = new_bi;

        UPDATE(old, p, GET_BUFFER, WRITE_DATA);
    }

#undef WRAP
#undef WRITE_DATA
#undef WRITE_DUMMY
#undef GET_BUFFER
}
