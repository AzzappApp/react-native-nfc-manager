import { Modal, SafeAreaView, ScrollView } from 'react-native';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { ModalProps } from 'react-native';

type ModuleSelectionListModalProps = Exclude<ModalProps, 'onRequestClose'> & {
  onSelectModuleKind: (module: ModuleKind) => void;
  onRequestClose: () => void;
};

// TODO temporary
const ModuleSelectionListModal = ({
  onSelectModuleKind,
  onRequestClose,
  ...props
}: ModuleSelectionListModalProps) => (
  <Modal onRequestClose={onRequestClose} {...props}>
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          leftElement={
            <IconButton icon="arrow_down" onPress={onRequestClose} />
          }
          middleElement="Add a new section"
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center', rowGap: 10 }}
        >
          {modules.map(module => (
            <Button
              key={module.value}
              onPress={() => onSelectModuleKind(module.value)}
              label={module.label}
              disabled={!module.ready}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Container>
  </Modal>
);

export default ModuleSelectionListModal;

const modules: Array<{ label: string; value: ModuleKind; ready: boolean }> = [
  {
    label: 'Simple Button',
    value: 'simpleButton',
    ready: false,
  },
  {
    label: 'Simple Text',
    value: 'simpleText',
    ready: true,
  },
  {
    label: 'Block Text',
    value: 'blockText',
    ready: false,
  },
  {
    label: 'Simple Title',
    value: 'simpleTitle',
    ready: true,
  },
  {
    label: 'Horizontal Photo',
    value: 'horizontalPhoto',
    ready: true,
  },
  {
    label: 'Carousel',
    value: 'carousel',
    ready: true,
  },
  {
    label: 'Line Divider',
    value: 'lineDivider',
    ready: true,
  },
  {
    label: 'Photo With Text and title',
    value: 'photoWithTextAndTitle',
    ready: false,
  },
  {
    label: 'Opening Hours',
    value: 'openingHours',
    ready: false,
  },
  {
    label: 'WebCards Carousel',
    value: 'webCardsCarousel',
    ready: false,
  },
  {
    label: 'Social Links',
    value: 'socialLinks',
    ready: false,
  },
];
