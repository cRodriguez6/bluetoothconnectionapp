# ⚡ Bluetooth Connection App

> 🌐 **Live Web App**: [https://crodriguez6.github.io/bluetoothconnectionapp/](https://crodriguez6.github.io/bluetoothconnectionapp/)  
> Open this link in **Google Chrome** or **Microsoft Edge** to scan, connect, and disconnect Bluetooth devices directly in your browser!

---

## Features
- **Live Bluetooth Hardware**: Connect and disconnect real Bluetooth peripherals (headphones, mice, fitness devices) over Web Bluetooth API.
- **Instant Search & Filter**: Real-time search for nearby Bluetooth devices by name, type, or ID.
- **Auto-Stop at 200 Devices**: Automatically halts discovery as soon as 200 signals are gathered to preserve battery and memory.
- **Hardware Telemetry & GATT Services**: Inspect signal strength (RSSI), connection states, UUIDs, and advertised services on a dedicated details screen.

---

## Run Locally

### On Web (Chrome)
```bash
npm run web
```
Open `http://localhost:8081` in Google Chrome and click **"+ Scan for Bluetooth Devices"**.

### On Mobile (iOS / Android)
Requires a native Development Build for hardware BLE access:
```bash
# For iOS Device:
npx expo run:ios --device

# For Android Device:
npx expo run:android --device
```
