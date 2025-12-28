# JSX Wrapper & Refactor 🚀

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/BeatCodeStudio.react-jsx-wrapper?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=BeatCodeStudio.react-jsx-wrapper)
[![License](https://img.shields.io/github/license/crazidev/react-jsx-wrapper?style=for-the-badge)](https://github.com/crazidev/react-jsx-wrapper/blob/main/LICENSE)

**Smart JSX refactoring for the modern developer.** Effortlessly wrap, unwrap, and refactor JSX/TSX elements with intelligent auto-imports, configurable framework presets, and smart selection.

## ✨ Features

- 🧠 **Smart Detection** - Instantly expands selection to the full JSX element when your cursor is inside a tag.
- 📦 **Configurable Wrappers** - Define your own components with custom imports and default attributes.
- ⚡ **Framework Presets** - Optimized defaults for **React Native**, **React (Web)**, and **HTML**.
- 🛠️ **Intelligent Unwrapping** - Choose between keeping or removing children when unwrapping elements.
- 🎨 **Wrap with Custom Element** - A dynamic snippet that lets you type any element name with dual-cursor sync.
- 🔗 **Smart Imports** - Automatically adds or updates named and default imports from any module.
- 🧹 **Auto-Format** - Optionally triggers document formatting after every refactor for a clean codebase.

---

## 🚀 Quick Start

### 1. Wrap Elements
Place your cursor anywhere in a JSX tag (e.g., `<V|iew>`) or select a block of code, then press:
- **Mac:** `Cmd + .`
- **Windows/Linux:** `Ctrl + .`

Choose your preferred component from the Refactor menu.

### 2. Wrap with Custom Element
Select code and choose **"Wrap with element..."**. Type the name (e.g., `div`), and both opening and closing tags will sync as you type.

### 3. Smart Unwrap
Place your cursor in a tag and press the Quick Fix shortcut to:
- **"Remove element (keep children)"** - Safely unwrap the content.
- **"Remove element with children"** - Delete the entire element and its nested children.

---

## 🛠️ Configuration

Tailor the extension to your project's needs via `settings.json`.

### Global Options

| Setting | Default | Description |
| :--- | :--- | :--- |
| `jsxWrapper.framework` | `"react"` | `react`, `react-native`, or `html` |
| `jsxWrapper.smartDetection` | `true` | Auto-detect complete JSX element under cursor |
| `jsxWrapper.formatAfterWrap` | `true` | Format document after refactoring |
| `jsxWrapper.preferredWrapper`| `"View"` | The wrapper shown at the top of the list |

### Custom Wrappers

Add your own components to the refactor menu:

```json
{
  "jsxWrapper.wrappers": [
    {
      "name": "Button",
      "import": {
        "module": "@/components/ui/Button",
        "default": true
      },
      "attributes": "variant=\"primary\" size=\"lg\""
    },
    {
      "name": "MotiView",
      "import": {
        "module": "moti",
        "named": true
      },
      "attributes": "from={{ opacity: 0 }} animate={{ opacity: 1 }}"
    }
  ]
}
```

#### Wrapper Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | The component or tag name |
| `import` | `object` | `{ module: string, named: boolean, default: boolean }` |
| `attributes` | `string` | Default props to insert (e.g., `style={{}}`) |
| `selfClosing`| `boolean`| Forces self-closing behavior if applicable |
| `removalBehavior` | `string` | `remove-with-children`, `remove-without-children`, or `both` |

---

## 📦 Framework Defaults

When no custom `wrappers` are defined, the extension uses these optimized defaults:

- **React Native**: `View`, `Text`, `Pressable`, `TouchableOpacity`, `ScrollView` (all from `react-native`)
- **React (Web)**: `div`, `span`, `button`
- **HTML**: `div`, `span`, `button`, `center`, `b`, `hr`, `br`

---

## 🤝 Contributing

Found a bug or have a feature request? Open an issue on [GitHub](https://github.com/crazidev/react-jsx-wrapper/issues).

## 📜 License

MIT © [BeatCode Studio](https://github.com/crazidev)
