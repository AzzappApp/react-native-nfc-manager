import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import RNBootSplash

@main
	class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

 func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    FirebaseApp.configure()
    clearKeychainIfNecessary()

    
    AZPAnimatorBridge.register(
      AZPCustomRevealTransition(),
      forName: "reveal"
    )

    factory.startReactNative(
      withModuleName: "azzapp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

private func clearKeychainIfNecessary() {
    let hasRunBefore = UserDefaults.standard.bool(forKey: "HAS_RUN_BEFORE")
    guard !hasRunBefore else { return }

    UserDefaults.standard.set(true, forKey: "HAS_RUN_BEFORE")

    let secItemClasses: [CFString] = [
      kSecClassGenericPassword,
      kSecClassInternetPassword,
      kSecClassCertificate,
      kSecClassKey,
      kSecClassIdentity
    ]

    for secClass in secItemClasses {
      let query = [kSecClass as String: secClass]
      SecItemDelete(query as CFDictionary)
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge!) -> URL! {
    return bundleURL()
  }

  override func bundleURL() -> URL! {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView) // ⬅️ initialize the splash screen
  }

}
