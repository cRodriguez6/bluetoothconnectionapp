import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SignalIndicatorProps {
  rssi: number; // e.g. -45 to -90
  showValue?: boolean;
}

export const SignalIndicator: React.FC<SignalIndicatorProps> = ({ rssi, showValue = true }) => {
  // RSSI calculation:
  // > -55: 4 bars (Excellent)
  // -55 to -70: 3 bars (Good)
  // -70 to -85: 2 bars (Fair)
  // < -85: 1 bar (Weak)
  let bars = 1;
  let color = '#EF4444'; // Red

  if (rssi >= -55) {
    bars = 4;
    color = '#10B981'; // Emerald Green
  } else if (rssi >= -70) {
    bars = 3;
    color = '#3B82F6'; // Electric Blue
  } else if (rssi >= -85) {
    bars = 2;
    color = '#F59E0B'; // Amber
  }

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {[1, 2, 3, 4].map((barIndex) => {
          const isActive = barIndex <= bars;
          return (
            <View
              key={barIndex}
              style={[
                styles.bar,
                {
                  height: 4 + barIndex * 3,
                  backgroundColor: isActive ? color : '#334155',
                },
              ]}
            />
          );
        })}
      </View>
      {showValue && (
        <Text style={[styles.rssiText, { color }]}>
          {rssi} dBm
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 16,
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
  rssiText: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
