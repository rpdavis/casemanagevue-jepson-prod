# Admin Action Buttons Guide

This guide explains how to use the new admin action button classes for consistent styling across admin panels.

## Overview

The admin action buttons provide consistent, properly sized buttons for common admin actions like edit, save, delete, and cancel operations. They solve width and alignment issues that existed with previous button implementations.

## CSS Classes

### Main Classes

- `.admin-action-btn` - Base class for all admin action buttons
- `.admin-action-btns` - Container class for grouping action buttons

### Button Variants

**Core Action Variants:**
- `.admin-action-btn.edit` - Blue edit button
- `.admin-action-btn.save` - Green save button  
- `.admin-action-btn.cancel` - Gray cancel button
- `.admin-action-btn.delete` - Red delete button

**Additional Color Variants:**
- `.admin-action-btn.primary` - Blue primary action button
- `.admin-action-btn.secondary` - Gray secondary button
- `.admin-action-btn.success` - Green success button
- `.admin-action-btn.warning` - Orange warning button
- `.admin-action-btn.info` - Light blue info button

## Features

- **Fixed Width**: All buttons are 36px × 36px for consistency (customizable with inline styles)
- **Proper Spacing**: 4px gap between buttons in containers
- **Clear Borders**: 2px solid borders with matching colors for better visibility
- **Rich Backgrounds**: Colored backgrounds that clearly distinguish button types
- **Enhanced Hover Effects**: Smooth animations with elevated shadows on hover
- **Focus States**: Proper keyboard navigation support
- **Disabled States**: Automatic styling for disabled buttons
- **Color Coding**: Different colors for different action types (edit=blue, save=green, delete=red, etc.)

## Usage Examples

### Basic Button Row

```html
<td class="admin-action-btns">
  <!-- View Mode -->
  <template v-if="!isEditing">
    <button @click="startEdit()" class="admin-action-btn edit" title="Edit">✏️</button>
  </template>
  
  <!-- Edit Mode -->
  <template v-else>
    <button @click="save()" class="admin-action-btn save" title="Save">💾</button>
    <button @click="cancel()" class="admin-action-btn cancel" title="Cancel">❌</button>
    <button @click="delete()" class="admin-action-btn delete" title="Delete">🗑️</button>
  </template>
</td>
```

### Individual Buttons

```html
<!-- Single edit button -->
<button class="admin-action-btn edit" @click="editItem()" title="Edit Item">✏️</button>

<!-- Single delete button -->
<button class="admin-action-btn delete" @click="deleteItem()" title="Delete Item">🗑️</button>
```

### With Custom Icons

```html
<button class="admin-action-btn edit" @click="viewDetails()" title="View Details">👁️</button>
<button class="admin-action-btn" @click="duplicate()" title="Duplicate">📋</button>
```

## Implementation Notes

### Container Usage

Always use the `.admin-action-btns` container class for proper spacing and alignment:

```html
<td class="admin-action-btns">
  <!-- buttons go here -->
</td>
```

### Accessibility

- Always include `title` attributes for tooltips
- Buttons support keyboard navigation
- Proper focus states are included

### Icons

The buttons work best with emoji icons (as shown) but can also use:
- Font icons (Font Awesome, etc.)
- SVG icons
- Text labels for accessibility

## Migration from Old Classes

### Before (Legacy)
```html
<td class="action-btns">
  <button class="btn-edit" @click="edit()">✏️</button>
  <button class="btn-save" @click="save()">💾</button>
  <button class="btn-delete" @click="delete()">🗑️</button>
</td>
```

### After (New)
```html
<td class="admin-action-btns">
  <button class="admin-action-btn edit" @click="edit()">✏️</button>
  <button class="admin-action-btn save" @click="save()">💾</button>
  <button class="admin-action-btn delete" @click="delete()">🗑️</button>
</td>
```

## Customization

The button styles can be customized by overriding CSS custom properties or adding additional variant classes as needed.

## Components Updated

The following components have been updated to use the new admin action button classes:

**Data Management:**
- `AdminStudents.vue` - Student management table
- `UserTable.vue` - User management table

**Admin Panel Components:**
- `AdminDashboard.vue` - Quick action buttons with color coding
- `AdminTeacherFeedback.vue` - Form action buttons (view, sync, edit, delete)
- `AdminTimeTable.vue` - Time table management buttons
- `AdminBackupRestore.vue` - Backup and restore action buttons
- `AppSettings.vue` - Settings save/load/reset buttons

**Debug & Testing:**
- `ComponentHealthDashboard.vue` - Debug component with "Full System Test" and "Export Report" buttons
- `SessionTimeoutDebug.vue` - Session timeout testing controls
- `TestingView.vue` - Testing and migration tools

All buttons now have proper borders, backgrounds, and color coding to distinguish different action types.

## Special Cases for Text Buttons

For buttons with longer text content (like "Full System Test" or "Export Report"), you can override the fixed width by adding inline styles:

```html
<button class="admin-action-btn" style="min-width: 160px; max-width: 160px;">
  🧪 Full System Test
</button>
```

This maintains the consistent styling while accommodating longer button text. 