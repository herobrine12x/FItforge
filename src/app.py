from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- DATABASE CONFIGURATION ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/fitforge_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- DEFINE YOUR FIRST TABLE ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

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

# Route to create a test user
@app.route('/add-user')
def add_user():
    try:
        new_user = User(username="testuser", email="test@example.com")
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"status": "success", "message": "User added to database!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# Route to get all users
@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

if __name__ == '__main__':
    # This line automatically creates the tables in MySQL if they don't exist
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)