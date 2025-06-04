import Image from 'next/image';
import dlAndroid from '#assets/images/download_android.png';
import dlIos from '#assets/images/download_ios.png';
import { textMedium } from '../../theme.css';

const StoreLinks = () => (
  <>
    <div className={textMedium} style={{ marginBottom: 20 }}>
      Download the mobile app
    </div>
    <div style={{ display: 'flex', gap: 10, marginBottom: 70 }}>
      <a
        href="https://apps.apple.com/app/id6502694267"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image src={dlIos} alt="azzapp-logo" width={150} />
      </a>
      <a
        href="https://play.google.com/store/apps/details?id=com.azzapp.app"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image src={dlAndroid} alt="azzapp-logo" width={150} />
      </a>
    </div>
  </>
);

export default StoreLinks;
