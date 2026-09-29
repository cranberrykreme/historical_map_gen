from flask import Blueprint, jsonify, send_file, request
import os

portrait_sources_bp = Blueprint('portrait_sources', __name__)

PROJECTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'projects')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def get_sources_dir(project_name: str) -> str:
    return os.path.join(PROJECTS_DIR, project_name, 'portrait_sources')


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def safe_filename(filename: str) -> str:
    stem, ext = os.path.splitext(filename)
    stem = "".join(c if c.isalnum() or c in "-_" else "_" for c in stem) or "portrait"
    return f"{stem}{ext.lower()}"


@portrait_sources_bp.route('/api/projects/<project_name>/portrait-sources/upload', methods=['POST'])
def upload_source(project_name: str):
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"error": "A PNG or JPEG image is required"}), 400

    sources_dir = get_sources_dir(project_name)
    os.makedirs(sources_dir, exist_ok=True)

    filename = safe_filename(file.filename)
    stem, ext = os.path.splitext(filename)
    save_path = os.path.join(sources_dir, filename)
    counter = 1
    while os.path.exists(save_path):
        filename = f"{stem}{counter}{ext}"
        save_path = os.path.join(sources_dir, filename)
        counter += 1

    file.save(save_path)
    return jsonify({"success": True, "filename": filename})


@portrait_sources_bp.route('/api/projects/<project_name>/portrait-sources')
def list_sources(project_name: str):
    sources_dir = get_sources_dir(project_name)
    if not os.path.exists(sources_dir):
        return jsonify({"sources": []})
    sources = sorted(f for f in os.listdir(sources_dir) if allowed_file(f))
    return jsonify({"sources": sources})


@portrait_sources_bp.route('/api/projects/<project_name>/portrait-sources/<filename>', methods=['GET'])
def get_source(project_name: str, filename: str):
    if os.path.basename(filename) != filename:
        return jsonify({"error": "Invalid filename"}), 400
    file_path = os.path.join(get_sources_dir(project_name), filename)
    if not os.path.isfile(file_path):
        return jsonify({"error": "Source not found"}), 404
    response = send_file(file_path)
    response.headers['Cache-Control'] = 'no-cache'
    return response


@portrait_sources_bp.route('/api/projects/<project_name>/portrait-sources/<filename>', methods=['DELETE'])
def delete_source(project_name: str, filename: str):
    if os.path.basename(filename) != filename:
        return jsonify({"error": "Invalid filename"}), 400
    file_path = os.path.join(get_sources_dir(project_name), filename)
    if not os.path.isfile(file_path):
        return jsonify({"error": "Source not found"}), 404
    os.remove(file_path)
    return jsonify({"success": True})