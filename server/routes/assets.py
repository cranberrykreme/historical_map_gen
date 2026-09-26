from flask import Blueprint, jsonify, send_file, request
import os

assets_bp = Blueprint('assets', __name__)

PROJECTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'projects')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg'}


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_assets_dir(project_name: str) -> str:
    return os.path.join(PROJECTS_DIR, project_name, 'assets')


@assets_bp.route('/api/projects/<project_name>/assets/upload', methods=['POST'])
def upload_asset(project_name: str):
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    asset_type = request.form.get('type', 'units')

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    save_dir = os.path.join(get_assets_dir(project_name), asset_type)
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, file.filename)
    file.save(save_path)

    return jsonify({"success": True, "filename": file.filename, "type": asset_type})


@assets_bp.route('/api/projects/<project_name>/assets/<asset_type>')
def list_assets(project_name: str, asset_type: str):
    asset_dir = os.path.join(get_assets_dir(project_name), asset_type)
    if not os.path.exists(asset_dir):
        return jsonify({"files": []})
    files = [f for f in os.listdir(asset_dir) if allowed_file(f)]
    return jsonify({"files": files})


@assets_bp.route('/api/projects/<project_name>/assets/<asset_type>/<filename>', methods=['GET'])
def get_asset(project_name: str, asset_type: str, filename: str):
    asset_dir = os.path.join(get_assets_dir(project_name), asset_type)
    file_path = os.path.join(asset_dir, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    return send_file(file_path)


@assets_bp.route('/api/projects/<project_name>/assets/<asset_type>/<filename>', methods=['DELETE'])
def delete_asset(project_name: str, asset_type: str, filename: str):
    asset_dir = os.path.join(get_assets_dir(project_name), asset_type)
    file_path = os.path.join(asset_dir, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    os.remove(file_path)
    return jsonify({"success": True})