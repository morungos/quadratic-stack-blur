#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>

#include "ctest.h"
#include "pgm.h"

#include "stack-blur.h"

CTEST(stack_blur, verify) {
    ImageData image = get_pgm_data("image.pgm");
    ASSERT_NOT_NULL(image.data);

    CTEST_LOG("Test read: %zux%zu", image.width, image.height);

    // Now for the actual blur operation
    // Horizontal pass
    for(int y = 0; y < image.height; y++) {
        quadratic_stack_blur(image.data + y * image.width, 1, image.width, 5);
    }

    // Now we can run a blur operation
    write_pgm_data("output.pgm", image);

    free(image.data);
}
