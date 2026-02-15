from flask import Flask, request, jsonify
from flask_cors import CORS
from database import db, init_db
from models import Todo

# Create Flask application
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change in production

# Enable CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize database
init_db(app)

# API Routes

@app.route('/api/todos', methods=['GET'])
def get_todos():
    """Get all todos."""
    try:
        todos = Todo.query.order_by(Todo.created_at.desc()).all()
        return jsonify({
            'success': True,
            'data': [todo.to_dict() for todo in todos],
            'count': len(todos)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/todos/<int:todo_id>', methods=['GET'])
def get_todo(todo_id):
    """Get a single todo by ID."""
    try:
        todo = Todo.query.get(todo_id)
        if not todo:
            return jsonify({
                'success': False,
                'error': 'Todo not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': todo.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/todos', methods=['POST'])
def create_todo():
    """Create a new todo."""
    try:
        data = request.get_json()
        
        # Validation
        if not data or not data.get('title'):
            return jsonify({
                'success': False,
                'error': 'Title is required'
            }), 400
        
        # Create new todo
        todo = Todo(
            title=data['title'],
            description=data.get('description', ''),
            completed=data.get('completed', False)
        )
        
        db.session.add(todo)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': todo.to_dict(),
            'message': 'Todo created successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    """Update an existing todo."""
    try:
        todo = Todo.query.get(todo_id)
        if not todo:
            return jsonify({
                'success': False,
                'error': 'Todo not found'
            }), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'title' in data:
            todo.title = data['title']
        if 'description' in data:
            todo.description = data['description']
        if 'completed' in data:
            todo.completed = data['completed']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': todo.to_dict(),
            'message': 'Todo updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    """Delete a todo."""
    try:
        todo = Todo.query.get(todo_id)
        if not todo:
            return jsonify({
                'success': False,
                'error': 'Todo not found'
            }), 404
        
        db.session.delete(todo)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Todo deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/todos/<int:todo_id>/toggle', methods=['PATCH'])
def toggle_todo(todo_id):
    """Toggle the completed status of a todo."""
    try:
        todo = Todo.query.get(todo_id)
        if not todo:
            return jsonify({
                'success': False,
                'error': 'Todo not found'
            }), 404
        
        todo.completed = not todo.completed
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': todo.id,
                'completed': todo.completed
            },
            'message': 'Todo status toggled successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'success': True,
        'message': 'API is running'
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# Made with Bob
