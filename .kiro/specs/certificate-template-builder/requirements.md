# Requirements Document

## Introduction

The Certificate Template Builder is a canvas-based visual editor that enables administrators to create customizable certificate templates with drag-and-drop functionality. The system allows uploading background images, positioning text and logo elements, configuring visual properties, and saving template configurations to the database for certificate generation.

## Glossary

- **Template_Builder**: The visual editor interface for creating certificate templates
- **Canvas**: The certificate design area with fixed dimensions (A4 landscape: 1122px × 794px)
- **Element**: A draggable component on the canvas (text or image)
- **Text_Element**: A draggable text component with configurable content, position, size, font, color, and alignment
- **Image_Element**: A draggable logo or image component with configurable position and size
- **Background_Image**: The base certificate image uploaded by the administrator
- **Template_Config**: The JSON representation of the certificate template stored in the database
- **CertificateTemplate_Model**: The database model storing template configurations
- **Admin_Portal**: The administrative interface at /admin/templates
- **Sample_Data**: Placeholder participant information used for template preview

## Requirements

### Requirement 1: Canvas Initialization

**User Story:** As an administrator, I want to create a new certificate template with a defined canvas size, so that I can design certificates with consistent dimensions.

#### Acceptance Criteria

1. WHEN the administrator opens the certificate template builder, THE Template_Builder SHALL display a canvas with dimensions 1122px width and 794px height
2. THE Template_Builder SHALL render the canvas with a white background by default
3. THE Template_Builder SHALL display canvas dimension indicators to the administrator
4. THE Template_Builder SHALL maintain the canvas aspect ratio when displayed on different screen sizes

### Requirement 2: Background Image Upload

**User Story:** As an administrator, I want to upload a background image for the certificate, so that I can use custom certificate designs.

#### Acceptance Criteria

1. WHEN the administrator clicks the background upload button, THE Template_Builder SHALL open a file selection dialog
2. THE Template_Builder SHALL accept PNG and JPG image formats only
3. WHEN a valid image file is selected, THE Template_Builder SHALL convert the image to base64 format
4. WHEN the image is converted, THE Template_Builder SHALL display the image as the canvas background
5. THE Template_Builder SHALL scale the background image to fit the canvas dimensions while maintaining aspect ratio
6. IF an invalid file format is selected, THEN THE Template_Builder SHALL display an error message "Only PNG and JPG formats are supported"
7. THE Template_Builder SHALL store the background image data in the Template_Config

### Requirement 3: Text Element Creation

**User Story:** As an administrator, I want to add text elements to the certificate, so that I can display participant names, event details, and custom messages.

#### Acceptance Criteria

1. WHEN the administrator clicks the "Add Text" button, THE Template_Builder SHALL create a new Text_Element on the canvas
2. THE Template_Builder SHALL position new Text_Elements at the canvas center (x: 561px, y: 397px)
3. THE Template_Builder SHALL assign a unique identifier to each Text_Element
4. THE Template_Builder SHALL set default properties for new Text_Elements: fontSize 24px, color black, font sans-serif, alignment center
5. THE Template_Builder SHALL display the Text_Element with placeholder content "New Text"
6. THE Template_Builder SHALL add the Text_Element to the Template_Config elements array

### Requirement 4: Image Element Creation

**User Story:** As an administrator, I want to add logo images to the certificate, so that I can include organizational branding.

#### Acceptance Criteria

1. WHEN the administrator clicks the "Add Logo" button, THE Template_Builder SHALL create a new Image_Element on the canvas
2. THE Template_Builder SHALL position new Image_Elements at the canvas center (x: 561px, y: 397px)
3. THE Template_Builder SHALL assign a unique identifier to each Image_Element
4. THE Template_Builder SHALL set default dimensions for new Image_Elements: width 100px, height 100px
5. THE Template_Builder SHALL display a placeholder icon until an image is uploaded
6. WHEN the administrator uploads an image for the Image_Element, THE Template_Builder SHALL convert the image to base64 format
7. THE Template_Builder SHALL accept PNG and JPG formats for Image_Elements
8. THE Template_Builder SHALL add the Image_Element to the Template_Config elements array

