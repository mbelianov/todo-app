// ===== Configuration =====
// This is the base URL for our Flask backend API
// All API requests will be made to endpoints starting with this URL
// Example: http://localhost:5000/api/todos
const API_BASE_URL = 'http://localhost:5000/api';

// ===== State Management =====
// In JavaScript, we need to keep track of our application's data
// These variables store the current state of our app

// 'todos' is an array that holds all our todo items
// Each todo is an object with properties like: id, title, description, completed, created_at
let todos = [];

// 'currentFilter' tracks which filter is active: 'all', 'active', or 'completed'
// This determines which todos we show to the user
let currentFilter = 'all';

// ===== DOM Elements =====
// DOM stands for "Document Object Model" - it's how JavaScript interacts with HTML
// We're storing references to HTML elements so we can manipulate them later
// This is more efficient than searching for them every time we need them

const todoForm = document.getElementById('todoForm');              // The form for adding new todos
const todoTitle = document.getElementById('todoTitle');            // Input field for todo title
const todoDescription = document.getElementById('todoDescription'); // Textarea for todo description
const todoList = document.getElementById('todoList');              // Container where todos are displayed
const loadingState = document.getElementById('loadingState');      // Loading spinner element
const errorMessage = document.getElementById('errorMessage');      // Error message container
const emptyState = document.getElementById('emptyState');          // "No todos" message
const filterTabs = document.querySelectorAll('.filter-tab');       // All filter buttons (All/Active/Completed)
const totalCount = document.getElementById('totalCount');          // Total todos counter
const activeCount = document.getElementById('activeCount');        // Active todos counter
const completedCount = document.getElementById('completedCount');  // Completed todos counter
const toast = document.getElementById('toast');                    // Toast notification element

// ===== API Functions =====
// These functions handle communication with our Flask backend
// They use the Fetch API to make HTTP requests

/**
 * FETCH ALL TODOS FROM THE SERVER
 * 
 * This function retrieves all todos from the backend API.
 * 
 * WHY ASYNC/AWAIT?
 * - Network requests take time (they're "asynchronous")
 * - 'async' marks this function as asynchronous
 * - 'await' pauses execution until the network request completes
 * - This makes our code easier to read than using callbacks or .then()
 * 
 * ERROR HANDLING:
 * - try/catch blocks handle errors gracefully
 * - If the network request fails, we catch the error and show a message
 * - finally block runs regardless of success/failure (good for cleanup)
 */
async function fetchTodos() {
    try {
        // STEP 1: Show loading spinner to give user feedback
        showLoading(true);
        hideError();
        
        // STEP 2: Make GET request to fetch todos
        // fetch() returns a Promise, so we 'await' it
        // This sends an HTTP GET request to: http://localhost:5000/api/todos
        const response = await fetch(`${API_BASE_URL}/todos`);
        
        // STEP 3: Parse the JSON response
        // response.json() also returns a Promise, so we await it too
        // This converts the response body from JSON string to JavaScript object
        const data = await response.json();
        
        // STEP 4: Check if the request was successful
        // Our backend returns { success: true/false, data: [...], count: N }
        if (data.success) {
            // Update our local todos array with the data from server
            todos = data.data;
            
            // Re-render the UI to show the todos
            renderTodos();
            
            // Update the statistics (total, active, completed counts)
            updateStats();
        } else {
            // If backend returned success: false, show the error message
            showError(data.error || 'Failed to fetch todos');
        }
    } catch (error) {
        // CATCH BLOCK: Handles any errors that occur during the try block
        // Common errors: network failure, server not running, invalid JSON
        console.error('Error fetching todos:', error);
        showError('Failed to connect to the server. Please make sure the backend is running.');
    } finally {
        // FINALLY BLOCK: Always runs, whether try succeeded or failed
        // Perfect for cleanup tasks like hiding the loading spinner
        showLoading(false);
    }
}

/**
 * CREATE A NEW TODO
 * 
 * This function sends a POST request to create a new todo on the server.
 * 
 * HOW POST REQUESTS WORK:
 * - GET requests retrieve data (like fetchTodos above)
 * - POST requests send data to create something new
 * - We include the data in the request body as JSON
 * 
 * @param {string} title - The todo title (required)
 * @param {string} description - The todo description (optional)
 * @returns {boolean} - Returns true if successful, false if failed
 */
