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
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Container>
  </Modal>
);

export default ModuleSelectionListModal;

const modules: Array<{ label: string; value: ModuleKind }> = [
  {
    label: 'Simple Button',
    value: 'simpleButton',
  },
  {
    label: 'Simple Text',
    value: 'simpleText',
  },
  {
    label: 'Block Text',
    value: 'blockText',
  },
  {
    label: 'Simple Title',
    value: 'simpleTitle',
  },
  {
    label: 'Horizontal Photo',
    value: 'horizontalPhoto',
  },
  {
    label: 'Carousel',
    value: 'carousel',
  },
  {
    label: 'Line Divider',
    value: 'lineDivider',
  },
  {
    label: 'Photo With Text and title',
    value: 'photoWithTextAndTitle',
  },
  {
    label: 'Opening Hours',
    value: 'openingHours',
  },
  {
    label: 'WebCards Carousel',
    value: 'webCardsCarousel',
  },
  {
    label: 'Social Links',
    value: 'socialLinks',
  },
];
