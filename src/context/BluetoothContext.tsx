import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BluetoothDevice, DeviceType } from '../types/bluetooth';

export function inferDeviceType(name?: string | null): DeviceType {
  if (!name) return 'generic';
  const lower = name.toLowerCase();
  if (lower.includes('headphone') || lower.includes('wh-') || lower.includes('quietcomfort')) return 'headphones';
  if (lower.includes('airpod') || lower.includes('buds') || lower.includes('ear') || lower.includes('soundcore') || lower.includes('space')) return 'earbuds';
  if (lower.includes('speaker') || lower.includes('soundlink') || lower.includes('flip') || lower.includes('charge') || lower.includes('boom')) return 'speaker';
  if (lower.includes('watch') || lower.includes('garmin') || lower.includes('fitbit')) return 'smartwatch';
  if (lower.includes('keyboard') || lower.includes('keychron')) return 'keyboard';
  if (lower.includes('mouse') || lower.includes('mx master') || lower.includes('trackpad') || lower.includes('logi')) return 'mouse';
  if (lower.includes('controller') || lower.includes('xbox') || lower.includes('dualshock') || lower.includes('gamepad')) return 'controller';
  if (lower.includes('tv') || lower.includes('roku') || lower.includes('firetv')) return 'tv';
  if (lower.includes('phone') || lower.includes('iphone')) return 'phone';
  return 'generic';
}

const MAX_DEVICES = 200;

interface BluetoothContextType {
  devices: BluetoothDevice[];
  selectedDevice: BluetoothDevice | null;
  selectDevice: (device: BluetoothDevice | null) => void;
  isScanning: boolean;
  statusMessage: string;
  showUnnamed: boolean;
  setShowUnnamed: (show: boolean) => void;
  startScan: () => void;
  stopScan: () => void;
  rescan: () => void;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  isWebSupported: boolean;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [showUnnamed, setShowUnnamed] = useState<boolean>(true);
  const [bleManager, setBleManager] = useState<any>(null);
  const [isWebSupported, setIsWebSupported] = useState<boolean>(true);

