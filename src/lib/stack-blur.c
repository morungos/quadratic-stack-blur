
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

#include <stdint.h>

#include "stack-blur.h"

#define MAX_RADIUS (20)

// Adds a number of inline functions which effectively replicate OpenCL ones. 

#ifndef __OPENCL_VERSION__

/**
 * On OpenCL, select is better than a ternary conditional, for processor
 * pipelining reasons. We can model it with bit operations if we choose, but it
 * is more important that it is handy for standard C. So we create an inline
 * function we can use for it. Note the argument order is entirely different.
 */
static inline int cl_select(int a, int b, int c) {
    return c ? b : a;
}

#else 

// The OpenCL version is simpler
#define cl_select(a,b,c) select(a,b,c)

#endif

/**
 * As a special case, we implement a basic stack blur with a fixed radius of
 * one. This will be used for a radius of one. The logic here is distinctly
 * different from the quadratic stack blur. Much of the time we will not need
 * this unless we need to handle a radius of one.
 */

#define STACK_BLUR_RADIUS (1)
#define STACK_BLUR_BUFFER_SIZE ((STACK_BLUR_RADIUS << 1) + 1)
#define STACK_BLUR_WIDTH (STACK_BLUR_RADIUS + 1)
#define STACK_BLUR_ROUND(v) (((v) + 2) >> 2)

static void stack_blur_one(TYPE *data, size_t origin, size_t stride, size_t count) {

    int buffer[STACK_BLUR_BUFFER_SIZE] = { 0 };

    int left = 0, right = 0;
    int sum = 0;
    int bi = 0, next;
    int o = 0, i;
    TYPE p, old, rem;

    buffer[1] = data[origin];
    buffer[2] = buffer[0] = data[origin + 1*stride];

    left = buffer[0] + buffer[1];
    right = buffer[2];
    sum = left;
    bi = 0;

    data[origin + (o++)*stride] = STACK_BLUR_ROUND(2 * buffer[0] + 2 * buffer[1]);

    for(i = STACK_BLUR_WIDTH; i < count; i++) {
        p = data[origin + i*stride];

        old = buffer[bi];
        buffer[bi] = p;
        bi = cl_select(bi + 1, 0, bi == STACK_BLUR_BUFFER_SIZE - 1);

        // Get the old value and remove it, replacing with the new
        left -= old;

        // Pick mid point, remove from right and add to left
        next = cl_select(bi + 1, 0, bi + 1 == STACK_BLUR_BUFFER_SIZE);
        rem = buffer[next];
        right += p;
        left += rem;
        sum += right;
        right -= rem;

        // Output
        data[origin + (o++*stride)] = STACK_BLUR_ROUND(sum);
        
        sum -= left;
    }

    // At the end, we need a slightly different calculation -- again one which 
    // matches the mirroring logic, and again one which doesn't require additional
    // memory accesses. We will have to write two pixels, the one affected by the
    // radius.

    next = cl_select(bi + 1, 0, bi + 1 == STACK_BLUR_BUFFER_SIZE);
    sum = right + sum + buffer[next];
    data[origin + (o++)*stride] = STACK_BLUR_ROUND(sum);
}

// A composable part of the update process. The GET_BUFFER and WRITE values are
// expected to be macros in their own right, which vary between the startup,
// main, and closedown stages. REM and ADD are the values to remove and add.
// GET_BUFFER is used with a buffer index, and WRITE is used with a value and
// writes elements strictly sequentially.
//
// This is written as a macro so the rolling sum calculations can be reused
// across the phases of the algorithm. Inline functions would be another option,
// but annoyingly, on OpenCL, they are a little problematic, as typically. The
// third and fourth arguments are themselves macros. This allows us to optimize
// situations where, e.g., we do not need an output value at all.

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
    WRITE(quad); \
    quad -= left; \
    left -= left_out; \
    right -= right_out; 

/**
 * The core quadratic_stack_blur function. This is a good approximation to a
 * gaussian blur, but we don't get a sigma value. The values are written back 
 * to the data source, i.e., the blurring filter works in-place.
 * 
 * The code here processes a single row, or column. It is intended to be part 
 * of a 1D workgroup, eventually.
 *
 * @param data the source of data
 * @param stride the offset between adjacent values, i.e., 1 for horizontal data
 * @param count the length of the data to be blurred
 * @param r the radius of the blur function
 */
