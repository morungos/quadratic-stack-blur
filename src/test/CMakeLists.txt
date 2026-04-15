cmake_minimum_required(VERSION 3.20 FATAL_ERROR)

project(application-tests LANGUAGES CXX)
project(application-tests VERSION 0.1.0 DESCRIPTION "Video enhancement tests")

include(CTest)
include(CheckLanguage)

enable_testing()

add_executable(stack-blur-test
    stack-blur-test.c ctest.c pgm.c
)

target_compile_features(stack-blur-test PUBLIC cxx_std_11)

add_compile_definitions(
    TEST_DATA="${CMAKE_SOURCE_DIR}/data"
)

target_include_directories(stack-blur-test PRIVATE 
    ${CMAKE_CURRENT_SOURCE_DIR}/../lib
)

target_link_libraries(stack-blur-test 
    stackblur
)

add_test(NAME stack-blur-test
  COMMAND stack-blur-test
)
