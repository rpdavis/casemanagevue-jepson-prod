# CaseManageVue Style Guide

## Overview

This style guide documents the CSS architecture and design system for the CaseManageVue application. The styles have been organized into a maintainable, scalable structure using CSS custom properties and component-based organization.

## Architecture

### Directory Structure

```
src/assets/styles/
├── base/
│   ├── variables.css      # CSS custom properties (design tokens)
│   ├── reset.css          # CSS reset and normalize
│   ├── typography.css     # Typography styles and utilities
│   └── layout.css         # Layout utilities and global styles
├── components/
│   ├── buttons.css        # Button component styles
│   ├── forms.css          # Form element styles
│   ├── tables.css         # Table component styles
│   └── dialogs.css        # Modal and dialog styles
├── utilities/
│   ├── spacing.css        # Spacing utility classes
│   └── colors.css         # Color utility classes
├── themes/
│   └── default.css        # Default theme styles
└── main.css               # Main entry point (imports all styles)
```

### Import Order

Styles are imported in the following order to ensure proper cascade:

1. **Base Styles** - Variables, reset, typography, layout
2. **Component Styles** - Reusable component styles
3. **Utility Classes** - Helper classes for quick styling
4. **Theme Styles** - Theme-specific overrides

## Design Tokens

### Colors

#### Primary Colors
- `--primary-color: #1976d2` - Main brand color
- `--primary-hover: #1565c0` - Hover state
- `--primary-light: #e3f2fd` - Light variant
- `--primary-dark: #0d47a1` - Dark variant

#### Status Colors
- `--success-color: #28a745` - Success states
- `--warning-color: #ffc107` - Warning states
- `--error-color: #dc3545` - Error states
- `--info-color: #17a2b8` - Information states

#### Background Colors
- `--bg-primary: #f4f6f9` - Main app background
- `--bg-secondary: #ffffff` - Card/component backgrounds
- `--bg-tertiary: #f8f9fa` - Secondary backgrounds
- `--bg-muted: #e9ecef` - Muted backgrounds

#### Text Colors
- `--text-primary: #333333` - Primary text
- `--text-secondary: #666666` - Secondary text
- `--text-muted: #999999` - Muted text
- `--text-inverse: #ffffff` - Inverse text (on dark backgrounds)

### Spacing

- `--spacing-xs: 0.25rem` (4px)
- `--spacing-sm: 0.5rem` (8px)
- `--spacing-md: 1rem` (16px)
- `--spacing-lg: 1.5rem` (24px)
- `--spacing-xl: 2rem` (32px)
- `--spacing-xxl: 3rem` (48px)

### Typography

#### Font Families
- `--font-family-base: 'Inter', 'Segoe UI', 'Arial', sans-serif`
- `--font-family-mono: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace`

#### Font Sizes
- `--font-size-xs: 0.75rem` (12px)
- `--font-size-sm: 0.875rem` (14px)
- `--font-size-base: 1rem` (16px)
- `--font-size-lg: 1.125rem` (18px)
- `--font-size-xl: 1.25rem` (20px)
- `--font-size-xxl: 1.5rem` (24px)

#### Font Weights
- `--font-weight-normal: 400`
- `--font-weight-medium: 500`
- `--font-weight-semibold: 600`
- `--font-weight-bold: 700`

### Shadows
- `--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)`
- `--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1)`
- `--shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.1)`
- `--shadow-xl: 0 4px 20px rgba(0, 0, 0, 0.3)`

### Border Radius
- `--border-radius-sm: 4px`
- `--border-radius-md: 6px`
- `--border-radius-lg: 8px`
- `--border-radius-xl: 12px`
- `--border-radius-pill: 50px`

## Component Styles

### Buttons

#### Base Button Classes
```css
.btn                    /* Base button styles */
.btn-sm                 /* Small button */
.btn-lg                 /* Large button */
```

#### Button Variants
```css
.btn-primary           /* Primary action button */
.btn-secondary         /* Secondary action button */
.btn-success           /* Success button */
.btn-warning           /* Warning button */
.btn-error             /* Error/danger button */
.btn-info              /* Info button */
```

#### Outline Buttons
```css
.btn-outline           /* Primary outline button */
.btn-outline-secondary /* Secondary outline button */
```

#### Ghost Buttons
```css
.btn-ghost             /* Transparent button */
.btn-ghost-primary     /* Transparent primary button */
```

#### Special Buttons
```css
.btn-icon              /* Icon-only button */
.btn-admin             /* Admin panel button */
.btn-edit              /* Edit action button */
.btn-save              /* Save action button */
.btn-delete            /* Delete action button */
.btn-cancel            /* Cancel action button */
```

### Forms

#### Form Structure
```css
.form-group            /* Form field container */
.form-row              /* Horizontal form layout */
.form-grid             /* Grid-based form layout */
.form-grid-2           /* 2-column grid */
.form-grid-3           /* 3-column grid */
```

#### Input Elements
```css
.input-sm              /* Small input */
.input-lg              /* Large input */
.search-input          /* Search input with icon */
```

#### Validation States
```css
.form-group.has-error   /* Error state */
.form-group.has-success /* Success state */
.form-group.has-warning /* Warning state */
```

### Tables

