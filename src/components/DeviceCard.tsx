import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BluetoothDevice } from '../types/bluetooth';
import { DeviceIcon } from './DeviceIcon';
import { SignalIndicator } from './SignalIndicator';

interface DeviceCardProps {
  device: BluetoothDevice;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onPressDetails: (device: BluetoothDevice) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onConnect,
  onDisconnect,
  onPressDetails,
}) => {
  const isConnected = device.isConnected;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.card,
        isConnected ? styles.connectedCard : styles.disconnectedCard,
      ]}
      onPress={() => onPressDetails(device)}
    >
      <View style={styles.topRow}>
        <View style={styles.deviceInfoContainer}>
          <DeviceIcon type={device.deviceType} isConnected={isConnected} />
          
          <View style={styles.textContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.deviceName} numberOfLines={1}>
                {device.name || 'Unknown Device'}
              </Text>
              {isConnected && (
                <View style={styles.connectedBadge}>
                  <View style={styles.greenDot} />
                  <Text style={styles.connectedText}>Connected</Text>
                </View>
              )}
            </View>

            <Text style={styles.macText}>
              {device.macAddress || device.id}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.metricsGroup}>
          <SignalIndicator rssi={device.rssi} />

          {device.batteryLevel !== undefined && (
            <View style={styles.batteryContainer}>
              <Ionicons
                name={
                  device.batteryLevel > 20
                    ? 'battery-charging-outline'
                    : 'battery-dead-outline'
                }
                size={16}
                color={device.batteryLevel > 20 ? '#10B981' : '#EF4444'}
              />
              <Text style={styles.batteryText}>{device.batteryLevel}%</Text>
            </View>
          )}
        </View>

        <View style={styles.actionGroup}>
          {device.isConnecting ? (
            <View style={styles.connectingButton}>
              <ActivityIndicator size="small" color="#38BDF8" />
              <Text style={styles.connectingText}>Pairing...</Text>
            </View>
          ) : isConnected ? (
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={() => onDisconnect(device.id)}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => onConnect(device.id)}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => onPressDetails(device)}
          >
            <Ionicons name="information-circle-outline" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  connectedCard: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  disconnectedCard: {
    backgroundColor: '#161F30',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    flexShrink: 1,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  connectedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
  },
  macText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: 'Courier',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  batteryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  disconnectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disconnectButtonText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  connectingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  connectingText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  infoButton: {
    padding: 4,
  },
});
