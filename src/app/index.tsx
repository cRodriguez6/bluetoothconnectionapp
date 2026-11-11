import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';

interface RealDevice {
  id: string;
  name: string;
  connected?: boolean;
  isConnecting?: boolean;
  rssi?: number | null;
  serviceUUIDs?: string[];
}

export default function BluetoothScreen() {
  const [devices, setDevices] = useState<RealDevice[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [bleManager, setBleManager] = useState<any>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [autoConnect, setAutoConnect] = useState<boolean>(false);
  const [showUnnamed, setShowUnnamed] = useState<boolean>(false);

  const autoConnectRef = useRef<boolean>(false);
  const showUnnamedRef = useRef<boolean>(false);
  const isConnectingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    autoConnectRef.current = autoConnect;
  }, [autoConnect]);

  useEffect(() => {
    showUnnamedRef.current = showUnnamed;
  }, [showUnnamed]);

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

  // Connect to a device
  const connectToDevice = async (deviceId: string, deviceName?: string) => {
    if (isConnectingRef.current.has(deviceId)) return;
    isConnectingRef.current.add(deviceId);

    // Stop scan first (required on iOS/Android for stable BLE connection)
    if (bleManager) {
      try {
        bleManager.stopDeviceScan();
        setIsScanning(false);
      } catch (_) {}
    }

    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, isConnecting: true } : d))
    );
    setStatusMessage(`Connecting to ${deviceName || deviceId}...`);

    try {
      if (Platform.OS === 'web') {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...d, connected: true, isConnecting: false } : d
          )
        );
        setStatusMessage(`Connected to ${deviceName || deviceId}`);
      } else if (bleManager) {
        // 1. Establish GATT connection
        const connectedDevice = await bleManager.connectToDevice(deviceId, {
          autoConnect: false,
        });

        setStatusMessage(`Connected to ${connectedDevice.name || deviceName || deviceId}! Reading services...`);

        // 2. Discover all services and characteristics
        const fullDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
        const services = await fullDevice.services();
        const serviceUUIDs = services.map((s: any) => s.uuid);

        // 3. Mark as connected in state
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  name: connectedDevice.name || d.name,
                  connected: true,
                  isConnecting: false,
                  serviceUUIDs,
                }
              : d
          )
        );
        setStatusMessage(`Connected to ${connectedDevice.name || deviceName || deviceId}`);

        // 4. Setup disconnect listener
        connectedDevice.onDisconnected((error: any, disconnectedDev: any) => {
          console.log(`Device disconnected:`, disconnectedDev?.id);
          setDevices((prev) =>
            prev.map((d) =>
              d.id === deviceId ? { ...d, connected: false, isConnecting: false } : d
            )
          );
          setStatusMessage(`Disconnected from ${connectedDevice.name || deviceName || deviceId}`);
        });
      }
    } catch (error: any) {
      console.warn('Connect error:', error);
      setStatusMessage(`Failed to connect to ${deviceName || deviceId}: ${error.message || error}`);
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, isConnecting: false } : d))
      );
    } finally {
      isConnectingRef.current.delete(deviceId);
    }
  };

  // Disconnect a device
  const disconnectDevice = async (deviceId: string, deviceName?: string) => {
    try {
      setStatusMessage(`Disconnecting from ${deviceName || deviceId}...`);
      if (bleManager) {
        await bleManager.cancelDeviceConnection(deviceId);
      }
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, connected: false, isConnecting: false } : d
        )
      );
      setStatusMessage(`Disconnected from ${deviceName || deviceId}`);
    } catch (error: any) {
      setStatusMessage(`Disconnect error: ${error.message || error}`);
    }
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
        'Native Bluetooth requires a custom development build.'
      );
      return;
    }

    const hasPermission = await requestAndroidPermissions();
    if (!hasPermission) {
      setStatusMessage('Bluetooth permissions denied.');
      return;
    }

    setStatusMessage('Scanning for Bluetooth devices...');
    setIsScanning(true);

    bleManager.startDeviceScan(null, null, (error: any, device: any) => {
      if (error) {
        setStatusMessage(`Scan error: ${error.message}`);
        setIsScanning(false);
        return;
      }

      if (device) {
        const deviceName = device.name || device.localName;
        const shouldInclude = Boolean(deviceName) || showUnnamedRef.current;
        if (shouldInclude) {
          const displayName = deviceName || `Peripheral (${device.id.slice(0, 8)})`;
          setDevices((prev) => {
            const exists = prev.some((d) => d.id === device.id);
            if (!exists) {
              const newDev: RealDevice = {
                id: device.id,
                name: displayName,
                connected: false,
                rssi: device.rssi,
              };

              // Auto-connect if enabled
              if (autoConnectRef.current) {
                setTimeout(() => {
                  connectToDevice(device.id, displayName);
                }, 300);
              }

              return [...prev, newDev];
            } else {
              return prev.map((d) =>
                d.id === device.id
                  ? { ...d, rssi: device.rssi ?? d.rssi, name: deviceName || d.name }
                  : d
              );
            }
          });
        }
      }
    });

    // Stop scan after 12 seconds
    setTimeout(() => {
      if (bleManager) {
        bleManager.stopDeviceScan();
        setIsScanning(false);
        setStatusMessage('Scan completed.');
      }
    }, 12000);
  };

  const handleScan = () => {
    if (isScanning && bleManager) {
      bleManager.stopDeviceScan();
      setIsScanning(false);
      setStatusMessage('Scan stopped.');
      return;
    }

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

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonActive]}
          onPress={handleScan}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Stop Scanning' : 'Scan for Devices'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Auto Connect Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleTextContainer}>
          <Text style={styles.toggleTitle}>Auto-Connect Unconnected</Text>
          <Text style={styles.toggleSubtitle}>
            Automatically connects whenever a new device is found
          </Text>
        </View>
        <Switch
          value={autoConnect}
          onValueChange={setAutoConnect}
          trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          thumbColor={autoConnect ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      {/* Show Unnamed Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleTextContainer}>
          <Text style={styles.toggleTitle}>Show All Signals / Unnamed</Text>
          <Text style={styles.toggleSubtitle}>
            Detects accessories broadcasting raw IDs without a public name
          </Text>
        </View>
        <Switch
          value={showUnnamed}
          onValueChange={setShowUnnamed}
          trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          thumbColor={showUnnamed ? '#ffffff' : '#f4f3f4'}
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
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceId}>ID: {item.id}</Text>
              {item.rssi != null && (
                <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
              )}
              <Text style={item.connected ? styles.connectedText : styles.disconnectedText}>
                {item.connected ? '● Connected' : '○ Not Connected'}
              </Text>
              {item.serviceUUIDs && item.serviceUUIDs.length > 0 && (
                <Text style={styles.servicesText}>
                  Services: {item.serviceUUIDs.map((uuid) => uuid.slice(0, 8)).join(', ')}
                </Text>
              )}
            </View>

            <View style={styles.actionContainer}>
              {item.isConnecting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#0284C7" />
                  <Text style={styles.loadingText}>Connecting...</Text>
                </View>
              ) : item.connected ? (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => disconnectDevice(item.id, item.name)}
                >
                  <Text style={styles.disconnectButtonText}>Disconnect</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => connectToDevice(item.id, item.name)}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No devices found yet. Tap "Scan for Devices" above.
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  status: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
  },
  controlsRow: {
    marginBottom: 12,
  },
  scanButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  scanButtonActive: {
    backgroundColor: '#dc2626',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginBottom: 18,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  deviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  deviceId: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  deviceRssi: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
  },
  connectedText: {
    fontSize: 13,
    color: '#10b981',
    marginTop: 4,
    fontWeight: 'bold',
  },
  disconnectedText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  servicesText: {
    fontSize: 11,
    color: '#6366f1',
    marginTop: 4,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  connectButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  disconnectButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disconnectButtonText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  emptyText: {
    color: '#9ca3af',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
