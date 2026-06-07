# DocMaster AI (Document Scanner & PDF Workspace App)

A modern, fast, and feature-rich document scanning and PDF utility application. 

This repository is organized as a monorepo containing both the React Native mobile client and the Node.js backend.

## 📂 Repository Structure

- **`DocMaster AI/`**: React Native (TypeScript) mobile application for iOS and Android. Features custom scanning camera, image/PDF compression levels, OCR text extraction, history list, and beautiful dark-mode inspired glassmorphism UI.
- **`docmaster-backend/`**: Node.js/TypeScript backend API handling file uploads, image compression, OCR processing, database history management, and secure file hosting.
- **`play_store_*.png`**: Graphics and mockups designed for Google Play Store upload.

---

## 🛠️ Quick Start

### 1. Backend Setup (`docmaster-backend`)
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd docmaster-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   * Create a `.env` file from the environment template configuration.
4. Run in development mode:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup (`DocMaster AI`)
1. Open a terminal and navigate to the frontend directory:
   ```bash
   cd "DocMaster AI"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Metro bundler:
   ```bash
   npm start
   ```
4. Build and run on a device or emulator:
   * **Android**: `npm run android`
   * **iOS**: `bundle exec pod install` && `npm run ios`

---

## 🚀 Key Features

* **AI Scanner**: Auto-cropped, clean document scanning using phone cameras.
* **AI OCR (Text Extraction)**: Turns printed/handwritten text into copyable, editable digital text fields in seconds.
* **PDF & Image Compression**: Dynamic three-tier compression (Low/Medium/High) shrinking files up to 90% while keeping text and images sharp.
* **Offline History**: View and manage all scanned items, compression history, and OCR results.
* **Share Instantly**: Integrated direct sharing to WhatsApp, email, Slack, and local downloads.
