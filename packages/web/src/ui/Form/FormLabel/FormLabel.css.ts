import { style } from '@vanilla-extract/css';
import { textSmallBold } from '#app/[userName]/theme.css';

const label = style([
  {
    flexGrow: 0,
    flexShrink: 0,
    width: 'auto',
    minWidth: '100px',
    marginRight: '10px',
  },
  textSmallBold,
]);

const styles = {
  label,
};

export default styles;
