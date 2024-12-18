#pragma once

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
  void releaseTexture(int texId);

  static void postTaskResult(jni::alias_ref<jni::JClass>, jlong bufferLoaderPtr,
                             std::string taskId, jint textureId, int width, int height,
                             std::string errorMessage);

};


class JSI_EXPORT BufferLoaderHostObject: public jsi::HostObject {
public:
  explicit BufferLoaderHostObject(jsi::Runtime &runtime);
  std::vector<jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;
  jsi::Value get(facebook::jsi::Runtime &, const facebook::jsi::PropNameID &name) override;

  void handleTaskResult(const std::string& taskId, int texId, int width, int height, std::string errorMessage);

private:
  jni::global_ref<JBufferLoader> jbufferLoader;
  jsi::Runtime *runtime;
  std::map<std::string,std::shared_ptr<jsi::Function>> tasks;
  std::map<uintptr_t, std::string> buffers;
};



}


