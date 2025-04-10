import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import useEditorLayout from '#hooks/useEditorLayout';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomMenu, { BOTTOM_MENU_PADDING } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import IconButton from '#ui/IconButton';
import type { BottomMenuProps } from '#ui/BottomMenu';
import type { ReactElement, ReactNode, ComponentType } from 'react';
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
   * the right button  header
   * Only change the label of the right header button
   */
  headerRightButtonTitle?: string | null;
  /**
   * prevent the navigation to the next step
   */
  preventNavigation?: boolean;
  /**
   * Show buttons in header only if defined
   */
  headerButtonsShowIfDefined?: boolean;
  /**
   * the title of the header
   */
  headerTitle?: ReactNode;
  /**
   * the content to display in the top panel of the image picker
   */
  topPanel: ReactNode;
  /**
   * the aspect ratio of the top panel
   */
  topPanelAspectRatio?: number;
  /**
   * the content to display in the bottom panel of the image picker
   */
  bottomPanel:
    | ReactNode
    | ((metrics: {
        insetBottom: number;
        insetTop: number;
        height: number;
      }) => ReactNode);
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
  headerLeftButton,
  headerRightButton,
  headerTitle,
  headerButtonsShowIfDefined = false,
  preventNavigation,
  isFirstStep,
  isLastStep,
  busy,
  topPanel,
  topPanelAspectRatio = 1,
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
  const intl = useIntl();
  let leftButton = headerLeftButton;
  if (!leftButton && !headerButtonsShowIfDefined) {
    if (isFirstStep && canCancel) {
      leftButton = (
        <HeaderButton
          label={intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Cancel button label in image picker wizzard',
          })}
          onPress={onBack}
          variant="secondary"
        />
      );
    } else if (!preventNavigation) {
      leftButton = (
        <IconButton
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Back',
            description: 'Back button label in image picker wizzard',
          })}
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
  if (!rightButton && !preventNavigation && !headerButtonsShowIfDefined) {
    rightButton = (
      <HeaderButton
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

  const { insetBottom, bottomPanelHeight, insetTop, topPanelHeight } =
    useEditorLayout({ topPanelAspectRatio });

  if (busy) {
    rightButton = <ActivityIndicator style={styles.activityIndicator} />;
  }

  return (
    <Container
      style={[styles.root, { paddingTop: insetTop }, style]}
      {...props}
    >
      <Header
        leftElement={leftButton}
        rightElement={rightButton}
        middleElement={headerTitle}
        style={styles.header}
      />

      <View style={{ height: !topPanel ? 0 : topPanelHeight }}>
        {!!topPanel && <TopPanelWrapper>{topPanel}</TopPanelWrapper>}
      </View>
      <View style={{ height: bottomPanelHeight }}>
        {typeof bottomPanel === 'function'
          ? bottomPanel({
              insetBottom,
              insetTop,
              height: bottomPanelHeight,
            })
          : bottomPanel}
      </View>
      {menuBarProps && (
        <View
          style={[
            styles.bottomMenuContainer,
            { bottom: insetBottom - BOTTOM_MENU_PADDING },
          ]}
          pointerEvents="box-none"
        >
          <BottomMenu
            {...menuBarProps}
            style={{
              width: menuBarProps.tabs.length * 60 + 40,
              gap: 20,
            }}
          />
        </View>
      )}
    </Container>
  );
};

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
  bottomMenuContainer: {
    position: 'absolute',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
