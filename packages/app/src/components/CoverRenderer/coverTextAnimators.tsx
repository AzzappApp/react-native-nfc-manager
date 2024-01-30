import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import capitalize from 'lodash/capitalize';
import { Fragment, useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { COVER_RATIO, type TextOrientation } from '@azzapp/shared/coverHelpers';
import { extractLetters } from '@azzapp/shared/stringHelpers';
import getCoverAnimationProgress from './getCoverAnimationProgress';
import type { ComponentType } from 'react';
import type { LayoutRectangle, TextLayoutLine, TextStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export type CoverTextAnimatorProps = {
  /**
   * The animation of the text
   */
  animation: string;
  /**
   * The title of the cover
   */
  title: string | null | undefined;
  /**
   * The style of the title
   */
  titleTextStyle: TextStyle | null | undefined;
  /**
   * the layout of the title
   */
  titleLayout: TextLayoutLine[] | null;
  /**
   * The sub title of the cover
   */
  subTitle: string | null | undefined;
  /**
   * The style of the sub title
   */
  subTitleTextStyle: TextStyle | null | undefined;
  /**
   * the layout of the title
   */
  subTitleLayout: TextLayoutLine[] | null;
  /**
   * The text orientation of the cover
   */
  orientation: TextOrientation;
  /**
   * The text block layout
   */
  textContainerLayout: LayoutRectangle;
  /**
   * the height of the cover
   */
  height: number;
  /**
   * animation shared value
   */
  animationSharedValue: SharedValue<number>;
};

/**
 * Returns the animator component for the given animation
 */
export const getTextAnimator = (
  animation: string,
): ComponentType<CoverTextAnimatorProps> | null => ANIMATORS[animation] ?? null;

const AnimatedTextContainer = ({
  textContainerLayout,
  mask,
  children,
}: {
  mask?:
    | { position: 'bottom' | 'left' | 'right' | 'top'; size: number }
    | null
    | undefined;
  textContainerLayout: LayoutRectangle;
  children: React.ReactNode;
}) => {
  const {
    x: tcX,
    y: tcY,
    width: tcWidth,
    height: tcHeight,
  } = textContainerLayout;

  if (!mask) {
    return (
      <View
        style={{
          position: 'absolute',
          top: tcY,
          left: tcX,
          width: tcWidth,
          height: tcHeight,
        }}
      >
        {children}
      </View>
    );
  }

  const { position, size: maskSize } = mask;

  return (
    <MaskedView
      style={{
        position: 'absolute',
        top: tcY + (position === 'top' ? -maskSize : 0),
        left: tcX + (position === 'left' ? -maskSize : 0),
        width:
          tcWidth +
          (position === 'left' || position === 'right' ? maskSize : 0),
        height:
          tcHeight +
          (position === 'top' || position === 'bottom' ? maskSize : 0),
        overflow: 'hidden',
        paddingTop: position === 'top' ? maskSize : 0,
        paddingLeft: position === 'left' ? maskSize : 0,
        paddingRight: position === 'right' ? maskSize : 0,
        paddingBottom: position === 'bottom' ? maskSize : 0,
      }}
      maskElement={
        <LinearGradient
          colors={
            position === 'left' || position === 'top'
              ? ['transparent', 'black', 'black']
              : ['black', 'black', 'transparent']
          }
          locations={[
            0.0,
            position === 'top'
              ? maskSize / (textContainerLayout.height + maskSize)
              : position === 'right'
                ? textContainerLayout.width /
                  (textContainerLayout.width + maskSize)
                : position === 'bottom'
                  ? textContainerLayout.height /
                    (textContainerLayout.height + maskSize)
                  : maskSize / (textContainerLayout.width + maskSize),
            1,
          ]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={
            position === 'left' || position === 'right'
              ? { x: 1, y: 0 }
              : { x: 0, y: 1 }
          }
        />
      }
    >
      {children}
    </MaskedView>
  );
};

const LettersSplitRenderer = ({
  titleLayout,
  subTitleLayout,
  titleTextStyle,
  subTitleTextStyle,
  renderLetter,
  mask,
}: {
  titleLayout: TextLayoutLine[] | null;
  subTitleLayout: TextLayoutLine[] | null;
  titleTextStyle: TextStyle | null | undefined;
  subTitleTextStyle: TextStyle | null | undefined;
  mask?: { position: 'bottom' | 'left' | 'right' | 'top'; size: number };
  renderLetter: (props: {
    letter: string;
    style: TextStyle | null | undefined;
    letterIndex: number;
    letterCount: number;
    lineIndex: number;
  }) => React.ReactNode;
}) => {
  const [linesWithLetters, letterCount] = useMemo(() => {
    const linesWithLetters: Array<{
      letters: string[];
      style: TextStyle | null | undefined;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    let letterCount = 0;
    let titleLayoutHeight = 0;
    const deltaX = mask?.position === 'left' ? mask.size : 0;
    const deltaY = mask?.position === 'top' ? mask.size : 0;
    titleLayout?.forEach(line => {
      const letters = extractLetters(line.text);

      linesWithLetters.push({
        letters,
        style: titleTextStyle,
        x: line.x + deltaX,
        y: line.y + deltaY,
        width: line.width,
        height: line.height,
      });
      letterCount += letters.length;
    });
    if (titleLayout) {
      const lastLine = titleLayout.at(-1);
      if (lastLine) {
        titleLayoutHeight = lastLine.y + lastLine.height;
      }
    }

    subTitleLayout?.forEach(line => {
      const letters = extractLetters(line.text);

      linesWithLetters.push({
        letters,
        style: subTitleTextStyle,
        x: line.x + deltaX,
        y: line.y + titleLayoutHeight + deltaY,
        width: line.width,
        height: line.height,
      });
      letterCount += letters.length;
    });
    return [linesWithLetters, letterCount];
  }, [
    mask?.position,
    mask?.size,
    titleLayout,
    subTitleLayout,
    titleTextStyle,
    subTitleTextStyle,
  ]);

  let currentLetterIndex = 0;
  return linesWithLetters.map(
    ({ letters, style, x, y, width, height }, lineIndex) => (
      <View
        style={{
          position: 'absolute',
          flexDirection: 'row',
          top: y,
          left: x,
          width,
          height,
        }}
        key={lineIndex}
      >
        {letters.map(letter => {
          const letterIndex = currentLetterIndex++;
          return (
            <Fragment key={letterIndex}>
              {renderLetter({
                letter,
                style,
                letterIndex,
                letterCount,
                lineIndex,
              })}
            </Fragment>
          );
        })}
      </View>
    ),
  );
};

const createSlideStyleTransform = (
  slideProgress: number,
  slideDirection: 'fromBottom' | 'fromLeft' | 'fromRight' | 'fromTop',
  axisSize: number,
) => {
  'worklet';
  const transform =
    slideDirection === 'fromTop' || slideDirection === 'fromBottom'
      ? 'translateY'
      : 'translateX';

  return {
    [transform]:
      (slideDirection === 'fromTop' || slideDirection === 'fromLeft' ? -1 : 1) *
      (slideProgress - 1) *
      axisSize,
  } as { translateX: number } | { translateY: number };
};

const createSlideAnimation = (
  slideDirection: 'fromBottom' | 'fromLeft' | 'fromRight' | 'fromTop',
) => {
  const SlideAnimation = ({
    textContainerLayout,
    height,
    animationSharedValue,
    title,
    titleTextStyle,
    subTitle,
    subTitleTextStyle,
  }: CoverTextAnimatorProps) => {
    const width = height * COVER_RATIO;
    const maskSize = width * 0.05;

    const textContainerAnimatedStyle = useAnimatedStyle(() => {
      const textAnimationProgress = getCoverAnimationProgress(
        animationSharedValue.value,
        {
          duration: 0.1,
          easing: Easing.inOut(Easing.ease),
        },
        {
          duration: 0.04,
          easing: Easing.inOut(Easing.ease),
        },
      );
      return {
        transform: [
          createSlideStyleTransform(
            textAnimationProgress,
            slideDirection,
            slideDirection === 'fromTop' || slideDirection === 'fromBottom'
              ? textContainerLayout.height + maskSize
              : textContainerLayout.width + maskSize,
          ),
        ],
      };
    });

    const maskPosition = slideDirection.slice(4).toLowerCase() as
      | 'bottom'
      | 'left'
      | 'right'
      | 'top';

    return (
      <AnimatedTextContainer
        textContainerLayout={textContainerLayout}
        mask={{ position: maskPosition, size: maskSize }}
      >
        <Animated.View style={textContainerAnimatedStyle}>
          <Text allowFontScaling={false} style={titleTextStyle}>
            {title}
          </Text>
          {!!subTitle && (
            <Text allowFontScaling={false} style={subTitleTextStyle}>
              {subTitle}
            </Text>
          )}
        </Animated.View>
      </AnimatedTextContainer>
    );
  };
  SlideAnimation.displayName = `SlideF${slideDirection.slice(1)}Animation`;
  return SlideAnimation;
};

const createSmoothAnimation = (
  slideDirection: 'fromBottom' | 'fromLeft' | 'fromRight' | 'fromTop',
) => {
  const SlideAnimation = ({
    textContainerLayout,
    animationSharedValue,
    title,
    titleTextStyle,
    subTitle,
    subTitleTextStyle,
  }: CoverTextAnimatorProps) => {
    const textContainerAnimatedStyle = useAnimatedStyle(() => {
      const textAnimationProgress = getCoverAnimationProgress(
        animationSharedValue.value,
        {
          duration: 0.2,
          easing: Easing.inOut(Easing.ease),
        },
        {
          duration: 0.2,
          easing: Easing.inOut(Easing.ease),
        },
      );

      const slideAnimationProgress = interpolate(
        textAnimationProgress,
        [0, 1, 2],
        [0, 1, 1],
      );

      return {
        opacity: interpolate(textAnimationProgress, [0, 1, 2], [0, 1, 0]),
        transform: [
          createSlideStyleTransform(
            slideAnimationProgress,
            slideDirection,
            slideDirection === 'fromTop' || slideDirection === 'fromBottom'
              ? textContainerLayout.height
              : textContainerLayout.width,
          ),
        ],
      };
    });

    return (
      <AnimatedTextContainer textContainerLayout={textContainerLayout}>
        <Animated.View style={textContainerAnimatedStyle}>
          <Text allowFontScaling={false} style={titleTextStyle}>
            {title}
          </Text>
          {!!subTitle && (
            <Text allowFontScaling={false} style={subTitleTextStyle}>
              {subTitle}
            </Text>
          )}
        </Animated.View>
      </AnimatedTextContainer>
    );
  };
  SlideAnimation.displayName = `SlideF${slideDirection.slice(1)}Animation`;
  return SlideAnimation;
};

const createSmoothLetterAnimation = (
  slideDirection: 'fromBottom' | 'fromLeft' | 'fromRight' | 'fromTop',
) => {
  const SmoothLetterAnimation = ({
    textContainerLayout,
    animationSharedValue,
    titleLayout,
    titleTextStyle,
    subTitleLayout,
    subTitleTextStyle,
  }: CoverTextAnimatorProps) => {
    const textAnimationProgress = useDerivedValue(() =>
      getCoverAnimationProgress(
        animationSharedValue.value,
        {
          duration: 0.2,
          easing: Easing.inOut(Easing.ease),
        },
        {
          duration: 0.04,
          easing: Easing.inOut(Easing.ease),
        },
      ),
    );

    return (
      <AnimatedTextContainer textContainerLayout={textContainerLayout}>
        <LettersSplitRenderer
          titleLayout={titleLayout}
          subTitleLayout={subTitleLayout}
          titleTextStyle={titleTextStyle}
          subTitleTextStyle={subTitleTextStyle}
          renderLetter={props => (
            <SmoothLetterAnimationLetterRenderer
              {...props}
              style={props.style}
              textAnimationProgress={textAnimationProgress}
              slideDirection={slideDirection}
              axisSize={
                slideDirection === 'fromTop' || slideDirection === 'fromBottom'
                  ? textContainerLayout.height
                  : textContainerLayout.width
              }
            />
          )}
        />
      </AnimatedTextContainer>
    );
  };
  // prettier-ignore
  SmoothLetterAnimation.displayName = 
    `SmoothLetter${capitalize(slideDirection)}Animation`;

  return SmoothLetterAnimation;
};

const SmoothLetterAnimationLetterRenderer = ({
  letter,
  letterIndex,
  letterCount,
  style,
  slideDirection,
  textAnimationProgress,
  axisSize,
}: {
  letter: string;
  letterIndex: number;
  letterCount: number;
  style: TextStyle | null | undefined;
  textAnimationProgress: SharedValue<number>;
  slideDirection: 'fromBottom' | 'fromLeft' | 'fromRight' | 'fromTop';
  axisSize: number;
}) => {
  const textAnimatedStyle = useAnimatedStyle(() => {
    const letterAnimPosition = (letterIndex + 1) / letterCount;
    const translationProgress = interpolate(
      textAnimationProgress.value,
      [0, letterAnimPosition, 2],
      [0, 1, 1],
    );
    return {
      opacity: interpolate(
        textAnimationProgress.value,
        [0, letterAnimPosition, 1, 1 + letterAnimPosition, 2],
        [0, 1, 1, 1, 0],
      ),
      transform: [
        createSlideStyleTransform(
          translationProgress,
          slideDirection,
          axisSize,
        ),
      ],
    };
  }, [textAnimationProgress]);

  return (
    <Animated.Text allowFontScaling={false} style={[style, textAnimatedStyle]}>
      {letter}
    </Animated.Text>
  );
};

const createSlideLetterAnimation = (
  slideDirection: 'fromBottom' | 'fromLeft' | 'fromRight' | 'fromTop',
) => {
  const SlideLetterAnimation = ({
    textContainerLayout,
    height,
    animationSharedValue,
    titleLayout,
    titleTextStyle,
    subTitleLayout,
    subTitleTextStyle,
  }: CoverTextAnimatorProps) => {
    const width = height * COVER_RATIO;
    const maskSize = width * 0.05;

    const textAnimationProgress = useDerivedValue(() =>
      getCoverAnimationProgress(animationSharedValue.value, {
        delay: 0.1,
        duration: 0.2,
        easing: Easing.inOut(Easing.ease),
      }),
    );

    const maskPosition = slideDirection.slice(4).toLowerCase() as
      | 'bottom'
      | 'left'
      | 'right'
      | 'top';

    const mask = { position: maskPosition, size: maskSize };

    return (
      <AnimatedTextContainer
        mask={mask}
        textContainerLayout={textContainerLayout}
      >
        <LettersSplitRenderer
          titleLayout={titleLayout}
          subTitleLayout={subTitleLayout}
          titleTextStyle={titleTextStyle}
          subTitleTextStyle={subTitleTextStyle}
          mask={mask}
          renderLetter={props => (
            <SlideLetterAnimationLetterRenderer
              {...props}
              style={props.style}
              textAnimationProgress={textAnimationProgress}
              slideDirection={slideDirection}
              axisSize={
                slideDirection === 'fromTop' || slideDirection === 'fromBottom'
                  ? textContainerLayout.height + maskSize
                  : textContainerLayout.width + maskSize
              }
            />
          )}
        />
      </AnimatedTextContainer>
    );
  };
  // prettier-ignore
  SlideLetterAnimation.displayName = 
    `SlideLetter${capitalize(slideDirection)}Animation`;

  return SlideLetterAnimation;
};

const SlideLetterAnimationLetterRenderer = ({
  letter,
  letterIndex,
  letterCount,
  style,
  slideDirection,
  textAnimationProgress,
  axisSize,
}: {
  letter: string;
  letterIndex: number;
  letterCount: number;
  style: TextStyle | null | undefined;
  textAnimationProgress: SharedValue<number>;
  slideDirection: 'fromBottom' | 'fromLeft' | 'fromRight' | 'fromTop';
  axisSize: number;
}) => {
  const textAnimatedStyle = useAnimatedStyle(() => {
    const letterAnimPosition = (letterIndex + 1) / letterCount;
    const translationProgress = interpolate(
      textAnimationProgress.value,
      [0, letterAnimPosition, 1],
      [0, 1, 1],
    );
    return {
      transform: [
        createSlideStyleTransform(
          translationProgress,
          slideDirection,
          axisSize,
        ),
      ],
    };
  }, [textAnimationProgress]);

  return (
    <Animated.Text allowFontScaling={false} style={[style, textAnimatedStyle]}>
      {letter}
    </Animated.Text>
  );
};

const FadeInAnimation = ({
  textContainerLayout,
  animationSharedValue,
  title,
  titleTextStyle,
  subTitle,
  subTitleTextStyle,
}: CoverTextAnimatorProps) => {
  const textContainerAnimatedStyle = useAnimatedStyle(() => {
    const textAnimationProgress = getCoverAnimationProgress(
      animationSharedValue.value,
      {
        duration: 0.2,
        easing: Easing.inOut(Easing.ease),
      },
      {
        duration: 0.2,
        easing: Easing.inOut(Easing.ease),
      },
    );
    return {
      opacity: interpolate(textAnimationProgress, [0, 1, 2], [0, 1, 0]),
    };
  });

  return (
    <AnimatedTextContainer textContainerLayout={textContainerLayout}>
      <Animated.View style={textContainerAnimatedStyle}>
        <Text allowFontScaling={false} style={titleTextStyle}>
          {title}
        </Text>
        {!!subTitle && (
          <Text allowFontScaling={false} style={subTitleTextStyle}>
            {subTitle}
          </Text>
        )}
      </Animated.View>
    </AnimatedTextContainer>
  );
};

const FadeInByLetterAnimation = ({
  textContainerLayout,
  animationSharedValue,
  titleLayout,
  titleTextStyle,
  subTitleLayout,
  subTitleTextStyle,
}: CoverTextAnimatorProps) => {
  const textAnimationProgress = useDerivedValue(
    () =>
      getCoverAnimationProgress(
        animationSharedValue.value,
        {
          duration: 0.2,
          easing: Easing.inOut(Easing.ease),
        },
        {
          duration: 0.2,
          easing: Easing.inOut(Easing.ease),
        },
      ),
    [animationSharedValue],
  );

  return (
    <AnimatedTextContainer textContainerLayout={textContainerLayout}>
      <LettersSplitRenderer
        titleLayout={titleLayout}
        subTitleLayout={subTitleLayout}
        titleTextStyle={titleTextStyle}
        subTitleTextStyle={subTitleTextStyle}
        renderLetter={props => (
          <FadeInByLetterAnimationRenderer
            {...props}
            style={props.style}
            textAnimationProgress={textAnimationProgress}
          />
        )}
      />
    </AnimatedTextContainer>
  );
};

const FadeInByLetterAnimationRenderer = ({
  letter,
  letterIndex,
  letterCount,
  style,
  textAnimationProgress,
}: {
  letter: string;
  letterIndex: number;
  letterCount: number;
  style: TextStyle | null | undefined;
  textAnimationProgress: SharedValue<number>;
}) => {
  const textAnimatedStyle = useAnimatedStyle(() => {
    const letterAnimPosition = (letterIndex + 1) / letterCount;
    return {
      opacity: interpolate(
        textAnimationProgress.value,
        [0, letterAnimPosition, 1],
        [0, 1, 1],
      ),
    };
  }, [textAnimationProgress]);

  return (
    <Animated.Text allowFontScaling={false} style={[style, textAnimatedStyle]}>
      {letter}
    </Animated.Text>
  );
};

const AppearAnimation = ({
  textContainerLayout,
  animationSharedValue,
  title,
  titleTextStyle,
  subTitle,
  subTitleTextStyle,
}: CoverTextAnimatorProps) => {
  const textContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animationSharedValue.value > 0.2 ? 1 : 0,
    };
  });

  return (
    <AnimatedTextContainer textContainerLayout={textContainerLayout}>
      <Animated.View style={textContainerAnimatedStyle}>
        <Text allowFontScaling={false} style={titleTextStyle}>
          {title}
        </Text>
        {!!subTitle && (
          <Text allowFontScaling={false} style={subTitleTextStyle}>
            {subTitle}
          </Text>
        )}
      </Animated.View>
    </AnimatedTextContainer>
  );
};

const AppearByLetterAnimation = ({
  textContainerLayout,
  animationSharedValue,
  titleLayout,
  titleTextStyle,
  subTitleLayout,
  subTitleTextStyle,
}: CoverTextAnimatorProps) => {
  return (
    <AnimatedTextContainer textContainerLayout={textContainerLayout}>
      <LettersSplitRenderer
        titleLayout={titleLayout}
        subTitleLayout={subTitleLayout}
        titleTextStyle={titleTextStyle}
        subTitleTextStyle={subTitleTextStyle}
        renderLetter={props => (
          <AppearByLetterAnimationRenderer
            {...props}
            style={props.style}
            animationSharedValue={animationSharedValue}
          />
        )}
      />
    </AnimatedTextContainer>
  );
};

const AppearByLetterAnimationRenderer = ({
  letter,
  letterIndex,
  letterCount,
  style,
  animationSharedValue,
}: {
  letter: string;
  letterIndex: number;
  letterCount: number;
  style: TextStyle | null | undefined;
  animationSharedValue: SharedValue<number>;
}) => {
  const textAnimatedStyle = useAnimatedStyle(() => {
    const letterAnimPosition = (letterIndex + 1) / letterCount;
    return {
      opacity:
        animationSharedValue.value > 0.2 + letterAnimPosition * 0.2 ? 1 : 0,
    };
  }, [animationSharedValue]);

  return (
    <Animated.Text allowFontScaling={false} style={[style, textAnimatedStyle]}>
      {letter}
    </Animated.Text>
  );
};

const BounceAnimation = ({
  textContainerLayout,
  animationSharedValue,
  title,
  titleTextStyle,
  subTitle,
  subTitleTextStyle,
}: CoverTextAnimatorProps) => {
  const textContainerAnimatedStyle = useAnimatedStyle(() => {
    const textAnimationProgress = getCoverAnimationProgress(
      animationSharedValue.value,
      {
        duration: 0.2,
        delay: 0.1,
        easing: Easing.bounce,
      },
      {
        duration: 0.2,
        easing: Easing.bounce,
      },
    );
    return {
      opacity: interpolate(textAnimationProgress, [0, 1, 2], [0, 1, 0]),
      transform: [
        {
          scale: interpolate(textAnimationProgress, [0, 1, 2], [0.5, 1, 0.5]),
        },
      ],
    };
  });

  return (
    <AnimatedTextContainer textContainerLayout={textContainerLayout}>
      <Animated.View style={textContainerAnimatedStyle}>
        <Text allowFontScaling={false} style={titleTextStyle}>
          {title}
        </Text>
        {!!subTitle && (
          <Text allowFontScaling={false} style={subTitleTextStyle}>
            {subTitle}
          </Text>
        )}
      </Animated.View>
    </AnimatedTextContainer>
  );
};

const NeonAnimation = ({
  textContainerLayout,
  animationSharedValue,
  title,
  titleTextStyle,
  subTitle,
  subTitleTextStyle,
}: CoverTextAnimatorProps) => {
  const textContainerAnimatedStyle = useAnimatedStyle(() => {
    const progress = animationSharedValue.value;
    return {
      opacity:
        progress < 0.2
          ? 0
          : progress < 0.225
            ? 1
            : progress < 0.25
              ? 0
              : progress < 0.275
                ? 1
                : progress < 0.3
                  ? 0
                  : 1,
    };
  });

  return (
    <AnimatedTextContainer textContainerLayout={textContainerLayout}>
      <Animated.View style={textContainerAnimatedStyle}>
        <Text allowFontScaling={false} style={titleTextStyle}>
          {title}
        </Text>
        {!!subTitle && (
          <Text allowFontScaling={false} style={subTitleTextStyle}>
            {subTitle}
          </Text>
        )}
      </Animated.View>
    </AnimatedTextContainer>
  );
};

const ANIMATORS: Record<string, React.ComponentType<CoverTextAnimatorProps>> = {
  slideUp: createSlideAnimation('fromBottom'),
  slideRight: createSlideAnimation('fromLeft'),
  slideBottom: createSlideAnimation('fromTop'),
  slideLeft: createSlideAnimation('fromRight'),
  smoothUp: createSmoothAnimation('fromBottom'),
  smoothRight: createSmoothAnimation('fromLeft'),
  smoothBottom: createSmoothAnimation('fromTop'),
  smoothLeft: createSmoothAnimation('fromRight'),
  smoothLettersUp: createSmoothLetterAnimation('fromBottom'),
  smoothLettersBottom: createSmoothLetterAnimation('fromTop'),
  slideLettersUp: createSlideLetterAnimation('fromBottom'),
  slideLettersRight: createSlideLetterAnimation('fromLeft'),
  slideLettersBottom: createSlideLetterAnimation('fromTop'),
  slideLettersLeft: createSlideLetterAnimation('fromRight'),
  fadeIn: FadeInAnimation,
  fadeInByLetter: FadeInByLetterAnimation,
  appear: AppearAnimation,
  appearByLetter: AppearByLetterAnimation,
  bounce: BounceAnimation,
  neon: NeonAnimation,
};

export const TEXT_ANIMATIONS = Object.keys(ANIMATORS);
