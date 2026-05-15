# Certificate Template Builder - Core Infrastructure

This directory contains the core TypeScript infrastructure for the Certificate Template Builder feature.

## Files Overview

### `templateBuilder.types.ts`
Core type definitions and interfaces for the template builder system.

**Key Exports:**
- `CANVAS_DIMENSIONS` - Fixed canvas size constants (1122px × 794px)
- `CanvasElement` - Union type for text and image elements
- `TextElement` - Interface for text elements with typography properties
- `ImageElement` - Interface for image/logo elements
- `TemplateConfig` - Complete template configuration structure
- `CanvasState` - Canvas state management interface
- `HistoryState` - Undo/redo history management interface

### `templateBuilder.utils.ts`
Utility functions for creating, validating, and manipulating templates.

**Key Functions:**

#### Element Creation
- `createTextElement(options?)` - Create a new text element
- `createImageElement(options?)` - Create a new image element
- `createEmptyTemplate(name)` - Create an empty template configuration

#### State Management
- `createInitialCanvasState()` - Initialize canvas state
- `createInitialHistoryState(config)` - Initialize history state

#### Validation
- `validateTemplateName(name)` - Validate template name
- `validateTextElement(element)` - Validate text element properties
- `validateImageElement(element)` - Validate image element properties
- `validateTemplateConfig(config)` - Validate complete template

#### Element Manipulation
- `addElement(config, element)` - Add element to template
- `removeElement(config, elementId)` - Remove element from template
- `updateElement(config, elementId, updates)` - Update element properties
- `updateElementPosition(config, elementId, x, y)` - Update element position
- `bringToFront(config, elementId)` - Move element to top layer
- `sendToBack(config, elementId)` - Move element to bottom layer
- `duplicateElement(config, elementId)` - Duplicate an element

#### Position Utilities
- `constrainPosition(x, y)` - Constrain position within canvas bounds
- `snapToGrid(x, y, gridSpacing)` - Snap position to grid

#### Placeholder Utilities
- `replacePlaceholders(text, data?)` - Replace placeholders with actual data
- `containsPlaceholders(text)` - Check if text contains placeholders
- `getUsedPlaceholders(config)` - Get all placeholders used in template

#### History Management
- `addToHistory(history, newConfig)` - Add state to history
- `undo(history)` - Undo last action
- `redo(history)` - Redo last undone action

#### Image Utilities
- `fileToBase64(file)` - Convert file to base64 string
- `isValidImageFormat(file)` - Validate image file format

### `templateBuilder.example.ts`
Example usage and common patterns for working with the template builder.

**Examples Include:**
1. Creating a basic certificate template
2. Working with canvas state
3. Updating element properties
4. Moving elements
5. Validating templates
6. Previewing certificates
7. Managing undo/redo history
8. Complete workflow demonstration

## Usage Examples

### Creating a New Template

```typescript
import { createEmptyTemplate, createTextElement, addElement } from './templateBuilder.utils';

// Create empty template
let config = createEmptyTemplate('My Certificate');

// Add a title
const title = createTextElement({
  content: 'Certificate of Achievement',
  fontSize: 48,
  color: '#000000',
  alignment: 'center',
  x: 561,
  y: 150,
});

config = addElement(config, title);
```

### Using Placeholders

```typescript
import { createTextElement, replacePlaceholders } from './templateBuilder.utils';

// Create element with placeholder
const nameElement = createTextElement({
  content: 'This certifies that {{participantName}} has completed {{eventName}}',
  fontSize: 24,
});

// Preview with sample data
const previewText = replacePlaceholders(nameElement.content);
// Result: "This certifies that John Doe has completed Sample Event 2024"
```

### Validating Before Save

```typescript
import { validateTemplateConfig } from './templateBuilder.utils';

const validation = validateTemplateConfig(config);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
} else {
  // Save to database
  await saveTemplate(config);
}
```

### Managing History (Undo/Redo)

```typescript
import { createInitialHistoryState, addToHistory, undo, redo } from './templateBuilder.utils';

let history = createInitialHistoryState(initialConfig);

// After each change
history = addToHistory(history, newConfig);

// Undo
const undoneHistory = undo(history);
if (undoneHistory) {
  history = undoneHistory;
  // Use history.present as current config
}

// Redo
const redoneHistory = redo(history);
if (redoneHistory) {
  history = redoneHistory;
}
```

## Constants Reference

### Canvas Dimensions
- Width: 1122px (A4 landscape)
- Height: 794px (A4 landscape)

### Element Constraints

**Text Elements:**
- Font size: 8-120 pixels
- Font families: sans-serif, serif, monospace
- Alignment: left, center, right

**Image Elements:**
- Width: 20-800 pixels
- Height: 20-600 pixels
- Default size: 100×100 pixels

### Template Name
- Minimum length: 3 characters
- Maximum length: 100 characters

### Grid Settings
- Grid spacing: 50 pixels
- Alignment tolerance: 5 pixels

## Supported Placeholders

The following placeholders are supported in text elements:

- `{{participantName}}` - Participant's name
- `{{eventName}}` - Event name
- `{{date}}` - Certificate date
- `{{certificateId}}` - Unique certificate identifier

## Type Safety

All functions are fully typed with TypeScript. The type system ensures:

- Elements cannot be positioned outside canvas bounds
- Font sizes and image dimensions are within valid ranges
- Template names meet length requirements
- Element types are properly discriminated (text vs image)

## Next Steps

This infrastructure provides the foundation for:

1. **UI Components** - React components for the visual editor
2. **Drag and Drop** - Interactive element positioning
3. **Property Editors** - Forms for editing element properties
4. **Canvas Rendering** - Visual representation of the template
5. **Database Integration** - Saving/loading templates
6. **PDF Generation** - Converting templates to certificates

## Requirements Coverage

This implementation satisfies the following requirements from the specification:

- **Requirement 1.1**: Canvas dimensions (1122px × 794px)
- **Requirement 1.2**: Template configuration data structure
- **Requirement 1.3**: Text element types and properties
- **Requirement 1.4**: Image element types and properties

See `requirements.md` and `design.md` in the spec directory for complete details.
