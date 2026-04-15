#ifndef QUADRATIC_STACK_BLUR_H
#define QUADRATIC_STACK_BLUR_H

#include <stdint.h>
#include <stdlib.h>

#define TYPE uint8_t
#define SUM_TYPE int

#ifdef __cplusplus
extern "C"
{
#endif

void quadratic_stack_blur(TYPE *data, size_t stride, size_t count, size_t r);

#ifdef __cplusplus
}
#endif

#endif
