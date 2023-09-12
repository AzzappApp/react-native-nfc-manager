/* eslint-disable max-lines */
import { RoutingInstrumentation } from '@sentry/react-native';
import { logger } from '@sentry/utils';
import type { NativeRouter } from '#components/NativeRouter';
import type { Route } from '#routes';
import type {
  Transaction as TransactionType,
  TransactionContext,
} from '@sentry/types';

export type TransactionCreator = (
  context: TransactionContext,
) => TransactionType | undefined;

export type OnConfirmRoute = (context: TransactionContext) => void;
export type BeforeNavigate = (
  context: TransactionContext,
) => TransactionContext;

class NativeRouterInstrumentation extends RoutingInstrumentation {
  public static instrumentationName: string = 'azzapp-native-router';

  public readonly name: string =
    NativeRouterInstrumentation.instrumentationName;

  private _router: NativeRouter | null = null;

  private readonly _maxRecentRouteLen: number = 200;

  private _latestRoute?: Route & { id: string };
  private _latestTransaction?: TransactionType;
  private _initialStateHandled: boolean = false;
  private _stateChangeTimeout?: number | undefined;
  private _recentRouteKeys: string[] = [];

  /**
   * Extends by calling _handleInitialState at the end.
   */
  public registerRoutingInstrumentation(
    listener: TransactionCreator,
    beforeNavigate: BeforeNavigate,
    onConfirmRoute: OnConfirmRoute,
  ): void {
    super.registerRoutingInstrumentation(
      listener,
      beforeNavigate,
      onConfirmRoute,
    );

    // We create an initial state here to ensure a transaction gets created before the first route mounts.
    if (!this._initialStateHandled) {
      this._onDispatch();
      if (this._router) {
        // Navigation container already registered, just populate with route state
        this._onStateChange();

        this._initialStateHandled = true;
      }
    }
  }

  setRouter(router: NativeRouter): void {
    this._router = router;
  }

  public routeWillChange(): void {
    this._onDispatch();
  }

  public routeDidChange(): void {
    this._onStateChange();
  }

  /**
   * To be called on every React-Navigation action dispatch.
   * It does not name the transaction or populate it with route information. Instead, it waits for the state to fully change
   * and gets the route information from there, @see _onStateChange
   */
  private _onDispatch(): void {
    if (this._latestTransaction) {
      logger.log(
        '[NativeRouterInstrumentation] A transaction was detected that turned out to be a noop, discarding.',
      );
      this._discardLatestTransaction();
      this._clearStateChangeTimeout();
    }

    this._latestTransaction = this.onRouteWillChange(
      getBlankTransactionContext(
        NativeRouterInstrumentation.instrumentationName,
      ),
    );

    this._stateChangeTimeout = setTimeout(
      this._discardLatestTransaction.bind(this),
      2000,
    ) as any;
  }

  /**
   * To be called AFTER the state has been changed to populate the transaction with the current route.
   */
  private _onStateChange(): void {
    // Use the getCurrentRoute method to be accurate.
    const previousRoute = this._latestRoute;

    if (!this._router) {
      logger.warn(
        '[NativeRouterInstrumentation] Missing router, cannot get current route.',
      );

      return;
    }

    const route = {
      ...this._router.getCurrentRoute(),
      id: this._router.getCurrentScreenId(),
    };

    if (route) {
      if (this._latestTransaction) {
        if (!previousRoute || previousRoute.id !== route.id) {
          const originalContext =
            this._latestTransaction.toContext() as typeof BLANK_TRANSACTION_CONTEXT;
          const routeHasBeenSeen = this._recentRouteKeys.includes(route.id);

          const data: RouteChangeContextData = {
            ...originalContext.data,
            route: {
              ...route,
              hasBeenSeen: routeHasBeenSeen,
            },
            previousRoute: previousRoute ?? undefined,
          };

          const updatedContext: NativeRouterTransactionContext = {
            ...originalContext,
            name: route.route,
            tags: {
              ...originalContext.tags,
              'routing.route.route': route.route,
            },
            data,
          };

          const finalContext = this._prepareFinalContext(updatedContext);
          this._latestTransaction.updateWithContext(finalContext);

          this._latestTransaction.setName(finalContext.name, 'component');

          this._onConfirmRoute?.(finalContext);
        }

        this._pushRecentRouteKey(route.id);
        this._latestRoute = route;

        // Clear the latest transaction as it has been handled.
        this._latestTransaction = undefined;
      }
    }
  }

  /** Creates final transaction context before confirmation */
  private _prepareFinalContext(
    updatedContext: TransactionContext,
  ): TransactionContext {
    let finalContext = this._beforeNavigate?.({ ...updatedContext });

    // This block is to catch users not returning a transaction context
    if (!finalContext) {
      logger.error(
        `[ReactNavigationInstrumentation] beforeNavigate returned ${finalContext}, return context.sampled = false to not send transaction.`,
      );

      finalContext = {
        ...updatedContext,
        sampled: false,
      };
    }

    // Note: finalContext.sampled will be false at this point only if the user sets it to be so in beforeNavigate.
    if (finalContext.sampled === false) {
      logger.log(
        `[ReactNavigationInstrumentation] Will not send transaction "${finalContext.name}" due to beforeNavigate.`,
      );
    } else {
      // Clear the timeout so the transaction does not get cancelled.
      this._clearStateChangeTimeout();
    }

    return finalContext;
  }

  /** Pushes a recent route key, and removes earlier routes when there is greater than the max length */
  private _pushRecentRouteKey = (key: string): void => {
    this._recentRouteKeys.push(key);

    if (this._recentRouteKeys.length > this._maxRecentRouteLen) {
      this._recentRouteKeys = this._recentRouteKeys.slice(
        this._recentRouteKeys.length - this._maxRecentRouteLen,
      );
    }
  };

  /** Cancels the latest transaction so it does not get sent to Sentry. */
  private _discardLatestTransaction(): void {
    if (this._latestTransaction) {
      this._latestTransaction.sampled = false;
      this._latestTransaction.finish();
      this._latestTransaction = undefined;
    }
  }

  /**
   *
   */
  private _clearStateChangeTimeout(): void {
    if (typeof this._stateChangeTimeout !== 'undefined') {
      clearTimeout(this._stateChangeTimeout);
      this._stateChangeTimeout = undefined;
    }
  }
}

export default NativeRouterInstrumentation;

const BLANK_TRANSACTION_CONTEXT = {
  name: 'Route Change',
  op: 'navigation',
  tags: {
    'routing.instrumentation': NativeRouterInstrumentation.instrumentationName,
  },
  data: {},
};

const getBlankTransactionContext = (name: string): TransactionContext => {
  return {
    name: 'Route Change',
    op: 'navigation',
    tags: {
      'routing.instrumentation': name,
    },
    data: {},
    metadata: {
      source: 'component',
    },
  };
};

type RouteChangeContextData = {
  previousRoute?: Route & { id: string };
  route: Route & { id: string; hasBeenSeen: boolean };
};

type NativeRouterTransactionContext = TransactionContext & {
  tags: {
    'routing.instrumentation': string;
    'routing.route.route': string;
  };
  data: RouteChangeContextData;
};
