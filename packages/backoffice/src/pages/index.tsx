import dynamic from 'next/dynamic';
import type { NextPage } from 'next';

const App = dynamic(() => import('../App'), { ssr: false });

const Home: NextPage = () => {
  return <App />;
};

export default Home;
