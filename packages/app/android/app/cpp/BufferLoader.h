#pragma once

#include <EGL/egl.h>
#include <EGL/eglext.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <android/log.h>
#include <android/hardware_buffer.h>
#include <android/bitmap.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <future>
#include <map>



namespace azzapp {

using namespace facebook;

struct JBufferLoader : public jni::JavaClass<JBufferLoader> {

public:
  static constexpr auto kJavaDescriptor = "Lcom/azzapp/jni/BufferLoader;";
  static jni::local_ref<JBufferLoader> create(jlong bufferLoader);
  static void registerNatives();

  std::string loadImage(std::string uri, double width, double height);
  std::string loadVideoFrame(std::string uri, double width, double height, double time);
  void releaseBuffer(std::string bufferId);

  static void postTaskResult(jni::alias_ref<jni::JClass>, jlong bufferLoaderPtr,
                             std::string taskId, jni::alias_ref<jobject> bitmap,
                             std::string errorMessage);

};


class JSI_EXPORT BufferLoaderHostObject: public jsi::HostObject {
public:
  BufferLoaderHostObject(jsi::Runtime &runtime);
  ~BufferLoaderHostObject();
  std::vector<jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;
  jsi::Value get(facebook::jsi::Runtime &, const facebook::jsi::PropNameID &name) override;

  void handleTaskResult(std::string taskId, jni::alias_ref<jobject> bitmap, std::string errorMessage);

private:
  jni::global_ref<JBufferLoader> jbufferLoader;
  jsi::Runtime *runtime;
  std::map<std::string,std::shared_ptr<jsi::Function>> tasks;
  std::map<uintptr_t, std::string> buffers;
  EGLDisplay eglDisplay = EGL_NO_DISPLAY;
  EGLContext eglContext = EGL_NO_CONTEXT;
  EGLSurface eglSurface = EGL_NO_SURFACE;
  GLuint shaderProgram = -1;

  bool initializeOpenGL();
  void destroyOpenGL();
  GLuint loadTextureFromBitmap(JNIEnv* env, jobject bitmap, AndroidBitmapInfo bitmapInfo);
  AHardwareBuffer* createHardwareBuffer(int width, int height);
  void renderToHardwareBuffer(AHardwareBuffer* hardwareBuffer, GLuint srcTexture, int width, int height);
  AHardwareBuffer *bitmapToHardwareBuffer(jni::alias_ref<jobject> bitmapRef);
};



}


