# TrailGuard: Installation & Requirements Guide

Welcome to the TrailGuard team! Because this project spans across mobile development, embedded C++ hardware, and a Python backend, there are a few different tools you'll need to install before you can run the code.

You do **not** need to install everything if you are only working on one part of the project. Pick the section that applies to you below.

---

## 1. Global Requirements (Everyone needs these)
- **Git:** For version control. (https://git-scm.com/)
- **VS Code:** The recommended IDE for this project. (https://code.visualstudio.com/)

---

## 2. Mobile App Development (Level 1)
If you are working on the React Native mobile app in the `apps/mobile/` folder, you will need:

### Prerequisites:
- **Node.js (v18 or higher):** Required for the React Native packager and Expo. (https://nodejs.org/)
- **npm or yarn:** Package manager (comes with Node.js).
- **Expo CLI:** We use Expo Application Services (EAS) for building. Install it globally:
  ```bash
  npm install -g eas-cli
  ```
- **Android Studio / Android SDK:** If you want to run the app locally on a Windows machine, you need the Android SDK. 
  - Install Android Studio.
  - Set up a Virtual Device (Emulator).
  - Ensure the `ANDROID_HOME` environment variable is set.

### Getting Started:
```bash
cd apps/mobile
npm install
npm run start   # Or 'npx expo start'
```

---

## 3. Node Firmware Development (Level 2)
If you are writing C++ code for the ESP32 LoRa nodes in the `hardware/firmware/` folder, you will need:

### Prerequisites:
- **PlatformIO IDE:** This is an extension for VS Code. Do **not** use the standard Arduino IDE, as our project uses advanced C++ module injection into Meshtastic.
  - Open VS Code.
  - Go to the Extensions tab (`Ctrl+Shift+X`).
  - Search for "PlatformIO IDE" and install it.
- **Python 3:** PlatformIO uses Python under the hood. (https://www.python.org/downloads/)
- **CP210x USB to UART Bridge VCP Drivers:** Required so your computer can recognize the Heltec ESP32 boards when plugged in via USB. (Download from Silicon Labs).

### Getting Started:
- Open the `hardware/firmware/` folder directly in VS Code.
- PlatformIO will automatically read the `platformio.ini` file and download all necessary compilers (ESP-IDF, Arduino core) and libraries.
- Use the PlatformIO "Upload" button (the right arrow on the bottom blue toolbar) to compile and flash the board.

---

## 4. Backend & Dashboard Development (Level 3)
If you are working on the Python Flask API or the HTML/JS dashboard in the `services/dashboard/` folder, you will need:

### Prerequisites:
- **Python (v3.10 or higher):** Required for the Flask backend and the Meshtastic serial reader. (https://www.python.org/downloads/)
- **pip:** Python package manager.

### Getting Started:
It is highly recommended to use a Python Virtual Environment so you don't pollute your global Python installation.

```bash
cd services/dashboard

# 1. Create a virtual environment
python -m venv venv

# 2. Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 3. Install the required Python packages
pip install -r requirements.txt

# 4. Run the Dashboard
python app.py
```

*Note: The backend requires `meshtastic` and `Flask`. If you are developing without a physical Gateway Node plugged into your PC, you can use the Mobile App's "WiFi Simulator" toggle to send mock data to the local Flask server over HTTP.*
