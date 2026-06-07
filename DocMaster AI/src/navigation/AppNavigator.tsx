import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector } from '../redux/store';

// Screens
import { LoginScreen } from '../modules/auth/screens/LoginScreen';
import { RegisterScreen } from '../modules/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '../modules/auth/screens/ForgotPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../modules/history/screens/HistoryScreen';
import { ProfileScreen } from '../modules/auth/screens/ProfileScreen';
import { PdfCompressScreen } from '../modules/compress-pdf/screens/PdfCompressScreen';
import { CompressedResultScreen } from '../modules/compress-pdf/screens/CompressedResultScreen';
import { JpgToPdfScreen } from '../modules/image-to-pdf/screens/JpgToPdfScreen';
import { OcrScannerScreen } from '../modules/ocr/screens/OcrScannerScreen';
import { ImageCompressScreen } from '../modules/image-compress/screens/ImageCompressScreen';
import { ToolsScreen } from '../screens/ToolsScreen';
import { ScannerScreen } from '../screens/ScannerScreen';



const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tools') {
            iconName = focused ? 'view-grid' : 'view-grid-outline';
          } else if (route.name === 'Scanner') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'history' : 'history';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4361EE',
        tabBarInactiveTintColor: '#8D99AE',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        headerStyle: {
          backgroundColor: '#4361EE',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Tools"
        component={ToolsScreen}
        options={{
          title: 'Tools',
          headerTitle: 'Document Tools',
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          title: 'Scanner',
          headerTitle: 'Document Scanner',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          headerTitle: 'Activity History',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'User Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  console.log('DOCMASTER: AppNavigator rendering...');
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  console.log('DOCMASTER: AppNavigator isAuthenticated =', isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4361EE',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{
                title: 'Reset Password',
                headerStyle: { backgroundColor: '#4361EE' },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
          </>
        ) : (
          // App Stack
          <>
            <Stack.Screen
              name="Dashboard"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            {/* These placeholders will be updated to real components in Phase 4, 5, 6 */}
            <Stack.Screen
              name="PdfCompress"
              component={PdfCompressScreen}
              options={{ title: 'PDF Compress' }}
            />
            <Stack.Screen
              name="CompressedResult"
              component={CompressedResultScreen}
              options={{ title: 'Compression Result' }}
            />
            <Stack.Screen
              name="JpgToPdf"
              component={JpgToPdfScreen}
              options={{ title: 'JPG to PDF' }}
            />
            <Stack.Screen
              name="OcrScanner"
              component={OcrScannerScreen}
              options={{ title: 'OCR Scanner' }}
            />
            <Stack.Screen
              name="ImageCompress"
              component={ImageCompressScreen}
              options={{ title: 'Image Compress' }}
            />

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
