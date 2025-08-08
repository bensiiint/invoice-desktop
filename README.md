# Engineering Invoice & Quotation System

A professional desktop application for creating engineering invoices and quotations.

## Features

- ✅ Modern, user-friendly interface
- ✅ Real-time calculation of labor, overtime, software, and overhead costs
- ✅ Professional quotation generation
- ✅ Save/Load projects to JSON files
- ✅ Print to PDF functionality
- ✅ Cross-platform desktop app (Windows, Mac, Linux)
- ✅ Custom company branding and client management

## Development Setup

### Prerequisites
- Node.js (v16 or later)
- npm (comes with Node.js)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode (Web Browser)
```bash
npm start
```
Opens the app in your browser at http://localhost:3000

#### Desktop Application (Electron)
```bash
npm run electron-dev
```
Runs the app as a desktop application

### Building for Production

#### Web Build
```bash
npm run build
```

#### Desktop Application Build
```bash
npm run electron-pack
```
Creates installers in the `dist/` folder

## Project Structure

```
src/
├── App.js          # Main React component
├── App.css         # Styling
├── index.js        # React entry point
└── index.css       # Global styles

public/
├── electron.js     # Electron main process
├── index.html      # HTML template
└── icons/          # App icons
```

## Usage

1. **Calculate Tab**: Enter engineering tasks, hours, rates, and costs
2. **Quotation Tab**: View professional quotation document
3. **File Menu**: Save/Load projects, Export PDF
4. **Print**: Generate PDF quotations for clients

## Built With

- React 18
- Electron
- Lucide React (for icons)
- Modern CSS

## Company

Built for KUSAKABE & MAENO TECH., INC
Engineering services and project management solutions.

## Version

1.0.0 - Initial release