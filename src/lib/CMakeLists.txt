cmake_minimum_required(VERSION 3.20)

project(stackblur LANGUAGES C)

add_library(stackblur 
    stack-blur.c
    quadratic-blur-weights.c
)
