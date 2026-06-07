/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('DOCMASTER: index.js executing...');

AppRegistry.registerComponent(appName, () => {
  console.log('DOCMASTER: AppRegistry.registerComponent factory running');
  return App;
});

