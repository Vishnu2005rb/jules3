# Event Controller Functionality Test

## What Should Work:

### 1. Page Load
- ✅ Page loads at `/admin/events`
- ✅ Shows "Event Controller" heading
- ✅ Shows "Initialize New Event" button (top right, blue gradient)
- ✅ Shows loading spinner initially
- ✅ Shows event cards or empty state

### 2. Create New Event
**Steps:**
1. Click "Initialize New Event" button
2. Modal should open with form
3. Fill in:
   - Event name
   - Start date
   - End date
   - Select form template from dropdown
   - Select certificate template from dropdown
4. Click "Confirm Deployment"
5. Modal closes, event appears in list

**If not working:**
- Check browser console for errors (F12 → Console tab)
- Check if modal appears at all
- Check if dropdowns are populated

### 3. Edit Existing Event
**Steps:**
1. Click "Configure" button on any event card
2. Modal opens with pre-filled data
3. Modify any field
4. Click "Confirm Deployment"
5. Changes saved, modal closes

**If not working:**
- Check if button is clickable
- Check if modal opens
- Check browser console

### 4. Delete Event
**Steps:**
1. Click 🗑️ button on any event card
2. Confirmation dialog appears
3. Click OK
4. Event is removed from list

**If not working:**
- Check if confirmation dialog appears
- Check browser console for errors

### 5. View Event Details
**Each event card should show:**
- Event name
- "Live Environment" badge
- Timeline (start - end dates)
- Submission count
- Form template name
- Certificate template name
- Configure button
- Delete button

## Common Issues:

### Issue: "Only showing text"
**Possible causes:**
1. CSS not loading - check if styles are applied
2. JavaScript not executing - check browser console
3. Modal z-index issue - modal might be behind other elements
4. Buttons not clickable - check if there's an overlay blocking clicks

**Debug steps:**
1. Open browser DevTools (F12)
2. Go to Console tab - look for errors
3. Go to Network tab - check if all resources loaded
4. Try clicking buttons - see if any errors appear
5. Check if `framer-motion` is working (animations should be visible)

### Issue: Buttons not working
**Check:**
1. Are buttons visible and styled correctly?
2. Do they have hover effects?
3. Does clicking them do anything in console?
4. Is there a JavaScript error preventing execution?

### Issue: Modal not opening
**Check:**
1. Is `isModalOpen` state changing? (use React DevTools)
2. Is modal rendered but hidden?
3. Is there a z-index issue?
4. Check browser console for errors

## API Endpoints Used:

- `GET /api/admin/events` - Fetch all events
- `POST /api/admin/events` - Create new event
- `PUT /api/admin/events` - Update event
- `DELETE /api/admin/events?id=xxx` - Delete event
- `GET /api/admin/templates` - Fetch templates for dropdowns

## Test in Browser Console:

```javascript
// Test if React is working
console.log('React version:', React.version);

// Test if fetch works
fetch('/api/admin/events')
  .then(r => r.json())
  .then(d => console.log('Events:', d));

// Test if templates load
fetch('/api/admin/templates')
  .then(r => r.json())
  .then(d => console.log('Templates:', d));
```

## Expected Behavior:

1. **Page loads** → Shows events or empty state
2. **Click "Initialize New Event"** → Modal opens
3. **Fill form** → All fields work
4. **Submit** → Event created, appears in list
5. **Click "Configure"** → Modal opens with data
6. **Click delete** → Confirmation → Event removed

If any of these steps fail, note which step and what error appears in console.
