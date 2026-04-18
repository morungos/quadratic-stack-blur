# quadratic-stack-blur

A piloting repository for a quadratic stack blur, also known as the bell blur.
The aim is to prove an implementation that provides a quadratic stack blur,
initially in plain C, eventually for OpenCL.

Why? Well, for our application, we need a filter that closely approximates a
gaussian blur, but which requires minimal memory access. With a relatively small
memory buffer (in size, 2r + 1) the stack blur only needs to read and write each
pixel twice, aside from edge effects. This is as low as we can reasonably
achieve. The quadratic stack blur extends it and is a very decent approximation
to the gaussian.

The primary reference is the excellent description at:
https://observablehq.com/@jobleonard/mario-klingemans-stackblur, which covers
the stack blur well, and the quadratic stack blur a little. The implementation
here is quite thoroughly tested. Note that the one main distinction is that we
need a specific edge model, reflection, which is not what all the sample code
that I've found tends to use.

The aim is to build an efficient quadratic stack blur in plain C, with a good
edge model. To make sure we get the behaviour right, we'll also have a
TypeScript implementation which is a little simpler to debug.

Note that we are only interested in greyscale cases. With OpenCL, that is less
of an issue, since we can simply using a vector as the pixel type. In C or in
TypeScript there is a bit more work in generalizing this to RGB.