async function createTodo(title, description) {
    try {
        // STEP 1: Make POST request with todo data
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'POST',  // Specify this is a POST request (default is GET)
            
            // Headers tell the server what format we're sending
            headers: {
                'Content-Type': 'application/json',  // We're sending JSON data
            },
            
            // Body contains the actual data we're sending
            // JSON.stringify() converts JavaScript object to JSON string
            body: JSON.stringify({
                title: title.trim(),           // Remove whitespace from title
                description: description.trim(), // Remove whitespace from description
                completed: false               // New todos start as incomplete
            })
        });
        
        // STEP 2: Parse the response
        const data = await response.json();
        
        // STEP 3: Handle the response
        if (data.success) {
            // Backend created the todo and returned it with an ID
            // unshift() adds the new todo to the START of the array
            // (so newest todos appear first)
            todos.unshift(data.data);
            
            // Update the UI
            renderTodos();
            updateStats();
            
            // Show success message to user
            showToast('Task added successfully!', 'success');
            
            // Return true to indicate success
            return true;
        } else {
            // Backend returned an error (e.g., validation failed)
            showError(data.error || 'Failed to create todo');
            return false;
        }
    } catch (error) {
        // Network error or other exception occurred
        console.error('Error creating todo:', error);
        showError('Failed to create todo. Please try again.');
        return false;
    }
}

/**
 * TOGGLE TODO COMPLETION STATUS
 * 
 * This function marks a todo as complete/incomplete.
 * 
 * WHY PATCH INSTEAD OF PUT?
 * - PUT typically replaces the entire resource
 * - PATCH updates only specific fields
 * - We're only changing the 'completed' field, so PATCH is more appropriate
 * 
 * @param {number} id - The ID of the todo to toggle
 */
async function toggleTodo(id) {
    try {
        // STEP 1: Send PATCH request to toggle endpoint
        // The backend has a special endpoint just for toggling: /todos/:id/toggle
        const response = await fetch(`${API_BASE_URL}/todos/${id}/toggle`, {
            method: 'PATCH',  // PATCH for partial updates
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        // STEP 2: Parse response
        const data = await response.json();
        
        // STEP 3: Update local state if successful
        if (data.success) {
            // Find the todo in our local array
            // find() returns the first element that matches the condition
            const todo = todos.find(t => t.id === id);
            
            if (todo) {
                // Update the completed status with the value from server
                todo.completed = data.data.completed;
                
                // Re-render to show the change (strikethrough, checkbox, etc.)
                renderTodos();
                updateStats();
                
                // Show appropriate message based on new status
                showToast(
                    todo.completed ? 'Task completed! 🎉' : 'Task marked as active',
                    'success'
                );
            }
        } else {
            showError(data.error || 'Failed to toggle todo');
        }
    } catch (error) {
        console.error('Error toggling todo:', error);
        showError('Failed to update todo. Please try again.');
    }
}

/**
 * DELETE A TODO
 * 
 * This function permanently removes a todo from the database.
 * 
 * WHY CONFIRM BEFORE DELETING?
 * - Deletion is permanent and can't be undone
 * - confirm() shows a browser dialog asking user to confirm
 * - This prevents accidental deletions
 * 
 * @param {number} id - The ID of the todo to delete
 */
async function deleteTodo(id) {
    // STEP 1: Ask user to confirm deletion
    // confirm() returns true if user clicks OK, false if they click Cancel
    if (!confirm('Are you sure you want to delete this task?')) {
        return;  // Exit function if user cancels
    }
    
    try {
        // STEP 2: Send DELETE request
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE'  // DELETE method removes the resource
        });
        
        // STEP 3: Parse response
        const data = await response.json();
        
        // STEP 4: Remove from local state if successful
        if (data.success) {
            // filter() creates a new array excluding the deleted todo
            // It keeps all todos where id !== the deleted id
            todos = todos.filter(t => t.id !== id);
            
            // Update UI
            renderTodos();
            updateStats();
            
            showToast('Task deleted successfully', 'success');
        } else {
            showError(data.error || 'Failed to delete todo');
        }
    } catch (error) {
        console.error('Error deleting todo:', error);
        showError('Failed to delete todo. Please try again.');
    }
}

// ===== UI Functions =====
// These functions handle updating the user interface

/**
 * RENDER TODOS TO THE PAGE
 * 
 * This function takes our todos array and converts it to HTML.
 * 
 * HOW IT WORKS:
 * 1. Filter todos based on current filter (all/active/completed)
 * 2. If no todos, show empty state message
 * 3. Otherwise, generate HTML for each todo using template literals
 * 4. Insert the HTML into the DOM
 * 
 * TEMPLATE LITERALS:
 * - Use backticks (`) instead of quotes
 * - Allow multi-line strings
 * - Can embed expressions with ${expression}
 * - Perfect for generating HTML dynamically
 */