### Requirement 5: Element Drag and Drop

**User Story:** As an administrator, I want to drag elements to different positions on the canvas, so that I can arrange the certificate layout.

#### Acceptance Criteria

1. WHEN the administrator clicks on an Element, THE Template_Builder SHALL mark the Element as selected
2. WHEN the administrator drags a selected Element, THE Template_Builder SHALL update the Element position in real-time
3. THE Template_Builder SHALL constrain Element positions within canvas boundaries (0 ≤ x ≤ 1122, 0 ≤ y ≤ 794)
4. WHEN the administrator releases the Element, THE Template_Builder SHALL update the Element coordinates in the Template_Config
5. THE Template_Builder SHALL display visual feedback during drag operations (cursor change or element highlight)
6. THE Template_Builder SHALL prevent Elements from being dragged outside the canvas area

### Requirement 6: Element Selection and Focus

**User Story:** As an administrator, I want to select elements to edit their properties, so that I can customize individual components.

#### Acceptance Criteria

1. WHEN the administrator clicks on an Element, THE Template_Builder SHALL display a selection indicator around the Element
2. THE Template_Builder SHALL display the Element properties panel for the selected Element
3. WHEN the administrator clicks on the canvas background, THE Template_Builder SHALL deselect all Elements
4. THE Template_Builder SHALL allow only one Element to be selected at a time
5. THE Template_Builder SHALL highlight the selected Element with a visible border or outline

### Requirement 7: Text Element Property Configuration

**User Story:** As an administrator, I want to configure text properties, so that I can style text elements appropriately.

#### Acceptance Criteria

1. WHEN a Text_Element is selected, THE Template_Builder SHALL display editable properties: content, fontSize, color, fontFamily, alignment
2. WHEN the administrator changes the content property, THE Template_Builder SHALL update the Text_Element display immediately
3. WHEN the administrator changes the fontSize property, THE Template_Builder SHALL update the Text_Element size immediately
4. WHEN the administrator changes the color property, THE Template_Builder SHALL update the Text_Element color immediately
5. THE Template_Builder SHALL support font families: sans-serif, serif, monospace
6. THE Template_Builder SHALL support text alignment options: left, center, right
7. THE Template_Builder SHALL accept fontSize values between 8 and 120 pixels
8. WHEN properties are changed, THE Template_Builder SHALL update the Template_Config immediately

### Requirement 8: Text Element Placeholder Support

**User Story:** As an administrator, I want to use placeholders in text elements, so that dynamic participant data can be inserted during certificate generation.

#### Acceptance Criteria

1. THE Template_Builder SHALL support the placeholder "{{participantName}}" for participant names
2. THE Template_Builder SHALL support the placeholder "{{eventName}}" for event names
3. THE Template_Builder SHALL support the placeholder "{{date}}" for certificate dates
4. THE Template_Builder SHALL support the placeholder "{{certificateId}}" for certificate identifiers
5. WHEN placeholders are used in Text_Element content, THE Template_Builder SHALL display the placeholder text in the editor
6. THE Template_Builder SHALL store placeholder text exactly as entered in the Template_Config

### Requirement 9: Image Element Property Configuration

**User Story:** As an administrator, I want to resize logo images, so that they fit appropriately in the certificate design.

#### Acceptance Criteria

1. WHEN an Image_Element is selected, THE Template_Builder SHALL display editable properties: width, height, imageUrl
2. WHEN the administrator changes the width property, THE Template_Builder SHALL update the Image_Element width immediately
3. WHEN the administrator changes the height property, THE Template_Builder SHALL update the Image_Element height immediately
4. THE Template_Builder SHALL accept width values between 20 and 800 pixels
5. THE Template_Builder SHALL accept height values between 20 and 600 pixels
6. WHEN properties are changed, THE Template_Builder SHALL update the Template_Config immediately

### Requirement 10: Element Layering

**User Story:** As an administrator, I want to control the stacking order of elements, so that I can manage overlapping components.

#### Acceptance Criteria

