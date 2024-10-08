import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import Toast from 'react-native-toast-message';
import CardTemplate from '#components/CardTemplate';
import { useRouter } from '#components/NativeRouter';
import useAuthState from '#hooks/useAuthState';
import useCardTemplates from '#hooks/useCardTemplates';
import useLoadCardTemplateMutation from '#hooks/useLoadCardTemplateMutation';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import SelectSection from '#ui/SelectSection';
import type { CardTemplateItem } from '#components/CardTemplateList';
import type {
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

type Props = {
  isPremium: boolean;
};

const AddContentBelowCoverTemplates = ({ isPremium }: Props) => {
  const { profileInfos } = useAuthState();
  const intl = useIntl();
  const router = useRouter();

  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { top, bottom } = useScreenInsets();
  const itemWidth = windowWidth - 100;

  const [selectedTemplate, setSelectedTemplate] =
    useState<CardTemplateItem | null>(null);

  const [
    templateTypesByWebCardCategory,
    selectedCardTemplateType,
    templates,
    onSelectSection,
    loadMore,
  ] = useCardTemplates(profileInfos!.profileId);

  const selectedIndexRef = useRef(0);

  useEffect(() => {
    setSelectedTemplate(templates[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = useCallback(
    ({
      nativeEvent: { contentOffset },
    }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const templateIndex = Math.round(contentOffset.x / (itemWidth + GAP));
      selectedIndexRef.current = templateIndex;
      setSelectedTemplate(templates[templateIndex]);
    },
    [itemWidth, setSelectedTemplate, templates],
  );

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index + GAP * (index - 1),
      index,
    }),
    [itemWidth],
  );

  const renderItem = useCallback<ListRenderItem<CardTemplateItem>>(
    ({ item, index }) => {
      const imageHeight = item.previewMedia
        ? itemWidth / item.previewMedia.aspectRatio
        : null;

      const maxScrollViewHeight = windowHeight - 475 - bottom;

      return (
        <CardTemplate
          template={item}
          imageHeight={imageHeight}
          isPremium={isPremium}
          itemWidth={itemWidth}
          priority={index === 0 ? 'high' : 'normal'}
          maxScrollViewHeight={maxScrollViewHeight}
        />
      );
    },
    [bottom, isPremium, itemWidth, windowHeight],
  );

  const onDone = useCallback(() => {
    router.replace({
      route: 'WEBCARD',
      params: {
        webCardId: profileInfos!.webCardId,
        userName: profileInfos!.userName,
        editing: true,
      },
    });
  }, [profileInfos, router]);

  const [commit, inFlight] = useLoadCardTemplateMutation();

  const onSubmit = useCallback(
    (cardTemplate: CardTemplateItem) => {
      const webCardId = profileInfos?.webCardId;
      if (!webCardId || !cardTemplate?.id) {
        return;
      }
      commit({
        variables: {
          cardTemplateId: cardTemplate.id,
          webCardId,
        },
        onCompleted: () => {
          onDone();
        },
        onError: error => {
          console.error(error);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, could not load the template',
              description: 'NewProfile - Card edition step error toast',
            }),
          });
        },
      });
    },
    [profileInfos?.webCardId, commit, intl, onDone],
  );

  const onChoseTemplatePress = useCallback(() => {
    if (selectedTemplate) {
      onSubmit(selectedTemplate);
    }
  }, [onSubmit, selectedTemplate]);

  return (
    <>
      <SelectSection
        nativeID="activities"
        accessibilityLabelledBy="activitiesLabel"
        sections={templateTypesByWebCardCategory}
        inputLabel={selectedCardTemplateType?.title}
        selectedItemKey={selectedCardTemplateType?.id}
        keyExtractor={keyExtractor}
        bottomSheetHeight={windowHeight - top - 30}
        onItemSelected={onSelectSection}
        placeHolder={intl.formatMessage({
          defaultMessage: 'Select a type of template',
          description:
            'Card Template list - Accessibility TextInput Placeholder to select a type of template',
        })}
        style={styles.select}
      />
      {templates && (
        <FlatList
          data={templates}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onScroll={onScroll}
          onEndReached={loadMore}
          style={styles.cardTemplateList}
          contentContainerStyle={styles.cardTemplateListContentContainer}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={windowWidth - 100 + GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          scrollEventThrottle={16}
          nestedScrollEnabled
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          getItemLayout={getItemLayout}
        />
      )}
      <View
        style={{
          position: 'absolute',
          bottom,
          paddingHorizontal: 20,
          width: '100%',
        }}
      >
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Choose this template',
            description: 'label of the button allowing to pick a template',
          })}
          onPress={onChoseTemplatePress}
          variant="primary"
          disabled={inFlight}
        />
      </View>
    </>
  );
};

const keyExtractor = (item: { id: string }) => {
  return item.id;
};

const GAP = 20;

const styles = StyleSheet.create({
  select: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  cardTemplateList: {
    flex: 1,
    overflow: 'visible',
  },
  cardTemplateListContentContainer: {
    paddingHorizontal: 50,
    overflow: 'visible',
  },
});

export default AddContentBelowCoverTemplates;
