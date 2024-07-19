#include "react-native-skia-skottie.h"
#include "SkottieTemplatePlayer.h"
#include <utility>

namespace RNSkia {
using namespace facebook;

void RNSkModuleManager::installBindings(jsi::Runtime* jsRuntime) {
  // Install bindings
  auto createSkottieTemplatePlayer = jsi::Function::createFromHostFunction(
      *jsRuntime, jsi::PropNameID::forAscii(*jsRuntime, "createSkottieTemplatePlayer"), 1,
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments,
                         size_t count) -> jsi::Value {
        if (count != 2) {
          throw jsi::JSError(runtime, "SkiaVideo.createSkottieTemplatePlayer(..) expects two arguments (string, string[)!");
        }

        auto content = arguments[0].asString(runtime).utf8(runtime);

        std::vector<std::string> resourcesIds{};
        auto jsResourceIds = arguments[1].asObject(runtime).asArray(runtime);
        size_t size = jsResourceIds.size(runtime);
        for (int i = 0; i < size; i++) {
          auto value = jsResourceIds.getValueAtIndex(runtime, i)
              .asString(runtime).utf8(runtime);
          resourcesIds.push_back(value);
        }


        auto instance = std::make_shared<RNSkia::SkottieTemplatePlayer>(
            content,
            resourcesIds
        );

        return jsi::Object::createFromHostObject(runtime, instance);
      });
  jsRuntime->global().setProperty(  *jsRuntime, "SkottieTemplatePlayer_createSkottieTemplatePlayer", createSkottieTemplatePlayer);

}
} // namespace RNSkia
