import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  Alert,
} from 'react-native';

interface RealDevice {
  id: string;
  name: string;
  connected?: boolean;
}

export default function BluetoothScreen() {
  const [devices, setDevices] = useState<RealDevice[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [bleManager, setBleManager] = useState<any>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Initialize native BLE manager if on native platform
  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        const { BleManager } = require('react-native-ble-plx');
        const manager = new BleManager();
        setBleManager(manager);

        return () => {
          manager.destroy();
        };
      } catch (err) {
        console.log('Native BleManager not available in Expo Go:', err);
        setStatusMessage(
          'Notice: Raw native Bluetooth requires a development build (npx expo run:ios / run:android) or Web Bluetooth in Chrome.'
        );
      }
    } else {
      setStatusMessage('Running on Web. Web Bluetooth API supported (Chrome / Edge).');
    }
  }, []);

  // Request Android Bluetooth permissions
  const requestAndroidPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  };

  // 1. Scan / Connect using Web Bluetooth API (for laptop/browser)
  const scanWebBluetooth = async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      Alert.alert(
        'Web Bluetooth Unsupported',
        'Your browser does not support Web Bluetooth. Please use Google Chrome or Microsoft Edge.'
      );
      return;
    }

    try {
      setStatusMessage('Opening system Bluetooth prompt...');
      // Request device from user via browser's native Bluetooth dialog
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information', 'generic_access'],
      });

      setStatusMessage(`Found: ${device.name || 'Unnamed'}. Connecting...`);

      let isConnected = false;
      if (device.gatt) {
        const server = await device.gatt.connect();
        isConnected = server.connected;
      }

      setDevices((prev) => {
        const exists = prev.some((d) => d.id === device.id);
        if (exists) {
          return prev.map((d) =>
            d.id === device.id ? { ...d, name: device.name || 'Unnamed', connected: isConnected } : d
          );
        }
        return [...prev, { id: device.id, name: device.name || 'Unnamed Device', connected: isConnected }];
      });

      setStatusMessage(
        isConnected
          ? `Connected to ${device.name || 'Device'}`
          : `Device paired: ${device.name || 'Device'}`
      );
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setStatusMessage('Bluetooth scan cancelled by user.');
      } else {
        setStatusMessage(`Error: ${err.message || err}`);
      }
    }
  };

  // 2. Scan using Native BLE (for iOS / Android Development builds)
  const scanNativeBluetooth = async () => {
    if (!bleManager) {
      Alert.alert(
        'Native BLE Not Ready',
        'Native Bluetooth requires a custom development build. In Expo Go, native C++/Java Bluetooth binaries are not bundled.\n\nTo test on laptop, open in Web (Chrome).\nTo test on phone, create a dev build (npx expo run:ios / run:android).'
      );
      return;
    }

    const hasPermission = await requestAndroidPermissions();
    if (!hasPermission) {
      setStatusMessage('Bluetooth permissions denied.');
      return;
    }

    setStatusMessage('Scanning for real Bluetooth devices...');
    setIsScanning(true);

    bleManager.startDeviceScan(null, null, (error: any, device: any) => {
      if (error) {
        setStatusMessage(`Scan error: ${error.message}`);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices((prev) => {
          const exists = prev.some((d) => d.id === device.id);
          if (!exists) {
            return [
              ...prev,
              {
                id: device.id,
                name: device.name,
                connected: device.isConnected ? true : false,
              },
            ];
          }
          return prev;
        });
      }
    });

    // Stop scan after 10 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
      setStatusMessage('Scan completed.');
    }, 10000);
  };

  const handleScan = () => {
    if (Platform.OS === 'web') {
      scanWebBluetooth();
    } else {
      scanNativeBluetooth();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Devices</Text>

      <Text style={styles.status}>Status: {statusMessage}</Text>

      <View style={styles.buttonContainer}>
        <Button
          title={isScanning ? 'Scanning...' : 'Scan / Pair Bluetooth Device'}
          onPress={handleScan}
          disabled={isScanning}
        />
      </View>

      <Text style={styles.sectionHeader}>
        Device List ({devices.length} found):
      </Text>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.deviceItem}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceId}>ID: {item.id}</Text>
            <Text style={item.connected ? styles.connectedText : styles.disconnectedText}>
              {item.connected ? 'Status: Connected' : 'Status: Discovered / Paired'}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No real Bluetooth devices listed yet. Press "Scan / Pair Bluetooth Device" above.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 15,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deviceItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },
  connectedText: {
    fontSize: 13,
    color: 'green',
    marginTop: 4,
    fontWeight: 'bold',
  },
  disconnectedText: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  emptyText: {
    color: '#888888',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