1. THE Template_Builder SHALL render Elements in the order they appear in the Template_Config elements array
2. WHEN the administrator clicks "Bring to Front", THE Template_Builder SHALL move the selected Element to the end of the elements array
3. WHEN the administrator clicks "Send to Back", THE Template_Builder SHALL move the selected Element to the beginning of the elements array
4. THE Template_Builder SHALL display layering controls when an Element is selected
5. THE Template_Builder SHALL update the visual stacking order immediately when layering changes occur

### Requirement 11: Element Deletion

**User Story:** As an administrator, I want to remove elements from the canvas, so that I can correct mistakes and refine the design.

#### Acceptance Criteria

1. WHEN the administrator clicks the delete button for a selected Element, THE Template_Builder SHALL remove the Element from the canvas
2. THE Template_Builder SHALL remove the deleted Element from the Template_Config elements array
3. WHEN an Element is deleted, THE Template_Builder SHALL deselect all Elements
4. THE Template_Builder SHALL display a confirmation dialog before deleting an Element
5. IF the administrator cancels the deletion, THEN THE Template_Builder SHALL retain the Element

### Requirement 12: Template Configuration Persistence

**User Story:** As an administrator, I want to save the certificate template, so that it can be used for certificate generation.

#### Acceptance Criteria

1. WHEN the administrator clicks the "Save Template" button, THE Template_Builder SHALL validate that a template name is provided
2. THE Template_Builder SHALL serialize the canvas configuration to JSON format
3. THE Template_Builder SHALL include in the Template_Config: name, width, height, backgroundImage, elements array
4. WHEN saving a new template, THE Template_Builder SHALL send a POST request to /api/admin/templates with the Template_Config
5. WHEN updating an existing template, THE Template_Builder SHALL send a PUT request to /api/admin/templates with the template ID and Template_Config
6. WHEN the save operation succeeds, THE Template_Builder SHALL display a success message "Template saved successfully"
7. IF the save operation fails, THEN THE Template_Builder SHALL display an error message with the failure reason
8. THE Template_Builder SHALL store the Template_Config in the CertificateTemplate_Model config field as JSON

### Requirement 13: Template Loading

**User Story:** As an administrator, I want to load existing templates for editing, so that I can update certificate designs.

#### Acceptance Criteria

1. WHEN the administrator selects a template from the Admin_Portal, THE Template_Builder SHALL fetch the template data from the database
2. WHEN template data is received, THE Template_Builder SHALL parse the Template_Config JSON
3. THE Template_Builder SHALL set the canvas dimensions from the Template_Config width and height properties
4. WHEN a background image exists in the Template_Config, THE Template_Builder SHALL display the background image on the canvas
5. THE Template_Builder SHALL create and position all Elements from the Template_Config elements array
6. THE Template_Builder SHALL restore all Element properties from the Template_Config
7. IF the Template_Config is invalid or corrupted, THEN THE Template_Builder SHALL display an error message "Unable to load template"

### Requirement 14: Template Preview with Sample Data

**User Story:** As an administrator, I want to preview the certificate with sample data, so that I can verify the design before saving.

#### Acceptance Criteria

1. WHEN the administrator clicks the "Preview" button, THE Template_Builder SHALL replace placeholders with Sample_Data
2. THE Template_Builder SHALL use Sample_Data: participantName "John Doe", eventName "Sample Event 2024", date "2024-05-20", certificateId "CERT-PREVIEW-001"
3. THE Template_Builder SHALL render the preview in a modal overlay
4. THE Template_Builder SHALL display the preview at actual certificate dimensions
5. WHEN the administrator closes the preview, THE Template_Builder SHALL restore placeholder text in Text_Elements
6. THE Template_Builder SHALL not modify the Template_Config during preview operations

### Requirement 15: Responsive Canvas Display

**User Story:** As an administrator, I want the template builder to work on different screen sizes, so that I can design certificates on various devices.

#### Acceptance Criteria

