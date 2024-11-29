import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { LayoutAnimation, Pressable } from 'react-native';
import { colors } from '#theme';
import Text from '#ui/Text';
import type { TextProps } from '#ui/Text';
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

type ExpendableTextProps = Omit<
  TextProps,
  'children' | 'ellipsizeMode' | 'numberOfLines'
> & {
  numberOfLines: number; //mandatory numberOfLines
  label: string;
  prefix?: TextProps & {
    label: string;
  };
};

const ExpendableText = ({
  label,
  numberOfLines,
  prefix,
  ...props
}: ExpendableTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const [clippedText, setClippedText] = useState<string | undefined>(undefined);

  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 220,
      create: { type: 'linear', property: 'opacity' },
      update: { type: 'spring', springDamping: 2 },
      delete: { type: 'linear', property: 'opacity' },
    });
  }, [expanded]);

  const onTextLayout = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<TextLayoutEventData>) => {
      const { lines } = nativeEvent;

      if (lines.length > numberOfLines) {
        //we need to clip
        let clippedText = lines
          .splice(0, numberOfLines)
          .map(line => line.text)
          .join('');
        clippedText = clippedText.substring(
          prefix?.label.length ?? 0,
          clippedText.length - 9,
        );
        setTimeout(() => {
          // setTimeout added for fabric.
          // We receive onTextLayout before useEffect which reset clippedText
          setClippedText(clippedText);
        });
      }
    },
    [numberOfLines, prefix?.label.length],
  );

  const toggleExpand = () => {
    if (clippedText) {
      setExpanded(prev => !prev);
    }
  };

  useEffect(() => {
    if (label) {
      setExpanded(false);
      setClippedText(undefined);
    }
  }, [label]);

  const text = useMemo(() => {
    if (expanded) {
      return (
        <>
          {label}
          <Text {...props} style={[props.style, { color: colors.grey400 }]}>
            <FormattedMessage
              defaultMessage="... less"
              description="ExpendableText  with more keyword to collapse the text"
            />
          </Text>
        </>
      );
    }
    if (clippedText) {
      return (
        <>
          {clippedText}
          <Text {...props} style={[props.style, { color: colors.grey400 }]}>
            <FormattedMessage
              defaultMessage="... more"
              description="ExpendableText  with more keyword to collapse the text"
            />
          </Text>
        </>
      );
    }
    return label;
  }, [clippedText, expanded, label, props]);

  return (
    //using a pressable without feedback to avoid the ripple effect on all the text container
    <Pressable onPress={toggleExpand}>
      <Text
        {...props}
        ellipsizeMode={undefined}
        onTextLayout={onTextLayout}
        numberOfLines={
          //adding one more line at the first render to know if we must to clip witout take the size of a big text
          expanded ? undefined : clippedText ? numberOfLines : numberOfLines + 1
        }
      >
        {prefix && <Text {...prefix}>{prefix.label}</Text>}
        {text}
      </Text>
    </Pressable>
  );
};

export default ExpendableText;
