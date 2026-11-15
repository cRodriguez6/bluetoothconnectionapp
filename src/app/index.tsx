import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBluetoothContext } from '../context/BluetoothContext';
import { DeviceIcon } from '../components/DeviceIcon';
import { SignalIndicator } from '../components/SignalIndicator';
import { BluetoothDevice } from '../types/bluetooth';

export default function HomeScreen() {
  const router = useRouter();
  const {
    devices,
    selectDevice,
    isScanning,
    startScan,
    rescan,
    statusMessage,
    isWebSupported,
  } = useBluetoothContext();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showList, setShowList] = useState<boolean>(Platform.OS === 'web');

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // If user is searching, filter the devices. Otherwise if showList is enabled, show all devices.
  const displayedDevices =
    trimmedQuery.length > 0
      ? devices.filter(
          (d) =>
            d.name.toLowerCase().includes(trimmedQuery) ||
            d.id.toLowerCase().includes(trimmedQuery) ||
            d.deviceType.toLowerCase().includes(trimmedQuery)
        )
      : showList
      ? devices
      : [];

  const isDisplayingList = trimmedQuery.length > 0 || showList;

  const handleSelectDevice = (device: BluetoothDevice) => {
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
    selectDevice(device);
    router.push('/details');
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header Title & Status */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bluetooth</Text>
              {Platform.OS === 'web' && (
                <Text style={styles.webSubheader}>Chrome Web Bluetooth API</Text>
              )}
            </View>
            <View style={styles.scanBadge}>
              <View
                style={[
                  styles.statusDot,
                  isScanning ? styles.dotScanning : styles.dotStopped,
                ]}
              />
              <Text style={styles.scanBadgeText}>
                {Platform.OS === 'web'
                  ? `${devices.length} Devices`
                  : isScanning
                  ? `Scanning (${devices.length}/200)`
                  : `Stopped (${devices.length}/200)`}
              </Text>
            </View>
          </View>

          {/* Browser compatibility hint if not Chromium */}
          {Platform.OS === 'web' && !isWebSupported && (
            <View style={styles.webWarningBanner}>
              <Ionicons name="information-circle" size={18} color="#92400E" />
              <Text style={styles.webWarningText}>
                To pair real Bluetooth devices, please open this link in Google Chrome, Edge, or Opera.
              </Text>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#4B5563" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search devices by name, type, or ID..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Web: Single Unified Scan & Pair Button */}
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.webScanBtn}
              onPress={startScan}
              activeOpacity={0.85}
            >
              <Ionicons name="bluetooth" size={18} color="#FFFFFF" />
              <Text style={styles.webScanBtnText}>+ Scan for Bluetooth Devices</Text>
            </TouchableOpacity>
          )}

          {/* Action Controls: List Devices & Rescan */}
          <View style={styles.controlsBar}>
            <TouchableOpacity
              style={[styles.listToggleBtn, showList && styles.listToggleBtnActive]}
              onPress={() => setShowList((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={showList ? 'eye-off-outline' : 'list-outline'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.listToggleBtnText}>
                {showList ? 'Hide List' : 'List Devices'} ({devices.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={rescan}
              activeOpacity={0.8}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Ionicons name="refresh" size={18} color="#000000" />
              )}
              <Text style={styles.rescanBtnText}>
                {Platform.OS === 'web' ? 'Pair / Refresh' : 'Rescan'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Results or Empty State */}
          {isDisplayingList ? (
            <View style={styles.resultsWrapper}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.resultsHeader}>
                  {trimmedQuery.length > 0
                    ? `Matches for "${searchQuery}" (${displayedDevices.length}):`
                    : `Discovered Devices (${displayedDevices.length}):`}
                </Text>
                {showList && trimmedQuery.length === 0 && (
                  <Text style={styles.resultsSubheader}>Tap to inspect & connect</Text>
                )}
              </View>

              <FlatList
                data={displayedDevices}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.deviceCard,
                      item.isConnected && styles.deviceCardConnected,
                    ]}
                    onPress={() => handleSelectDevice(item)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.cardLeft}>
                      <DeviceIcon
                        type={item.deviceType}
                        isConnected={item.isConnected}
                        size={22}
                      />
                      <View style={styles.deviceTextGroup}>
                        <View style={styles.deviceNameRow}>
                          <Text style={styles.deviceName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.isConnected && (
                            <View style={styles.connectedTag}>
                              <Text style={styles.connectedTagText}>Connected</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.deviceId}>{item.id}</Text>
                      </View>
                    </View>

                    <View style={styles.cardRight}>
                      <SignalIndicator rssi={item.rssi} showValue={false} />
                      <Ionicons name="chevron-forward" size={18} color="#1F2937" />
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name={trimmedQuery.length > 0 ? 'search-outline' : 'radio-outline'}
                      size={34}
                      color="#1F2937"
                    />
                    <Text style={styles.emptyText}>
                      {trimmedQuery.length > 0
                        ? `No devices matching "${searchQuery}"`
                        : 'No devices found yet. Tap "+ Pair New Device" above.'}
                    </Text>
                  </View>
                }
              />
            </View>
          ) : (
            <View style={styles.idleContainer}>
              <Ionicons name="bluetooth" size={42} color="#1F2937" />
              <Text style={styles.idleTitle}>Search or List Devices</Text>
              <Text style={styles.idleSubtitle}>
                {devices.length === 0
                  ? 'Ready to connect. Tap "+ Pair New Device" or "List Devices".'
                  : `${devices.length} signals available. Tap "List Devices" or type to search.`}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    maxWidth: Platform.OS === 'web' ? 680 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  webSubheader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 1,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotScanning: {
    backgroundColor: '#22C55E',
  },
  dotStopped: {
    backgroundColor: '#EF4444',
  },
  scanBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  webWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  webWarningText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    padding: 0,
    outlineWidth: 0,
  } as any,
  clearBtn: {
    padding: 2,
  },
  webScanBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    cursor: 'pointer',
  } as any,
  webScanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  controlsBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  listToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000000',
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  listToggleBtnActive: {
    backgroundColor: '#1E293B',
  },
  listToggleBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rescanBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  resultsWrapper: {
    flex: 1,
    marginTop: 14,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  resultsHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultsSubheader: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    cursor: 'pointer',
  } as any,
  deviceCardConnected: {
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  deviceTextGroup: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  deviceName: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  connectedTag: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  connectedTagText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  deviceId: {
    color: '#4B5563',
    fontSize: 11,
    fontFamily: 'Courier',
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  idleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  idleTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  idleSubtitle: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
