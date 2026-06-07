import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View } from 'react-native';
import { store, persistor } from './src/redux/store';
import { theme } from './src/styles/theme';
import { AppNavigator } from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  console.log('DOCMASTER: App rendering...');
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <View style={{ flex: 1 }}>
              <StatusBar
                barStyle="light-content"
                backgroundColor={theme.colors.primary}
              />
              <AppNavigator />
            </View>
          </SafeAreaProvider>
        </PaperProvider>
      </PersistGate>
    </ReduxProvider>
  );
}

export default App;
