import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { colors } from '#theme';
import { useCoverEditorContext } from '#components/CoverEditor/CoverEditorContext';
import { ScreenModal } from '#components/NativeRouter';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import type { CoverEditorAction } from '#components/CoverEditor/coverEditorActions';
import type { ListRenderItemInfo } from 'react-native';

type Props = {
  open: boolean;
  onClose: () => void;
};

const CoverEditorAddTextModal = (props: Props) => {
  const { open, onClose } = props;
  const intl = useIntl();

  const [selectedTag, setSelectedTag] = useState<number>(0);
  const updateSelectedTag = useCallback((tag: string | null) => {
    if (tag) {
      setSelectedTag(parseInt(tag, 10));
    }
  }, []);

  const { dispatch } = useCoverEditorContext();

  const itemsPerTag = useMemo(() => {
    return [
      {
        label: intl.formatMessage({
          defaultMessage: 'Title',
          description: 'CoverEditorAddTextModal - Tag title',
        }),
        items: titleTextStyles,
      },
      {
        label: intl.formatMessage({
          defaultMessage: 'Text',
          description: 'CoverEditorAddTextModal - Tag text',
        }),
        items: simpleTextStyles,
      },
      {
        label: intl.formatMessage({
          defaultMessage: 'Static',
          description: 'CoverEditorAddTextModal - Tag static',
        }),
        items: staticTextStyles,
      },
      {
        label: intl.formatMessage({
          defaultMessage: 'Animated',
          description: 'CoverEditorAddTextModal - Tag animated',
        }),
        items: animatedTextStyles,
      },
    ];
  }, [intl]);

  const items = useMemo(() => {
    return itemsPerTag[selectedTag].items;
  }, [itemsPerTag, selectedTag]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TextStyleItem>) => {
      return (
        <AddTextModalItem style={item} onClose={onClose} dispatch={dispatch} />
      );
    },
    [dispatch, onClose],
  );

  return (
    <ScreenModal
      visible={open}
      animationType="slide"
      onRequestDismiss={onClose}
    >
      {open && (
        <Container style={styles.container}>
          <SafeAreaView
            style={styles.container}
            edges={{ bottom: 'off', top: 'additive' }}
          >
            <Header
              middleElement={
                <Text variant="large" style={styles.header}>
                  <FormattedMessage
                    defaultMessage="Add text"
                    description="CoverEditorAddTextModal - Header"
                  />
                </Text>
              }
              leftElement={
                <Button
                  variant="secondary"
                  label={intl.formatMessage({
                    defaultMessage: 'Cancel',
                    description: 'MultiUserAddModal - Cancel button label',
                  })}
                  onPress={onClose}
                />
              }
            />
            <View style={styles.tagsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tags}>
                  {itemsPerTag.map(({ label }, index) => (
                    <RoundedMenuComponent
                      key={label}
                      selected={index === selectedTag}
                      label={label}
                      id={`${index}`}
                      onSelect={updateSelectedTag}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={styles.styleItemsContainer}>
              <FlatList
                testID="cover-editor-add-text-modal"
                contentContainerStyle={styles.styleItems}
                columnWrapperStyle={styles.styleItemsColumn}
                accessibilityRole="list"
                data={items}
                renderItem={renderItem}
                directionalLockEnabled
                showsVerticalScrollIndicator={false}
                numColumns={2}
              />
            </View>
          </SafeAreaView>
        </Container>
      )}
    </ScreenModal>
  );
};

const AddTextModalItem = ({
  style,
  dispatch,
  onClose,
}: {
  style: TextStyleItem;
  onClose: () => void;
  dispatch: React.Dispatch<CoverEditorAction>;
}) => {
  const onPress = useCallback(() => {
    dispatch({
      type: 'ADD_TEXT_LAYER',
      payload: {
        text: 'Title 01',
        ...style,
        textAlign: 'center',
        color: '#000000',
      },
    });
    onClose();
  }, [dispatch, onClose, style]);

  return (
    <View style={styles.styleItem}>
      <TouchableOpacity style={styles.styleItemContent} onPress={onPress}>
        <Text style={style}>
          <FormattedMessage
            defaultMessage="Title 01"
            description="CoverEditorAddTextModal - Placeholder for text preview"
          />
        </Text>
      </TouchableOpacity>
    </View>
  );
};

type TextStyleItem = { fontFamily: string; fontSize: number };

const titleTextStyles: TextStyleItem[] = [
  { fontFamily: 'DMSerifDisplay_Regular', fontSize: 25 },
  { fontFamily: 'Koulen_Regular', fontSize: 25 },
  { fontFamily: 'Koulen_Regular', fontSize: 25 },
  { fontFamily: 'DMSerifDisplay_Regular', fontSize: 25 },
  { fontFamily: 'DMSerifDisplay_Regular', fontSize: 25 },
  { fontFamily: 'Koulen_Regular', fontSize: 25 },
  { fontFamily: 'Koulen_Regular', fontSize: 25 },
  { fontFamily: 'DMSerifDisplay_Regular', fontSize: 25 },
  { fontFamily: 'DMSerifDisplay_Regular', fontSize: 25 },
  { fontFamily: 'Koulen_Regular', fontSize: 25 },
];

const simpleTextStyles: TextStyleItem[] = [];
const staticTextStyles: TextStyleItem[] = [];
const animatedTextStyles: TextStyleItem[] = [];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    maxWidth: '50%',
    textAlign: 'center',
  },
  styleItem: {
    flex: 0.5,
  },
  styleItemContent: {
    height: 172,
    backgroundColor: colors.grey50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    width: '100%',
    height: 33,
    marginTop: 20,
  },
  tags: {
    gap: 10,
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  styleItemsContainer: {
    marginTop: 20,
    flex: 1,
  },
  styleItems: {
    gap: 10,
    paddingHorizontal: 10,
    paddingBottom: 50,
  },
  styleItemsColumn: {
    gap: 10,
    flex: 1,
  },
});

export default CoverEditorAddTextModal;