1. WHEN the viewport width is less than 1200px, THE Template_Builder SHALL scale the canvas proportionally to fit the screen
2. THE Template_Builder SHALL maintain the canvas aspect ratio during scaling
3. THE Template_Builder SHALL adjust Element positions proportionally when the canvas is scaled
4. THE Template_Builder SHALL store Element positions in absolute canvas coordinates (not scaled coordinates)
5. WHEN the viewport is resized, THE Template_Builder SHALL recalculate the canvas scale factor
6. THE Template_Builder SHALL display a zoom indicator showing the current scale percentage

### Requirement 16: Template Name Validation

**User Story:** As an administrator, I want to provide a unique template name, so that templates can be identified clearly.

#### Acceptance Criteria

1. THE Template_Builder SHALL require a template name before saving
2. THE Template_Builder SHALL accept template names between 3 and 100 characters
3. IF the template name is empty, THEN THE Template_Builder SHALL display an error message "Template name is required"
4. IF the template name is less than 3 characters, THEN THE Template_Builder SHALL display an error message "Template name must be at least 3 characters"
5. THE Template_Builder SHALL trim whitespace from template names before saving

### Requirement 17: Grid and Alignment Guides

**User Story:** As an administrator, I want visual alignment guides, so that I can position elements precisely.

#### Acceptance Criteria

1. WHERE grid display is enabled, THE Template_Builder SHALL render a grid overlay on the canvas with 50px spacing
2. WHERE snap-to-grid is enabled, THE Template_Builder SHALL snap Element positions to the nearest grid intersection
3. THE Template_Builder SHALL provide a toggle control for grid visibility
4. THE Template_Builder SHALL provide a toggle control for snap-to-grid functionality
5. WHEN an Element is aligned with another Element, THE Template_Builder SHALL display alignment guides (vertical and horizontal lines)
6. THE Template_Builder SHALL detect alignment within 5px tolerance

### Requirement 18: Undo and Redo Operations

**User Story:** As an administrator, I want to undo and redo changes, so that I can experiment with designs without losing work.

#### Acceptance Criteria

1. THE Template_Builder SHALL maintain a history of Template_Config states
2. WHEN the administrator clicks "Undo", THE Template_Builder SHALL restore the previous Template_Config state
3. WHEN the administrator clicks "Redo", THE Template_Builder SHALL restore the next Template_Config state
4. THE Template_Builder SHALL support up to 50 undo operations
5. WHEN a new change is made after undo, THE Template_Builder SHALL clear the redo history
6. THE Template_Builder SHALL disable the "Undo" button when no previous states exist
7. THE Template_Builder SHALL disable the "Redo" button when no future states exist

### Requirement 19: Keyboard Shortcuts

**User Story:** As an administrator, I want keyboard shortcuts for common actions, so that I can work more efficiently.

#### Acceptance Criteria

1. WHEN the administrator presses Delete key with an Element selected, THE Template_Builder SHALL delete the selected Element
2. WHEN the administrator presses Ctrl+Z (or Cmd+Z on Mac), THE Template_Builder SHALL perform undo operation
3. WHEN the administrator presses Ctrl+Y (or Cmd+Shift+Z on Mac), THE Template_Builder SHALL perform redo operation
4. WHEN the administrator presses Ctrl+S (or Cmd+S on Mac), THE Template_Builder SHALL save the template
5. THE Template_Builder SHALL prevent default browser behavior for registered keyboard shortcuts
6. THE Template_Builder SHALL display a keyboard shortcuts help panel when the administrator presses "?"

### Requirement 20: Element Duplication

**User Story:** As an administrator, I want to duplicate elements, so that I can create similar components quickly.

#### Acceptance Criteria

1. WHEN the administrator clicks "Duplicate" with an Element selected, THE Template_Builder SHALL create a copy of the Element
2. THE Template_Builder SHALL assign a new unique identifier to the duplicated Element
3. THE Template_Builder SHALL offset the duplicated Element position by 20px horizontally and 20px vertically
4. THE Template_Builder SHALL copy all properties from the original Element to the duplicated Element
5. THE Template_Builder SHALL select the duplicated Element after creation
6. THE Template_Builder SHALL add the duplicated Element to the Template_Config elements array
