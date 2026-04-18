#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "ctest.h"
#include "pgm.h"

#include "stack-blur.h"

static int hex_string_to_bytes(uint8_t *out, const char *str) {
    int i, len = strlen(str) >> 1;

    for (i = 0; i < len; i++) {
        // Reads str & stores in op
        sscanf(str, "%2hhx", &out[i]);
        str += 2;
    }

    return len;
}

static int bytes_to_hex_string(char *out, const uint8_t *data, int len) {
    for (int i = 0; i < len; i++) {
        // Reads str & stores in op
        sprintf(&out[i << 1], "%02x", data[i]);
    }
    out[len << 1] = '\0';
    return len << 1;
}

CTEST(stack_blur, simple_blur) {
    const char *input_source = "000000000000000203040a0403020000000000000000000000000000";
    const size_t input_size = strlen(input_source) / 2;
    uint8_t *input = (uint8_t *)malloc(input_size);
    hex_string_to_bytes(input, input_source);

    quadratic_stack_blur(input, 0, 1, input_size, 1);

    char *result = (char *)malloc(input_size + 1);
    bytes_to_hex_string(result, input, input_size);

    ASSERT_STR("00000000000001020305070503020100000000000000000000000000", result);

    free(input);
    free(result);
}

CTEST(stack_blur, edge_blur) {
    const char *input_source = "0a0200000000000000020a020000000003040b04030000000003040b";
    const size_t input_size = strlen(input_source) / 2;
    uint8_t *input = (uint8_t *)malloc(input_size);
    hex_string_to_bytes(input, input_source);

    quadratic_stack_blur(input, 0, 1, input_size, 1);

    char *result = (char *)malloc(input_size + 1);
    bytes_to_hex_string(result, input, input_size);

    ASSERT_STR("06040100000000000104060401000001030608060301000001030608", result);

    free(input);
    free(result);
}

CTEST_SKIP(stack_blur, verify) {
    ImageData image = get_pgm_data("image.pgm");
    ASSERT_NOT_NULL(image.data);

    CTEST_LOG("Test read: %zux%zu", image.width, image.height);

    // Now for the actual blur operation
    // Horizontal pass
    for(int y = 0; y < image.height; y++) {
        quadratic_stack_blur(image.data, y * image.width, 1, image.width, 5);
    }

    // Now we can run a blur operation
    write_pgm_data("output.pgm", image);

    free(image.data);
}
