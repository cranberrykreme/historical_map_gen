from flask import Blueprint, jsonify, send_file, request
import os

assets_bp = Blueprint('assets', __name__)

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@assets_bp.route('/api/assets/upload', methods=['POST'])
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
    save_path = os.path.join(save_dir, file.filename)
    file.save(save_path)

    return jsonify({"success": True, "filename": file.filename, "type": asset_type})

@assets_bp.route('/api/assets/<asset_type>')
def list_assets(asset_type: str):
    asset_dir = os.path.join(ASSETS_DIR, asset_type)
    if not os.path.exists(asset_dir):
        return jsonify({"files": []})
    files = [f for f in os.listdir(asset_dir) if allowed_file(f)]
    return jsonify({"files": files})

@assets_bp.route('/api/assets/<asset_type>/<filename>')
def get_asset(asset_type: str, filename: str):
    asset_dir = os.path.join(ASSETS_DIR, asset_type)
    file_path = os.path.join(asset_dir, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    return send_file(file_path)