from flask import Blueprint, jsonify, send_file, request
import os
import re

assets_bp = Blueprint('assets', __name__)

PROJECTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'projects')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg'}
FOLDER_NAME_PATTERN = re.compile(r'^[A-Za-z0-9_-]+$')


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_assets_dir(project_name: str) -> str:
    return os.path.join(PROJECTS_DIR, project_name, 'assets')


def is_safe_relpath(relpath: str) -> bool:
    # Blocks path traversal and absolute paths; only single-level folders allowed.
    parts = relpath.split('/')
    if len(parts) > 2:
        return False
    if '..' in parts or any(p == '' for p in parts):
        return False
    return True


@assets_bp.route('/api/projects/<project_name>/assets/upload', methods=['POST'])
def upload_asset(project_name: str):
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    asset_type = request.form.get('type', 'units')
    folder = request.form.get('folder', '').strip()

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    if folder and not FOLDER_NAME_PATTERN.match(folder):
        return jsonify({"error": "Invalid folder name"}), 400

    save_dir = os.path.join(get_assets_dir(project_name), asset_type, folder) if folder \
        else os.path.join(get_assets_dir(project_name), asset_type)
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, file.filename)
    file.save(save_path)

    relpath = f"{folder}/{file.filename}" if folder else file.filename
    return jsonify({"success": True, "path": relpath, "type": asset_type})


@assets_bp.route('/api/projects/<project_name>/assets/<asset_type>')
def list_assets(project_name: str, asset_type: str):
    asset_dir = os.path.join(get_assets_dir(project_name), asset_type)
    if not os.path.exists(asset_dir):
        return jsonify({"files": [], "folders": []})

    files = []
    folders = set()

    for entry in sorted(os.listdir(asset_dir)):
        full_path = os.path.join(asset_dir, entry)
        if os.path.isdir(full_path):
            folders.add(entry)
            for sub_entry in sorted(os.listdir(full_path)):
                if allowed_file(sub_entry):
                    files.append(f"{entry}/{sub_entry}")
        elif allowed_file(entry):
            files.append(entry)

    return jsonify({"files": files, "folders": sorted(folders)})


@assets_bp.route('/api/projects/<project_name>/assets/<asset_type>/folder', methods=['POST'])
def create_folder(project_name: str, asset_type: str):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"error": "Folder name required"}), 400

    folder_name = data['name'].strip()
    if not FOLDER_NAME_PATTERN.match(folder_name):
        return jsonify({"error": "Invalid folder name"}), 400

    folder_path = os.path.join(get_assets_dir(project_name), asset_type, folder_name)
    os.makedirs(folder_path, exist_ok=True)
    return jsonify({"success": True, "folder": folder_name})


@assets_bp.route('/api/projects/<project_name>/assets/<asset_type>/<path:relpath>', methods=['GET'])
def get_asset(project_name: str, asset_type: str, relpath: str):
    if not is_safe_relpath(relpath):
        return jsonify({"error": "Invalid path"}), 400

    file_path = os.path.join(get_assets_dir(project_name), asset_type, relpath)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    return send_file(file_path)


@assets_bp.route('/api/projects/<project_name>/assets/<asset_type>/<path:relpath>', methods=['DELETE'])
def delete_asset(project_name: str, asset_type: str, relpath: str):
    if not is_safe_relpath(relpath):
        return jsonify({"error": "Invalid path"}), 400

    file_path = os.path.join(get_assets_dir(project_name), asset_type, relpath)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    os.remove(file_path)
    return jsonify({"success": True})


@assets_bp.route('/api/projects/<project_name>/assets/<asset_type>/<path:relpath>', methods=['PATCH'])
def rename_or_move_asset(project_name: str, asset_type: str, relpath: str):
    if not is_safe_relpath(relpath):
        return jsonify({"error": "Invalid path"}), 400

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    new_filename = data.get('filename')
    new_folder = data.get('folder', '')

    old_path = os.path.join(get_assets_dir(project_name), asset_type, relpath)
    if not os.path.exists(old_path):
        return jsonify({"error": "File not found"}), 404

    current_filename = os.path.basename(relpath)
    filename_to_use = new_filename.strip() if new_filename else current_filename

    if not allowed_file(filename_to_use):
        return jsonify({"error": "Invalid filename"}), 400

    if new_folder and not FOLDER_NAME_PATTERN.match(new_folder):
        return jsonify({"error": "Invalid folder name"}), 400

    new_dir = os.path.join(get_assets_dir(project_name), asset_type, new_folder) if new_folder \
        else os.path.join(get_assets_dir(project_name), asset_type)
    os.makedirs(new_dir, exist_ok=True)
    new_path = os.path.join(new_dir, filename_to_use)

    if os.path.exists(new_path) and new_path != old_path:
        return jsonify({"error": "A file with that name already exists in the target folder"}), 409

    os.rename(old_path, new_path)

    new_relpath = f"{new_folder}/{filename_to_use}" if new_folder else filename_to_use
    return jsonify({"success": True, "path": new_relpath})