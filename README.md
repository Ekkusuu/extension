# Quick Notes - Study Helper (Firefox Extension)

A simple clipboard and note-taking extension that seamlessly integrates with Moodle (else.fcim.utm.md). Features cloud sync capabilities for your study notes.

## Features

- 📋 **Quick Notes Button** - Appears naturally in the Moodle quiz sidebar
- 💬 **Note Interface** - Clean, Moodle-themed chat interface
- 🖼️ **Image Attachments** - Drag & drop, paste, or click to attach images
- ☁️ **Cloud Sync** - Sync your notes across devices (requires sync key)
- 🎨 **Native Theme** - Matches Moodle's visual style perfectly

## Installation

### Step 1: Get a Cloud Sync Key

1. Go to [Google Cloud Console](https://aistudio.google.com/apikey)
2. Sign in with your account
3. Create a new sync key
4. Copy the generated key

### Step 2: Install the Extension in Firefox

#### Temporary Installation (Development)

1. Open Firefox
2. Type `about:debugging` in the address bar
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on..."
5. Navigate to the extension folder and select `manifest.json`

#### Permanent Installation

1. Create a ZIP file of the extension folder
2. Submit to [Firefox Add-ons](https://addons.mozilla.org/developers/)

### Step 3: Configure the Extension

**Option A: From the toolbar**
1. Click the extension icon in Firefox toolbar
2. Enter your Cloud Sync Key
3. Click "Save Settings"

**Option B: From the Notes panel**
1. Open Quick Notes on any Moodle page
2. Click the ⚙️ settings icon
3. Enter your sync key and save

## Usage

1. Navigate to any quiz page on `else.fcim.utm.md`
2. Find the **Quick Notes** button in the right sidebar
3. Click to open the notes panel
4. Either:
   - **Drag & drop** an image
   - **Click** the image area to select a file
   - **Paste** an image (Ctrl+V / Cmd+V)
5. Add your note or question
6. Press **Enter** to save/sync

## File Structure

```
extension/
├── manifest.json       # Extension configuration
├── content.js          # Page integration script
├── styles.css          # Moodle-matching styles
├── background.js       # Background processes
├── popup.html          # Settings popup
├── popup.js            # Settings logic
└── README.md           # Documentation
```

## Technical Details

- **Target Site**: else.fcim.utm.md
- **Manifest Version**: 2 (Firefox compatible)
- **Theme**: Matches Moodle Bootstrap theme
- **Sync Service**: Google Cloud API

## Troubleshooting

### "Sync key not configured" error
- Click ⚙️ in the notes panel or the extension icon to set up

### Button doesn't appear
- Ensure you're on `else.fcim.utm.md`
- Refresh the page
- Check that the sidebar is visible

### Image won't attach
- Use PNG, JPEG, or WEBP format
- Try a smaller file size

## Privacy

- Sync key stored locally in browser
- Images processed through cloud sync service
- No data collected by the extension

## License

MIT License
