cmake_minimum_required(VERSION 3.4.1)
project(AzzappApp)
set(PACKAGE_NAME "azzapp-app")

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

set(build_DIR ${CMAKE_SOURCE_DIR}/build)

file(GLOB libfbjni_include_DIRS "${build_DIR}/fbjni-*-headers.jar/")

# Consume shared libraries and headers from prefabs
find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)

set(JSI_LIB ReactAndroid::jsi)
message("-- JSI     : " ${JSI_LIB})
set(FBJNI_LIBRARY fbjni::fbjni)
message("-- FBJNI   : " ${FBJNI_LIBRARY})
set(REACT_LIB ReactAndroid::react_nativemodule_core)
message("-- REACT   : " ${REACT_LIB})
set(TURBOMODULES_LIB "ReactAndroid::turbomodulejsijni")
message("-- TURBO   : " ${TURBOMODULES_LIB})


add_library(${PACKAGE_NAME}
        SHARED
        cpp/cpp-adapter.cpp
        cpp/BufferLoader.h
        cpp/BufferLoader.cpp
        cpp/JNIHelpers.h
        cpp/JNIHelpers.cpp
)

# Specifies a path to native header files.
include_directories(
        cpp/

        # React native
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/runtimeexecutor"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/react/nativemodule/core"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"

        ${libfbjni_include_DIRS}
)


# Android Log lib
find_library(LOG_LIB  log)

# Link
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        ${FBJNI_LIBRARY}
        ${REACT_LIB}
        ${JSI_LIB}
        ${TURBOMODULES_LIB}
        -ljnigraphics
        -landroid
)