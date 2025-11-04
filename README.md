# JSX Wrapper - Configurable Refactoring

Wrap JSX/TSX selections with custom components via `Ctrl + .` (Quick Fix menu).

## Features

- ✅ **Fully configurable** wrappers with custom imports
- ✅ **Smart detection** - Works even when cursor is inside JSX tag name
- ✅ **Wrap with custom element** - Interactive snippet with dual cursors
- ✅ **Remove wrapper** - Unwrap elements intelligently
- ✅ **Auto-format** - Optional formatting after wrapping
- ✅ **Auto-imports** components from any module
- ✅ **Default attributes** (style, className, callbacks, etc.)
- ✅ **Works with React Native, React, or any JSX**
- ✅ Preserves indentation (coming soon)
- ✅ Updates existing imports intelligently

## Usage

### Method 1: Cursor Inside Element (Smart Detection)

1. **Place cursor anywhere in JSX element** (e.g., between `<V|iew>`)
2. **Press `Ctrl + .`** (or `Cmd + .` on Mac)
3. **Choose "Wrap with..."** from the refactor menu

### Method 2: Select Text

1. **Select JSX code** (partial or complete element)
2. **Press `Ctrl + .`**
3. **Choose "Wrap with..."**

### Method 3: Wrap with Custom Element

1. **Place cursor or select element**
2. **Press `Ctrl + .`**
3. **Choose "Wrap with element..."**
4. **Type element name** - cursor syncs in opening and closing tags!

### Method 4: Remove Wrapper (Unwrap)

1. **Place cursor in element** (e.g., `<View>`)
2. **Press `Ctrl + .`**
3. **Choose:**
   - **"Remove element (keep children)"** - Unwrap safely
   - **"Remove element with children"** - Delete entire element

## Default Wrappers

The extension provides framework-specific defaults based on your configuration:

### React Native (`"jsxWrapper.framework": "react-native"`)

- `View` - from react-native
- `Text` - from react-native (shows both unwrap options)
- `Pressable` - from react-native (with onPress)
- `TouchableOpacity` - from react-native (with onPress)
- `ScrollView` - from react-native

### React (`"jsxWrapper.framework": "react"`) - Default

- `div` - with className
- `span` - with className
- `section` - with className
- `button` - with onClick

### HTML (`"jsxWrapper.framework": "html"`)

- `div`, `span`, `section`, `article`, `main`, `header`, `footer` - all with className

**Note:** These defaults are only used if you haven't defined custom wrappers.

## Configuration

### Custom Wrappers

Add custom wrappers in your VS Code `settings.json`:

```json
{
  "jsxWrapper.wrappers": [
    {
      "name": "View",
      "import": {
        "module": "react-native",
        "named": true
      },
      "attributes": "style={{}}"
    },
    {
      "name": "Button",
      "import": {
        "module": "@/components/Button",
        "default": true
      },
      "attributes": "onPress={() => {}} variant=\"primary\""
    },
    {
      "name": "Container",
      "import": {
        "module": "@/components/Container",
        "named": true
      }
    },
    {
      "name": "div",
      "attributes": "className=\"\""
    },
    {
      "name": "section",
      "attributes": "className=\"container\""
    }
  ],
  "jsxWrapper.preferredWrapper": "View"
}
```

### Configuration Options

#### Global Settings

| Setting                       | Type    | Default  | Description                                                |
| ----------------------------- | ------- | -------- | ---------------------------------------------------------- |
| `jsxWrapper.smartDetection`   | boolean | `true`   | Auto-detect complete JSX element when cursor is inside tag |
| `jsxWrapper.formatAfterWrap`  | boolean | `true`   | Automatically format document after wrapping               |
| `jsxWrapper.preferredWrapper` | string  | `"View"` | Default wrapper shown first in menu                        |

#### Wrapper Object

| Property              | Type    | Required | Description                                            |
| --------------------- | ------- | -------- | ------------------------------------------------------ |
| `name`                | string  | ✅       | Component or element name                              |
| `import`              | object  | ❌       | Import configuration (omit for HTML elements)          |
| `attributes`          | string  | ❌       | Default attributes to add                              |
| `selfClosing`         | boolean | ❌       | Whether component is self-closing                      |
| `requiresTextWrapper` | boolean | ❌       | If true, shows both unwrap options (for Text elements) |

#### Import Object

| Property  | Type    | Description                                               |
| --------- | ------- | --------------------------------------------------------- |
| `module`  | string  | Module path (e.g., `react-native`, `@/components/Button`) |
| `named`   | boolean | Use named import: `import { Button } from '...'`          |
| `default` | boolean | Use default import: `import Button from '...'`            |

### Examples

#### React Native Setup

```json
{
  "jsxWrapper.framework": "react-native",
  "jsxWrapper.preferredWrapper": "View",
  "jsxWrapper.wrappers": [
    // Add custom wrappers on top of framework defaults
    {
      "name": "AppText",
      "import": { "module": "@/components/AppText", "default": true },
      "requiresTextWrapper": true
    }
  ]
}
```

