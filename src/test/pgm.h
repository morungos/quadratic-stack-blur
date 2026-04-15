#ifndef CTEST_PGM_H
#define CTEST_PGM_H

#include <stdlib.h>
#include <stdbool.h>
#include <stdint.h>

typedef struct ImageData {
    size_t width;
    size_t height;
    uint8_t *data;
} ImageData;

#ifdef __cplusplus
extern "C"
{
#endif

bool read_pgm(const char *full_path, ImageData *data);
ImageData get_pgm_data(const char *data_file);
bool write_pgm_data(const char *data_file, ImageData data);

#ifdef __cplusplus
}
#endif

#endif