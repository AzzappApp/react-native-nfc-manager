import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { LayoutAnimation } from 'react-native';
import Text from '#ui/Text';
import type { TextProps } from '#ui/Text';
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

type ExpendableTextProps = Omit<
  TextProps,
  'children' | 'ellipsizeMode' | 'numberOfLines'
> & {
  numberOfLines: number; //mandatory numberOfLines
  label: string;
};

const ExpendableText = ({
  label,
  numberOfLines,
  ...props
}: ExpendableTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const [clippedText, setClippedText] = useState<string | undefined>(undefined);

  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 600,
      create: { type: 'linear', property: 'opacity' },
      update: { type: 'spring', springDamping: 2 },
      delete: { type: 'linear', property: 'opacity' },
    });
  }, [expanded]);

  const onTextLayout = ({
    nativeEvent,
  }: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = nativeEvent;
    if (lines.length > numberOfLines) {
      //we need to clip
      const clippedText = lines
        .splice(0, numberOfLines)
        .map(line => line.text)
        .join('');
      setClippedText(clippedText);
    }
  };

  const toggleExpand = () => {
    if (clippedText) {
      setExpanded(prev => !prev);
    }
  };

  const intl = useIntl();
  const text = useMemo(() => {
    if (expanded) {
      return intl.formatMessage(
        {
          defaultMessage: '{text}...less',
          description: 'ExpendableText  with less keyword to collapse the text',
        },
        { text: label },
      );
    }
    if (clippedText) {
      return intl.formatMessage(
        {
          defaultMessage: '{text}... more',
          description: 'ExpendableText  with more keyword to expand the text',
        },
        { text: clippedText.substring(0, clippedText.length - 9) },
      );
    }
    return label;
  }, [clippedText, expanded, intl, label]);

  return (
    <Text
      {...props}
      onPress={toggleExpand}
      ellipsizeMode={undefined}
      onTextLayout={onTextLayout}
      numberOfLines={
        //adding one more line at the first render to know if we must to clip witout take the size of a big text
        expanded ? undefined : clippedText ? numberOfLines : numberOfLines + 1
      }
    >
      {text}
    </Text>
  );
};

export default ExpendableText;
