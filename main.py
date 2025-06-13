
import os
from app import app

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('static/uploads', exist_ok=True)
    os.makedirs('static/results', exist_ok=True)
    os.makedirs('instance', exist_ok=True)
    
    # Run in debug mode for development
    app.run(host='127.0.0.1', port=5000, debug=True)