**Note:** When you define custom wrappers, framework defaults are **not** included. Define all wrappers you need.

```json
{
  "jsxWrapper.framework": "react-native",
  "jsxWrapper.wrappers": [
    {
      "name": "View",
      "import": { "module": "react-native", "named": true },
      "attributes": "style={{}}"
    },
    {
      "name": "Pressable",
      "import": { "module": "react-native", "named": true },
      "attributes": "onPress={() => {}}"
    },
    {
      "name": "Text",
      "import": { "module": "react-native", "named": true },
      "requiresTextWrapper": true
    },
    {
      "name": "Animated.View",
      "import": { "module": "react-native", "named": true },
      "attributes": "style={{}}"
    }
  ]
}
```

#### React Web Setup

```json
{
  "jsxWrapper.framework": "react",
  "jsxWrapper.wrappers": [
    {
      "name": "div",
      "attributes": "className=\"\""
    },
    {
      "name": "Card",
      "import": { "module": "@/components/ui/card", "named": true }
    },
    {
      "name": "motion.div",
      "import": { "module": "framer-motion", "named": true }
    }
  ]
}
```

#### Custom Text Components

```json
{
  "jsxWrapper.framework": "react-native",
  "jsxWrapper.wrappers": [
    // Include framework defaults manually if needed
    {
      "name": "View",
      "import": { "module": "react-native", "named": true }
    },
    {
      "name": "Text",
      "import": { "module": "react-native", "named": true },
      "requiresTextWrapper": true
    },
    // Add custom text wrappers
    {
      "name": "AppText",
      "import": { "module": "@/components/AppText", "default": true },
      "requiresTextWrapper": true
    },
    {
      "name": "Heading",
      "import": { "module": "@/components/Typography", "named": true },
      "requiresTextWrapper": true
    }
  ]
}
```

#### With Complex Attributes

```json
{
  "jsxWrapper.wrappers": [
    {
      "name": "TouchableOpacity",
      "import": { "module": "react-native", "named": true },
      "attributes": "onPress={() => {}} activeOpacity={0.7}"
    },
    {
      "name": "FlatList",
      "import": { "module": "react-native", "named": true },
      "attributes": "data={[]} renderItem={({ item }) => <View />} keyExtractor={(item) => item.id}"
    }
  ]
}
```

## Preferred Wrapper

Set which wrapper shows first (marked as "preferred"):

```json
{
  "jsxWrapper.preferredWrapper": "View"
}
```

## Tips

- **Smart Detection ON** (default): Just place cursor in tag name and press `Ctrl + .`
- **Smart Detection OFF**: Must select complete element
- **Format After Wrap ON** (default): Code auto-formats after wrapping
- **Format After Wrap OFF**: Manual formatting required
- **Framework setting** only applies when `wrappers` array is empty
- **Custom wrappers override framework** - define all wrappers you need
- **Omit `import`** for HTML elements (div, span, etc.)
- **Use `named: true`** for `import { Component } from '...'`
- **Use `default: true`** for `import Component from '...'`
- **Set `requiresTextWrapper: true`** for Text components to show both unwrap options
- **Attributes** are inserted as-is, so include proper spacing
- Extension works in both `.jsx`/`.tsx` and `.js`/`.ts` files

## Examples in Action

### Smart Detection Example:

```jsx
// Cursor position: <V|iew>
<View>
  <Text>Hello</Text>
</View>

// Press Ctrl+. → Wrap with Pressable
<Pressable onPress={() => {}}>
  <View>
    <Text>Hello</Text>
  </View>
</Pressable>
```

### Wrap with Custom Element:

```jsx
// Before: Cursor in <Text>
<Text>Hello World</Text>

// Press Ctrl+. → "Wrap with element..."
// Type "div" (cursor syncs in both tags!)
<div>
  <Text>Hello World</Text>
</div>
```

### Unwrap Examples:

#### Safe Unwrap (View, Pressable, etc.):

```jsx
// Before: Cursor in <View>
<View style={{}}>
  <Text>Content</Text>
</View>

// After: "Remove element (keep children)"
<Text>Content</Text>
```

#### Unsafe Unwrap (Text elements):

```jsx
// Before: Cursor in <Text>
<Text>Hello World</Text>

// Option 1: "Remove element (keep children)" → ONLY TEXT REMAINS
Hello World  // ⚠️ Will break in React Native!

// Option 2: "Remove element with children" → EVERYTHING DELETED
(empty)  // ✅ Safe choice
```

### Before:

```jsx
<Text>Hello World</Text>
```

### After (Wrap with View):

```jsx
<View>
  <Text>Hello World</Text>
</View>
```

### With Attributes:

```jsx
<View style={{}}>
  <Text>Hello World</Text>
</View>
```

## License

MIT
