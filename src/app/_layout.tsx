import { Stack } from 'expo-router';
import { BluetoothProvider } from '../context/BluetoothContext';

export default function RootLayout() {
  return (
    <BluetoothProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FACC15' },
          animation: 'slide_from_right',
        }}
      />
    </BluetoothProvider>
  );
}
