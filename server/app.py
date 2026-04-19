from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'assets')
PROJECTS_DIR = os.path.join(os.path.dirname(__file__), 'projects')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health')
def health():
    return jsonify({"status":"ok", "message":"Historical_Map_Gen backend running"})

@app.route('/api/map')
def get_map():
    map_path = os.path.join('assets', 'maps', 'MasterMapV1.svg')
    if not os.path.exists(map_path):
        return jsonify({"error": "Map file not found"}), 404
    return send_file(map_path, mimetype='image/svg+xml')

@app.route('/api/assets/upload', methods=['POST'])
def upload_asset():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    asset_type = request.form.get('type', 'units')

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400
    
    save_dir = os.path.join(ASSETS_DIR, asset_type)
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file.filename)
    file.save(file_path)

    return jsonify({"success": True, "filename": file.filename, "type": asset_type})

@app.route('/api/assets/<asset_type>')
def list_assets(asset_type: str):
    asset_dir = os.path.join(ASSETS_DIR, asset_type)
    if not os.path.exists(asset_dir):
        return jsonify({"files": []})
    files = [f for f in os.listdir(asset_dir) if allowed_file(f)]
    return jsonify({"files": files})

@app.route('/api/assets/<asset_type>/<filename>')
def get_asset(asset_type: str, filename: str):
    asset_dir = os.path.join(ASSETS_DIR, asset_type)
    file_path = os.path.join(asset_dir, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    return send_file(file_path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)