void quadratic_stack_blur(TYPE *data, size_t origin, size_t stride, size_t count, size_t r) {

    // If radius is one, act like a regular stack blur of radius one. Our
    // intermediate summing doesn't work as half the quarters are empty.

    if (r == 1) {
        stack_blur_one(data, origin, stride, count);
        return;
    }

    if (r > MAX_RADIUS) {
        return;
    }

    // Statically allocate a buffer that's big enough. This could be done using
    // pointers into the data, but... part of our goal here is to improve memory
    // access patterns, and those pointers are harder to cache. So long as this
    // buffer is fairly small (which for our case is true) this is fine. For a
    // large radius, possibly less so. In the limit, you're probably better
    // using offsets into the original data, but that does result in more global
    // memory accesses, which (for our usage) is what we are trying to avoid.
    // For relatively small radii, if a workgroup fits into the cache, it should
    // be good.

#define QUADRATIC_MAX_BUFFER_SIZE ((MAX_RADIUS << 1) + 1)

    // A maximum buffer size is set to allow 
    TYPE buffer[QUADRATIC_MAX_BUFFER_SIZE];

    const int buffer_size = (r << 1) + 1;
    const int width = r + 1;
    const int acc_width = r >> 1;

    float weight = 1.0f / (acc_width * (width - acc_width + 1) * (width + 1));
    
    int bi = 0, o = 0, i, j, next;

    TYPE p, old;
    SUM_TYPE left = 0, right = 0;
    SUM_TYPE left_in = 0, left_out = 0;
    SUM_TYPE right_in = 0, right_out = 0;
    SUM_TYPE quad = 0;

    // There is a choice to be made for register/private memory access versus
    // computation. Again, since we want to move to OpenCL, keeping private
    // memory small is right for us. These should be tested for performance,
    // because it might well be better to compute these once.

#define QUADRATIC_BUFFER_OFFSET_MID (r)
#define QUADRATIC_BUFFER_OFFSET_RIGHT_LIMIT (r << 1)
#define QUADRATIC_BUFFER_OFFSET_LEFT_LIMIT (0)
#define QUADRATIC_BUFFER_OFFSET_LEFT_OUT_END (QUADRATIC_BUFFER_OFFSET_LEFT_LIMIT + acc_width)
#define QUADRATIC_BUFFER_OFFSET_LEFT_IN_START (QUADRATIC_BUFFER_OFFSET_MID - acc_width)
#define QUADRATIC_BUFFER_OFFSET_RIGHT_OUT_END (QUADRATIC_BUFFER_OFFSET_MID + acc_width)
#define QUADRATIC_BUFFER_OFFSET_RIGHT_IN_START (QUADRATIC_BUFFER_OFFSET_RIGHT_LIMIT - acc_width)

    // Modulo-free wrapping macro -- it works as long as we don't let x go negative or >= 2*limit
#define QUADRATIC_INDEX_WRAP(x,limit) (x - cl_select(0, (limit), (x) >= limit))

#define QUADRATIC_BUFFER_GET(x) (buffer[QUADRATIC_INDEX_WRAP(bi + (x), buffer_size)])
#define QUADRATIC_ROUND(v) (TYPE)(((v) * quadratic_weight_multipliers[r] + (1 << (quadratic_weight_shifts[r] - 1))) >> quadratic_weight_shifts[r])
#define QUADRATIC_DATA_WRITE(v) (data[origin + (o++)*stride] = QUADRATIC_ROUND(v))

    // The core of the running sums update, written as a macro. This is important, because 
    // this is used several times during the process, with different versions of data access
    // and writing needed for the border cases. Since OpenCL is distinctly weird with inline
    // functions, this way we are guaranteed to get correct inlining.
#define QUADRATIC_UPDATE(rem,add,BUFFER_GET,DATA_WRITE) \
    left_out -= rem;                                                                   \
    left_in += BUFFER_GET(QUADRATIC_BUFFER_OFFSET_MID);                                \
    left += left_in;                                                                   \
    left_out += BUFFER_GET(QUADRATIC_BUFFER_OFFSET_LEFT_OUT_END);                      \
    left_in -= BUFFER_GET(QUADRATIC_BUFFER_OFFSET_LEFT_IN_START);                      \
                                                                                       \
    right_out -= BUFFER_GET(QUADRATIC_BUFFER_OFFSET_MID - 1);                          \
    right_in += add;                                                                   \
    right += right_in;                                                                 \
    right_out += BUFFER_GET(QUADRATIC_BUFFER_OFFSET_RIGHT_OUT_END);                    \
    right_in -= BUFFER_GET(QUADRATIC_BUFFER_OFFSET_RIGHT_IN_START);                    \
                                                                                       \
    quad += right;                                                                     \
                                                                                       \
    DATA_WRITE(quad);                                                                  \
                                                                                       \
    quad -= left;                                                                      \
    left -= left_out;                                                                  \
    right -= right_out;

    // Step 1. Load the left/top edge data into the buffer
    buffer[QUADRATIC_BUFFER_OFFSET_MID] = data[origin];
    for(i = 1; i < width; i++) {
        buffer[QUADRATIC_BUFFER_OFFSET_MID - i] = buffer[QUADRATIC_BUFFER_OFFSET_MID + i] = data[origin + i*stride];
    }

    // Step 2. Count up the running sums across the leading edge. This requires
    // us to read only from the buffer, *and* the edge offset also needs to be 
    // used to mask yet-to-be-read values as zeroes.
    for(i = 0; i < buffer_size; i++) {
        p = buffer[i];

#define QUADRATIC_BUFFER_INITIAL_GET(x) (cl_select(buffer[(x+i+1) - buffer_size], 0, (x+i+1 < buffer_size)))
#define QUADRATIC_DATA_WRITE_NULL(v) ;

        QUADRATIC_UPDATE(0, p, QUADRATIC_BUFFER_INITIAL_GET, QUADRATIC_DATA_WRITE_NULL);

#undef QUADRATIC_BUFFER_INITIAL_GET
#undef QUADRATIC_DATA_WRITE_NULL
    }

    // Reset the buffer index
    bi = 0;

    // Step 3. Retrospectively write the value that would have been generated for the left edge
    QUADRATIC_DATA_WRITE(quad + left_out + left);

    // Step 4. Process all the main body; on completion, buffer values will be
    // in place. So, when collecting data, we only need to read from the buffer,
    // and we are done with the leading edge, so we can write directly. 

    for(i = r + 1; i < count; i++) {

        p = data[origin + i*stride];

        old = buffer[bi];
        buffer[bi] = p;
        bi = QUADRATIC_INDEX_WRAP(bi + 1, buffer_size);

        QUADRATIC_UPDATE(old, p, QUADRATIC_BUFFER_GET, QUADRATIC_DATA_WRITE);
    }

    // Step 5. We have to finish off, but now we have read the source data, so it's back to the
    // buffer only again.

    for(i = 0; i < r; i++) {

        // Read values backwards; adding buffer_size guarantees it's between 0 and 2*buffer_size
        j = buffer_size + bi - 2*(i + 1);
        p = buffer[QUADRATIC_INDEX_WRAP(j, buffer_size)];
        old = buffer[bi];
        buffer[bi] = p;
        bi = QUADRATIC_INDEX_WRAP(bi + 1, buffer_size);

        QUADRATIC_UPDATE(old, p, QUADRATIC_BUFFER_GET, QUADRATIC_DATA_WRITE);
    }

    // Clean up our internal macros
#undef QUADRATIC_UPDATE
#undef QUADRATIC_BUFFER_GET
#undef QUADRATIC_DATA_WRITE
#undef QUADRATIC_INDEX_WRAP
#undef QUADRATIC_INDEX_WRAP

#undef QUADRATIC_BUFFER_OFFSET_MID
#undef QUADRATIC_BUFFER_OFFSET_RIGHT_LIMIT
#undef QUADRATIC_BUFFER_OFFSET_LEFT_LIMIT
#undef QUADRATIC_BUFFER_OFFSET_LEFT_OUT_END
#undef QUADRATIC_BUFFER_OFFSET_LEFT_IN_START
#undef QUADRATIC_BUFFER_OFFSET_RIGHT_OUT_END
#undef QUADRATIC_BUFFER_OFFSET_RIGHT_IN_START

}
