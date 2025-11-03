# Spoiler Blocker (MV3)

**Spoil‑safe browsing for movies, series, sports, and games.**

## ✨ Features
- **Block, blur, or collapse** spoiler content.
- **Live scanning** for dynamically inserted content (social feeds, comments, etc.).
- **Smart matching**: case‑insensitive, word‑boundary aware, optional fuzzy matching ("partial" mode).
- **Per‑site controls** and a **Quick‑Snooze** toggle from popup.
- **Zero external services** — privacy‑first.

## 📦 Project Structure
```
spoiler-blocker/
├─ manifest.json
├─ LICENSE
├─ .gitignore
├─ .editorconfig
├─ README.md
├─ assets/
│  └─ icon.svg
├─ src/
│  ├─ contentScript.js
│  ├─ background.js
│  ├─ popup.html
│  ├─ popup.js
│  ├─ options.html
│  ├─ options.js
│  └─ styles.css
```

## 🚀 Installing (Developer Mode)
1. Open **chrome://extensions**.
2. Enable **Developer mode** (top‑right).
3. Click **Load unpacked** and select the project folder.

## 🛠️ Configuration
Open the **popup** to quickly toggle protection, add keywords, and snooze. For advanced settings (site rules, action modes, intensity), open **Options**.

## 🔒 Privacy
All logic runs locally. Your keywords and settings are stored via `chrome.storage.sync` within your Chrome profile and are not uploaded anywhere else by this extension.

## 🧩 Compatibility
- Chrome, Brave, Edge (Manifest V3)
- Firefox (Manifest v3 preview) may require loading via `about:debugging` and minor tweaks.

## 🧪 Testing Tips
- Add broad keywords like a show name and browse news or social media to verify masking.
- Switch actions (Blur/Blackout/Collapse) to validate styling.
- Use Options → "Highlight matches" for debugging.

## 📜 License
[MIT](LICENSE)

---
**Author:** Mobin Yousefi — GitHub: [mobinyousefi-cs](https://github.com/mobinyousefi-cs)

