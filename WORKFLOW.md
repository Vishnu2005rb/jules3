# 🎯 Form Template to Live Submission Workflow

## Overview
This document explains how admin-created form templates become live submission forms for users.

---

## 📋 Complete Workflow

### Step 1: Create Form Template (Layout Studio)
**Location:** `/admin/templates`

1. Click **"Create New Template"**
2. Design your form using the **3-panel builder**:
   - **LEFT PANEL:** Configure form settings
     - Form name
     - Header elements (logos, text)
     - Custom fields
     - Header height
   - **CENTER PANEL:** Drag-and-drop header canvas
     - Position logos and text elements
     - Visual editing with real-time feedback
   - **RIGHT PANEL:** Live preview
     - See exactly how users will see the form

3. Click **"Commit to Registry"** → Template saved to database ✅

**What gets saved:**
```json
{
  "name": "Spring Hackathon Form",
  "headerElements": [
    {"type": "logo", "imageUrl": "...", "x": 50, "y": 30, "width": 100, "height": 100},
    {"type": "text", "content": "Event Name", "x": 400, "y": 70, "fontSize": 36}
  ],
  "headerHeight": 200,
  "customFields": [
    {"label": "Department", "type": "text", "required": true}
  ],
  "footerText": "Contact: support@example.com",
  "footerSocials": ["facebook", "twitter", "instagram", "linkedin"]
}
```

---

### Step 2: Assign Template to Event (Event Controller)
**Location:** `/admin/events`

1. Click **"Initialize New Event"** (or edit existing event)
2. Fill in event details:
   - Event name
   - Start date
   - End date
3. **Select Form Template** from dropdown (labeled "Form Schema")
4. Select Certificate Template
5. Click **"Confirm Deployment"** → Event created with template ✅

**What happens:**
- Event is linked to the form template via `formTemplateId`
- The template is now "LIVE" (shown with green badge in Layout Studio)
- Users can now submit using this form

---

### Step 3: Users Submit Using Live Form
**Location:** `/submit?eventId=xxx`

**What users see:**
1. **Header Section** (from template)
   - Logos positioned exactly as admin designed
   - Text elements with custom fonts, colors, sizes
   - Configurable height and background

2. **Body Section**
   - **Fixed Fields** (always present):
     - Full Name
     - Email Address
     - Phone Number
   - **Custom Fields** (from admin template):
     - Department, Year, etc.
     - Text, number, email, dropdown types
   - **Screenshot Upload** (fixed, required):
     - Google review screenshot
     - Cannot be removed by admin

3. **Footer Section** (from template)
   - Contact information
   - Social media icons
   - Customizable text

**Submission Flow:**
1. User fills form → Clicks "Submit for Verification"
2. Data saved with `eventId` and `dynamicFields`
3. AI verifies review screenshot
4. Certificate generated using event's certificate template
5. Certificate emailed to user

---

## 🎨 Template Features

### Fixed Elements (Cannot be Removed)
- Name, Email, Phone fields
- Screenshot upload section
- Footer structure

### Customizable Elements
- **Header:**
  - Add/remove logos
  - Add/remove text elements
  - Drag-and-drop positioning
  - Configure sizes, colors, fonts
  - Adjust header height
  - Change background gradient

- **Body:**
  - Add custom fields (text, number, email, dropdown)
  - Set field labels and placeholders
  - Mark fields as required/optional
  - Add dropdown options

- **Footer:**
  - Customize contact text
  - Select social media icons

---

## 🔄 Template Status

### In Registry (Not Live)
- Template saved but not assigned to any event
- Shown in Layout Studio without badge
- Can be edited or deleted

### Live (Assigned to Event)
- Template assigned to one or more events
- Shown with **"✓ Live"** green badge
- Shows count: "Used by X event(s)"
- Can still be edited (changes affect all events using it)

---

## 💡 Best Practices

1. **Create templates first** before creating events
2. **Test templates** by previewing in Layout Studio
3. **Use descriptive names** for templates (e.g., "Spring 2026 Hackathon Form")
4. **Position logos carefully** - different logos have different sizes
5. **Keep custom fields minimal** - only ask what you need
6. **Test the submission flow** after assigning template to event

---

## 🚀 Quick Start

```bash
# 1. Create form template
Visit: http://localhost:3000/admin/templates
Click: "Create New Template"
Design form → "Commit to Registry"

# 2. Create event with template
Visit: http://localhost:3000/admin/events
Click: "Initialize New Event"
Select your template → "Confirm Deployment"

# 3. Test submission
Visit: http://localhost:3000/submit?eventId=YOUR_EVENT_ID
Fill form → Submit
```

---

## 📊 Database Schema

```prisma
model Event {
  id                    String               @id @default(cuid())
  name                  String
  formTemplateId        String?
  formTemplate          FormTemplate?        @relation(fields: [formTemplateId], references: [id])
  certificateTemplateId String?
  certificateTemplate   CertificateTemplate? @relation(fields: [certificateTemplateId], references: [id])
  startDate             DateTime
  endDate               DateTime
  submissions           UserSubmission[]
}

model FormTemplate {
  id           String   @id @default(cuid())
  name         String
  fields       Json     // Custom fields array
  headerConfig Json?    // Header elements, height, background, footer
  createdAt    DateTime @default(now())
  events       Event[]  // All events using this template
}
```

---

## 🎯 Summary

**Admin creates template** → **Admin assigns to event** → **Users submit using live form**

The form template system provides complete flexibility for admins while maintaining required fields for the verification system. Once a template is committed to registry and assigned to an event, it becomes the actual submission form that users interact with.
