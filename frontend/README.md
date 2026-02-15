# Todo App Frontend

A modern, responsive frontend for the Todo application built with vanilla JavaScript, HTML, and CSS.

## Features

✨ **Core Functionality**
- ✅ Create new todos with title and description
- ✅ Mark todos as complete/incomplete
- ✅ Delete todos
- ✅ Filter todos (All, Active, Completed)
- ✅ Real-time statistics (Total, Active, Completed)

🎨 **Design Features**
- Modern, clean UI with gradient header
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Toast notifications for user feedback
- Loading states and error handling
- Empty state when no todos exist

⚡ **User Experience**
- Keyboard shortcut (Ctrl/Cmd + K) to focus input
- Relative timestamps (e.g., "2 hours ago")
- Confirmation dialog before deletion
- Auto-focus on input after adding todo
- XSS protection with HTML escaping

## File Structure

```
frontend/
├── index.html      # Main HTML structure
├── styles.css      # Responsive CSS styling
├── app.js          # JavaScript for API interactions
└── README.md       # This file
```

## Getting Started

### Prerequisites

- Backend Flask API running on `http://localhost:5000`
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **No build process required!** This is a vanilla JavaScript application.

2. **Option 1: Open directly in browser**
   ```bash
   # Simply open index.html in your browser
   # On Windows:
   start frontend/index.html
   
   # On macOS:
   open frontend/index.html
   
   # On Linux:
   xdg-open frontend/index.html
   ```

3. **Option 2: Use a local server (recommended)**
   
   Using Python:
   ```bash
   cd frontend
   python -m http.server 8000
   ```
   Then open: http://localhost:8000

   Using Node.js (npx):
   ```bash
   cd frontend
   npx serve
   ```

   Using VS Code Live Server extension:
   - Install "Live Server" extension
   - Right-click on `index.html`
   - Select "Open with Live Server"

### Backend Setup

Make sure the Flask backend is running:

```bash
cd backend
python app.py
```

The backend should be accessible at: http://localhost:5000

## Usage

### Adding a Todo

1. Type your task in the "What needs to be done?" field
2. (Optional) Add a description in the text area
3. Click "Add Task" or press Enter
4. Your todo will appear at the top of the list

### Managing Todos

- **Complete a todo**: Click the checkbox next to the todo
- **Delete a todo**: Click the trash icon (confirmation required)
- **Filter todos**: Use the All/Active/Completed tabs

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Focus on the input field

## API Integration

The frontend communicates with the Flask backend using these endpoints:

- `GET /api/todos` - Fetch all todos
- `POST /api/todos` - Create a new todo
- `PATCH /api/todos/:id/toggle` - Toggle completion status
- `DELETE /api/todos/:id` - Delete a todo
- `GET /api/health` - Health check

## Configuration

To change the API base URL, edit the `API_BASE_URL` constant in `app.js`:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Responsive Breakpoints

- **Desktop**: > 768px
- **Tablet**: 481px - 768px
- **Mobile**: ≤ 480px

## Customization

### Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary-color: #6366f1;
    --success-color: #10b981;
    --danger-color: #ef4444;
    /* ... more colors */
}
```

### Animations

To disable animations (accessibility):

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

## Troubleshooting

### "Cannot connect to backend" error

**Solution**: Ensure the Flask backend is running on port 5000:
```bash
cd backend
python app.py
```

### CORS errors

**Solution**: The backend has CORS enabled. If you still see errors, check that:
- Backend is running
- CORS is properly configured in `backend/app.py`

### Todos not loading

**Solution**: 
1. Check browser console for errors (F12)
2. Verify backend is accessible: http://localhost:5000/api/health
3. Check network tab in browser DevTools

### Styling issues

**Solution**:
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Ensure `styles.css` is in the same directory as `index.html`

## Performance

- **Lightweight**: No external dependencies
- **Fast**: Vanilla JavaScript with minimal DOM manipulation
- **Optimized**: CSS animations use GPU acceleration
- **Efficient**: Debounced operations where needed

## Security

- ✅ XSS protection via HTML escaping
- ✅ Input validation on frontend and backend
- ✅ Confirmation dialogs for destructive actions
- ✅ CORS properly configured

## Future Enhancements

Potential features to add:

- [ ] Edit todo inline
- [ ] Drag and drop reordering
- [ ] Due dates and reminders
- [ ] Categories/tags
- [ ] Search functionality
- [ ] Dark mode toggle
- [ ] Bulk operations
- [ ] Export/import todos
- [ ] Offline support with Service Workers
- [ ] Progressive Web App (PWA)

## Contributing

To contribute:

1. Test your changes across different browsers
2. Ensure responsive design works on mobile
3. Follow existing code style
4. Add comments for complex logic
5. Test with backend API

## License

This project is part of the Todo App and follows the same license.

## Credits

Built with ❤️ using vanilla JavaScript, HTML5, and CSS3.

Icons: Inline SVG (Feather Icons style)