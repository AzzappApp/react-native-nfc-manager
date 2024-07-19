import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { FlatList, StyleSheet, View } from 'react-native';
import { ScreenModal } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import ModuleSelectionListModalItem from './ModuleSelectionListModalItem';
import type { ScreenModalProps } from '#components/NativeRouter';
import type { ModuleSelectionListItem } from './ModuleSelectionListModalItem';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { ListRenderItemInfo } from 'react-native';

type ModuleSelectionListModalProps = Omit<
  ScreenModalProps,
  'onRequestDismiss'
> & {
  onSelectModuleKind: (module: ModuleKind) => void;
  onRequestClose: () => void;
};

const ModuleSelectionListModal = ({
  onSelectModuleKind,
  onRequestClose,
  ...props
}: ModuleSelectionListModalProps) => {
  const intl = useIntl();
  const modules = useMemo(
    () =>
      [
        {
          moduleKind: 'simpleButton',
          label: intl.formatMessage({
            defaultMessage: 'Button',
            description:
              'Module selection list modal simple button module label',
          }),
          image_light: require('./../../assets/module/simpleButton_light.png'),
          image_dark: require('./../../assets/module/simpleButton_dark.png'),
          ready: true,
        },
        {
          moduleKind: 'simpleText',
          label: intl.formatMessage({
            defaultMessage: 'Text',
            description: 'Module selection list modal simple text module label',
          }),
          image_light: require('./../../assets/module/simpleText_light.png'),
          image_dark: require('./../../assets/module/simpleText_dark.png'),
          ready: true,
        },
        {
          moduleKind: 'blockText',
          label: intl.formatMessage({
            defaultMessage: 'Text Block',
            description: 'Module selection list modal block text module label',
          }),
          image_light: require('./../../assets/module/blockText_light.png'),
          image_dark: require('./../../assets/module/blockText_dark.png'),
          ready: true,
        },
        {
          moduleKind: 'simpleTitle',
          label: intl.formatMessage({
            defaultMessage: 'Title',
            description:
              'Module selection list modal simple title module label',
          }),
          image_light: require('./../../assets/module/simpleTitle_light.png'),
          image_dark: require('./../../assets/module/simpleTitle_dark.png'),
          ready: true,
        },
        {
          moduleKind: 'horizontalPhoto',
          label: intl.formatMessage({
            defaultMessage: 'Image',
            description:
              'Module selection list modal horizontal photo module label',
          }),
          image_light: require('./../../assets/module/horizontalPhoto_light.png'),
          image_dark: require('./../../assets/module/horizontalPhoto_dark.png'),
          ready: true,
        },
        {
          moduleKind: 'carousel',
          label: intl.formatMessage({
            defaultMessage: 'Image Carousel',
            description:
              'Module selection list modal Image Carousel module label',
          }),
          image_light: require('./../../assets/module/carousel_light.png'),
          image_dark: require('./../../assets/module/carousel_dark.png'),
          ready: true,
        },
        {
          moduleKind: 'lineDivider',
          label: intl.formatMessage({
            defaultMessage: 'Divider',
            description:
              'Module selection list modal Line Divider module label',
          }),
          image_light: require('./../../assets/module/lineDivider_light.png'),
          image_dark: require('./../../assets/module/lineDivider_dark.png'),
          ready: true,
        },
        {
          moduleKind: 'photoWithTextAndTitle',
          label: intl.formatMessage({
            defaultMessage: 'Text Image',
            description:
              'Module selection list modal Photo With Text and title module label',
          }),
          image_light: require('./../../assets/module/photoWithTextAndTitle_light.png'),
          image_dark: require('./../../assets/module/photoWithTextAndTitle_dark.png'),
          ready: true,
        },
        {
          moduleKind: 'schedule',
          label: intl.formatMessage({
            defaultMessage: 'Schedule',
            description:
              'Module selection list modal Opening Hours module label',
          }),
          image_light: require('./../../assets/module/openingHours_light.png'),
          image_dark: require('./../../assets/module/openingHours_dark.png'),
          ready: false,
        },
        {
          moduleKind: 'socialLinks',
          label: intl.formatMessage({
            defaultMessage: 'Links',
            description:
              'Module selection list modal Social Links module label',
          }),
          image_light: require('./../../assets/module/socialLinks_light.png'),
          image_dark: require('./../../assets/module/socialLinks_dark.png'),
          ready: true,
        },
        {
          moduleKind: 'parallax',
          label: intl.formatMessage({
            defaultMessage: 'Parrallax',
            description: 'Module selection list modal Parrallax module label',
          }),
          image_light: require('./../../assets/module/parallax_light.png'),
          image_dark: require('./../../assets/module/parallax_light.png'),
          ready: false,
        },
        {
          moduleKind: 'video',
          label: intl.formatMessage({
            defaultMessage: 'Video',
            description: 'Module selection list modal Video module label',
          }),
          image_light: require('./../../assets/module/video_light.png'),
          image_dark: require('./../../assets/module/video_light.png'),
          ready: false,
        },
        {
          moduleKind: 'imageGrid',
          label: intl.formatMessage({
            defaultMessage: 'Image Grid',
            description: 'Module selection list modal Image Grid module label',
          }),
          image_light: require('./../../assets/module/imagegrid_light.png'),
          image_dark: require('./../../assets/module/imagegrid_light.png'),
          ready: false,
        },
      ] as const,
    [intl],
  );

  const { top, bottom } = useScreenInsets();
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ModuleSelectionListItem | null>) =>
      item ? (
        <ModuleSelectionListModalItem
          module={item}
          key={item.moduleKind}
          onSelect={onSelectModuleKind}
        />
      ) : (
        <View
          key="empty"
          style={{
            flex: 1,
            padding: 15,
          }}
        />
      ),

    [onSelectModuleKind],
  );

  const data = useMemo(
    () => (modules.length % 2 === 1 ? [...modules, null] : modules),
    [modules],
  );

  return (
    <ScreenModal {...props} onRequestDismiss={onRequestClose}>
      <Container style={[styles.root, { paddingTop: top }]}>
        <Header
          leftElement={
            <IconButton
              icon="arrow_down"
              variant="icon"
              onPress={onRequestClose}
            />
          }
          middleElement={intl.formatMessage({
            defaultMessage: 'Add a new section',
            description: 'Module selection list modal header title',
          })}
        />
        <FlatList
          numColumns={2}
          data={data}
          renderItem={renderItem}
          contentContainerStyle={{
            rowGap: 10,
            columnGap: 10,
            paddingBottom: bottom + 30,
          }}
          style={styles.flatList}
          showsVerticalScrollIndicator={false}
        />
      </Container>
    </ScreenModal>
  );
};

export default ModuleSelectionListModal;

const styles = StyleSheet.create({
  root: { flex: 1 },
  flatList: {
    paddingHorizontal: 10,
    paddingTop: 20,
  },
});
