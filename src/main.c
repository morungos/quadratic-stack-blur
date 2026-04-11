#include <stdio.h>
#include <stdint.h>

#define MIN(a, b) ((a) < (b) ? (a) : (b))

#define TEST_SIZE 20

int data[TEST_SIZE] = {
    0, 0, 0, 0, 0, 0, 0, 100, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0
};

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

int main(int argc, char **argv) {
    blur(data, TEST_SIZE, 2);
    fprintf(stdout, "{ ");
    for(int i = 0; i < TEST_SIZE; i++) {
        fprintf(stdout, "%d ", data[i]);
    }
    fprintf(stdout, "}\n");
}
