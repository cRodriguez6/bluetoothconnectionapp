import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeviceType } from '../types/bluetooth';

interface DeviceIconProps {
  type: DeviceType;
  isConnected?: boolean;
  size?: number;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({
  type,
  isConnected = false,
  size = 22,
}) => {
  let iconName: keyof typeof Ionicons.glyphMap = 'bluetooth';

  switch (type) {
    case 'headphones':
      iconName = 'headset';
      break;
    case 'earbuds':
      iconName = 'ear-outline';
      break;
    case 'speaker':
      iconName = 'volume-high';
      break;
    case 'smartwatch':
      iconName = 'watch-outline';
      break;
    case 'fitness':
      iconName = 'heart-circle-outline';
      break;
    case 'keyboard':
      iconName = 'keypad-outline';
      break;
    case 'mouse':
      iconName = 'hardware-chip-outline';
      break;
    case 'controller':
      iconName = 'game-controller-outline';
      break;
    case 'phone':
      iconName = 'phone-portrait-outline';
      break;
    case 'tv':
      iconName = 'tv-outline';
      break;
    default:
      iconName = 'bluetooth-outline';
      break;
  }

  return (
    <View
      style={[
        styles.iconWrapper,
        isConnected ? styles.connectedWrapper : styles.disconnectedWrapper,
      ]}
    >
      <Ionicons
        name={iconName}
        size={size}
        color={isConnected ? '#38BDF8' : '#94A3B8'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedWrapper: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  disconnectedWrapper: {
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
});
