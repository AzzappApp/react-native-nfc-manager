import UIKit

@objc(AZPCustomRevealTransition)
class AZPCustomRevealTransition: NSObject, RNSScreenCustomStackAnimator {
  func animateCustom(
    withTransitionContext transitionContext: UIViewControllerContextTransitioning,
    toVC toViewController: UIViewController,
    fromVC fromViewController: UIViewController,
    for operation: UINavigationController.Operation,
    andDuration duration: TimeInterval,
    withOptions options: [AnyHashable: Any]
  ) {
    let fromRect = rectangle(from: options["fromRectangle"] as? [String: Any])
    let toRect = rectangle(from: options["toRectangle"] as? [String: Any])

    let fromRadius = (options["fromRadius"] as? NSNumber)?.floatValue ?? 0
    let toRadius = (options["toRadius"] as? NSNumber)?.floatValue ?? 0

    let targetFrame = transitionContext.finalFrame(for: toViewController)
    let scale = fromRect.width / toRect.width
    let fromTransform = CGAffineTransform(scaleX: scale, y: scale)

    let fromCenter = CGPoint(
      x: fromRect.origin.x + fromRect.width / 2 - toRect.origin.x / 2,
      y: fromRect.origin.y + fromRect.width * (targetFrame.height / targetFrame.width) / 2
         - toRect.origin.y / 2
    )

    let targetCenter = CGPoint(
      x: targetFrame.origin.x + targetFrame.width / 2,
      y: targetFrame.origin.y + targetFrame.height / 2
    )

    let mask = UIView(frame: targetFrame)
    mask.backgroundColor = .clear
    let areaToReveal = UIView()
    areaToReveal.backgroundColor = .white
    mask.addSubview(areaToReveal)

    let fromRevealBounds = CGRect(origin: .zero, size: toRect.size)
    let fromRevealCenter = CGPoint(x: toRect.midX, y: toRect.midY)

    let targetRevealBounds = CGRect(origin: .zero, size: targetFrame.size)
    let targetRevealCenter = CGPoint(x: targetFrame.midX, y: targetFrame.midY)

    toViewController.view.frame = targetFrame

    switch operation {
    case .push:
      transitionContext.containerView.addSubview(toViewController.view)

      toViewController.view.transform = fromTransform
      toViewController.view.center = fromCenter
      areaToReveal.bounds = fromRevealBounds
      areaToReveal.center = fromRevealCenter
      areaToReveal.layer.cornerRadius = CGFloat(fromRadius)

      toViewController.view.mask = mask

      UIView.animate(withDuration: duration, animations: {
        toViewController.view.transform = .identity
        toViewController.view.center = targetCenter
        areaToReveal.bounds = targetRevealBounds
        areaToReveal.center = targetRevealCenter
        areaToReveal.layer.cornerRadius = CGFloat(toRadius)
      }, completion: { finished in
        toViewController.view.transform = .identity
        toViewController.view.center = targetCenter
        toViewController.view.mask = nil
        transitionContext.completeTransition(!transitionContext.transitionWasCancelled)
      })

    case .pop:
      transitionContext.containerView.insertSubview(toViewController.view, belowSubview: fromViewController.view)

      fromViewController.view.transform = .identity
      fromViewController.view.center = targetCenter
      areaToReveal.bounds = targetRevealBounds
      areaToReveal.center = targetRevealCenter
      areaToReveal.layer.cornerRadius = CGFloat(toRadius)

      fromViewController.view.mask = mask

      UIView.animate(withDuration: duration, animations: {
        fromViewController.view.transform = fromTransform
        fromViewController.view.center = fromCenter
        areaToReveal.bounds = fromRevealBounds
        areaToReveal.center = fromRevealCenter
        areaToReveal.layer.cornerRadius = CGFloat(fromRadius)
      }, completion: { finished in
        fromViewController.view.transform = .identity
        fromViewController.view.center = targetCenter
        fromViewController.view.mask = nil
        transitionContext.completeTransition(!transitionContext.transitionWasCancelled)
      })

    default:
      break
    }
  }

  private func rectangle(from options: [String: Any]?) -> CGRect {
    guard
      let x = options?["x"] as? NSNumber,
      let y = options?["y"] as? NSNumber,
      let width = options?["width"] as? NSNumber,
      let height = options?["height"] as? NSNumber
    else {
      return .zero
    }

    return CGRect(x: CGFloat(truncating: x),
                  y: CGFloat(truncating: y),
                  width: CGFloat(truncating: width),
                  height: CGFloat(truncating: height))
  }
}
