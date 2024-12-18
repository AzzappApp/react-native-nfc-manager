#pragma once
#include <jsi/jsi.h>
#include <map>
#include <include/core/SkImage.h>
#include <modules/skottie/include/Skottie.h>
#include <modules/skresources/include/SkResources.h>

namespace RNSkia {
using namespace facebook;
class TemplateResourceProvider;
class TemplateImageAsset;

class JSI_EXPORT SkottieTemplatePlayer : public jsi::HostObject {
public:
  SkottieTemplatePlayer(const std::string& content,
                        const std::vector<std::string> resourcesIds);
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& propNameId) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;

private:
  sk_sp<skottie::Animation> animation;
  sk_sp<TemplateResourceProvider> resourceProvider;
  
  void dispose();
};

class TemplateResourceProvider : public skresources::ResourceProvider {
public:
  TemplateResourceProvider(const std::vector<std::string> resourcesIds);
  sk_sp<skresources::ImageAsset> loadImageAsset(const char[], const char[],
                                                const char[]) const override;
  void updateAssetImage(std::string id, sk_sp<SkImage> image, std::shared_ptr<SkMatrix> matrix);
  
  void dispose();

private:
  std::map<std::string, sk_sp<TemplateImageAsset>> assets;
};

class TemplateImageAsset : public skresources::ImageAsset {
public:
  TemplateImageAsset();
  sk_sp<SkImage> currentImage = nullptr;
  std::shared_ptr<SkMatrix> skMatrix = nullptr;
  bool isMultiFrame() override;
  FrameData getFrameData(float t) override;
};

} // namespace RNSkiaVideo
