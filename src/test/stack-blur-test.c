#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>

#include "ctest.h"
#include "pgm.h"

CTEST(stack_blur, verify) {
    ImageData image = get_pgm_data("image.pgm");
    ASSERT_NOT_NULL(image.data);

    CTEST_LOG("Test read: %zux%zu", image.width, image.height);

    // Now we can run a blur operation
    write_pgm_data("output.pgm", image);

    free(image.data);
}
