import { Path, Svg } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

type ColorTriptychProps = Omit<SvgProps, 'viewBox'> & {
  primary?: string;
  dark?: string;
  light?: string;
};

const ColorTriptychRenderer = ({
  primary,
  dark,
  light,
  ...props
}: ColorTriptychProps) => {
  return (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M9.99914 10.0008L9.99915 20C4.47676 20 -2.04185e-05 15.5232 -2.09013e-05 10.0008C-2.10548e-05 8.24561 0.462003 6.52132 1.33961 5.00125L9.99914 10.0008Z"
        fill={dark}
      />
      <Path
        d="M9.99916 10.0008L1.33963 5.00124C4.10082 0.218715 10.2162 -1.4199 14.9987 1.34129C16.5188 2.2189 17.7811 3.48118 18.6587 5.00124L9.99916 10.0008Z"
        fill={primary}
      />
      <Path
        d="M9.99916 10.0008L18.6587 5.00125C21.4199 9.78378 19.7813 15.8992 14.9987 18.6604C13.4787 19.538 11.7544 20 9.99916 20L9.99916 10.0008Z"
        fill={light}
      />
    </Svg>
  );
};

export default ColorTriptychRenderer;
