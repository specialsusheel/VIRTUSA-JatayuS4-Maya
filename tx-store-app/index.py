from flask import Flask, jsonify
from flask_mysqldb import MySQL
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Allow React frontend to access this API

# MySQL config (match your .env or local config)
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'financial_records'

mysql = MySQL(app)

@app.route('/records', methods=['GET'])
def get_records():
    conn = mysql.connection
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM transactions ORDER BY datetime DESC")
    records = cursor.fetchall()
    return jsonify(records)

if __name__ == '__main__':
    app.run(debug=True)

    # app.py (add this new route)

from flask import request # Import request to get POST data

# ... (existing imports and config)

@app.route('/records', methods=['POST']) # Add POST method
def add_record():
    try:
        data = request.get_json()

        # Extract data from the request body, matching frontend fields
        description = data.get('description')
        amount = data.get('amount')
        category = data.get('category')
        transaction_date = data.get('date') # Flask will receive 'date' from frontend
        notes = data.get('notes', '') # Optional
        blockchain_hash = data.get('transactionHash') # From frontend
        status = data.get('status', 'Original') # Default status if not provided

        # Validate required fields
        if not all([description, amount, category, transaction_date, blockchain_hash]):
            return jsonify({"message": "Missing required fields"}), 400

        # Convert amount to float for database storage
        try:
            amount_float = float(amount)
        except ValueError:
            return jsonify({"message": "Invalid amount format"}), 400

        conn = mysql.connection
        cursor = conn.cursor() # Use non-dictionary cursor for execute with tuple

        # Insert into database
        # Note: 'datetime' column will store the frontend's 'date' combined with current time.
        # You might want to adjust this if you only want the date.
        # For now, assuming you want a timestamp for when it was recorded in DB.
        query = """
        INSERT INTO transactions (description, amount, category, datetime, notes, status, tx_hash)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            description,
            amount_float,
            category,
            transaction_date + ' ' + os.popen('date +%H:%M:%S').read().strip(), # Combine date with current time
            notes,
            status,
            blockchain_hash
        ))
        conn.commit()
        cursor.close()

        return jsonify({"message": "Record added successfully!", "id": cursor.lastrowid}), 201

    except Exception as e:
        print(f"Error adding record: {e}")
        return jsonify({"message": "Internal server error", "error": str(e)}), 500


