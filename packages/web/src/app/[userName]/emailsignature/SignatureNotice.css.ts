import { style } from '@vanilla-extract/css';
import { vars } from '../theme.css';

const styles = {
  tabBar: style({
    alignSelf: 'stretch',
    marginBottom: 30,
  }),
  step: style({
    padding: '10px 0',
    marginBottom: 10,
    borderBottom: `1px solid ${vars.color.grey100}`,
    fontSize: 14,
    alignSelf: 'stretch',
  }),
  stepIndex: style({
    color: vars.color.grey400,
  }),
};

export default styles;
