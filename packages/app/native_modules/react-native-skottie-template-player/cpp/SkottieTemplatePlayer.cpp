#include "SkottieTemplatePlayer.h"
#include <JsiSkCanvas.h>
#include <JsiSkImage.h>
#include <JsiSkRect.h>
#include <include/core/SkBitmap.h>
#include <include/gpu/ganesh/SkImageGanesh.h>


namespace RNSkia {

SkottieTemplatePlayer::SkottieTemplatePlayer(
    const std::string& content, const std::vector<std::string> resourcesIds) {
  for (const auto& resourceId : resourcesIds) {
    assets[resourceId] = sk_make_sp<TemplateImageAsset>();
  }
  resourcesProvider = TemplateResourceProvider::Make(assets);
  animation = skottie::Animation::Builder()
    .setResourceProvider(resourcesProvider)
    .make(content.c_str(), content.length());
}

jsi::Value SkottieTemplatePlayer::get(jsi::Runtime& runtime,
                                      const jsi::PropNameID& propNameId) {
  auto propName = propNameId.utf8(runtime);
  if (propName == "render") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forAscii(runtime, "render"), 4,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue,
               const jsi::Value* arguments, size_t count) -> jsi::Value {
          auto jsCanvas = arguments[0].asObject(runtime).asHostObject(runtime);
          auto canvas = std::static_pointer_cast<RNSkia::JsiSkCanvas>(jsCanvas)->getCanvas();
          auto rect = RNSkia::JsiSkRect::fromValue(runtime, arguments[1]);
          auto progress = arguments[2].asNumber();

          if (arguments[3].isObject()) {
            auto jsImages = arguments[3].asObject(runtime);
            auto ids = jsImages.getPropertyNames(runtime);
            size_t size = ids.length(runtime);
            
            // Set pour tracker les IDs utilisés
            std::unordered_set<std::string> usedIds;
            
            for (int i = 0; i < size; i++) {
              auto id = ids.getValueAtIndex(runtime, i)
                           .asString(runtime)
                           .utf8(runtime);
              usedIds.insert(id);
              
              auto frame = jsImages.getProperty(runtime, id.c_str()).asObject(runtime);
              auto image = JsiSkImage::fromValue(runtime, frame.getProperty(runtime, "image"));
              auto jsMatrix = frame.getProperty(runtime, "matrix");
              auto matrix = jsMatrix.isObject() ? JsiSkMatrix::fromValue(runtime, jsMatrix) : nullptr;
              
              if (image != nullptr) {
                updateAssetImage(id, std::move(image), matrix);
              }
            }
          }

          if (animation != nullptr) {
            animation->seek(progress);
            animation->render(canvas, rect.get());
          }
          
          return jsi::Value::undefined();
        });
  } else if (propName == "dispose") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forAscii(runtime, "dispose"), 0,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue,
               const jsi::Value* arguments, size_t count) -> jsi::Value {
          this->dispose();
          return jsi::Value::undefined();
        });
  }
  
  return jsi::Value::undefined();
}

std::vector<jsi::PropNameID> SkottieTemplatePlayer::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("render")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("dispose")));
  return result;
}



void SkottieTemplatePlayer::updateAssetImage(std::string id, sk_sp<SkImage> newImage, std::shared_ptr<SkMatrix> matrix) {
    auto it = assets.find(id);
    if (it == assets.end()) {
        return;
    }
    
    auto asset = it->second;
    if (asset == nullptr) {
        return;
    }

    // Libérer explicitement l'ancienne image avant d'assigner la nouvelle
    if (asset->currentImage) {
        asset->currentImage.reset();
    }
    
    asset->currentImage = newImage;
    asset->skMatrix = matrix;
}

void SkottieTemplatePlayer::dispose() {
  for (auto& entry : assets) {
    if (entry.second) {
      if (entry.second->currentImage) {
        entry.second->currentImage.reset();
      }
      if (entry.second->skMatrix) {
        entry.second->skMatrix.reset();
      }
    }
  }
  assets.clear();
  if (animation) {
    animation = nullptr;
  }
}

sk_sp<TemplateResourceProvider> TemplateResourceProvider::Make(const std::unordered_map<std::string, sk_sp<TemplateImageAsset>> assets) {
  return sk_sp<TemplateResourceProvider>(new TemplateResourceProvider(assets));
}

TemplateResourceProvider::TemplateResourceProvider(
    const std::unordered_map<std::string, sk_sp<TemplateImageAsset>> assets): _assets(assets) {
}

sk_sp<skresources::ImageAsset> TemplateResourceProvider::loadImageAsset(
    const char*, const char*, const char* resourceId) const {
  if (!_assets.count(resourceId)) {
    return nullptr;
  }
  return _assets.at(resourceId);
}

TemplateImageAsset::TemplateImageAsset() {
  SkBitmap bitmap;
  bitmap.allocN32Pixels(1, 1);
  bitmap.eraseColor(SK_ColorTRANSPARENT);
  currentImage = bitmap.asImage();
}

bool TemplateImageAsset::isMultiFrame() {
  return true;
}

TemplateImageAsset::FrameData TemplateImageAsset::getFrameData(float t) {
  auto matrix = this->skMatrix;
  if (matrix == nullptr) {
    matrix = std::make_shared<SkMatrix>(SkMatrix::I());
  }
  return {
      currentImage,
      SkSamplingOptions(SkFilterMode::kLinear, SkMipmapMode::kNone),
      *matrix,
      SizeFit::kNone,
  };
}

} // namespace RNSkiaVideo

// Copy/pasted from
// https://github.com/google/skia/blob/5101cbe5a6bb6f5b05c3f582202f6745f9abe58e/modules/skresources/src/SkResources.cpp
// libskresource is not compiled by react-native-skia, and it was not worth is
// for this 2 lines of code
namespace skresources {

sk_sp<SkImage> ImageAsset::getFrame(float t) {
  return nullptr;
}

ImageAsset::FrameData ImageAsset::getFrameData(float t) {
  // legacy behavior
  return {
      this->getFrame(t),
      SkSamplingOptions(SkFilterMode::kLinear, SkMipmapMode::kNearest),
      SkMatrix::I(),
      SizeFit::kCenter,
  };
}
} // namespace skresources
