module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|@react-navigation|react-redux|redux-persist|react-native-paper|react-native-safe-area-context|react-native-screens|react-native-vector-icons|react-native-share|@hookform/resolvers|react-hook-form|@reduxjs/toolkit|immer|axios)',
  ],
};
