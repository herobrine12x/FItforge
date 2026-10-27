from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import secrets
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# --- DATABASE CONFIGURATION ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/fitforge_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- DEFINE YOUR TABLE ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True) 
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiration = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {"id": self.id, "username": self.username, "email": self.email}

# --- ROUTES ---
@app.route('/test-db')
def test_db():
    try:
        db.session.execute(db.text('SELECT 1'))
        return jsonify({"status": "success", "message": "Connected to MySQL perfectly!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/add-user')
def add_user():
    try:
        new_user = User(username="testuser", email="test@example.com")
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"status": "success", "message": "User added to database!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

# --- FORGOT PASSWORD ROUTES ---
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    
    if user:
        token = secrets.token_hex(20)
        user.reset_token = token
        user.reset_token_expiration = datetime.datetime.now() + datetime.timedelta(minutes=15)
        db.session.commit()
        
        reset_link = f"http://localhost:3000/#/reset-password?token={token}"
        print(f"\n--- PASSWORD RESET LINK FOR {email} ---")
        print(reset_link)
        print("---------------------------------------\n")
        
    return jsonify({"message": "If that email exists, a reset link has been sent."}), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    
    user = User.query.filter_by(reset_token=token).first()
    
    if not user or user.reset_token_expiration < datetime.datetime.now():
        return jsonify({"error": "Invalid or expired token"}), 400
        
    user.password = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expiration = None
    db.session.commit()
    
    return jsonify({"message": "Password successfully reset!"}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)      