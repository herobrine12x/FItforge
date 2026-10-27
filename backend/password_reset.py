"""
FitForge - Password Reset Blueprint (Flask + MySQL)
Handles self-service password recovery with secure SHA-256 hashed one-time tokens.

To register this Blueprint in your main Flask app file (e.g. app.py), add:
-------------------------------------------------------------------------
from backend.password_reset import password_reset_bp
app.register_blueprint(password_reset_bp)
-------------------------------------------------------------------------
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash

# ==============================================================================
# CONFIGURABLE DATABASE SCHEMA CONSTANTS
# Adjust these constants if your database table or column names differ.
# ==============================================================================
USERS_TABLE = os.environ.get('USERS_TABLE', 'users')
USER_ID_COL = os.environ.get('USER_ID_COL', 'id')
USER_EMAIL_COL = os.environ.get('USER_EMAIL_COL', 'email')
USER_PASSWORD_HASH_COL = os.environ.get('USER_PASSWORD_HASH_COL', 'password_hash')

PASSWORD_RESETS_TABLE = os.environ.get('PASSWORD_RESETS_TABLE', 'password_resets')
RESET_ID_COL = os.environ.get('RESET_ID_COL', 'id')
RESET_USER_ID_COL = os.environ.get('RESET_USER_ID_COL', 'user_id')
RESET_TOKEN_HASH_COL = os.environ.get('RESET_TOKEN_HASH_COL', 'token_hash')
RESET_EXPIRES_AT_COL = os.environ.get('RESET_EXPIRES_AT_COL', 'expires_at')
RESET_USED_COL = os.environ.get('RESET_USED_COL', 'used')
RESET_CREATED_AT_COL = os.environ.get('RESET_CREATED_AT_COL', 'created_at')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
GENERIC_FORGOT_MESSAGE = "If that email exists, a reset link was sent."

# ==============================================================================
# BLUEPRINT INITIALIZATION
# ==============================================================================
password_reset_bp = Blueprint('password_reset', __name__)


# ==============================================================================
# DATABASE CONNECTION ADAPTER
# Reuses your existing application's database connection function.
# ==============================================================================
def get_db():
    """
    Retrieves the existing database connection or session.
    Inspects standard Flask locations (e.g. app.db, db.get_db_connection, or db.session).
    """
    for module_name in ('app', 'db', 'database', 'src.app'):
        try:
            mod = __import__(module_name, fromlist=['get_db_connection', 'get_db', 'db'])
            if hasattr(mod, 'get_db_connection') and callable(getattr(mod, 'get_db_connection')):
                return mod.get_db_connection()
            if hasattr(mod, 'get_db') and callable(getattr(mod, 'get_db')):
                return mod.get_db()
            if hasattr(mod, 'db'):
                return mod.db
        except (ImportError, Exception):
            continue

    raise RuntimeError(
        "Could not automatically detect your existing database connection function. "
        "Please edit `get_db()` in backend/password_reset.py to return your database connection or SQLAlchemy db instance."
    )


def execute_sql(sql: str, params: tuple = (), fetchone: bool = False, fetchall: bool = False, commit: bool = False):
    """
    Executes a parameterized SQL statement against the existing DB connection.
    Supports raw MySQL connections (PyMySQL, mysql.connector) as well as Flask-SQLAlchemy.
    """
    db_obj = get_db()

    # Flask-SQLAlchemy `db` or `db.session` support
    if hasattr(db_obj, 'session') or hasattr(db_obj, 'execute'):
        from sqlalchemy import text
        session = getattr(db_obj, 'session', db_obj)
        # Convert %s placeholders to :param positional mapping for SQLAlchemy text() if needed
        # Or execute via raw DB-API connection if available:
        raw_conn = None
        if hasattr(db_obj, 'engine') and hasattr(db_obj.engine, 'raw_connection'):
            try:
                raw_conn = db_obj.engine.raw_connection()
            except Exception:
                raw_conn = None

        if raw_conn:
            cursor = raw_conn.cursor()
            try:
                cursor.execute(sql, params)
                row = cursor.fetchone() if fetchone else (cursor.fetchall() if fetchall else None)
                if commit:
                    raw_conn.commit()
                return row
            finally:
                cursor.close()
                raw_conn.close()

        # Fallback to session.execute
        # Replace %s with :p0, :p1, ...
        formatted_sql = sql
        param_dict = {}
        parts = formatted_sql.split('%s')
        if len(parts) > 1:
            rebuilt = []
            for idx, part in enumerate(parts[:-1]):
                param_name = f"p_{idx}"
                rebuilt.append(part + f":{param_name}")
                param_dict[param_name] = params[idx]
            rebuilt.append(parts[-1])
            formatted_sql = "".join(rebuilt)

        result = session.execute(text(formatted_sql), param_dict)
        if commit:
            session.commit()
        if fetchone:
            return result.fetchone()
        if fetchall:
            return result.fetchall()
        return None

    # Standard DB-API connection (PyMySQL / mysql.connector / sqlite3)
    conn = db_obj
    cursor = conn.cursor()
    try:
        cursor.execute(sql, params)
        res = cursor.fetchone() if fetchone else (cursor.fetchall() if fetchall else None)
        if commit:
            conn.commit()
        return res
    finally:
        cursor.close()


def send_reset_notification(email: str, reset_link: str):
    """
    Dispatches password reset link via SMTP (STARTTLS) if configured,
    or logs the link directly to the Flask console in demo mode.
    Never stores or prints passwords.
    """
    smtp_host = os.environ.get('SMTP_HOST')
    if smtp_host:
        try:
            smtp_port = int(os.environ.get('SMTP_PORT', 587))
            smtp_user = os.environ.get('SMTP_USER', '')
            smtp_password = os.environ.get('SMTP_PASSWORD', '')
            smtp_from = os.environ.get('SMTP_FROM', smtp_user or 'noreply@fitforge.com')

            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'FitForge - Password Reset Request'
            msg['From'] = smtp_from
            msg['To'] = email

            body = (
                f"Hello,\n\n"
                f"We received a request to reset your password for your FitForge account.\n\n"
                f"To set a new password, open this link within 30 minutes:\n"
                f"{reset_link}\n\n"
                f"If you did not request this change, please ignore this email.\n\n"
                f"- The FitForge Team"
            )
            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.sendmail(smtp_from, [email], msg.as_string())
        except Exception as e:
            # Log error internally on server; do not expose SMTP exception to the user
            print(f"[FitForge SMTP Error] Could not send reset email: {e}")
    else:
        # Demo mode: print link directly in console
        print("\n" + "=" * 65)
        print("[FITFORGE PASSWORD RESET - DEMO MODE]")
        print(f"SMTP_HOST not set. Password reset link generated:")
        print(f"User Email: {email}")
        print(f"Reset URL:  {reset_link}")
        print("Validity:   30 minutes (Single use only)")
        print("=" * 65 + "\n")


# ==============================================================================
# ENDPOINT: POST /api/forgot-password
# ==============================================================================
@password_reset_bp.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """
    Receives { "email": string }.
    Normalizes email, checks if user exists, invalidates previous unused tokens,
    creates a cryptographically secure token, stores only its SHA-256 hash,
    and sends or logs the reset link. Always returns generic message to avoid email enumeration.
    """
    payload = request.get_json(silent=True) or {}
    raw_email = payload.get('email', '')
    email = str(raw_email).strip().lower()

    if not email:
        return jsonify({"message": GENERIC_FORGOT_MESSAGE}), 200

    try:
        # Check if user exists using parameterized query
        find_user_sql = (
            f"SELECT {USER_ID_COL} FROM {USERS_TABLE} "
            f"WHERE LOWER({USER_EMAIL_COL}) = %s LIMIT 1"
        )
        user_row = execute_sql(find_user_sql, (email,), fetchone=True)

        if user_row:
            # Extract user_id (supports dict, tuple, or Row object)
            user_id = user_row[0] if isinstance(user_row, (tuple, list)) else getattr(user_row, USER_ID_COL, user_row.get(USER_ID_COL) if isinstance(user_row, dict) else None)

            # Invalidate previous unused tokens for this user
            invalidate_sql = (
                f"UPDATE {PASSWORD_RESETS_TABLE} SET {RESET_USED_COL} = 1 "
                f"WHERE {RESET_USER_ID_COL} = %s AND {RESET_USED_COL} = 0"
            )
            execute_sql(invalidate_sql, (user_id,), commit=True)

            # Generate cryptographically secure random token and SHA-256 hash
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

            # Expiry set to 30 minutes from now (UTC)
            now_utc = datetime.now(timezone.utc)
            expires_at = (now_utc + timedelta(minutes=30)).strftime('%Y-%m-%d %H:%M:%S')

            # Insert new token hash record
            insert_sql = (
                f"INSERT INTO {PASSWORD_RESETS_TABLE} "
                f"({RESET_USER_ID_COL}, {RESET_TOKEN_HASH_COL}, {RESET_EXPIRES_AT_COL}, {RESET_USED_COL}) "
                f"VALUES (%s, %s, %s, 0)"
            )
            execute_sql(insert_sql, (user_id, token_hash, expires_at), commit=True)

            # Build reset link
            reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"

            # Dispatch email or print to console
            send_reset_notification(email, reset_link)

    except Exception as err:
        # Log database error for administrators, but do not leak details in HTTP response
        print(f"[FitForge Error] forgot_password error: {err}")

    # ALWAYS return the exact same response regardless of email existence
    return jsonify({"message": GENERIC_FORGOT_MESSAGE}), 200


# ==============================================================================
# ENDPOINT: POST /api/reset-password
# ==============================================================================
@password_reset_bp.route('/api/reset-password', methods=['POST'])
def reset_password():
    """
    Receives { "token": string, "password": string }.
    Validates token and expiration, hashes new password via Werkzeug,
    updates user record, and marks the token used.
    """
    payload = request.get_json(silent=True) or {}
    token = str(payload.get('token', '')).strip()
    new_password = str(payload.get('password', ''))

    if not token:
        return jsonify({"error": "Invalid or expired link."}), 400

    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400

    try:
        # Calculate SHA-256 hash of incoming token
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        now_utc_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

        # Find active, unexpired, unused token record
        find_token_sql = (
            f"SELECT {RESET_ID_COL}, {RESET_USER_ID_COL} FROM {PASSWORD_RESETS_TABLE} "
            f"WHERE {RESET_TOKEN_HASH_COL} = %s AND {RESET_USED_COL} = 0 AND {RESET_EXPIRES_AT_COL} > %s "
            f"LIMIT 1"
        )
        reset_row = execute_sql(find_token_sql, (token_hash, now_utc_str), fetchone=True)

        if not reset_row:
            return jsonify({"error": "Invalid or expired link."}), 400

        # Extract reset_id and user_id
        if isinstance(reset_row, (tuple, list)):
            reset_id, user_id = reset_row[0], reset_row[1]
        elif isinstance(reset_row, dict):
            reset_id = reset_row[RESET_ID_COL]
            user_id = reset_row[RESET_USER_ID_COL]
        else:
            reset_id = getattr(reset_row, RESET_ID_COL)
            user_id = getattr(reset_row, RESET_USER_ID_COL)

        # Hash the new password with werkzeug
        password_hash = generate_password_hash(new_password)

        # Update users table with new password hash
        update_user_sql = (
            f"UPDATE {USERS_TABLE} SET {USER_PASSWORD_HASH_COL} = %s "
            f"WHERE {USER_ID_COL} = %s"
        )
        execute_sql(update_user_sql, (password_hash, user_id), commit=True)

        # Mark token as used to enforce single-use
        mark_used_sql = (
            f"UPDATE {PASSWORD_RESETS_TABLE} SET {RESET_USED_COL} = 1 "
            f"WHERE {RESET_ID_COL} = %s"
        )
        execute_sql(mark_used_sql, (reset_id,), commit=True)

        return jsonify({
            "success": True,
            "message": "Password successfully updated. You can now log in."
        }), 200

    except Exception as err:
        print(f"[FitForge Error] reset_password error: {err}")
        return jsonify({"error": "An error occurred while resetting your password."}), 500
