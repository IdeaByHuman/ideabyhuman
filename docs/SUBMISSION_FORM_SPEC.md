# Submission Form Specification

Complete specification for the project submission form component.

## Form Overview

The submission form is a multi-step form that guides creators through sharing their AI-built project. It is designed to be intuitive while collecting all necessary information for curation review.

**URL**: `/submit`
**Accessible to**: Authenticated users with 'creator' or 'admin' role
**Method**: Multi-step form with Progress indicator
**Submission endpoint**: POST `/api/submit`

## Form Steps

### Step 1: Basic Information

#### Fields

**Title** (Text Input)
- Label: "Project Title"
- Help text: "What's your project called?"
- Validation:
  - Required
  - Min 3 characters
  - Max 255 characters
  - Real-time error: "Title must be 3-255 characters"
- Placeholder: "e.g., Smart Meeting Summarizer"
- Constraints: Cannot contain special characters

**Short Description** (Textarea)
- Label: "Short Description"
- Help text: "One or two sentences explaining what your project does"
- Validation:
  - Required
  - Min 20 characters
  - Max 150 characters
  - Real-time char counter
- Placeholder: "An app that listens to meetings and generates AI summaries automatically"
- Rows: 3

**Category** (Select Dropdown)
- Label: "Category"
- Help text: "What category best describes your project?"
- Options:
  - Web Applications
  - Mobile Apps
  - Content Tools
  - Automation
  - Creative Projects
  - Data & Analytics
  - E-commerce
- Validation: Required
- Default: "--Select a category--"

