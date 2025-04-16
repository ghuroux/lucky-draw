# Public Event Publishing System Specification

## Overview

This specification outlines the requirements for implementing a public-facing event entry system for the Lucky Draw application. The system will allow event administrators to publish events to a public URL where potential entrants can view event details and submit entries.

## Goals

- Enable event administrators to publish events to a public-facing URL
- Create user-friendly, shareable URLs for public events
- Provide rich content editing for public event descriptions
- Support image uploads for events and prizes
- Implement a preview system for event publishers
- Enable email notifications to potential entrants (stretch goal)

## Database Schema Changes

### Event Model Additions

```prisma
model Event {
  // Existing fields remain unchanged
  
  // New fields
  isPublished     Boolean  @default(false)
  publishedSlug   String?  @unique
  publicDescription Json?    // Store rich text as JSON
  publicImage     String?  // URL to uploaded image
  customTheme     Json?    // Optional: Color scheme, fonts, etc.
}
```

### Prize Model Additions

```prisma
model Prize {
  // Existing fields remain unchanged
  
  // New fields
  image     String?  // URL to prize image
  imageAlt  String?  // Accessibility description
}
```

## Admin Interface Requirements

### Event Publishing Control Panel

Add a new "Publish" tab to the event edit page with the following sections:

1. **Publication Settings**
   - Toggle to publish/unpublish the event
   - Editable URL slug field (auto-generated from name but customizable)
   - Publication status indicator

2. **Public Content**
   - Rich text editor for public description
   - Event image upload
   - Prize image upload fields for each prize

3. **Preview & Share**
   - Live preview of the public page (desktop & mobile views)
   - QR code generator for the public URL
   - Copy link button
   - Preview email notification (if email feature implemented)

### Publishing Workflow

1. Event is created in draft mode (not published)
2. Admin completes event details (name, date, prizes, etc.)
3. Admin switches to "Publish" tab to prepare public-facing content
4. System generates a default slug based on event name
5. Admin can customize the slug, description, and upload images
6. Admin can preview the public page before publishing
7. Once published, the event is accessible via its public URL

## Public-Facing Pages

### Routes Structure

```
/e/[slug]              - Main public event page
/e/[slug]/success      - Confirmation page after entry
/e/[slug]/entries      - Optional public leaderboard
```

### Main Event Page Requirements

1. **Header Section**
   - Event name
   - Event image (if provided)
   - Event date and status

2. **Description Section**
   - Rich text content from publicDescription
   - Responsive layout for all device sizes

3. **Prizes Section**
   - Visual display of prizes with images
   - Prize descriptions and details

4. **Entry Form**
   - Name, email, and other required fields
   - Entry options based on event configuration
   - Clear call-to-action button
   - Terms and conditions acceptance

5. **Success Page**
   - Confirmation message
   - Entry details summary
   - Social sharing options
   - Return to event button

## Rich Content Editing

### Requirements

1. **WYSIWYG Editor**
   - Basic text formatting (bold, italic, underline)
   - Paragraph styles and headings
   - Lists (ordered and unordered)
   - Links
   - Tables
   - Image embedding
   - Mobile-friendly editing interface

2. **Content Storage**
   - Store formatted content as JSON
   - Render on public page with proper HTML structure
   - Sanitize all user-generated content for security

3. **Accessibility**
   - Ensure generated content is accessible
   - Support alt text for images
   - Maintain proper heading structure

## Image Handling

### Requirements

1. **Upload Constraints**
   - File formats: JPG, PNG, WebP
   - Maximum file size: 2MB
   - Recommended dimensions: 1200x800px (16:9 ratio)
   - Minimum dimensions: 800x450px

2. **User Guidance**
   - Visual guide showing ideal image dimensions
   - Helper text explaining image requirements
   - Preview of uploaded image
   - Error messages with clear remediation steps

3. **Processing Pipeline**
   - Client-side validation before upload
   - Server-side validation and security checks
   - Image optimization (resizing, compression)
   - Storage in secure location with appropriate caching

4. **Error Handling**
   - Clear error messages for invalid uploads
   - Options to retry or select different image
   - Fallback to placeholder images when needed

## URL and Slug Generation

### Requirements

1. **Slug Generation Rules**
   - Convert event name to lowercase
   - Replace spaces with hyphens
   - Remove special characters
   - Truncate to reasonable length (max 60 chars)
   - Ensure uniqueness by adding suffix if needed

2. **URL Structure**
   - Base path: `/e/[slug]`
   - User-friendly and easy to type
   - Avoid unnecessary parameters or query strings

3. **QR Code Generation**
   - Generate QR code for public URL
   - Downloadable in multiple formats
   - Include event name in QR code metadata

## Email Notification System (Stretch Goal)

### Requirements

1. **Template Generation**
   - Auto-generate from event content
   - Responsive email design
   - Include event image, name, description
   - Display key prizes with images
   - Clear call-to-action button

2. **Preview Functionality**
   - Show desktop and mobile previews
   - Test sending option
   - Spam score analysis

3. **Recipient Management**
   - Target past entrants (with filtering options)
   - Import email list
   - Track email analytics (optional)

## Implementation Phases

### Phase 1: Core Publishing System
1. Update database schema
2. Implement slug generation
3. Create public page routes and basic templates
4. Add publishing toggle to admin interface

### Phase 2: Rich Content & Images
1. Integrate rich text editor
2. Implement image upload system
3. Build prize image functionality
4. Add content preview system

### Phase 3: Enhanced UX & Polish
1. Improve public page design and responsiveness
2. Add QR code generation
3. Implement social sharing functionality
4. Add analytics tracking

### Phase 4: Email System (if implemented)
1. Create email template generation
2. Add preview functionality
3. Build recipient management
4. Implement sending and tracking

## Technical Considerations

### Security
- Sanitize all user-generated content
- Validate all uploads server-side
- Implement rate limiting for submissions
- Use CSRF protection

### Performance
- Optimize images during upload
- Implement proper caching for public pages
- Lazy load images and content
- Monitor page load times

### Accessibility
- Ensure WCAG 2.1 AA compliance
- Test with screen readers
- Maintain proper color contrast
- Support keyboard navigation

### Analytics
- Track page views and conversion rates
- Monitor entry submission completion rates
- Record sharing and referral data
- Analyze email campaign performance (if implemented)

## Future Enhancements

- Custom domains for events (e.g., event-name.luckydraw.com)
- Advanced theming options with CSS customization
- Social media integration for automatic posting
- Entry leaderboard with live updates
- Scheduled publishing and unpublishing 