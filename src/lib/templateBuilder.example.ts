/**
 * Example usage of the Certificate Template Builder infrastructure
 * 
 * This file demonstrates how to use the types and utilities to create
 * and manipulate certificate templates.
 */

import {
  createEmptyTemplate,
  createTextElement,
  createImageElement,
  addElement,
  updateElement,
  updateElementPosition,
  validateTemplateConfig,
  replacePlaceholders,
  createInitialCanvasState,
  createInitialHistoryState,
  addToHistory,
} from './templateBuilder.utils';
import { TemplateConfig, CanvasState } from './templateBuilder.types';

// ============================================================================
// Example 1: Creating a basic certificate template
// ============================================================================

export function createBasicCertificateTemplate(): TemplateConfig {
  // Start with an empty template
  let config = createEmptyTemplate('Basic Certificate');

  // Add a title text element
  const titleElement = createTextElement({
    content: 'Certificate of Achievement',
    fontSize: 48,
    color: '#1a1a1a',
    fontFamily: 'serif',
    alignment: 'center',
    x: 561, // Center of canvas
    y: 150,
  });
  config = addElement(config, titleElement);

  // Add participant name with placeholder
  const nameElement = createTextElement({
    content: '{{participantName}}',
    fontSize: 36,
    color: '#4f46e5',
    fontFamily: 'serif',
    alignment: 'center',
    x: 561,
    y: 300,
  });
  config = addElement(config, nameElement);

  // Add event description
  const descriptionElement = createTextElement({
    content: 'has successfully completed',
    fontSize: 20,
    color: '#666666',
    fontFamily: 'sans-serif',
    alignment: 'center',
    x: 561,
    y: 370,
  });
  config = addElement(config, descriptionElement);

  // Add event name with placeholder
  const eventElement = createTextElement({
    content: '{{eventName}}',
    fontSize: 28,
    color: '#1a1a1a',
    fontFamily: 'serif',
    alignment: 'center',
    x: 561,
    y: 440,
  });
  config = addElement(config, eventElement);

  // Add date with placeholder
  const dateElement = createTextElement({
    content: 'Date: {{date}}',
    fontSize: 16,
    color: '#666666',
    fontFamily: 'sans-serif',
    alignment: 'center',
    x: 561,
    y: 650,
  });
  config = addElement(config, dateElement);

  // Add certificate ID with placeholder
  const certIdElement = createTextElement({
    content: 'Certificate ID: {{certificateId}}',
    fontSize: 12,
    color: '#999999',
    fontFamily: 'monospace',
    alignment: 'center',
    x: 561,
    y: 750,
  });
  config = addElement(config, certIdElement);

  // Add a logo placeholder
  const logoElement = createImageElement({
    imageUrl: '', // Will be set when image is uploaded
    width: 80,
    height: 80,
    x: 100,
    y: 100,
  });
  config = addElement(config, logoElement);

  return config;
}

// ============================================================================
// Example 2: Working with canvas state
// ============================================================================

export function initializeCertificateBuilder(): CanvasState {
  // Create initial canvas state
  const state = createInitialCanvasState();

  // Set up a basic template
  state.config = createBasicCertificateTemplate();

  // Enable grid for easier alignment
  state.showGrid = true;
  state.snapToGrid = true;

  return state;
}

// ============================================================================
// Example 3: Updating element properties
// ============================================================================

export function updateCertificateTitle(
  config: TemplateConfig,
  newTitle: string
): TemplateConfig {
  // Find the title element (first text element)
  const titleElement = config.elements.find(
    (el) => el.type === 'text' && el.fontSize === 48
  );

  if (!titleElement) {
    return config;
  }

  // Update the title content
  return updateElement(config, titleElement.id, {
    content: newTitle,
  });
}

// ============================================================================
// Example 4: Moving elements
// ============================================================================

export function repositionElement(
  config: TemplateConfig,
  elementId: string,
  newX: number,
  newY: number
): TemplateConfig {
  return updateElementPosition(config, elementId, newX, newY);
}

// ============================================================================
// Example 5: Validating a template before saving
// ============================================================================

export function validateAndSaveTemplate(
  config: TemplateConfig
): { success: boolean; errors: string[] } {
  const validation = validateTemplateConfig(config);

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  // In a real application, you would save to database here
  console.log('Template is valid and ready to save:', config);

  return {
    success: true,
    errors: [],
  };
}

// ============================================================================
// Example 6: Previewing a certificate with sample data
// ============================================================================

export function previewCertificate(config: TemplateConfig): TemplateConfig {
  // Create a copy of the config for preview
  const previewConfig = { ...config };

  // Replace placeholders in all text elements
  previewConfig.elements = config.elements.map((element) => {
    if (element.type === 'text') {
      return {
        ...element,
        content: replacePlaceholders(element.content),
      };
    }
    return element;
  });

  return previewConfig;
}

// ============================================================================
// Example 7: Managing undo/redo history
// ============================================================================

export function demonstrateHistoryManagement() {
  // Create initial template
  const initialConfig = createEmptyTemplate('History Demo');
  let history = createInitialHistoryState(initialConfig);

  // Add a text element (action 1)
  const textElement = createTextElement({ content: 'Hello' });
  const config1 = addElement(initialConfig, textElement);
  history = addToHistory(history, config1);

  // Update the text element (action 2)
  const config2 = updateElement(config1, textElement.id, {
    content: 'Hello World',
  });
  history = addToHistory(history, config2);

  // Now we can undo/redo
  console.log('Current state:', history.present);
  console.log('Can undo:', history.past.length > 0);
  console.log('Can redo:', history.future.length > 0);

  return history;
}

// ============================================================================
// Example 8: Complete workflow
// ============================================================================

export function completeTemplateWorkflow() {
  // 1. Initialize the builder
  const state = initializeCertificateBuilder();

  // 2. Validate the template
  const validation = validateAndSaveTemplate(state.config);

  if (!validation.success) {
    console.error('Template validation failed:', validation.errors);
    return null;
  }

  // 3. Preview the certificate
  const preview = previewCertificate(state.config);

  console.log('Template created successfully!');
  console.log('Elements:', state.config.elements.length);
  console.log('Preview:', preview);

  return {
    config: state.config,
    preview,
  };
}
