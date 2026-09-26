from flask import Blueprint, jsonify, send_file, request
import os

maps_bp = Blueprint('maps', __name__)

PROJECTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'projects')


@maps_bp.route('/api/projects/<project_name>/map')
def get_map(project_name: str):
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"error": "No map selected"}), 404

    map_path = os.path.join(PROJECTS_DIR, project_name, 'assets', 'maps', filename)
    if not os.path.exists(map_path):
        return jsonify({"error": "Map file not found"}), 404
    return send_file(map_path, mimetype='image/svg+xml')