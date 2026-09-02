# Running TrailGuard

Because the TrailGuard repository is segregated into purpose-built modules, you need to run each service from its respective directory.

Here are the commands to run each part of the system:

## 1. Web Dashboard (Flask)
The dashboard is the central incident management system.

```powershell
# Open a terminal and navigate to the dashboard directory
cd services

# Run the Flask app
python -m dashboard.app
```
> The dashboard will be accessible at `http://localhost:5000`.

## 2. LoRa Gateway (Serial Adapter)
The gateway reads packets from the physical LoRa nodes over USB/Serial and forwards them to the dashboard.

```powershell
# Open a new terminal and navigate to the gateway directory
cd services/gateway

# Install dependencies if you haven't already
pip install -r requirements.txt

# Run the gateway adapter
python src/main.py
```

## 3. Mobile App (Expo / React Native)
The mobile app is used by hikers for offline mapping and Bluetooth connection to their LoRa nodes.

```powershell
# Open a new terminal and navigate to the mobile app directory
cd apps/mobile

# Install dependencies if you haven't already
npm install

# Start the Expo development server
npx expo start
```
> You can then scan the QR code with the Expo Go app on your phone, or press `a` to run on an Android emulator.

## 4. Hardware Tests (C++)
To run the simulated mesh and priority testing scripts for the firmware.

```powershell
# Open a terminal and navigate to the firmware tests directory
cd hardware/firmware/modules/trailguard/tests

# Compile the test file (assuming you have g++ installed)
g++ test_priority.cpp ../src/TrailGuardModule.cpp ../src/crypto.cpp ../lib/tweetnacl/tweetnacl.c -o test_priority

# Run the compiled executable
./test_priority
```

## 5. Cross-Platform Crypto Tests (Node.js)
To verify that the Node.js mobile app crypto matches the C++ firmware crypto.

```powershell
# Navigate to the root tests directory
cd tests

# Run the interoperability test
node test_crypto_interop.js
```
