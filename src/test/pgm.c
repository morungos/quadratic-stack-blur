#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

#include "pgm.h"

static char *get_test_data_file_path(const char *data_file) {
    int prefix_length = strlen(TEST_DATA);
    int buffer_size = prefix_length + strlen(data_file) + 2;
    char *value = (char *) malloc(buffer_size);
    strcpy(value, TEST_DATA);
    value[prefix_length] = '/';
    strcpy(value + prefix_length + 1, data_file);
    return value;
}

bool read_pgm(const char *full_path, ImageData *data) {
    FILE *input = fopen(full_path, "r");
    if (! input) {
        perror("File opening failed");
        return false;
    }

    char ch;
    bool skipping = false;
    bool allocated = false;
    size_t ret;
    size_t index = 0;
    size_t limit = 0;
    int maximum;
    while((ch = getc(input)) != EOF) {
        if (allocated && index == limit) {
            break;
        }
        if (skipping) {
            if (ch == '\n') {
                skipping = false;
            }
            continue;
        }
        switch (ch) {
            case '#':
                skipping = true;
                break;
            case 'P':
                ungetc(ch, input);
                ret = fscanf(input, "P2 %lu %lu %u\n", &(data->width), &(data->height), &(maximum));
                if (ret != 3 || maximum != 255) {
                    perror("Failed to parse PGM");
                    goto error;
                }
                // Now we can allocate a buffer
                limit = data->width * data->height;
                data->data = (uint8_t *) malloc(limit);
                allocated = true;
                index = 0;
                break;
            default:
                ungetc(ch, input);
                if (! allocated) {
                    perror("Missing P2 header");
                    goto error;
                }
                int value;
                ret = fscanf(input, "%u", &value);
                if (ret != 1) {
                    perror("Failed to read value");
                    goto error;
                }
                data->data[index++] = (uint8_t) (value & 0xff);
        }
    }
    fclose(input);
    return allocated && index == limit;

    error:
    fclose(input);
    return false;
}

ImageData get_pgm_data(const char *data_file) {
    char *full_path = get_test_data_file_path(data_file);
    ImageData data;
    bool ret = read_pgm(full_path, &data);
    free(full_path);
    assert(ret);
    return data;
}

