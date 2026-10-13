import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BluetoothDevice } from '../types/bluetooth';
import { DeviceIcon } from './DeviceIcon';
import { SignalIndicator } from './SignalIndicator';

interface DeviceDetailsModalProps {
  device: BluetoothDevice | null;
  visible: boolean;
  onClose: () => void;
  onToggleConnect: (id: string) => void;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  device,
  visible,
  onClose,
  onToggleConnect,
}) => {
  if (!device) return null;

  const isConnected = device.isConnected;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <DeviceIcon type={device.deviceType} isConnected={isConnected} size={28} />
              <View>
                <Text style={styles.title}>{device.name || 'Unnamed Device'}</Text>
                <Text style={styles.subtitle}>{device.deviceType.toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Status Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.statusRow}>
                <Text style={styles.label}>Connection State</Text>
                <View
                  style={[
                    styles.statusPill,
                    isConnected ? styles.connectedPill : styles.disconnectedPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isConnected ? styles.connectedPillText : styles.disconnectedPillText,
                    ]}
                  >
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.label}>Signal Strength (RSSI)</Text>
                <SignalIndicator rssi={device.rssi} />
              </View>

              {device.batteryLevel !== undefined && (
                <View style={styles.statusRow}>
                  <Text style={styles.label}>Battery Level</Text>
                  <Text style={styles.valueHighlight}>{device.batteryLevel}%</Text>
                </View>
              )}
            </View>

            {/* Hardware & Identifiers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hardware & Identification</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Device ID</Text>
                <Text style={styles.codeValue}>{device.id}</Text>
              </View>

              {device.macAddress && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>MAC Address</Text>
                  <Text style={styles.codeValue}>{device.macAddress}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.label}>Last Seen</Text>
                <Text style={styles.value}>
                  {new Date(device.lastSeen).toLocaleTimeString()}
                </Text>
              </View>
            </View>

            {/* GATT Services */}
            {device.serviceUUIDs && device.serviceUUIDs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Advertised GATT Services</Text>
                <View style={styles.servicesGrid}>
                  {device.serviceUUIDs.map((uuid, idx) => (
                    <View key={idx} style={styles.serviceBadge}>
                      <Ionicons name="code-working" size={14} color="#38BDF8" />
                      <Text style={styles.serviceText}>0x{uuid}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isConnected ? styles.disconnectBtn : styles.connectBtn,
              ]}
              onPress={() => {
                onToggleConnect(device.id);
                onClose();
              }}
            >
              <Ionicons
                name={isConnected ? 'bluetooth-outline' : 'bluetooth'}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.actionBtnText}>
                {isConnected ? 'Disconnect Device' : 'Connect to Device'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoRow: {
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#94A3B8',
  },
  value: {
    fontSize: 14,
    color: '#F1F5F9',
    marginTop: 2,
  },
  valueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  codeValue: {
    fontSize: 13,
    fontFamily: 'Courier',
    color: '#38BDF8',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  disconnectedPill: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  connectedPillText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  disconnectedPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  serviceText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  footer: {
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  connectBtn: {
    backgroundColor: '#0284C7',
  },
  disconnectBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