**Live URL** (Text Input)
- Label: "Live Project URL"
- Help text: "Where can people access your project?"
- Validation:
  - Required
  - Must be valid URL (http:// or https://)
  - Must be publicly accessible
  - Real-time validation feedback
- Placeholder: "https://yourproject.com"
- Error: "Enter a valid, publicly accessible URL"

### Step 2: Links & Media

#### Fields

**GitHub URL** (Text Input)
- Label: "GitHub Repository (Optional)"
- Help text: "Link to your code repository"
- Validation:
  - Optional
  - If provided, must be valid GitHub URL
  - Format: https://github.com/username/repo
- Placeholder: "https://github.com/yourname/project"

**Demo Video URL** (Text Input)
- Label: "Demo Video (Optional)"
- Help text: "YouTube or Vimeo link showing your project in action"
- Validation:
  - Optional
  - If provided, must be valid YouTube or Vimeo URL
- Placeholder: "https://youtube.com/watch?v=..."
- Accepted: youtube.com, youtu.be, vimeo.com

**Hero Image** (File Upload)
- Label: "Hero Image"
- Help text: "Main cover image for your project (1200x630px recommended)"
- Validation:
  - Required
  - File types: PNG, JPG, JPEG, WebP
  - Max file size: 10MB
  - Recommended dimensions: 1200x630px
  - Aspect ratio: 16:9
- Behavior:
  - Show image preview after selection
  - Allow replace/delete
  - Drag & drop support
- Error messages:
  - "Image required"
  - "Must be PNG, JPG, or WebP (max 10MB)"
  - "Image too small (min 800x450px)"

**Additional Screenshots** (Multi-file Upload)
- Label: "Additional Screenshots (Optional)"
- Help text: "Up to 5 more images showing your project (2-5 recommended)"
- Validation:
  - Optional
  - Max 5 files
  - File types: PNG, JPG, JPEG, WebP
  - Max 10MB each
  - Minimum 800x450px
- Behavior:
  - Show previews of selected images
  - Drag to reorder
  - Delete individual images
  - Show count (e.g., "3 of 5 images")

### Step 3: Story - The Problem

#### Field

**Story: The Problem** (Textarea)
- Label: "The Problem"
- Help text: "What problem did you identify? What gap or need were you trying to fill? (300-400 words recommended)"
- Validation:
  - Required
  - Min 150 characters
  - Max 2000 characters
  - Real-time word counter
  - Validation on blur
- Placeholder: "I was spending 30 minutes every morning transcribing meeting notes..."
- Rows: 8
- Error: "Problem section must be 150-2000 characters"

### Step 4: Story - Your Idea

#### Field

**Story: Your Idea** (Textarea)
- Label: "Your Idea"
- Help text: "What was your creative vision? How did you approach solving this? What makes your approach unique? (200-300 words recommended)"
- Validation:
  - Required
  - Min 150 characters
  - Max 2000 characters
  - Real-time word counter
- Placeholder: "Instead of building another generic tool, I wanted to create something that learns your meeting style and preferences..."
- Rows: 8
- Error: "Idea section must be 150-2000 characters"

### Step 5: Story - AI's Role

#### Field

**Story: How You Used AI** (Textarea)
- Label: "How Did You Use AI?"
- Help text: "Which AI tools did you use? What did you prompt? How did you iterate? What surprised you? (300-400 words recommended)"
- Validation:
  - Required
  - Min 200 characters
  - Max 2500 characters
  - Real-time word counter
- Placeholder: "I used Claude API for summarization with custom prompts that evolved over 50+ iterations. Initially I struggled with..."
- Rows: 8
- Error: "AI process section must be 200-2500 characters"

### Step 6: Story - Surprises

#### Field

**Story: Surprises & Learnings** (Textarea)
- Label: "What Surprised You?"
- Help text: "What went differently than expected? What did you learn about AI or building products? (200-300 words recommended)"
- Validation:
  - Optional
  - If provided, min 50 characters
  - Max 2000 characters
  - Real-time word counter
- Placeholder: "I expected the hardest part to be getting transcription right, but it was actually prompt engineering..."
- Rows: 8

### Step 7: Technical Details

#### Fields

**AI Tools Used** (Multi-select Checkboxes)
- Label: "AI Tools Used"
- Help text: "Select all AI tools you used to build this project"
- Options (searchable):
  - Claude (all versions)
  - ChatGPT
  - GPT-4
  - Gemini
  - Copilot
  - Midjourney
  - DALL-E
  - Runway
  - ElevenLabs
  - Replicate
  - Hugging Face
  - Custom/Other
- Validation:
  - Required, at least 1
  - Max 10 selections
- Behavior:
  - Search/filter options
  - Show "Other" input if "Custom/Other" selected

**Technology Stack** (Text Input)
- Label: "Technology Stack"
- Help text: "Main technologies used (5-10 recommended)"
- Example: "Next.js, TypeScript, Claude API, Supabase, PostgreSQL"
- Validation:
  - Required
  - Min 3 technologies (comma-separated)
  - Max 15 technologies
  - Real-time validation as user types
- Behavior:
  - Autocomplete suggestions (React, Next.js, Claude, etc.)
  - Show tags as user types
  - Allow custom entries

**Build Time (Hours)** (Number Input)
- Label: "Build Time (Hours)"
- Help text: "Approximately how many hours did you spend building this?"
- Validation:
  - Optional
  - Min 1
  - Max 2000
  - Whole numbers only
- Placeholder: "e.g., 40"

**Key Prompts** (Textarea)
- Label: "Key Prompts (Optional)"
- Help text: "Share 1-2 prompts that were particularly effective (if not proprietary)"
- Validation:
  - Optional
  - Max 1000 characters
- Placeholder: "You are an expert meeting facilitator tasked with extracting action items..."
- Rows: 4

### Step 8: Review & Submit

#### Sections

**Summary Preview**
- Shows all entered data in read-only format
- Organized by sections
- Edit buttons next to each section to go back and modify

**Submission Agreement**
- Checkbox: "I confirm this project is built with meaningful AI involvement"
- Checkbox: "I have permission to share this project publicly"
- Checkbox: "I agree to IdeaByHuman's Content Guidelines"
- Link to Content Guidelines
- All three required before submission

**Submit Button**
- Label: "Submit for Review"
- Disabled until all validations pass
- Shows loading state during submission
- Disabled after click to prevent double-submission

## Validation Rules

### Client-side Validation (Real-time)
- Field length validation
- URL format validation
- File type/size validation
- Required field checks
- Custom validation rules per field

### Server-side Validation (On Submit)
All client-side validations repeated on server:
- Verify all required fields present
- Validate URLs are actually accessible
- Verify images meet specs
- Check for spam/suspicious content
- Verify user is authenticated and has creator role

### Error Handling
- Display error inline next to field
- Clear error message explaining what's wrong
- Validation on blur for text inputs
- Validation on file drop/select for uploads
- Prevent form submission if any validation fails

## Post-Submission Flow

### 1. Submission Processing
```
User clicks "Submit for Review"
  ↓
Client validates all fields
  ↓
Media files uploaded to Cloudflare R2 (presigned URL)
  ↓
Form data sent to /api/submit
  ↓
Server validates everything again
  ↓
Project record created (status: "pending")
  ↓
Database transaction succeeds or rolls back
```

### 2. User Feedback
- Success page with confirmation message
- Project details displayed
- Next steps explained
- Link to view project draft
- Email confirmation sent

### 3. Creator Experience
- Project appears in creator's dashboard
- Draft state visible (not public yet)
- Can view and edit until approved/rejected
- Receives email when status changes

### 4. Reviewer Notification
- Email sent to all reviewers
- New submission appears in admin panel
- Ready for review

## Save as Draft Feature

**Future Feature** (not in MVP):
- Auto-save to localStorage every 30 seconds
- Button to manually save progress
- Resume editing link in email if session expires
- Allow creators to save incomplete submissions

## Accessibility

### WCAG AA Compliance
- All form inputs have associated labels
- Error messages linked to input with aria-describedby
- Form progress indicator announces current step
- Focus management when stepping between sections
- Keyboard navigation fully supported
- Screen reader friendly

### Keyboard Navigation
- Tab through all fields in order
- Enter to submit
- Escape to cancel (with confirmation)
- Arrow keys in multi-select dropdowns

### Visual Accessibility
- High contrast labels and inputs
- Clear visual focus indicators
- Error messages in color + icon + text
- Adequate spacing between form elements
- Responsive design on all screen sizes

## Responsive Design

- **Mobile** (< 768px): Single column, larger touch targets
- **Tablet** (768px - 1024px): Single column or two-column layout
- **Desktop** (> 1024px): Two-column layout where appropriate

## Mobile Considerations

- File upload optimized for mobile (camera option)
- Dropdown inputs convert to native select on mobile
- Form spread across steps (not all visible at once)
- Submit button always visible (sticky footer)
- Swipe gestures to move between steps (optional)

## Performance

- Form data persisted in component state (React)
- Debounced validation to avoid excessive re-renders
- Lazy-load images for preview to avoid blocking
- Presigned upload URLs generated on file select, not form submit
- Optimize image uploads with compression before sending

## Error Handling

### Network Errors
- Show retry button if /api/submit fails
- Preserve form data on error
- Display helpful error message

### File Upload Errors
- Show specific error for failed upload
- Allow user to retry or select different file
- Don't require re-entering other form data

### Validation Errors
- Highlight failed field
- Show error message below field
- Scroll to first error on submit attempt

## Admin Notes

### For Admin Dashboard
- Form submissions traceable by user ID
- Track submission source and IP
- Rate limiting per user (max 5 submissions per day)
- Spam detection on content

### Moderation
- Content review tools in admin panel
- Flag submissions for review
- Edit project details if needed (before/after publication)
- Track submission metadata

## Testing Checklist

- [ ] All fields validate correctly
- [ ] File uploads work on mobile and desktop
- [ ] Form can be submitted with minimum required data
- [ ] Form validation errors display clearly
- [ ] Form persists data when navigating away (future)
- [ ] Presigned URLs work for image upload
- [ ] Success page displays after submission
- [ ] Creator receives confirmation email
- [ ] Reviewers are notified of new submission
- [ ] Project appears in admin pending queue
- [ ] Mobile responsiveness at all breakpoints
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility verified

## Example Request Body

```json
{
  "title": "Smart Meeting Summarizer",
  "short_description": "AI-powered app that listens to meetings and generates summaries automatically",
  "category_id": "uuid-of-web-apps",
  "live_url": "https://meetingsummarizer.com",
  "github_url": "https://github.com/user/meeting-summarizer",
  "demo_video_url": "https://youtube.com/watch?v=...",
  "story_problem": "Every morning I spent 15 minutes transcribing voice notes...",
  "story_idea": "Instead of building another calendar tool...",
  "story_ai_process": "I used Claude API with custom prompts...",
  "story_surprises": "I expected transcription to be hard, but prompt engineering was tougher...",
  "ai_tools_used": ["Claude", "Whisper"],
  "tech_stack": "Next.js, TypeScript, Claude API, Supabase, PostgreSQL, TailwindCSS",
  "build_time_hours": 40,
  "key_prompts": "You are an expert meeting facilitator...",
  "hero_image_url": "https://r2.example.com/projects/...",
  "screenshot_urls": [
    "https://r2.example.com/projects/...",
    "https://r2.example.com/projects/..."
  ]
}
```

## Example Response

### Success (201)
```json
{
  "id": "uuid-of-project",
  "title": "Smart Meeting Summarizer",
  "slug": "smart-meeting-summarizer",
  "status": "pending",
  "message": "Submission received! We'll review it within 7-10 days.",
  "next_steps": "You'll receive an email when we've reviewed your project.",
  "project_url": "https://ideabyhuman.com/project/smart-meeting-summarizer"
}
```

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "errors": {
    "title": "Title is required",
    "live_url": "Must be a valid URL",
    "hero_image_url": "Image is required"
  }
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to submit a project"
}
```
