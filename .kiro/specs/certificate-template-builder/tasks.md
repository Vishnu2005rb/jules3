# Implementation Plan: Certificate Template Builder

## Overview

This implementation plan breaks down the Certificate Template Builder feature into discrete coding tasks. The builder is a canvas-based visual editor that enables administrators to create customizable certificate templates with drag-and-drop functionality. The implementation follows the existing Form Template Builder patterns and uses TypeScript/React with Next.js.

## Tasks

- [x] 1. Set up core canvas infrastructure and data models
  - Create TypeScript interfaces for template configuration, elements, and canvas state
  - Define types for TextElement, ImageElement, and TemplateConfig
  - Set up canvas dimensions constants (1122px × 794px)
  - Create initial state management structure for canvas and elements
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement canvas component with background image support
  - [x] 2.1 Create Canvas component with fixed dimensions and white background
    - Implement canvas container with A4 landscape dimensions
    - Add dimension indicators display
    - Implement responsive scaling logic for different screen sizes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  
  - [x] 2.2 Implement background image upload functionality
    - Create file upload button and dialog
    - Add file format validation (PNG, JPG only)
    - Implement base64 conversion for uploaded images
    - Display background image on canvas with proper scaling
    - Add error handling for invalid file formats
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 3. Implement text element creation and management
  - [x] 3.1 Create DraggableTextElement component
    - Implement text element rendering with default properties
    - Set default position at canvas center (561px, 397px)
    - Assign unique identifiers to each element
    - Display placeholder content "New Text"
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 3.2 Implement text property editor panel
    - Create property editor UI for text elements
    - Add controls for content, fontSize, color, fontFamily, alignment
    - Implement real-time property updates
    - Add validation for fontSize (8-120px range)
    - Support font families: sans-serif, serif, monospace
    - Support alignment options: left, center, right
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 3.3 Add placeholder support for text elements
    - Implement placeholder detection and display
    - Support {{participantName}}, {{eventName}}, {{date}}, {{certificateId}}
    - Store placeholder text exactly as entered
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 4. Implement image element creation and management
  - [x] 4.1 Create DraggableImageElement component
    - Implement image element rendering with default properties
    - Set default position at canvas center (561px, 397px)
    - Set default dimensions (100px × 100px)
    - Display placeholder icon until image uploaded
    - Assign unique identifiers to each element
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [x] 4.2 Implement image property editor panel
    - Create property editor UI for image elements
    - Add controls for width, height, imageUrl
    - Implement image upload for logo elements
    - Add validation for dimensions (width: 20-800px, height: 20-600px)
    - Implement real-time property updates
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 5. Implement drag-and-drop functionality
  - [x] 5.1 Add element selection and focus management
    - Implement click handler for element selection
    - Display selection indicator (border/outline) around selected element
    - Show property panel for selected element
    - Implement canvas background click to deselect
    - Ensure only one element selected at a time
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 5.2 Implement drag-and-drop for elements
    - Add mouse event handlers for drag operations
    - Update element position in real-time during drag
    - Constrain positions within canvas boundaries (0 ≤ x ≤ 1122, 0 ≤ y ≤ 794)
    - Update TemplateConfig on drag end
    - Add visual feedback during drag (cursor change/highlight)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 6. Checkpoint - Ensure basic canvas functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement element layering controls
  - Add "Bring to Front" and "Send to Back" buttons
  - Implement z-index management by reordering elements array
  - Update visual stacking order immediately
  - Display layering controls when element is selected
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8. Implement element deletion functionality
  - Add delete button for selected elements
  - Implement confirmation dialog before deletion
  - Remove element from canvas and TemplateConfig
  - Deselect all elements after deletion
  - Handle cancellation of deletion
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 9. Implement element duplication functionality
  - Add "Duplicate" button for selected elements
  - Create copy of element with new unique identifier
  - Offset duplicated element position by 20px horizontally and vertically
  - Copy all properties from original element
  - Select duplicated element after creation
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [x] 10. Implement grid and alignment guides
  - [x] 10.1 Create grid overlay component
    - Render grid with 50px spacing
    - Add toggle control for grid visibility
    - Implement snap-to-grid functionality with toggle
    - Snap to nearest grid intersection when enabled
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
  
  - [x] 10.2 Implement alignment guides
    - Detect element alignment with other elements (5px tolerance)
    - Display vertical and horizontal alignment lines
    - Show guides during drag operations
    - _Requirements: 17.5, 17.6_

