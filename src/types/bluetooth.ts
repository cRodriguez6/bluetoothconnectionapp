export type DeviceType = 
  | 'headphones' 
  | 'earbuds' 
  | 'speaker' 
  | 'smartwatch' 
  | 'fitness' 
  | 'keyboard' 
  | 'mouse' 
  | 'controller' 
  | 'phone' 
  | 'tv' 
  | 'generic';

export interface BluetoothDevice {
  id: string;
  name: string;
  macAddress?: string;
  rssi: number; // Signal strength in dBm, e.g. -45 (strong) to -90 (weak)
  isConnected: boolean;
  isConnecting?: boolean;
  deviceType: DeviceType;
  batteryLevel?: number; // 0 - 100
  serviceUUIDs?: string[];
  txPowerLevel?: number;
  lastSeen: number;
}

export type BluetoothState = 'poweredOn' | 'poweredOff' | 'unauthorized' | 'unsupported' | 'resetting' | 'unknown';

export type DeviceFilter = 'all' | 'connected' | 'available' | 'audio';
