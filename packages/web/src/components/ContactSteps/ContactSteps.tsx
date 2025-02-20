import cx from 'classnames';
import styles from './ContactSteps.css';

const ContactSteps = ({ step = 0 }: { step: number }) => (
  <div className={styles.stepContainer}>
    <div className={cx(styles.step, step === 0 && styles.activeStep)}>1</div>
    <div className={cx(styles.step, step === 1 && styles.activeStep)}>2</div>
    <div className={cx(styles.step, step === 2 && styles.activeStep)}>3</div>
  </div>
);

export default ContactSteps;
