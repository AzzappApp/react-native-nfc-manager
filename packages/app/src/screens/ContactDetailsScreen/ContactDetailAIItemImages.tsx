import { Image } from 'expo-image';
import { View, StyleSheet, FlatList } from 'react-native';

export const ContactDetailAIItemImages = ({
  imageUrls,
}: {
  imageUrls: string[];
}) => {
  const renderItem = ({ item }: { item: string }) => {
    return (
      <Image
        key={item}
        source={item}
        contentFit="scale-down"
        style={styles.image}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainerStyle}
        data={imageUrls}
        decelerationRate="fast"
        scrollEventThrottle={16}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item: string, index: number) => `${index}${item}`}
        renderItem={renderItem}
      />
    </View>
  );
};

const ITEM_HEIGHT = 138;

const styles = StyleSheet.create({
  container: { height: ITEM_HEIGHT, overflow: 'visible' },
  contentContainerStyle: {
    width: '100%',
    height: ITEM_HEIGHT,
    overflow: 'visible',
  },
  image: {
    height: ITEM_HEIGHT,
    width: 50,
    overflow: 'visible',
  },
  separator: { width: 5 },
});