  const showUnnamedRef = useRef<boolean>(true);
  const isConnectingRef = useRef<Set<string>>(new Set());
  const managerRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);

  // Map to keep active Web Bluetooth device objects
  const webBLEMap = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    showUnnamedRef.current = showUnnamed;
  }, [showUnnamed]);

  // Check browser capabilities on Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const hasBLE = typeof navigator !== 'undefined' && Boolean((navigator as any).bluetooth);
      setIsWebSupported(hasBLE);
      if (!hasBLE) {
        setStatusMessage('Open in Google Chrome or Microsoft Edge for live Bluetooth hardware access.');
      } else {
        setStatusMessage('Chrome Web Bluetooth ready. Put your mouse or headphones in pairing mode and click scan.');
      }
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

  // Unified Web Bluetooth Scanner (Shows mice, headphones, keyboards, and all BLE peripherals in pairing mode)
  const scanWebBluetooth = async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      alert('Web Bluetooth is supported in Google Chrome, Microsoft Edge, and Opera. Please open this link in Chrome.');
      return;
    }

    try {
      setIsScanning(true);
      setStatusMessage('Chrome Bluetooth dialog opened. Make sure your device is blinking in pairing mode...');

      // Request any nearby Bluetooth device
      const webDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'device_information',
          'generic_access',
          'generic_attribute',
          'heart_rate',
          0x180f,
          0x180a,
          0x1800,
          0x1801,
          0x180d,
        ],
      });

      webBLEMap.current.set(webDevice.id, webDevice);

      const devType = inferDeviceType(webDevice.name);
      const isConnected = webDevice.gatt?.connected ?? false;

      const newDev: BluetoothDevice = {
        id: webDevice.id,
        name: webDevice.name || 'Bluetooth Device',
        isConnected,
        isConnecting: false,
        deviceType: devType,
        rssi: -45,
        lastSeen: Date.now(),
        serviceUUIDs: ['180A', '180F'],
      };

      // Disconnect listener
      webDevice.addEventListener('gattserverdisconnected', () => {
        setDevices((prev) =>
          prev.map((d) => (d.id === webDevice.id ? { ...d, isConnected: false, isConnecting: false } : d))
        );
        setStatusMessage(`Disconnected from ${webDevice.name || webDevice.id}`);
      });

      setDevices((prev) => {
        const index = prev.findIndex((d) => d.id === webDevice.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...newDev };
          return updated;
        }
        return [newDev, ...prev];
      });

      setStatusMessage(`Found ${webDevice.name || 'Device'}! Tap it to connect & view details.`);
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setStatusMessage('Pairing prompt closed.');
      } else {
        setStatusMessage(`BLE: ${err.message || err}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Start BLE Scanning (Native or Web)
  const startScan = async () => {
    if (Platform.OS === 'web') {
      await scanWebBluetooth();
      return;
    }

    const manager = managerRef.current;
    if (!manager) {
      setStatusMessage('BLE Manager not ready.');
      return;
    }

    if (Platform.OS === 'android') {
      const granted = await requestAndroidPermissions();
      if (!granted) {
        setStatusMessage('Bluetooth permissions denied.');
        return;
      }
    }

    try {
      manager.stopDeviceScan();
    } catch (_) {}

    setIsScanning(true);
    isScanningRef.current = true;
    setStatusMessage('Auto-scanning for Bluetooth devices...');

    manager.startDeviceScan(null, null, (error: any, device: any) => {
      if (error) {
        setStatusMessage(`Scan notice: ${error.message}`);
        setIsScanning(false);
        isScanningRef.current = false;
        return;
      }

      if (device) {
        const deviceName = device.name || device.localName;
        const shouldInclude = Boolean(deviceName) || showUnnamedRef.current;

        if (shouldInclude) {
          const displayName = deviceName || `Peripheral (${device.id.slice(0, 8)})`;
          const devType = inferDeviceType(deviceName);

          setDevices((prev) => {
            if (prev.length >= MAX_DEVICES) {
              if (managerRef.current && isScanningRef.current) {
                try {
                  managerRef.current.stopDeviceScan();
                } catch (_) {}
                setIsScanning(false);
                isScanningRef.current = false;
                setStatusMessage('Auto-stopped: Reached 200 devices limit.');
              }
              return prev;
            }

            const index = prev.findIndex((d) => d.id === device.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                name: displayName,
                rssi: device.rssi ?? updated[index].rssi,
                lastSeen: Date.now(),
                deviceType: devType,
              };
              return updated;
            } else {
              const newDev: BluetoothDevice = {
                id: device.id,
                name: displayName,
                macAddress: Platform.OS === 'android' ? device.id : undefined,
                rssi: device.rssi ?? -70,
                isConnected: false,
                isConnecting: false,
                deviceType: devType,
                lastSeen: Date.now(),
                serviceUUIDs: device.serviceUUIDs || [],
              };
              const nextList = [...prev, newDev];

              if (nextList.length >= MAX_DEVICES) {
                if (managerRef.current && isScanningRef.current) {
                  try {
                    managerRef.current.stopDeviceScan();
                  } catch (_) {}
                  setIsScanning(false);
                  isScanningRef.current = false;
                  setStatusMessage('Auto-stopped: Reached 200 devices limit.');
                }
              }

              return nextList;
            }
          });
        }
      }
    });
  };

  const stopScan = () => {
    if (Platform.OS === 'web') {
      setIsScanning(false);
      return;
    }

    const manager = managerRef.current;
    if (manager) {
      try {
        manager.stopDeviceScan();
      } catch (_) {}
    }
    setIsScanning(false);
    isScanningRef.current = false;
    setStatusMessage('Scanning stopped.');
  };

  const rescan = () => {
    setDevices([]);
    if (Platform.OS === 'web') {
      scanWebBluetooth();
      return;
    }

    const manager = managerRef.current;
    if (manager) {
      try {
        manager.stopDeviceScan();
      } catch (_) {}
    }
    setIsScanning(false);
    isScanningRef.current = false;
    setStatusMessage('Rescanning from 0 to 200 devices...');
    setTimeout(() => {
      startScan();
    }, 200);
  };

  // Connect to a device (Native or Web Bluetooth)
  const connectToDevice = async (deviceId: string) => {
    if (isConnectingRef.current.has(deviceId)) return;
    isConnectingRef.current.add(deviceId);

    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, isConnecting: true } : d))
    );
    setStatusMessage(`Connecting to device...`);

    // Web Bluetooth connection handler
    if (Platform.OS === 'web') {
      const bleDev = webBLEMap.current.get(deviceId);
      if (bleDev && bleDev.gatt) {
        try {
          const server = await bleDev.gatt.connect();

          let serviceUUIDs: string[] = [];
          try {
            const services = await server.getPrimaryServices();
            serviceUUIDs = services.map((s: any) => s.uuid);
          } catch (servErr) {
            console.log('Browser service access note:', servErr);
            serviceUUIDs = ['0000180a-0000-1000-8000-00805f9b34fb'];
          }

          setDevices((prev) =>
            prev.map((d) =>
              d.id === deviceId
                ? {
                    ...d,
                    isConnected: true,
                    isConnecting: false,
                    serviceUUIDs: serviceUUIDs.length > 0 ? serviceUUIDs : ['Connected Device'],
                  }
                : d
            )
          );
          setStatusMessage(`Connected to ${bleDev.name || 'Device'}!`);
        } catch (bleErr: any) {
          console.warn('Web GATT error:', bleErr);
          setStatusMessage(`Connect status: ${bleErr.message || bleErr}`);
          setDevices((prev) =>
            prev.map((d) => (d.id === deviceId ? { ...d, isConnecting: false } : d))
          );
        } finally {
          isConnectingRef.current.delete(deviceId);
        }
        return;
      }
    }

    // Native implementation (iOS / Android)
    const manager = managerRef.current;
    if (!manager) return;

    try {
      manager.stopDeviceScan();
      setIsScanning(false);
    } catch (_) {}

    try {
      const connectedDevice = await manager.connectToDevice(deviceId, {
        autoConnect: false,
      });

      setStatusMessage(`Connected! Reading GATT services...`);
      const fullDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
      const services = await fullDevice.services();
      const serviceUUIDs = services.map((s: any) => s.uuid);

      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId
            ? {
                ...d,
                name: connectedDevice.name || d.name,
                isConnected: true,
                isConnecting: false,
                serviceUUIDs,
              }
            : d
        )
      );
      setStatusMessage(`Connected to ${connectedDevice.name || deviceId}`);

      connectedDevice.onDisconnected((error: any, disconnectedDev: any) => {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...d, isConnected: false, isConnecting: false } : d
          )
        );
        setStatusMessage(`Disconnected from device.`);
      });
    } catch (err: any) {
      console.warn('Connection failed:', err);
      setStatusMessage(`Connection failed: ${err.message || err}`);
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, isConnecting: false } : d))
      );
    } finally {
      isConnectingRef.current.delete(deviceId);
    }
  };

  // Disconnect from a device
  const disconnectDevice = async (deviceId: string) => {
    // Web handling
    if (Platform.OS === 'web') {
      const bleDev = webBLEMap.current.get(deviceId);
      if (bleDev && bleDev.gatt && bleDev.gatt.connected) {
        try {
          bleDev.gatt.disconnect();
        } catch (_) {}
      }

      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, isConnected: false, isConnecting: false } : d
        )
      );
      setStatusMessage(`Device disconnected.`);
      return;
    }

    // Native implementation
    const manager = managerRef.current;
    if (!manager) return;

    try {
      setStatusMessage(`Disconnecting...`);
      await manager.cancelDeviceConnection(deviceId);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, isConnected: false, isConnecting: false } : d
        )
      );
      setStatusMessage(`Device disconnected.`);
    } catch (err: any) {
      setStatusMessage(`Disconnect error: ${err.message || err}`);
    }
  };

  // Initialize and automatically start scanning on mount (Native)
  useEffect(() => {
    let mgr: any = null;

    if (Platform.OS !== 'web') {
      try {
        const { BleManager } = require('react-native-ble-plx');
        mgr = new BleManager();
        setBleManager(mgr);
        managerRef.current = mgr;

        setTimeout(() => {
          startScan();
        }, 500);
      } catch (err) {
        console.log('BleManager init error:', err);
        setStatusMessage('BLE requires Development Build (npx expo run:ios / run:android).');
      }
    }

    return () => {
      if (mgr) {
        try {
          mgr.stopDeviceScan();
          mgr.destroy();
        } catch (_) {}
      }
    };
  }, []);

  const selectDevice = (device: BluetoothDevice | null) => {
    setSelectedDeviceId(device ? device.id : null);
  };

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || null;

  return (
    <BluetoothContext.Provider
      value={{
        devices,
        selectedDevice,
        selectDevice,
        isScanning,
        statusMessage,
        showUnnamed,
        setShowUnnamed,
        startScan,
        stopScan,
        rescan,
        connectToDevice,
        disconnectDevice,
        isWebSupported,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetoothContext = () => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetoothContext must be used within a BluetoothProvider');
  }
  return context;
};
