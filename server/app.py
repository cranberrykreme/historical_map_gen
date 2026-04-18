from flask import Flask, jsonify, send_file
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({"status":"ok", "message":"Historical_Map_Gen backend running"})

@app.route('/api/map')
def get_map():
    map_path = os.path.join('assets', 'maps', 'MasterMapV1.svg')
    if not os.path.exists(map_path):
        return jsonify({"error": "Map file not found"}), 404
    return send_file(map_path, mimetype='image/svg+xml')

if __name__ == '__main__':
    app.run(debug=True, port=5000)