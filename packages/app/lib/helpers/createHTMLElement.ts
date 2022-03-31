/* eslint-disable @typescript-eslint/no-var-requires */

const unstable_createElement = require('react-native-web/dist/cjs/exports/createElement/');

// TODO better typing
const createHTMLElement = (tag: any, props: any): React.ReactElement =>
  unstable_createElement(tag, props);

export default createHTMLElement;
