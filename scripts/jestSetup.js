require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests();
require('react-native-gesture-handler/jestSetup');

process.env.NEXT_PUBLIC_URL = 'https://fake-azzapp.com';
process.env.NEXT_PUBLIC_API_ENDPOINT = 'https://api.fake-azzapp.com';
