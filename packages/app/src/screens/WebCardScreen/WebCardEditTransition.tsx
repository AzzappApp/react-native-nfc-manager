import { uniq } from 'lodash';
import { useCallback, useRef, useState } from 'react';
import { Platform, StatusBar, StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  captureSnapshot,
  SnapshotRenderer,
} from '@azzapp/react-native-snapshot-view';
import { waitTime } from '@azzapp/shared/asyncHelpers';
import { COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import { colors, reactNativeShadow, shadow } from '#theme';
import useScreenDimensions from '#hooks/useScreenDimensions';
import {
  TRANSITIONS_DURATION,
  useWebCardEditScale,
} from '#screens/WebCardEditScreen/webCardEditScreenHelpers';
import type { ChildPositionAwareScrollViewHandle } from '#ui/ChildPositionAwareScrollView';
import type { ViewStyle, LayoutRectangle } from 'react-native';
import type { DerivedValue } from 'react-native-reanimated';

export type ModuleTransitionInfo = {
  webCardScreenSnapshotId: string | null;
  webCardScreenLayout: LayoutRectangle;
  editScreenSnapshotId: string | null;
  editScreenLayout: LayoutRectangle;
};

export const useWebCardEditTransition = (initialEdit: boolean) => {
  const [editing, setEditing] = useState(initialEdit);
  const [transitionInfos, setTransitionInfo] = useState<Record<
    string,
    ModuleTransitionInfo
  > | null>(null);
  const editTransition = useSharedValue(editing ? 1 : 0);
  const scrollViewRef = useRef<ChildPositionAwareScrollViewHandle>(null);
  const editScrollViewRef = useRef<ChildPositionAwareScrollViewHandle>(null);
  const { height: windowHeight } = useScreenDimensions();

  const clearTransitionInfos = useCallback(() => {
    setTimeout(() => {
      setTransitionInfo(null);
    }, 5);
  }, []);

  const editScale = useWebCardEditScale();
  const toggleEditing = useCallback(async () => {
    const fromScrollView = editing ? editScrollViewRef : scrollViewRef;
    const toScrollView = editing ? scrollViewRef : editScrollViewRef;
    const moduleId = await fromScrollView.current?.getTopChildId();
    if (moduleId) {
      toScrollView.current?.scrollToChild(moduleId);
    }
    // wait next tick to be sure the scrollview is at the right position
    await waitTime(1);
    const [editScreenContentInfos, webCardScreenContentInfos] =
      await Promise.all([
        editScrollViewRef.current?.getContentInfos(),
        scrollViewRef.current?.getContentInfos(),
      ]);

    const transitionItemsInfos: Record<string, ModuleTransitionInfo> = {};

    if (editScreenContentInfos && webCardScreenContentInfos) {
      const editScrollViewHeight =
        editScreenContentInfos.scrollViewLayout.height / editScale;
      const scrollViewHeight =
        webCardScreenContentInfos.scrollViewLayout.height;

      const modulesToDisplays = uniq([
        ...webCardScreenContentInfos.childInfos
          .filter(
            ({ layout }) =>
              webCardScreenContentInfos.scrollY < layout.y + layout.height &&
              layout.y < webCardScreenContentInfos.scrollY + scrollViewHeight,
          )
          .map(({ childId }) => childId),
        ...editScreenContentInfos.childInfos
          .filter(
            ({ layout }) =>
              editScreenContentInfos.scrollY < layout.y + layout.height &&
              layout.y < editScreenContentInfos.scrollY + editScrollViewHeight,
          )
          .map(({ childId }) => childId),
      ]);

      const webCardScreenModuleInfos = Object.fromEntries(
        webCardScreenContentInfos.childInfos.map(moduleInfo => [
          moduleInfo.childId,
          moduleInfo,
        ]),
      );
      const editScreenModuleInfos = Object.fromEntries(
        editScreenContentInfos.childInfos.map(moduleInfo => [
          moduleInfo.childId,
          moduleInfo,
        ]),
      );

      const transitionsModuleInfos = modulesToDisplays
        .map(childId => {
          const webCardScreenModuleInfo = webCardScreenModuleInfos[childId];
          const editScreenModuleInfo = editScreenModuleInfos[childId];
          if (!webCardScreenModuleInfo || !editScreenModuleInfo) {
            return null;
          }
          return {
            id: childId,
            webCardScreenRef: webCardScreenModuleInfo.ref,
            webCardScreenLayout: webCardScreenModuleInfo.layout,
            editScreenLayout: editScreenModuleInfo.layout,
            editScreenRef: editScreenModuleInfo.ref,
          };
        })
        .filter(info => !!info)
        .sort((a, b) => a.webCardScreenLayout.y - b.webCardScreenLayout.y);

      const snapshots = Object.fromEntries(
        await Promise.all(
          transitionsModuleInfos.map(
            async ({
              id,
              webCardScreenRef,
              webCardScreenLayout,
              editScreenRef,
            }) => [
              id,
              await Promise.all([
                webCardScreenLayout.height < windowHeight &&
                webCardScreenLayout.height > 0 &&
                id !== 'cover'
                  ? captureSnapshot(webCardScreenRef).catch(() => null)
                  : null,
                captureSnapshot(editScreenRef).catch(() => null),
              ]),
            ],
          ),
        ),
      );

      const webScreenScrollY = webCardScreenContentInfos.scrollY;
      const webScreenScrollEndY = webScreenScrollY + scrollViewHeight;
      let deltaStartY = 0;
      for (const {
        id,
        webCardScreenLayout,
        editScreenLayout,
      } of transitionsModuleInfos) {
        const webCardScreenAspectRatio =
          webCardScreenLayout.width / webCardScreenLayout.height;
        let webCardScreenYStart = webCardScreenLayout.y - deltaStartY;
        let webCardScreenYEnd =
          webCardScreenYStart + webCardScreenLayout.height;
        const editScreenAspectRatio =
          editScreenLayout.width / editScreenLayout.height;

        if (editScreenAspectRatio - webCardScreenAspectRatio > 0.1) {
          webCardScreenYStart = Math.max(webScreenScrollY, webCardScreenYStart);

          if (webCardScreenYEnd > webScreenScrollEndY) {
            deltaStartY += webCardScreenYEnd - webScreenScrollEndY;
            webCardScreenYEnd = webScreenScrollEndY;
          }
        }
        const [webCardScreenSnapshotId, editScreenSnapshotId] = snapshots[id];
        transitionItemsInfos[id] = {
          webCardScreenSnapshotId,
          editScreenSnapshotId,
          webCardScreenLayout: {
            x: 0,
            y: webCardScreenYStart - webScreenScrollY,
            width: webCardScreenLayout.width,
            height: webCardScreenYEnd - webCardScreenYStart,
          },
          editScreenLayout: {
            x: editScreenLayout.x * editScale,
            y:
              editScreenLayout.y * editScale -
              editScreenContentInfos.scrollY * editScale +
              editScreenContentInfos.scrollViewLayout.y +
              Platform.select({
                default: 0,
                android: StatusBar.currentHeight,
              }),
            width: editScreenLayout.width * editScale,
            height: editScreenLayout.height * editScale,
          },
        };
      }
    }

    setTransitionInfo(transitionItemsInfos);
    // We need to wait the Snapshot to be rendered before starting the transition
    await waitTime(1);
    editTransition.value = withTiming(
      editing ? 0 : 1,
      { duration: TRANSITIONS_DURATION },
      () => {
        runOnJS(clearTransitionInfos)();
      },
    );
    // We need the animation to start before changing the editing state to avoid a flicker
    // the edit screen being visible only if editTransition.value is greater than 0
    await waitTime(1);
    setEditing(!editing);
  }, [editing, editTransition, editScale, windowHeight, clearTransitionInfos]);

  return {
    editing,
    editTransition,
    transitionInfos,
    scrollViewRef,
    editScrollViewRef,
    toggleEditing,
  };
};

export const WebCardModuleTransitionSnapshotRenderer = ({
  info,
  editTransition,
}: {
  info: ModuleTransitionInfo;
  editTransition: DerivedValue<number>;
}) => {
  const { width: windowWidth } = useScreenDimensions();
  const editScale = useWebCardEditScale();
  const style = useAnimatedStyle(() => {
    const { webCardScreenLayout, editScreenLayout } = info;

    return {
      position: 'absolute',
      top: interpolate(
        editTransition.value,
        [0, 1],
        [webCardScreenLayout.y, editScreenLayout.y],
      ),
      left: interpolate(
        editTransition.value,
        [0, 1],
        [webCardScreenLayout.x, editScreenLayout.x],
      ),
      width: interpolate(
        editTransition.value,
        [0, 1],
        [webCardScreenLayout.width, editScreenLayout.width],
      ),
      height: interpolate(
        editTransition.value,
        [0, 1],
        [webCardScreenLayout.height, editScreenLayout.height],
      ),
      borderRadius: interpolate(
        editTransition.value,
        [0, 1],
        [0, (COVER_CARD_RADIUS * windowWidth - 2) * editScale],
      ),
    };
  });

  const innerViewStyle = useAnimatedStyle(() => {
    return {
      borderRadius: interpolate(
        editTransition.value,
        [0, 1],
        [0, (COVER_CARD_RADIUS * windowWidth - 2) * editScale],
      ),
      overflow: 'hidden',
      backgroundColor: colors.grey100,
    };
  });

  const appearance = useColorScheme() ?? 'light';

  const webCardScreenSnapshotStyle = useAnimatedStyle(() => {
    return {
      opacity: info.editScreenSnapshotId
        ? interpolate(editTransition.value, [0, 0.2], [1, 0])
        : 1,
    };
  });

  return (
    <Animated.View
      style={[
        style,
        Platform.select<ViewStyle>({
          ios: reactNativeShadow(appearance),
          default: shadow(appearance),
        }),
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, innerViewStyle]}>
        <SnapshotRenderer
          snapshotID={info.editScreenSnapshotId}
          style={{
            top: 0,
            left: 0,
            width: '100%',
            aspectRatio:
              info.editScreenLayout.width / info.editScreenLayout.height,
          }}
        />
        {info.webCardScreenSnapshotId && (
          <Animated.View
            style={[StyleSheet.absoluteFill, webCardScreenSnapshotStyle]}
          >
            <SnapshotRenderer
              snapshotID={info.webCardScreenSnapshotId}
              style={{
                top: 0,
                left: 0,
                width: '100%',
                aspectRatio:
                  info.webCardScreenLayout.width /
                  info.webCardScreenLayout.height,
              }}
            />
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
};
