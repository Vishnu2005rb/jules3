/**
 * Certificate Template Builder - Utility Functions
 * 
 * This file contains utility functions for creating, validating, and
 * manipulating template builder data structures.
 */

import {
  CanvasElement,
  TextElement,
  ImageElement,
  TemplateConfig,
  CanvasState,
  HistoryState,
  CreateTextElementOptions,
  CreateImageElementOptions,
  ValidationResult,
  CANVAS_DIMENSIONS,
  DEFAULT_ELEMENT_POSITION,
  ELEMENT_CONSTRAINTS,
  TEMPLATE_NAME_CONSTRAINTS,
  DEFAULT_SAMPLE_DATA,
  PlaceholderType,
} from './templateBuilder.types';

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID for canvas elements
 */
export function generateElementId(): string {
  return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Element Factory Functions
// ============================================================================

/**
 * Create a new text element with default or custom properties
 */
export function createTextElement(
  options: CreateTextElementOptions = {}
): TextElement {
  return {
    id: generateElementId(),
    type: 'text',
    content: options.content ?? 'New Text',
    fontSize: options.fontSize ?? 24,
    color: options.color ?? '#000000',
    fontFamily: options.fontFamily ?? 'sans-serif',
    alignment: options.alignment ?? 'center',
    x: options.x ?? DEFAULT_ELEMENT_POSITION.X,
    y: options.y ?? DEFAULT_ELEMENT_POSITION.Y,
    zIndex: 0, // Will be set by the canvas state manager
  };
}

/**
 * Create a new image element with default or custom properties
 */
export function createImageElement(
  options: CreateImageElementOptions = {}
): ImageElement {
  return {
    id: generateElementId(),
    type: 'image',
    imageUrl: options.imageUrl ?? '',
    width: options.width ?? ELEMENT_CONSTRAINTS.IMAGE.DEFAULT_WIDTH,
    height: options.height ?? ELEMENT_CONSTRAINTS.IMAGE.DEFAULT_HEIGHT,
    x: options.x ?? DEFAULT_ELEMENT_POSITION.X,
    y: options.y ?? DEFAULT_ELEMENT_POSITION.Y,
    zIndex: 0, // Will be set by the canvas state manager
  };
}

// ============================================================================
// Template Configuration Functions
// ============================================================================

/**
 * Create an empty template configuration
 */
export function createEmptyTemplate(name: string = ''): TemplateConfig {
  return {
    name,
    width: CANVAS_DIMENSIONS.WIDTH,
    height: CANVAS_DIMENSIONS.HEIGHT,
    elements: [],
  };
}

/**
 * Create initial canvas state
 */
export function createInitialCanvasState(): CanvasState {
  return {
    config: createEmptyTemplate(),
    selectedElementId: null,
    showGrid: false,
    snapToGrid: false,
    scaleFactor: 1,
  };
}

/**
 * Create initial history state
 */
export function createInitialHistoryState(
  initialConfig: TemplateConfig
): HistoryState {
  return {
    past: [],
    present: initialConfig,
    future: [],
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate template name
 */
export function validateTemplateName(name: string): ValidationResult {
  const errors: string[] = [];
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.push('Template name is required');
  } else if (trimmedName.length < TEMPLATE_NAME_CONSTRAINTS.MIN_LENGTH) {
    errors.push(
      `Template name must be at least ${TEMPLATE_NAME_CONSTRAINTS.MIN_LENGTH} characters`
    );
  } else if (trimmedName.length > TEMPLATE_NAME_CONSTRAINTS.MAX_LENGTH) {
    errors.push(
      `Template name must not exceed ${TEMPLATE_NAME_CONSTRAINTS.MAX_LENGTH} characters`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate text element properties
 */
export function validateTextElement(element: TextElement): ValidationResult {
  const errors: string[] = [];

  if (
    element.fontSize < ELEMENT_CONSTRAINTS.TEXT.MIN_FONT_SIZE ||
    element.fontSize > ELEMENT_CONSTRAINTS.TEXT.MAX_FONT_SIZE
  ) {
    errors.push(
      `Font size must be between ${ELEMENT_CONSTRAINTS.TEXT.MIN_FONT_SIZE} and ${ELEMENT_CONSTRAINTS.TEXT.MAX_FONT_SIZE} pixels`
    );
  }

  if (!element.content) {
    errors.push('Text content cannot be empty');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate image element properties
 */
export function validateImageElement(element: ImageElement): ValidationResult {
  const errors: string[] = [];

  if (
    element.width < ELEMENT_CONSTRAINTS.IMAGE.MIN_WIDTH ||
    element.width > ELEMENT_CONSTRAINTS.IMAGE.MAX_WIDTH
  ) {
    errors.push(
      `Image width must be between ${ELEMENT_CONSTRAINTS.IMAGE.MIN_WIDTH} and ${ELEMENT_CONSTRAINTS.IMAGE.MAX_WIDTH} pixels`
    );
  }

  if (
    element.height < ELEMENT_CONSTRAINTS.IMAGE.MIN_HEIGHT ||
    element.height > ELEMENT_CONSTRAINTS.IMAGE.MAX_HEIGHT
  ) {
    errors.push(
      `Image height must be between ${ELEMENT_CONSTRAINTS.IMAGE.MIN_HEIGHT} and ${ELEMENT_CONSTRAINTS.IMAGE.MAX_HEIGHT} pixels`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete template configuration
 */
export function validateTemplateConfig(
  config: TemplateConfig
): ValidationResult {
  const errors: string[] = [];

  // Validate template name
  const nameValidation = validateTemplateName(config.name);
  if (!nameValidation.valid) {
    errors.push(...nameValidation.errors);
  }

  // Validate canvas dimensions
  if (config.width !== CANVAS_DIMENSIONS.WIDTH) {
    errors.push(`Canvas width must be ${CANVAS_DIMENSIONS.WIDTH}px`);
  }
  if (config.height !== CANVAS_DIMENSIONS.HEIGHT) {
    errors.push(`Canvas height must be ${CANVAS_DIMENSIONS.HEIGHT}px`);
  }

  // Validate each element
  config.elements.forEach((element, index) => {
    let elementValidation: ValidationResult;
    
    if (element.type === 'text') {
      elementValidation = validateTextElement(element);
    } else {
      elementValidation = validateImageElement(element);
    }

    if (!elementValidation.valid) {
      errors.push(
        `Element ${index + 1} (${element.type}): ${elementValidation.errors.join(', ')}`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Position Constraint Functions
// ============================================================================

/**
 * Constrain element position within canvas boundaries
 */
export function constrainPosition(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(x, CANVAS_DIMENSIONS.WIDTH)),
    y: Math.max(0, Math.min(y, CANVAS_DIMENSIONS.HEIGHT)),
  };
}

/**
 * Snap position to grid if enabled
 */
export function snapToGrid(
  x: number,
  y: number,
  gridSpacing: number
): { x: number; y: number } {
  return {
    x: Math.round(x / gridSpacing) * gridSpacing,
    y: Math.round(y / gridSpacing) * gridSpacing,
  };
}

// ============================================================================
// Element Manipulation Functions
// ============================================================================

/**
 * Update element position in template config
 */
export function updateElementPosition(
  config: TemplateConfig,
  elementId: string,
  x: number,
  y: number
): TemplateConfig {
  return {
    ...config,
    elements: config.elements.map((el) =>
      el.id === elementId ? { ...el, x, y } : el
    ),
  };
}

/**
 * Add element to template config
 */
export function addElement(
  config: TemplateConfig,
  element: CanvasElement
): TemplateConfig {
  // Set zIndex to be on top of all existing elements
  const maxZIndex = config.elements.reduce(
    (max, el) => Math.max(max, el.zIndex),
    -1
  );
  
  const elementWithZIndex = { ...element, zIndex: maxZIndex + 1 };

  return {
    ...config,
    elements: [...config.elements, elementWithZIndex],
  };
}

/**
 * Remove element from template config
 */
export function removeElement(
  config: TemplateConfig,
  elementId: string
): TemplateConfig {
  return {
    ...config,
    elements: config.elements.filter((el) => el.id !== elementId),
  };
}

/**
 * Update element properties in template config
 */
export function updateElement(
  config: TemplateConfig,
  elementId: string,
  updates: Partial<CanvasElement>
): TemplateConfig {
  return {
    ...config,
    elements: config.elements.map((el) =>
      el.id === elementId ? { ...el, ...updates } as CanvasElement : el
    ),
  };
}

/**
 * Bring element to front (highest zIndex)
 */
export function bringToFront(
  config: TemplateConfig,
  elementId: string
): TemplateConfig {
  const maxZIndex = config.elements.reduce(
    (max, el) => Math.max(max, el.zIndex),
    -1
  );

  return updateElement(config, elementId, { zIndex: maxZIndex + 1 });
}

/**
 * Send element to back (lowest zIndex)
 */
export function sendToBack(
  config: TemplateConfig,
  elementId: string
): TemplateConfig {
  const minZIndex = config.elements.reduce(
    (min, el) => Math.min(min, el.zIndex),
    Infinity
  );

  return updateElement(config, elementId, { zIndex: minZIndex - 1 });
}

/**
 * Duplicate an element with offset position
 */
export function duplicateElement(
  config: TemplateConfig,
  elementId: string,
  offsetX: number = 20,
  offsetY: number = 20
): TemplateConfig {
  const element = config.elements.find((el) => el.id === elementId);
  if (!element) return config;

  const duplicated: CanvasElement = {
    ...element,
    id: generateElementId(),
    x: element.x + offsetX,
    y: element.y + offsetY,
  };

  return addElement(config, duplicated);
}

// ============================================================================
// Placeholder Functions
// ============================================================================

/**
 * Replace placeholders in text with sample data
 */
export function replacePlaceholders(
  text: string,
  data: typeof DEFAULT_SAMPLE_DATA = DEFAULT_SAMPLE_DATA
): string {
  return text
    .replace(/\{\{participantName\}\}/g, data.participantName)
    .replace(/\{\{eventName\}\}/g, data.eventName)
    .replace(/\{\{date\}\}/g, data.date)
    .replace(/\{\{certificateId\}\}/g, data.certificateId);
}

/**
 * Check if text contains placeholders
 */
export function containsPlaceholders(text: string): boolean {
  const placeholderPattern = /\{\{(participantName|eventName|date|certificateId)\}\}/;
  return placeholderPattern.test(text);
}

/**
 * Get all placeholders used in a template
 */
export function getUsedPlaceholders(config: TemplateConfig): PlaceholderType[] {
  const placeholders = new Set<PlaceholderType>();
  
  config.elements.forEach((element) => {
    if (element.type === 'text') {
      const matches = element.content.match(/\{\{(participantName|eventName|date|certificateId)\}\}/g);
      if (matches) {
        matches.forEach((match) => placeholders.add(match as PlaceholderType));
      }
    }
  });

  return Array.from(placeholders);
}

// ============================================================================
// History Management Functions
// ============================================================================

/**
 * Add a new state to history (for undo/redo)
 */
export function addToHistory(
  history: HistoryState,
  newConfig: TemplateConfig,
  maxHistorySize: number = 50
): HistoryState {
  const newPast = [...history.past, history.present];
  
  // Limit history size
  if (newPast.length > maxHistorySize) {
    newPast.shift();
  }

  return {
    past: newPast,
    present: newConfig,
    future: [], // Clear future when new action is performed
  };
}

/**
 * Undo last action
 */
export function undo(history: HistoryState): HistoryState | null {
  if (history.past.length === 0) return null;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  };
}

/**
 * Redo last undone action
 */
export function redo(history: HistoryState): HistoryState | null {
  if (history.future.length === 0) return null;

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  };
}

// ============================================================================
// Image Conversion Functions
// ============================================================================

/**
 * Convert file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file format
 */
export function isValidImageFormat(file: File): boolean {
  const validFormats = ['image/png', 'image/jpeg', 'image/jpg'];
  return validFormats.includes(file.type);
}
