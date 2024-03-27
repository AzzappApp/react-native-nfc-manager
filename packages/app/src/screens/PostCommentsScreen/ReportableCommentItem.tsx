import { useRef } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import { useSendReport } from '#hooks/useSendReport';
import ActivityIndicator from '#ui/ActivityIndicator';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SwipeableRow, { SwipeableRowRightAction } from '#ui/SwipeableRow';
import CommentItem from './CommentItem';
import type { CommentItemFragment_comment$key } from '#relayArtifacts/CommentItemFragment_comment.graphql';
import type { SwipeableRowActionsProps } from '#ui/SwipeableRow';
import type { SwipeableRowHandle } from '#ui/SwipeableRow/SwipeableRow';
type ReportableCommentItemProps = {
  item: CommentItemFragment_comment$key;
};

const ReportableCommentItem = (props: ReportableCommentItemProps) => {
  const { item } = props;

  const comment = useFragment(
    graphql`
      fragment ReportableCommentItemFragment_comment on PostComment {
        id
      }
    `,
    item,
  );

  const intl = useIntl();

  const swipeableRef = useRef<SwipeableRowHandle>(null);

  const [sendReport, sendReportLoading] = useSendReport(
    comment?.id ?? '',
    ({ sendReport }) => {
      if (sendReport.created) {
        Toast.show({
          type: 'success',
          text1: intl.formatMessage({
            defaultMessage: 'Report on comment sent',
            description:
              'Success toast message when sending report on comment succeeds.',
          }),
          onHide: swipeableRef.current?.close,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: intl.formatMessage({
            defaultMessage: 'You already reported this comment',
            description:
              'Info toast message when sending report on comment is already done.',
          }),
          onHide: swipeableRef.current?.close,
        });
      }
    },
    () =>
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Error while sending the report, please try again.',
          description: 'Error toast message when sending report fails.',
        }),
      }),
  );

  if (!comment) return null;

  const DeletableCommentItemActions = ({
    progress,
  }: SwipeableRowActionsProps) => {
    return (
      <View style={styles.optionContainer}>
        <SwipeableRowRightAction x={72} progress={progress}>
          <PressableNative
            style={styles.rightAction}
            onPress={sendReport}
            disabled={sendReportLoading}
          >
            {sendReportLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Icon icon="warning" style={styles.option} />
            )}
          </PressableNative>
        </SwipeableRowRightAction>
      </View>
    );
  };

  return (
    <SwipeableRow ref={swipeableRef} RightActions={DeletableCommentItemActions}>
      <CommentItem item={item} />
    </SwipeableRow>
  );
};

const styles = StyleSheet.create({
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.black,
  },
  optionContainer: {
    width: 72,
    flexDirection: 'row',
  },
  option: { tintColor: colors.white, width: 24, height: 24 },
});

export default ReportableCommentItem;
