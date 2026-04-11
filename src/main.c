#include <stdio.h>
#include <stdint.h>

#define MIN(a, b) ((a) < (b) ? (a) : (b))

#define TEST_SIZE 30

int data[TEST_SIZE] = {
    0, 0, 0, 0, 0, 10, 0, 0, 10, 20, 15, 11, 12, 5, 0, 0, 0, 0, 0, 0, 20, 10, 0, 0, 10, 0, 0, 0, 0, 0, 0
};

/**
 * A ome-dimensional blur operation, which will form the core of a stack blur
 * pass, either on a row or a column. 
 */
static void blur(int *data, size_t count, size_t r) {
    int buffer[20];
    int qi = 0;
    const int ds = 2 * r + 1;
    int sum_in = 0;
    int sum_out = 0;
    int sum_stack = 0;
    int stack_size = (r + 1) * (r + 1);

    // Initialize the buffer
    for(int i = 0; i < ds; i++) {
        buffer[i] = 0;
    }

    for(int i = 0; i < count; i++) {

        fprintf(stdout, "sum_stack: %d, sum_out: %d, sum_in: %d\n", sum_stack, sum_out, sum_in);

        data[i] = sum_stack / stack_size;
        sum_stack -= sum_out;
        sum_out -= buffer[qi];
        int ni = MIN(i + r + 1, TEST_SIZE - 1);
        buffer[qi] = data[ni];
        sum_in += buffer[qi];
        sum_stack += sum_in;
        qi = (qi + 1) % ds;
        int mi = (qi + r) % ds;
        sum_out += buffer[mi];
        sum_in -= buffer[mi];
    }
}

// The main difference between the stack blur and the quadratic stack blur is
// that the quadratic stack blur uses additional running sums between the inputs
// and the outputs, so the effect is a sum of sums rather than a sum. Instead of
// three accumulators, we need seven. 

// Q U A D R A T I C   G U I D E S
//
//  <────────radius───────>*<───────radius────────>
//  <──────────────────blurWidth──────────────────>
//  <──────stackWidth──────>
//  <─accWidth─>
//  
//  blurWidth  = radius * 2 + 1
//  stackWidth = radius + 1
//  accWidth   = Math.floor((stackWidth+1) / 2)
//  
//  ## Accumulators and range of pixels they cover
//  
//  ### Linear Accumulators
//  <──────────>        stackLeftOut
//             <──────────>  stackLeftIn
//          stackRightOut  <──────────>
//          stackRightIn               <──────────>
//  
//  ### Stack accumulators
//  <───────stackLeft──────>
//                         <──────stackRight──────>
//  
//  ### Quadratic stack accumulator
//  <──────────────────quadStack──────────────────>

//  Indices to keep track of and what they are for:
//  1          23         45           67         89

/**
 * A ome-dimensional blur operation, which will form the core of a quadratic
 * blur pass, either on a row or a column. A small private buffer is used to
 * reduce direct pixel memory access. 
 *
 * The key constraint is to be able to associate buffer pixels with image
 * pixels, bearing in mind the buffer is circular. The `qi` value is key to
 * that, it addresses the "centre" of the buffer, and corresponds to the current
 * `x` coordinate. 
 *
 * Finally, a significant additional dimension is to reduce the number of
 * conditionals, because these hamper acceleration. we can use all sorts of
 * other functions, like `abs()`, `min()`, `max()`, `clamp()`, and `step()`. But
 * as far as possible, we want to avoid actual `if` statements. Given our need
 * to initialize a bunch of distinct accumulators, this is a fun task. We can
 * use conditional expressions `c ? b : a`, because OpenCL also supports those
 * via the `select()` function. And `select()` is better for pipelining.
 */
static void quadratic(int *data, size_t count, size_t r) {
    int buffer[20];
    int qi = 0;
    const int width = r + 1;
    const int acc_width = (width + 1) / 2;
    const int ds = 2 * r + 1;
    const int weight = acc_width * (width - acc_width) * width;

    int left = 0, left_in = 0, left_out = 0;
    int right = 0, right_in = 0, right_out = 0;
    int quad;
    int p;

    // Initializing from off the edge, at this point, the buffer is not
    // initialized, and no pixels need to be written. Because this is
    // symmetrical about the edge, we can process it in a single pass, again
    // reducing memory access. We can do this because the order of additions
    // and subtractions generally does not matter.

    for(int x = -r; x < 0; x++) {
        p = data[-r];
    }

    // Initialize from the edge
    for(int i = 0; i < ds; i++) {
        
    }

}

int main(int argc, char **argv) {
    blur(data, TEST_SIZE, 2);
    fprintf(stdout, "{ ");
    for(int i = 0; i < TEST_SIZE; i++) {
        fprintf(stdout, "%d ", data[i]);
    }
    fprintf(stdout, "}\n");
}
