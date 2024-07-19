#pragma once

#include <jsi/jsi.h>

namespace RNSkia {
using namespace facebook;

class RNSkModuleManager {
public:
  /**
   * Installs the javascript methods for registering/unregistering draw
   * callbacks for RNSkDrawViews. Called on installation of the parent native
   * module.
   */
  static void installBindings(jsi::Runtime* jsRuntime);

private:
  jsi::Runtime* _jsRuntime;
};
} // namespace RNSkia
