/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Đây là quy định bắt buộc của Firebase Messaging: handler chạy khi thông báo
// đến lúc app đang nền sâu hoặc đã bị "giết" hẳn — phải đăng ký TRƯỚC KHI
// AppRegistry khởi động React Tree, không thể đặt trong Component nào cả.
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[push] Thông báo đến khi app đang nền/killed:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);

