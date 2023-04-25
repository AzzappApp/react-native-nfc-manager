import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomMenu, { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Button from '#ui/Button';
import Container from '#ui/Container';
import FadeSwitch from '#ui/FadeSwitch';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import { TOOL_BAR_BOTTOM_MARGIN } from './imagePickerConstants';
import type { BottomMenuProps } from '#ui/BottomMenu';
import type { ReactElement, ReactNode, ComponentType } from 'react';
import type { ViewProps, LayoutChangeEvent } from 'react-native';

export type ImagePickerStepDefinition = {
  /**
   * the id of the step
   */
  stepId: string;
  /**
   * the left button of the header
   * if null, and if the state allows it, the back button is displayed
   */
  headerLeftButton?: ReactElement | null;
  /**
   * the right button of the header
   * if null, and if the state allows it, the next button is displayed
   */
  headerRightButton?: ReactElement | null;
  /**
   * the right button  header
   * Only change the label of the right header button
   */
  headerRightButtonTitle?: string | null;
  /**
   * prevent the navigation to the next step
   */
  preventNavigation?: boolean;
  /**
   * the title of the header
   */
  headerTitle?: ReactNode;
  /**
   * the content to display in the top panel of the image picker
   */
  topPanel: ReactNode;
  /**
   * the content to display in the bottom panel of the image picker
   */
  bottomPanel: ReactNode;
  /**
   * the props of the toolbar to display, if null, no toolbar is displayed
   */
  menuBarProps?: Exclude<BottomMenuProps, 'style' | 'variant'> | null;
};

/**
 * Allows to define a step of the image picker wizard, every step must return
 * and ImagePickerStep element to be able to display content
 * in the image picker wizard
 */
export const ImagePickerStep = (props: ImagePickerStepDefinition) => {
  const { setCurrentStep } = useContext(ImagePickerWizardContainerContext);
  useLayoutEffect(() => {
    setCurrentStep(props);
  }, [setCurrentStep, props]);
  return null;
};

const ImagePickerWizardContainerContext = createContext<{
  setCurrentStep(step: ImagePickerStepDefinition): void;
}>({
  setCurrentStep: () => void 0,
});

type ImagePickerWizardContainerProps = Exclude<ViewProps, 'children'> & {
  children: ReactElement;
  isLastStep: boolean;
  isFirstStep: boolean;
  canCancel: boolean;
  busy?: boolean;
  exporting?: boolean;
  TopPanelWrapper: ComponentType<any>;
  onBack(): void;
  onNext(): void;
};

/**
 * Manage the display of the image picker wizard Internally use a portal
 * like mechanism through Context to display the current step without
 * mounting/unmounting the panels of the wizard every time the step changes
 * if those panels are identical between steps
 */
export const ImagePickerWizardContainer = ({
  children,
  ...props
}: ImagePickerWizardContainerProps) => {
  const [currentStep, setCurrentStep] =
    useState<ImagePickerStepDefinition | null>(null);
  return (
    <>
      <ImagePickerWizardContainerContext.Provider
        value={useMemo(() => ({ setCurrentStep }), [])}
      >
        {children}
      </ImagePickerWizardContainerContext.Provider>
      {currentStep ? (
        <ImagePickerWizardRenderer {...currentStep} {...props} />
      ) : null}
    </>
  );
};

type ImagePickerWizardRendererProps = ImagePickerStepDefinition &
  ViewProps & {
    isLastStep: boolean;
    isFirstStep: boolean;
    lastStepButtonLabel?: string;
    canCancel: boolean;
    busy?: boolean;
    onBack(): void;
    onNext(): void;
    TopPanelWrapper: ComponentType<any>;
  };

const ImagePickerWizardRenderer = ({
  stepId,
  headerLeftButton,
  headerRightButton,
  headerTitle,
  preventNavigation,
  isFirstStep,
  isLastStep,
  busy,
  topPanel,
  bottomPanel,
  menuBarProps,
  headerRightButtonTitle,
  canCancel,
  onBack,
  onNext,
  TopPanelWrapper,
  style,
  ...props
}: ImagePickerWizardRendererProps) => {
  const { top: safeAreaTop, bottom: safeAreaBottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const intl = useIntl();
  let leftButton = headerLeftButton;
  if (!leftButton) {
    if (isFirstStep && canCancel) {
      leftButton = (
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Cancel button label in image picker wizzard',
          })}
          onPress={onBack}
          variant="cancel"
        />
      );
    } else if (!preventNavigation) {
      leftButton = (
        <IconButton
          onPress={onBack}
          iconSize={30}
          icon="arrow_left"
          style={{ borderWidth: 0 }}
        />
      );
    }
  }
  if (busy) {
    leftButton = null;
  }
  let rightButton = headerRightButton;
  if (!rightButton && !preventNavigation) {
    rightButton = (
      <Button
        label={
          headerRightButtonTitle
            ? headerRightButtonTitle
            : isLastStep
            ? intl.formatMessage({
                defaultMessage: 'Save',
                description: 'Save button label in image picker wizzard',
              })
            : intl.formatMessage({
                defaultMessage: 'Next',
                description: 'Next button label in image picker wizzard',
              })
        }
        onPress={onNext}
      />
    );
  }

  const marginBottom =
    safeAreaBottom > 0
      ? safeAreaBottom
      : TOOL_BAR_BOTTOM_MARGIN + (menuBarProps ? BOTTOM_MENU_HEIGHT : 0);

  //this is the maximum height of the top panel when top and bottom are not absolute view

  const [heightTopPanel, setHeightTopPanel] = useState(0);
  const onLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      setHeightTopPanel(
        Math.min(
          width,
          layout.height - marginBottom - BOTTOM_PANEL_MININAL_SIZE,
        ),
      );
    },
    [marginBottom, width],
  );

  if (busy) {
    rightButton = <ActivityIndicator style={styles.activityIndicator} />;
  }

  return (
    <Container
      style={[styles.root, { paddingTop: safeAreaTop }, style]}
      {...props}
    >
      <Header
        leftElement={leftButton}
        rightElement={rightButton}
        middleElement={headerTitle}
        style={styles.header}
      />

      <View onLayout={onLayout} style={{ flex: 1 }}>
        <FadeSwitch transitionDuration={130} currentKey={stepId}>
          <View
            style={[
              {
                minHeight: heightTopPanel,
                flex: 1,
                maxHeight: width,
              },
            ]}
          >
            {!!topPanel && <TopPanelWrapper>{topPanel}</TopPanelWrapper>}
          </View>
          <View
            style={{
              minHeight: BOTTOM_PANEL_MININAL_SIZE + marginBottom,
              flex: 1,
              flexShrink: 0,
            }}
          >
            {bottomPanel}
          </View>
          {menuBarProps && (
            <View
              style={[
                styles.tabBarContainer,
                {
                  bottom:
                    safeAreaBottom > 0
                      ? safeAreaBottom
                      : TOOL_BAR_BOTTOM_MARGIN,
                },
              ]}
              pointerEvents="box-none"
            >
              <BottomMenu {...menuBarProps} />
            </View>
          )}
        </FadeSwitch>
      </View>
    </Container>
  );
};

const BOTTOM_PANEL_MININAL_SIZE = 183;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    marginBottom: 10,
  },
  activityIndicator: {
    marginRight: 10,
  },
  topPanel: {
    flex: 1,
  },

  tabBarContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
  },
});
