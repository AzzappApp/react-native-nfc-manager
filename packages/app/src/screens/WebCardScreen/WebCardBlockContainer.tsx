import { View, type ViewProps } from 'react-native';
import { useScrollViewChildRef } from '#ui/ChildPositionAwareScrollView';

type WebCardBlockContainerProps = ViewProps & {
  id: string;
};

const WebCardBlockContainer = ({
  id,
  ...props
}: WebCardBlockContainerProps) => {
  const containerRef = useScrollViewChildRef(id);

  return <View ref={containerRef} {...props} collapsable={false} />;
};

export default WebCardBlockContainer;