function renderTodos() {
    // STEP 1: Get filtered todos based on current filter
    const filteredTodos = getFilteredTodos();
    
    // STEP 2: Handle empty state
    if (filteredTodos.length === 0) {
        todoList.innerHTML = '';  // Clear the list
        emptyState.style.display = 'block';  // Show "no todos" message
        return;  // Exit function early
    }
    
    // STEP 3: Hide empty state since we have todos
    emptyState.style.display = 'none';
    
    // STEP 4: Generate HTML for all todos
    // map() transforms each todo into an HTML string
    // join('') combines all strings into one
    todoList.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-header">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo(${todo.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div class="todo-content">
                    <div class="todo-title">${escapeHtml(todo.title)}</div>
                    ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
                    <div class="todo-meta">
                        <div class="todo-date">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${formatDate(todo.created_at)}
                        </div>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="btn-icon-only btn-delete" onclick="deleteTodo(${todo.id})" title="Delete task">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * GET FILTERED TODOS
 * 
 * Returns todos based on the current filter setting.
 * 
 * FILTER LOGIC:
 * - 'all': Return all todos
 * - 'active': Return only incomplete todos (completed = false)
 * - 'completed': Return only completed todos (completed = true)
 * 
 * @returns {Array} - Filtered array of todos
 */
function getFilteredTodos() {
    // Switch statement checks currentFilter and returns appropriate todos
    switch (currentFilter) {
        case 'active':
            // filter() creates new array with only items that pass the test
            // Keep todos where completed is false
            return todos.filter(todo => !todo.completed);
        case 'completed':
            // Keep todos where completed is true
            return todos.filter(todo => todo.completed);
        default:
            // Return all todos (no filtering)
            return todos;
    }
}

/**
 * UPDATE STATISTICS
 * 
 * Calculates and displays todo statistics in the header.
 * 
 * CALCULATIONS:
 * - Total: Count of all todos
 * - Completed: Count of todos where completed = true
 * - Active: Total minus completed
 */
function updateStats() {
    // Calculate totals
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;
    
    // Update the DOM elements with new values
    // textContent is safer than innerHTML (prevents XSS)
    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;
}

/**
 * SHOW/HIDE LOADING STATE
 * 
 * Displays or hides the loading spinner.
 * 
 * WHY SHOW LOADING?
 * - Gives user feedback that something is happening
 * - Prevents confusion during network requests
 * - Improves perceived performance
 * 
 * @param {boolean} show - True to show loading, false to hide
 */
function showLoading(show) {
    // Set display style based on show parameter
    loadingState.style.display = show ? 'block' : 'none';
    todoList.style.display = show ? 'none' : 'block';
}

/**
 * SHOW ERROR MESSAGE
 * 
 * Displays an error message to the user.
 * 
 * AUTO-HIDE:
 * - Error automatically disappears after 5 seconds
 * - setTimeout() schedules a function to run after a delay
 * - 5000 milliseconds = 5 seconds
 * 
 * @param {string} message - The error message to display
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Automatically hide after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

/**
 * HIDE ERROR MESSAGE
 * 
 * Immediately hides any displayed error message.
 */
function hideError() {
    errorMessage.style.display = 'none';
}

/**
 * SHOW TOAST NOTIFICATION
 * 
 * Displays a temporary notification at the bottom of the screen.
 * 
 * TOAST PATTERN:
 * - Non-intrusive way to show feedback
 * - Appears briefly then disappears
 * - Doesn't block user interaction
 * 
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success' or 'error'
 */
function showToast(message, type = 'success') {
    // Set the message
    toast.textContent = message;
    
    // Set the CSS classes (controls color/style)
    toast.className = `toast ${type}`;
    
    // Add 'show' class to trigger CSS animation
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * FORMAT DATE TO READABLE STRING
 * 
 * Converts ISO date string to human-readable relative time.
 * 
 * EXAMPLES:
 * - "Just now" (< 1 minute ago)
 * - "5 mins ago"
 * - "2 hours ago"
 * - "3 days ago"
 * - "Jan 15" (older dates)
 * 
 * WHY RELATIVE TIME?
 * - More intuitive than absolute timestamps
 * - Users care more about "how long ago" than exact time
 * 
 * @param {string} dateString - ISO date string from backend
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    // Parse the ISO date string into a Date object
    const date = new Date(dateString);
    const now = new Date();
    
    // Calculate time difference in milliseconds
    const diffMs = now - date;
    
    // Convert to different units
    const diffMins = Math.floor(diffMs / 60000);      // 60000 ms = 1 minute
    const diffHours = Math.floor(diffMs / 3600000);   // 3600000 ms = 1 hour
    const diffDays = Math.floor(diffMs / 86400000);   // 86400000 ms = 1 day
    
    // Return appropriate format based on how long ago
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // For older dates, show formatted date
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

/**
 * ESCAPE HTML TO PREVENT XSS ATTACKS
 * 
 * Converts special HTML characters to safe entities.
 * 
 * SECURITY CONCERN - XSS (Cross-Site Scripting):
 * - If user enters: <script>alert('hack')</script>
 * - Without escaping: Browser would execute the script!
 * - With escaping: Browser shows it as text, not code
 * 
 * HOW IT WORKS:
 * - Create a temporary div element
 * - Set textContent (browser auto-escapes)
 * - Read innerHTML (get escaped version)
 * 
 * EXAMPLE:
 * - Input: "<script>alert('hi')</script>"
 * - Output: "<script>alert('hi')</script>"
 * 
 * @param {string} text - Text that might contain HTML
 * @returns {string} - Safe HTML-escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;  // textContent automatically escapes HTML
    return div.innerHTML;    // innerHTML gives us the escaped version
}

// ===== Event Listeners =====
// Event listeners respond to user actions (clicks, typing, etc.)

/**
 * HANDLE FORM SUBMISSION
 * 
 * This runs when user submits the "Add Todo" form.
 * 
 * EVENT OBJECT:
 * - 'e' is the event object
 * - Contains info about the event (what was clicked, key pressed, etc.)
 * - e.preventDefault() stops the default form submission behavior
 *   (which would reload the page)
 */
todoForm.addEventListener('submit', async (e) => {
    // Prevent default form submission (page reload)
    e.preventDefault();
    
    // Get values from input fields and remove whitespace
    const title = todoTitle.value.trim();
    const description = todoDescription.value.trim();
    
    // Validate: title is required
    if (!title) {
        showError('Please enter a task title');
        return;  // Exit if validation fails
    }
    
    // Try to create the todo
    const success = await createTodo(title, description);
    
    // If successful, clear the form and focus on input
    if (success) {
        todoForm.reset();      // Clear all form fields
        todoTitle.focus();     // Put cursor back in title field
    }
});

/**
 * HANDLE FILTER TAB CLICKS
 * 
 * This runs when user clicks on All/Active/Completed tabs.
 * 
 * FOREACH LOOP:
 * - Iterates over all filter tab elements
 * - Adds a click event listener to each one
 */
filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // STEP 1: Remove 'active' class from all tabs
        filterTabs.forEach(t => t.classList.remove('active'));
        
        // STEP 2: Add 'active' class to clicked tab
        tab.classList.add('active');
        
        // STEP 3: Update filter and re-render todos
        // data-filter is a custom HTML attribute we defined
        currentFilter = tab.dataset.filter;
        renderTodos();
    });
});

