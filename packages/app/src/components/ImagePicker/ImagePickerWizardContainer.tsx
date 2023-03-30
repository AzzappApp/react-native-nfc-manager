import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '#ui/Button';
import FadeSwitch from '#ui/FadeSwitch';
import TabsBar from '#ui/TabsBar';
import Header from '../Header';
import { TOOL_BAR_BOTTOM_MARGIN } from './imagePickerConstants';
import type { TabsBarProps } from '#ui/TabsBar';
import type { ReactElement, ReactNode } from 'react';
import type { ViewProps } from 'react-native';

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
  toolbarProps?: Exclude<TabsBarProps, 'style' | 'variant'> | null;
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
    canCancel: boolean;
    busy?: boolean;
    onBack(): void;
    onNext(): void;
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
  toolbarProps,
  canCancel,
  onBack,
  onNext,
  style,
  ...props
}: ImagePickerWizardRendererProps) => {
  const { top: safeAreaTop, bottom: safeAreaBottom } = useSafeAreaInsets();

  const intl = useIntl();
  let leftButton = headerLeftButton;
  if (!leftButton) {
    if ((isFirstStep && canCancel) || !preventNavigation) {
      leftButton = (
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Cancel button label in image picker wizzard',
          })}
          onPress={onBack}
          variant="secondary"
          style={styles.headerButtons}
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
          isLastStep
            ? intl.formatMessage({
                defaultMessage: 'Finish',
                description: 'Finish button label in image picker wizzard',
              })
            : intl.formatMessage({
                defaultMessage: 'Next',
                description: 'Next button label in image picker wizzard',
              })
        }
        onPress={onNext}
        style={styles.headerButtons}
      />
    );
  }
  if (busy) {
    rightButton = <ActivityIndicator style={styles.activityIndicator} />;
  }
  return (
    <View style={[styles.root, { paddingTop: safeAreaTop }, style]} {...props}>
      <Header
        leftButton={leftButton}
        rightButton={rightButton}
        title={headerTitle}
        style={styles.header}
      />
      <View style={styles.topPanel}>{topPanel}</View>
      <View style={styles.bottomPanel}>
        <FadeSwitch transitionDuration={120} currentKey={stepId}>
          {bottomPanel}
        </FadeSwitch>
        {toolbarProps && (
          <View
            style={[
              styles.tabBarContainer,
              { bottom: safeAreaBottom + TOOL_BAR_BOTTOM_MARGIN },
            ]}
            pointerEvents="box-none"
          >
            <TabsBar variant="toolbar" {...toolbarProps} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'white',
    flex: 1,
  },
  header: {
    height: 70,
  },
  headerButtons: {
    width: 70,
    height: 46,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  activityIndicator: {
    marginRight: 10,
  },
  topPanel: {
    aspectRatio: 1,
    // backgroundColor: colors.grey500,
  },
  bottomPanel: { flex: 1, marginTop: 1 },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    width: '100%',
  },
});
