import { style } from '@vanilla-extract/css';
import { textSmallMedium } from '#app/theme.css';

const label = style([
  {
    flexGrow: 0,
    flexShrink: 0,
    width: 'auto',
    minWidth: '70px',
    marginRight: '10px',
  },
  textSmallMedium,
]);

const styles = {
  label,
};

export default styles;
