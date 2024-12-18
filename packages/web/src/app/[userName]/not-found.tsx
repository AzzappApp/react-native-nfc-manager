import Image from 'next/image';
import Link from 'next/link';
import cards from '#assets/images/cards.png';
import logo from '#assets/images/logo-horizontal-black.png';

import styles from './not-found.css';

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <Image src={cards} alt="webcards" className={styles.background} />
      <div className={styles.message}>
        <h1 className={styles.title}>Sorry, this page isn't available</h1>
        <p className={styles.description}>
          The link you followed may be broken, or the page may have been
          removed.
        </p>
      </div>
      <Link href="/" className={styles.logoWrapper}>
        <Image src={logo} alt="azzap logo" className={styles.logo} />
      </Link>
    </div>
  );
}