- [x] 11. Implement undo/redo functionality
  - Create history state management for TemplateConfig
  - Implement undo operation to restore previous state
  - Implement redo operation to restore next state
  - Support up to 50 undo operations
  - Clear redo history when new change is made
  - Disable undo/redo buttons when no states available
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

- [x] 12. Implement keyboard shortcuts
  - Add Delete key handler for element deletion
  - Add Ctrl+Z / Cmd+Z for undo
  - Add Ctrl+Y / Cmd+Shift+Z for redo
  - Add Ctrl+S / Cmd+S for save
  - Prevent default browser behavior for shortcuts
  - Create keyboard shortcuts help panel (triggered by "?")
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [x] 13. Checkpoint - Ensure all editor features work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement template save functionality
  - [x] 14.1 Create template name validation
    - Require template name before saving
    - Validate name length (3-100 characters)
    - Trim whitespace from template names
    - Display appropriate error messages
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [x] 14.2 Implement template persistence
    - Serialize canvas configuration to JSON format
    - Include name, width, height, backgroundImage, elements in TemplateConfig
    - Send POST request for new templates to /api/admin/templates
    - Send PUT request for existing templates with template ID
    - Display success/error messages
    - Store TemplateConfig in CertificateTemplate.config field
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [x] 15. Implement template loading functionality
  - Fetch template data from database when template selected
  - Parse TemplateConfig JSON from database
  - Set canvas dimensions from TemplateConfig
  - Display background image if exists
  - Create and position all elements from TemplateConfig
  - Restore all element properties
  - Handle invalid/corrupted TemplateConfig with error message
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [x] 16. Implement preview functionality with sample data
  - Create preview modal component
  - Replace placeholders with sample data on preview
  - Use sample data: participantName "John Doe", eventName "Sample Event 2024", date "2024-05-20", certificateId "CERT-PREVIEW-001"
  - Render preview at actual certificate dimensions
  - Restore placeholder text when preview is closed
  - Ensure TemplateConfig is not modified during preview
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 17. Integrate certificate builder into admin templates page
  - Add "Certificate Builder" tab/button to existing templates page
  - Create modal or route for certificate template builder
  - Wire up template list to load certificate templates
  - Connect save functionality to template list refresh
  - Ensure consistent UI/UX with form template builder
  - _Requirements: 12.4, 12.5, 13.1_

- [x] 18. Update API routes for certificate template operations
  - Extend /api/admin/templates to handle certificate template CRUD
  - Add GET endpoint to fetch certificate templates
  - Add POST endpoint to create new certificate templates
  - Add PUT endpoint to update existing certificate templates
  - Add DELETE endpoint to remove certificate templates
  - Validate TemplateConfig JSON structure
  - _Requirements: 12.4, 12.5, 13.1_

- [x] 19. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks build incrementally on previous implementations
- The builder follows the same architectural patterns as the existing Form Template Builder
- Template configurations are stored as JSON in the CertificateTemplate.config field
- Canvas dimensions are fixed at 1122px × 794px (A4 landscape)
- Element positions are stored in absolute canvas coordinates
- Placeholders ({{participantName}}, etc.) are stored exactly as entered and replaced during certificate generation
- The implementation uses TypeScript/React with Next.js framework
- Responsive scaling maintains aspect ratio and converts scaled coordinates to absolute coordinates for storage
