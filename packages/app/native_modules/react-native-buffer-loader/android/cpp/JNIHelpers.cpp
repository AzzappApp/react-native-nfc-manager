//
// Created by François de Campredon on 14/05/2024.
//

#include "JNIHelpers.h"
#include <ReactCommon/CallInvokerHolder.h>

namespace azzapp {

std::shared_ptr<react::CallInvoker> JNIHelpers::getCallInvoker() {
  auto clazz = javaClassStatic();
  static const auto getCallInvokerMethod =
      clazz->getStaticMethod<jobject()>("getCallInvoker");
  auto callInvoker =
      static_ref_cast<react::CallInvokerHolder::javaobject>(
          getCallInvokerMethod(clazz));


  return callInvoker->cthis()->getCallInvoker();
}

}