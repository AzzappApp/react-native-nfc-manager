cmake_minimum_required(VERSION 3.4.1)
project(AzzappReactNativeBufferLoader)

set(PACKAGE_NAME "azzapp_react-native-buffer-loader")

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

set(build_DIR ${CMAKE_SOURCE_DIR}/build)

file(GLOB libfbjni_include_DIRS "${build_DIR}/fbjni-*-headers.jar/")

# Consume shared libraries and headers from prefabs
find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)

add_library(${PACKAGE_NAME}
        SHARED
        cpp/cpp-adapter.cpp
        cpp/BufferLoader.cpp
        cpp/BufferLoader.h
        cpp/JNIHelpers.cpp
        cpp/JNIHelpers.h
)

# Specifies a path to native header files.
include_directories(
        cpp/

        # React native
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/react/nativemodule/core"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"

        ${libfbjni_include_DIRS}
)

find_library(
        LOG_LIB
        log
)

target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        android
        fbjni::fbjni
        ReactAndroid::reactnative
        ReactAndroid::jsi
        -ljnigraphics
        -lGLESv2
        -lEGL
        -landroid
)