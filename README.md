# quadratic-stack-blur

A piloting repository for a quadratic stack blur. The aim is to prove an
implementation that provides a quadratic stack blur, initially in plain C.

Why? Well, for our application, we need a filter that closely approximates a
gaussian blur, but which requires minimal memory access. With a relatively small
memory buffer (in size, 2r + 1) the stack blur only needs to read and write each
pixel twice, aside from edge effects. This is as low as we can reasonably
achieve. The quadratic stack blur extends it and is a very decent approximation
to the gaussian.

The primary reference is:
https://observablehq.com/@jobleonard/mario-klingemans-stackblur, which covers
the stack blur well, and the quadratic stack blur a little. 

Note that the one main distinction is that we need a specific edge model,
reflection, which is not what the sample code uses.
