#include <stdio.h>
#include <stdint.h>

#define TEST_SIZE 20

uint8_t data[TEST_SIZE] = {
    0, 0, 0, 0, 0, 0, 0, 100, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0
};

static void blur(uint8_t *input, size_t count, size_t r) {
    for(int i = 0; i < count; i++) {
        input[i] = input[i];
    }
}

int main(int argc, char **argv) {
    blur(data, TEST_SIZE, 4);
    fprintf(stdout, "{ ");
    for(int i = 0; i < TEST_SIZE; i++) {
        fprintf(stdout, "%d ", data[i]);
    }
    fprintf(stdout, "}\n");
}
