import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBluetoothContext } from '../context/BluetoothContext';
import { DeviceIcon } from '../components/DeviceIcon';
import { SignalIndicator } from '../components/SignalIndicator';

export default function DeviceDetailsScreen() {
  const router = useRouter();
  const { selectedDevice, connectToDevice, disconnectDevice } = useBluetoothContext();

  if (!selectedDevice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#000000" />
          <Text style={styles.emptyTitle}>No Device Selected</Text>
          <Text style={styles.emptySubtitle}>
            Please search and select a device from the home screen.
          </Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
            <Text style={styles.backHomeBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isConnected = selectedDevice.isConnected;
  const isConnecting = selectedDevice.isConnecting;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
            <Text style={styles.backText}>Search</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Device Details</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Device Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrapper}>
              <DeviceIcon
                type={selectedDevice.deviceType}
                isConnected={isConnected}
                size={34}
              />
            </View>

            <Text style={styles.heroName} numberOfLines={2}>
              {selectedDevice.name}
            </Text>
            <Text style={styles.heroType}>
              {selectedDevice.deviceType.toUpperCase()}
            </Text>

            {/* Connection Status Badge */}
            <View
              style={[
                styles.statusBadge,
                isConnected ? styles.connectedBadge : styles.disconnectedBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isConnected ? styles.connectedDot : styles.disconnectedDot,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  isConnected ? styles.connectedText : styles.disconnectedText,
                ]}
              >
                {isConnecting
                  ? 'Connecting...'
                  : isConnected
                  ? 'Connected'
                  : 'Not Connected'}
              </Text>
            </View>

            {/* Main Action Button */}
            <View style={styles.actionRow}>
              {isConnecting ? (
                <View style={styles.connectingBtn}>
                  <ActivityIndicator size="small" color="#000000" />
                  <Text style={styles.connectingBtnText}>Connecting...</Text>
                </View>
              ) : isConnected ? (
                <TouchableOpacity
                  style={styles.disconnectBtn}
                  onPress={() => disconnectDevice(selectedDevice.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                  <Text style={styles.disconnectBtnText}>Disconnect Device</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.connectBtn}
                  onPress={() => connectToDevice(selectedDevice.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="bluetooth" size={18} color="#FFFFFF" />
                  <Text style={styles.connectBtnText}>Connect to Device</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Signal & Telemetry Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Signal & Telemetry</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Signal Strength (RSSI)</Text>
              <SignalIndicator rssi={selectedDevice.rssi} />
            </View>

            {selectedDevice.batteryLevel !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Battery Level</Text>
                <Text style={styles.batteryValue}>{selectedDevice.batteryLevel}%</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Detected</Text>
              <Text style={styles.infoValue}>
                {new Date(selectedDevice.lastSeen).toLocaleTimeString()}
              </Text>
            </View>
          </View>

          {/* Hardware & Identifiers Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Hardware & Identifiers</Text>

            <View style={styles.infoStackRow}>
              <Text style={styles.infoLabel}>Device UUID / ID</Text>
              <Text style={styles.codeSnippet}>{selectedDevice.id}</Text>
            </View>

            {selectedDevice.macAddress && (
              <View style={styles.infoStackRow}>
                <Text style={styles.infoLabel}>MAC Address</Text>
                <Text style={styles.codeSnippet}>{selectedDevice.macAddress}</Text>
              </View>
            )}
          </View>

          {/* GATT Services Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Advertised GATT Services</Text>

            {selectedDevice.serviceUUIDs && selectedDevice.serviceUUIDs.length > 0 ? (
              <View style={styles.servicesGrid}>
                {selectedDevice.serviceUUIDs.map((uuid, index) => (
                  <View key={index} style={styles.servicePill}>
                    <Ionicons name="code-working" size={14} color="#0284C7" />
                    <Text style={styles.servicePillText}>{uuid}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noServicesText}>
                {isConnected
                  ? 'No standard GATT services advertised.'
                  : 'Connect to this device to discover all services and characteristics.'}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FACC15',
  },
  container: {
    flex: 1,
    backgroundColor: '#FACC15',
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  backText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  navTitle: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  heroIconWrapper: {
    marginBottom: 10,
  },
  heroName: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroType: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 18,
  },
  connectedBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  disconnectedBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  connectedDot: {
    backgroundColor: '#15803D',
  },
  disconnectedDot: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  connectedText: {
    color: '#15803D',
  },
  disconnectedText: {
    color: '#4B5563',
  },
  actionRow: {
    width: '100%',
  },
  connectBtn: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  disconnectBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  disconnectBtnText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '800',
  },
  connectingBtn: {
    backgroundColor: '#FEF08A',
    borderWidth: 1.5,
    borderColor: '#EAB308',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  connectingBtnText: {
    color: '#854D0E',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoStackRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '600',
  },
  batteryValue: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '800',
  },
  codeSnippet: {
    color: '#0284C7',
    fontSize: 12,
    fontFamily: 'Courier',
    marginTop: 4,
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#7DD3FC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  servicePillText: {
    color: '#0369A1',
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
  },
  noServicesText: {
    color: '#6B7280',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#374151',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  backHomeBtn: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
