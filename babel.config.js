module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@assets': './src/assets',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@data': './src/data',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@types': './src/types',
          '@contexts': './src/contexts',
          '@api': './src/api', // ➕ MỚI (Chương 6) — dùng cho axiosClient
          'expo-secure-store': './src/services/secureStore',
          'expo-local-authentication': './src/services/localAuthentication',
          'expo-haptics': './src/services/haptics',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};