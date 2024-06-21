#include <jni.h>
#include "react-native-skia-skottie.h"
#include <android/log.h>
#include <stdexcept>

extern "C" JNIEXPORT void JNICALL
Java_com_skiaskottie_SkiaSkottieModule_initialize(JNIEnv *env, jclass clazz, jlong jsi_ptr)
{
    __android_log_print(ANDROID_LOG_DEBUG, "SkiaSkottieModule", "Initializing SkiaSkottieModule");

    RNSkia::RNSkModuleManager::installBindings(
        reinterpret_cast<facebook::jsi::Runtime *>(jsi_ptr));

    __android_log_print(ANDROID_LOG_DEBUG, "SkiaSkottieModule", "SkiaSkottieModule initialized!");
}