/**
 * HANDLE KEYBOARD SHORTCUTS
 * 
 * This runs whenever user presses a key anywhere on the page.
 * 
 * KEYBOARD SHORTCUT: Ctrl/Cmd + K
 * - Common pattern in modern apps (like VS Code, Slack)
 * - Quickly focus on search/input without using mouse
 * 
 * EVENT PROPERTIES:
 * - e.ctrlKey: true if Ctrl is pressed (Windows/Linux)
 * - e.metaKey: true if Cmd is pressed (Mac)
 * - e.key: the actual key pressed ('k' in this case)
 */
document.addEventListener('keydown', (e) => {
    // Check if Ctrl+K or Cmd+K was pressed
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();  // Prevent browser's default Ctrl+K behavior
        todoTitle.focus();   // Focus on the title input field
    }
});

// ===== Initialize App =====

/**
 * INITIALIZE THE APPLICATION
 * 
 * This function runs when the page first loads.
 * 
 * INITIALIZATION STEPS:
 * 1. Log startup messages to console
 * 2. Focus on input field for better UX
 * 3. Fetch todos from backend
 * 4. Check backend connection health
 * 
 * WHY ASYNC?
 * - We need to wait for fetchTodos() to complete
 * - async allows us to use await inside the function
 */
async function init() {
    console.log('🚀 Todo App initialized');
    console.log('📡 API Base URL:', API_BASE_URL);
    
    // Focus on input field so user can start typing immediately
    todoTitle.focus();
    
    // Fetch initial todos from backend
    await fetchTodos();
    
    // Check if backend is running by calling health endpoint
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        if (data.success) {
            console.log('✅ Backend connection successful');
        }
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        showError('Cannot connect to backend. Please ensure the Flask server is running on http://localhost:5000');
    }
}

// ===== Start the App =====
// This code runs immediately when the script loads

/**
 * WAIT FOR DOM TO BE READY
 * 
 * WHY CHECK READYSTATE?
 * - JavaScript might load before HTML is fully parsed
 * - We need to wait for DOM elements to exist before accessing them
 * - DOMContentLoaded event fires when HTML is fully loaded
 * 
 * TWO SCENARIOS:
 * 1. If DOM is still loading: Wait for DOMContentLoaded event
 * 2. If DOM is already loaded: Run init() immediately
 */
if (document.readyState === 'loading') {
    // DOM is still loading, wait for it
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already loaded, start immediately
    init();
}

// Made with Bob
