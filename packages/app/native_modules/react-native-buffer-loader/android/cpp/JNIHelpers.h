#pragma once
#include <fbjni/fbjni.h>
#include <ReactCommon/CallInvoker.h>

namespace azzapp {
using namespace facebook;
struct JNIHelpers : public jni::JavaClass<JNIHelpers> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/azzapp/bufferloader/JNIHelpers;";
  static std::shared_ptr<react::CallInvoker> getCallInvoker();
};
}


