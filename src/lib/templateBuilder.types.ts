/**
 * Certificate Template Builder - Core Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the certificate
 * template builder canvas infrastructure and data models.
 */

// ============================================================================
// Canvas Constants
// ============================================================================

/**
 * Canvas dimensions for A4 landscape certificate (1122px × 794px)
 * These dimensions are fixed and should not be changed.
 */
export const CANVAS_DIMENSIONS = {
  WIDTH: 1122,
  HEIGHT: 794,
} as const;

/**
 * Default positioning for new elements (canvas center)
 */
export const DEFAULT_ELEMENT_POSITION = {
  X: CANVAS_DIMENSIONS.WIDTH / 2,
  Y: CANVAS_DIMENSIONS.HEIGHT / 2,
} as const;

/**
 * Element size constraints
 */
export const ELEMENT_CONSTRAINTS = {
  TEXT: {
    MIN_FONT_SIZE: 8,
    MAX_FONT_SIZE: 120,
  },
  IMAGE: {
    MIN_WIDTH: 20,
    MAX_WIDTH: 800,
    MIN_HEIGHT: 20,
    MAX_HEIGHT: 600,
    DEFAULT_WIDTH: 100,
    DEFAULT_HEIGHT: 100,
  },
} as const;

/**
 * Grid and alignment settings
 */
export const GRID_SETTINGS = {
  SPACING: 50,
  ALIGNMENT_TOLERANCE: 5,
} as const;

// ============================================================================
// Element Types
// ============================================================================

/**
 * Base properties shared by all canvas elements
 */
export interface BaseElement {
  /** Unique identifier for the element */
  id: string;
  /** Element type discriminator */
  type: 'text' | 'image';
  /** X coordinate position on canvas (pixels from left) */
  x: number;
  /** Y coordinate position on canvas (pixels from top) */
  y: number;
  /** Z-index for layering (higher values appear on top) */
  zIndex: number;
}

/**
 * Text element with configurable typography and content
 */
export interface TextElement extends BaseElement {
  type: 'text';
  /** Text content (supports placeholders like {{participantName}}) */
  content: string;
  /** Font size in pixels (8-120) */
  fontSize: number;
  /** Text color in hex format (e.g., #000000) */
  color: string;
  /** Font family */
  fontFamily: 'sans-serif' | 'serif' | 'monospace';
  /** Text alignment */
  alignment: 'left' | 'center' | 'right';
}

/**
 * Image element for logos and graphics
 */
export interface ImageElement extends BaseElement {
  type: 'image';
  /** Image data in base64 format or URL */
  imageUrl: string;
  /** Image width in pixels (20-800) */
  width: number;
  /** Image height in pixels (20-600) */
  height: number;
}

/**
 * Union type for all canvas elements
 */
export type CanvasElement = TextElement | ImageElement;

// ============================================================================
// Template Configuration
// ============================================================================

/**
 * Certificate ID format configuration
 * Controls how the certificate ID is generated for each certificate in this template.
 * Example: prefix="CER_HACKATHON", padding=4 → CER_HACKATHON_0001, CER_HACKATHON_0002, ...
 */
export interface CertIdConfig {
  /** Prefix string (e.g. "CER_HACKATHON" or "CERT_WEBDEV") */
  prefix: string;
  /** Zero-padding width for the counter (e.g. 4 → 0001) */
  padding: number;
}

/**
 * Complete template configuration stored in database
 */
export interface TemplateConfig {
  /** Template name (3-100 characters) */
  name: string;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Background image in base64 format (optional) */
  backgroundImage?: string;
  /** Array of canvas elements (text and images) */
  elements: CanvasElement[];
  /** Certificate ID format configuration (optional, falls back to default CERT-... format) */
  certIdConfig?: CertIdConfig;
}

// ============================================================================
// Canvas State Management
// ============================================================================

/**
 * Canvas state for the template builder
 */
export interface CanvasState {
  /** Current template configuration */
  config: TemplateConfig;
  /** ID of currently selected element (null if none selected) */
  selectedElementId: string | null;
  /** Grid visibility toggle */
  showGrid: boolean;
  /** Snap to grid toggle */
  snapToGrid: boolean;
  /** Canvas scale factor for responsive display */
  scaleFactor: number;
}

/**
 * History state for undo/redo functionality
 */
export interface HistoryState {
  /** Array of past template configurations */
  past: TemplateConfig[];
  /** Current template configuration */
  present: TemplateConfig;
  /** Array of future template configurations (for redo) */
  future: TemplateConfig[];
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Drag state for element positioning
 */
export interface DragState {
  /** Whether an element is currently being dragged */
  isDragging: boolean;
  /** ID of the element being dragged */
  elementId: string | null;
  /** Initial mouse X position when drag started */
  startX: number;
  /** Initial mouse Y position when drag started */
  startY: number;
  /** Initial element X position when drag started */
  elementStartX: number;
  /** Initial element Y position when drag started */
  elementStartY: number;
}

/**
 * Alignment guide data
 */
export interface AlignmentGuide {
  /** Guide type */
  type: 'vertical' | 'horizontal';
  /** Position on canvas */
  position: number;
  /** Whether guide is currently visible */
  visible: boolean;
}

// ============================================================================
// Placeholder Types
// ============================================================================

/**
 * Supported placeholder types for dynamic content
 */
export type PlaceholderType = 
  | '{{participantName}}'
  | '{{eventName}}'
  | '{{date}}'
  | '{{certificateId}}';

/**
 * Sample data for template preview
 */
export interface SampleData {
  participantName: string;
  eventName: string;
  date: string;
  certificateId: string;
}

/**
 * Default sample data for preview
 */
export const DEFAULT_SAMPLE_DATA: SampleData = {
  participantName: 'John Doe',
  eventName: 'Sample Event 2024',
  date: '2024-05-20',
  certificateId: 'CERT-PREVIEW-001',
} as const;

// ============================================================================
// Factory Functions Types
// ============================================================================

/**
 * Options for creating a new text element
 */
export interface CreateTextElementOptions {
  content?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: TextElement['fontFamily'];
  alignment?: TextElement['alignment'];
  x?: number;
  y?: number;
}

/**
 * Options for creating a new image element
 */
export interface CreateImageElementOptions {
  imageUrl?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result for template configuration
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of validation error messages */
  errors: string[];
}

/**
 * Template name validation constraints
 */
export const TEMPLATE_NAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 100,
} as const;
