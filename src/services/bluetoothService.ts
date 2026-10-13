import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { BluetoothDevice, BluetoothState, DeviceType } from '../types/bluetooth';

// Initial realistic sample devices (connected & nearby)
const INITIAL_DEVICES: BluetoothDevice[] = [
  {
    id: 'dev-airpods-01',
    name: "AirPods Pro (2nd gen)",
    macAddress: 'CC:98:8B:4A:12:89',
    rssi: -42,
    isConnected: true,
    deviceType: 'earbuds',
    batteryLevel: 88,
    serviceUUIDs: ['180A', '180F', '110B'],
    lastSeen: Date.now(),
  },
  {
    id: 'dev-watch-02',
    name: 'Apple Watch Ultra',
    macAddress: 'D4:F5:47:91:EE:03',
    rssi: -49,
    isConnected: true,
    deviceType: 'smartwatch',
    batteryLevel: 64,
    serviceUUIDs: ['180D', '180A', '180F'],
    lastSeen: Date.now(),
  },
  {
    id: 'dev-sony-03',
    name: 'Sony WH-1000XM5',
    macAddress: 'F0:C7:7F:32:8A:BC',
    rssi: -65,
    isConnected: false,
    deviceType: 'headphones',
    batteryLevel: 95,
    serviceUUIDs: ['180A', '110B'],
    lastSeen: Date.now() - 3000,
  },
  {
    id: 'dev-bose-04',
    name: 'Bose SoundLink Flex',
    macAddress: '00:1E:7C:4F:92:11',
    rssi: -72,
    isConnected: false,
    deviceType: 'speaker',
    batteryLevel: 70,
    serviceUUIDs: ['180A', '180F'],
    lastSeen: Date.now() - 8000,
  },
  {
    id: 'dev-logi-05',
    name: 'Logitech MX Master 3S',
    macAddress: 'E8:9F:80:12:33:AA',
    rssi: -58,
    isConnected: false,
    deviceType: 'mouse',
    batteryLevel: 45,
    serviceUUIDs: ['1812', '180F'],
    lastSeen: Date.now() - 12000,
  },
  {
    id: 'dev-key-06',
    name: 'Keychron K2 Pro Keyboard',
    macAddress: '24:4B:FE:8B:90:54',
    rssi: -78,
    isConnected: false,
    deviceType: 'keyboard',
    batteryLevel: 80,
    serviceUUIDs: ['1812'],
    lastSeen: Date.now() - 25000,
  },
];

const DISCOVERABLE_POOL: Omit<BluetoothDevice, 'id' | 'lastSeen'>[] = [
  {
    name: 'Xbox Wireless Controller',
    macAddress: '98:B6:E9:10:44:2B',
    rssi: -68,
    isConnected: false,
    deviceType: 'controller',
    batteryLevel: 52,
    serviceUUIDs: ['1812', '180F'],
  },
  {
    name: 'Garmin HRM-Pro Plus',
    macAddress: '14:98:77:88:AC:33',
    rssi: -75,
    isConnected: false,
    deviceType: 'fitness',
    batteryLevel: 90,
    serviceUUIDs: ['180D', '180F'],
  },
  {
    name: 'Samsung Smart TV (Q80C)',
    macAddress: '3C:CD:5D:89:12:F1',
    rssi: -83,
    isConnected: false,
    deviceType: 'tv',
    serviceUUIDs: ['1800', '1801'],
  },
  {
    name: 'Tile Pro Key Finder',
    macAddress: '70:2C:1F:6A:9B:45',
    rssi: -80,
    isConnected: false,
    deviceType: 'generic',
    batteryLevel: 30,
    serviceUUIDs: ['FEED'],
  },
];

export function useBluetooth() {
  const [devices, setDevices] = useState<BluetoothDevice[]>(INITIAL_DEVICES);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>('poweredOn');
  const [isNativeSupported, setIsNativeSupported] = useState<boolean>(false);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check platform capabilities
  useEffect(() => {
    // Native BLE requires a development build with react-native-ble-plx
    // In Expo Go or Web, we run in simulated environment
    setIsNativeSupported(Platform.OS !== 'web');
  }, []);

  // Scanning simulation: discover devices or update RSSI
  const startScan = useCallback(() => {
    if (bluetoothState !== 'poweredOn') return;
    setIsScanning(true);

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    let discoveryIndex = 0;
    scanIntervalRef.current = setInterval(() => {
      setDevices((prev) => {
        // Randomly update RSSI for existing devices to simulate real live signal
        const updated = prev.map((d) => {
          const jitter = Math.floor(Math.random() * 7) - 3;
          const newRssi = Math.min(-30, Math.max(-95, d.rssi + jitter));
          return { ...d, rssi: newRssi, lastSeen: Date.now() };
        });

        // Periodically discover a new device from the pool if not already added
        if (discoveryIndex < DISCOVERABLE_POOL.length && Math.random() > 0.4) {
          const candidate = DISCOVERABLE_POOL[discoveryIndex];
          const exists = updated.some((d) => d.name === candidate.name);
          if (!exists) {
            discoveryIndex++;
            const newDev: BluetoothDevice = {
              ...candidate,
              id: `dev-discovered-${Date.now()}-${discoveryIndex}`,
              lastSeen: Date.now(),
            };
            return [...updated, newDev];
          }
        }

        return updated;
      });
    }, 2000);
  }, [bluetoothState]);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const toggleScan = useCallback(() => {
    if (isScanning) {
      stopScan();
    } else {
      startScan();
    }
  }, [isScanning, startScan, stopScan]);

  const toggleBluetoothPower = useCallback(() => {
    setBluetoothState((prev) => {
      if (prev === 'poweredOn') {
        stopScan();
        return 'poweredOff';
      } else {
        return 'poweredOn';
      }
    });
  }, [stopScan]);

  const connectToDevice = useCallback((deviceId: string) => {
    // Set connecting state
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, isConnecting: true } : d))
    );

    // Simulate connection handshake
    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId
            ? { ...d, isConnected: true, isConnecting: false }
            : d
        )
      );
    }, 1200);
  }, []);

  const disconnectDevice = useCallback((deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, isConnected: false, isConnecting: false }
          : d
      )
    );
  }, []);

  const removeDevice = useCallback((deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const connectedDevices = devices.filter((d) => d.isConnected);
  const availableDevices = devices.filter((d) => !d.isConnected);

  return {
    devices,
    connectedDevices,
    availableDevices,
    isScanning,
    bluetoothState,
    isNativeSupported,
    startScan,
    stopScan,
    toggleScan,
    toggleBluetoothPower,
    connectToDevice,
    disconnectDevice,
    removeDevice,
  };
}
