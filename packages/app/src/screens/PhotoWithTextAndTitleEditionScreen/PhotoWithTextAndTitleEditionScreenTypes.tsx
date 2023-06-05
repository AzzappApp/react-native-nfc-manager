export type PhotoWithTextAndTitleEditionValue = {
  image?: string;
  fontFamily?: string;
  fontColor?: string;
  textAlign?: 'left';
  imageMargin?: 'width_limited';
  arrangement?: undefined;
  fontSize?: number;
  textSize?: number;
  borderRadius?: number;
  marginHorizontal?: number;
  marginVertical?: number;
  background: Readonly<{
    id: string;
    uri: string;
  }> | null;
  backgroundStyle: Readonly<{
    backgroundColor: string;
    patternColor: string;
    opacity: number;
  }> | null;
};