#### Base Table Classes
```css
.table                 /* Base table styles */
.students-table        /* Student-specific table */
.user-admin-table      /* Admin user table */
.table-responsive      /* Responsive table wrapper */
```

#### Table Elements
```css
.service-pill          /* Service indicator pills */
.badge                 /* Status badges */
.flag-overlay          /* Flag indicators */
.instruction-cell      /* Special accommodation cell */
```

### Dialogs

#### Dialog Structure
```css
.dialog-backdrop       /* Modal backdrop */
.dialog                /* Dialog container */
.dialog-sm             /* Small dialog */
.dialog-lg             /* Large dialog */
.dialog-xl             /* Extra large dialog */
.dialog-fullscreen     /* Fullscreen dialog */
```

#### Dialog Components
```css
.student-info          /* Student info section */
.form-selection        /* Form selection area */
.status-message        /* Status message display */
```

## Utility Classes

### Layout Utilities

#### Display
```css
.d-flex, .d-inline-flex, .d-block, .d-inline-block, .d-none
```

#### Flexbox
```css
.flex-row, .flex-column, .flex-wrap, .flex-nowrap
.justify-start, .justify-center, .justify-end, .justify-between
.align-start, .align-center, .align-end, .align-stretch
.flex-1, .flex-auto, .flex-none
```

#### Grid
```css
.grid, .grid-cols-1, .grid-cols-2, .grid-cols-3, .grid-cols-4, .grid-cols-auto
.gap-xs, .gap-sm, .gap-md, .gap-lg, .gap-xl
```

### Spacing Utilities

#### Margin
```css
.m-0, .m-xs, .m-sm, .m-md, .m-lg, .m-xl, .m-auto
.mt-*, .mb-*, .ml-*, .mr-* (top, bottom, left, right)
.mx-*, .my-* (horizontal, vertical)
```

#### Padding
```css
.p-0, .p-xs, .p-sm, .p-md, .p-lg, .p-xl
.pt-*, .pb-*, .pl-*, .pr-* (top, bottom, left, right)
.px-*, .py-* (horizontal, vertical)
```

### Color Utilities

#### Background Colors
```css
.bg-primary, .bg-secondary, .bg-tertiary, .bg-muted
.bg-success, .bg-warning, .bg-error, .bg-info
.bg-success-light, .bg-warning-light, .bg-error-light, .bg-info-light
```

#### Text Colors
```css
.text-primary, .text-secondary, .text-muted, .text-inverse
.text-success, .text-warning, .text-error, .text-info
.text-primary-brand, .text-secondary-brand
```

#### Border Utilities
```css
.border, .border-0, .border-top, .border-bottom, .border-left, .border-right
.rounded-none, .rounded-sm, .rounded-md, .rounded-lg, .rounded-xl, .rounded-full
.shadow-none, .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl
```

## Best Practices

### CSS Custom Properties
- Always use CSS custom properties for colors, spacing, and other design tokens
- Define component-specific properties when needed
- Use meaningful, descriptive names

### Component Styling
- Prefer scoped styles for component-specific styling
- Use utility classes for common patterns
- Keep component styles focused and minimal

### Naming Conventions
- Use BEM methodology for complex components
- Use descriptive class names that indicate purpose
- Prefix utility classes appropriately

### Responsive Design
- Mobile-first approach
- Use consistent breakpoints defined in variables
- Test across different screen sizes

### Performance
- Minimize CSS duplication
- Use efficient selectors
- Leverage CSS custom properties for theming

## Migration Guide

### From Old Structure
1. Remove old CSS imports from components
2. Update class names to use new utility classes
3. Replace hardcoded values with CSS custom properties
4. Test all components for visual consistency

### Adding New Styles
1. Check if existing utilities can be used
2. Add new design tokens to variables.css if needed
3. Create component-specific styles in appropriate files
4. Document new patterns in this guide

## Browser Support

The CSS architecture supports:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Custom Properties (IE 11+ with polyfill if needed)
- CSS Grid and Flexbox
- Modern CSS features with graceful degradation

## Maintenance

### Regular Tasks
- Review and consolidate duplicate styles
- Update design tokens when design changes
- Add new utility classes as patterns emerge
- Keep documentation updated

### Performance Monitoring
- Monitor CSS bundle size
- Remove unused styles
- Optimize critical path CSS
- Use CSS purging in production builds

## Examples

### Creating a New Component
```vue
<template>
  <div class="my-component">
    <h2 class="text-lg font-semibold mb-md">Component Title</h2>
    <div class="d-flex gap-sm">
      <button class="btn btn-primary">Primary Action</button>
      <button class="btn btn-outline">Secondary Action</button>
    </div>
  </div>
</template>

<style scoped>
.my-component {
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}
</style>
```

### Using Utility Classes
```html
<!-- Layout -->
<div class="d-flex justify-between align-center gap-md">
  <span class="text-lg font-semibold">Title</span>
  <button class="btn btn-sm btn-primary">Action</button>
</div>

<!-- Spacing -->
<div class="p-lg mb-xl bg-secondary rounded-md">
  Content with padding and margin
</div>

<!-- Colors -->
<div class="bg-success-light text-success p-md rounded-sm">
  Success message
</div>
```

This style guide provides a comprehensive reference for using the new CSS architecture in CaseManageVue. Follow these patterns for consistent, maintainable styling throughout the application. 