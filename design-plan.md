# Apple Human Interface Design Plan for Tank Volume Calculator

## Overview
This document outlines the design plan for reworking the Tank Volume Calculator UI to align with Apple's Human Interface Guidelines. The goal is to create a minimalistic, light design that follows Apple's design principles while maintaining the application's functionality.

## Design Principles
- **Clarity**: Focus on essential elements and remove visual clutter
- **Deference**: UI should help users understand and interact with content, not compete with it
- **Depth**: Visual layers and realistic motion convey hierarchy and facilitate understanding

## Color Palette

### Primary Colors
- **Background**: #F5F5F7 (Apple light gray background)
- **Surface**: #FFFFFF (White for cards and content areas)
- **Primary**: #8E8E93 (Apple light gray for primary actions and focus states)
- **Secondary**: #34C759 (Apple green for success states and secondary actions)
- **Text Primary**: #1D1D1F (Apple dark gray for primary text)
- **Text Secondary**: #86868B (Apple medium gray for secondary text)
- **Borders**: #D2D2D7 (Apple light gray for borders and dividers)

### Status Colors
- **Success**: #34C759 (Apple green)
- **Warning**: #FF9500 (Apple orange)
- **Error**: #FF3B30 (Apple red)
- **Info**: #5AC8FA (Apple light blue)

## Typography

### Font Family
- Use system fonts to match the native OS look:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
  ```

### Font Sizes
- **Large Title**: 34px (for main page title)
- **Title 1**: 28px (for section headers)
- **Title 2**: 22px (for card titles)
- **Title 3**: 20px (for subsection headers)
- **Body**: 17px (for regular text)
- **Callout**: 16px (for emphasized text)
- **Subhead**: 15px (for labels and secondary text)
- **Footnote**: 13px (for auxiliary information)
- **Caption**: 12px (for small labels and hints)

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing and Layout

### Spacing Scale
- **2px**: Minimum spacing
- **4px**: Extra small spacing
- **8px**: Small spacing
- **16px**: Medium spacing
- **24px**: Large spacing
- **32px**: Extra large spacing
- **48px**: 2x large spacing
- **64px**: 3x large spacing

### Layout Guidelines
- Use consistent spacing between elements
- Align elements to a grid for visual harmony
- Use white space effectively to create a clean, uncluttered interface
- Maintain proper hierarchy with spacing and typography

## Component Design

### Cards
- Light elevation with subtle shadows
- Rounded corners (12px radius)
- Clean white background
- Minimal borders or dividers

### Buttons
- Pill-shaped (fully rounded corners)
- Clear visual hierarchy (primary, secondary, tertiary)
- Appropriate padding (16px horizontal, 10px vertical)
- Hover and active states with subtle transitions

### Form Controls
- Clean, minimal styling
- Clear focus states
- Appropriate spacing between label and input
- Validation states with appropriate colors and icons

### Dropdowns
- Simple, clean design
- Subtle animations for opening/closing
- Clear selected state
- Proper spacing for options

### Results Display
- Clear hierarchy of information
- Use of color to highlight important data
- Expandable sections for detailed information
- Proper spacing between sections

## Implementation Plan

### Global Styles
1. Update color variables in CSS
2. Set up typography system
3. Create spacing utilities
4. Define common component styles

### Component Updates
1. App.vue - Update layout and header/footer styling
2. TankSelector.vue - Redesign dropdown to match Apple style
3. VolumeCalculator.vue - Update form controls and button styling
4. ResultsDisplay.vue - Redesign results card with improved hierarchy

### Responsive Design
- Ensure all components work well on different screen sizes
- Use appropriate breakpoints for layout changes
- Maintain readability and usability at all sizes

## Accessibility Considerations
- Ensure sufficient color contrast
- Provide focus indicators for keyboard navigation
- Use semantic HTML elements
- Include appropriate ARIA attributes where needed
