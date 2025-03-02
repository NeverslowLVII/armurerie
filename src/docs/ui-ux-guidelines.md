# UI/UX Guidelines for Armurerie

This document outlines the UI/UX standards for the Armurerie application to ensure consistency across all pages and components.

## Design Language

### Colors

- **Primary**: Red to orange gradient (`from-red-500 to-orange-500`, `from-red-600 to-amber-500`)
- **Secondary**: Blue (`text-blue-500`, `dark:text-blue-400`)
- **Neutral**: 
  - Light mode: White backgrounds (`bg-white`) with neutral text (`text-neutral-900`, `text-neutral-500`)
  - Dark mode: Dark backgrounds (`bg-neutral-900`, `bg-neutral-800`) with light text (`text-white`, `text-neutral-400`)
- **Accent**: Red (`text-red-500`, `text-red-600`) for emphasis and important elements

### Typography

- **Font Family**: Poppins (400, 700 weights)
- **Headings**:
  - H1: `text-3xl font-bold tracking-tight`
  - H2: `text-2xl font-semibold`
  - H3: `text-xl font-medium`
- **Body Text**: `text-sm` or `text-base`
- **Gradient Text**: `bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 bg-clip-text text-transparent`

### Spacing

- **Container**: `container mx-auto`
- **Padding**: `p-6`, `p-8`, or `p-10` for sections
- **Margins**: `space-y-4`, `space-y-6` for vertical spacing
- **Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

### Shadows and Borders

- **Card Shadows**: `shadow-lg`
- **Borders**: `border border-neutral-200 dark:border-neutral-800`
- **Border Radius**: `rounded-lg`, `rounded-xl`

### Animations

- **Page Transitions**: Fade in with slight movement
  ```jsx
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
  ```
- **Element Transitions**: Staggered animations with delays
  ```jsx
  <motion.h1 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
  ```
- **Hover Effects**: Subtle scale or color changes
  ```css
  transition-all duration-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50
  ```

## Components

### Cards

Cards should have consistent styling:

```jsx
<Card className="bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden relative group h-full">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-white">
      <Icon className="h-5 w-5 text-red-500" />
      Card Title
    </CardTitle>
    <CardDescription className="text-neutral-500 dark:text-neutral-400">Description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Buttons

Primary buttons:
```jsx
<Button className="bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white">
  Button Text
</Button>
```

Secondary buttons:
```jsx
<Button variant="outline" className="border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
  Button Text
</Button>
```

### Forms

Form elements should be consistent:

```jsx
<div className="space-y-4 bg-white dark:bg-neutral-900 p-4 rounded-lg">
  <div className="space-y-2">
    <Label htmlFor="field">Field Label</Label>
    <Input
      id="field"
      name="field"
      type="text"
      placeholder="Placeholder text"
      className="dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
    />
  </div>
  <Button type="submit" className="w-full">Submit</Button>
</div>
```

## Page Layouts

### Auth Pages

Auth pages should follow this structure:

```jsx
<div className="container relative min-h-screen flex-col items-center justify-center grid bg-white dark:bg-neutral-900 lg:max-w-none lg:grid-cols-2 lg:px-0">
  {/* Left side - Image with overlay */}
  <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex overflow-hidden">
    <div className="absolute inset-0">
      <Image
        src={backgroundImage}
        alt="Background"
        fill
        className="object-cover transition-transform duration-500 hover:scale-105"
        priority
        quality={100}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 backdrop-blur-[2px]" />
    </div>
    
    {/* Logo or brand */}
    <div className="relative z-20 flex items-center">
      <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
        Armurerie
      </span>
    </div>
    
    {/* Quote or description */}
    <div className="relative z-20 mt-auto">
      <blockquote className="space-y-2">
        <p className="text-lg text-white">
          Descriptive text or quote
        </p>
        <footer className="text-sm text-white/70">
          Attribution or additional info
        </footer>
      </blockquote>
    </div>
  </div>
  
  {/* Right side - Form */}
  <div className="lg:p-8">
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Page Title
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Page description
        </p>
      </div>
      
      {/* Form or content */}
      <div className="space-y-4">
        {/* Form elements */}
      </div>
    </div>
  </div>
</div>
```

### Dashboard and Content Pages

Content pages should follow this structure:

```jsx
<div className="container mx-auto p-6 space-y-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
    <div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
        Page Title
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Page description or metadata
      </p>
    </div>
    
    {/* Optional action buttons */}
    <div className="flex items-center gap-3">
      {/* Buttons or status indicators */}
    </div>
  </div>
  
  {/* Main content */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Cards or content sections */}
  </div>
</div>
```

## Loading States

### Skeleton Loading

Use skeleton loading for a better user experience:

```jsx
<SkeletonLoading isLoading={true} className="space-y-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
    <div>
      <Skeleton className="h-10 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 w-32" />
    </div>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Skeleton className="h-64 rounded-xl" />
    <Skeleton className="h-64 rounded-xl" />
  </div>
</SkeletonLoading>
```

For auth pages:

```jsx
<FullPageSkeletonLoading>
  <div className="space-y-6">
    <Skeleton className="h-12 w-64 mx-auto" />
    <Skeleton className="h-6 w-full max-w-md mx-auto" />
    <div className="space-y-4 max-w-md mx-auto">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
</FullPageSkeletonLoading>
```

## Responsive Design

- Use responsive classes to adapt layouts for different screen sizes
- Mobile-first approach with breakpoints at:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
- Stack elements vertically on mobile, use grid or horizontal layouts on larger screens
- Hide decorative elements on mobile with `hidden lg:flex`

## Accessibility

- Use semantic HTML elements
- Ensure sufficient color contrast
- Provide text alternatives for images
- Use ARIA attributes when necessary
- Ensure keyboard navigation works properly
- Test with screen readers

## Dark Mode

- All components should support dark mode
- Use `dark:` prefix for dark mode specific styles
- Background colors: `dark:bg-neutral-900`, `dark:bg-neutral-800`
- Text colors: `dark:text-white`, `dark:text-neutral-400`
- Border colors: `dark:border-neutral-800`

## Best Practices

1. Maintain consistent spacing and alignment
2. Use animations sparingly and purposefully
3. Ensure text is readable on all backgrounds
4. Use skeleton loading for better perceived performance
5. Keep the UI clean and focused on the task at hand
6. Use motion effects to guide attention and provide feedback
7. Ensure all interactive elements have appropriate hover/focus states
8. Follow a consistent color scheme throughout the application 