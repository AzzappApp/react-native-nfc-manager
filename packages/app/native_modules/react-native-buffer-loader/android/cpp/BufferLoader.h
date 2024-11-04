#pragma once

#include <android/hardware_buffer_jni.h>
#include <android/bitmap.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <future>
#include <map>



namespace azzapp {

using namespace facebook;

struct JBufferLoader : public jni::JavaClass<JBufferLoader> {

public:
  static constexpr auto kJavaDescriptor = "Lcom/azzapp/bufferloader/BufferLoader;";
  static jni::local_ref<JBufferLoader> create(jlong bufferLoader);
  static void registerNatives();

  std::string loadImage(std::string uri, double width, double height);
  std::string loadVideoFrame(std::string uri, double width, double height, double time);
  void releaseBuffer(std::string bufferId);

  static void postTaskResult(jni::alias_ref<jni::JClass>, jlong bufferLoaderPtr,
                             std::string taskId, jni::alias_ref<jobject> jbuffer,
                             std::string errorMessage);

};


class JSI_EXPORT BufferLoaderHostObject: public jsi::HostObject {
public:
  BufferLoaderHostObject(jsi::Runtime &runtime);
  std::vector<jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;
  jsi::Value get(facebook::jsi::Runtime &, const facebook::jsi::PropNameID &name) override;

  void handleTaskResult(std::string taskId, AHardwareBuffer *buffer, std::string errorMessage);

private:
  jni::global_ref<JBufferLoader> jbufferLoader;
  jsi::Runtime *runtime;
  std::map<std::string,std::shared_ptr<jsi::Function>> tasks;
  std::map<uintptr_t, std::string> buffers;
};



}


