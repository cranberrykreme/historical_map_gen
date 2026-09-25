from flask import Blueprint, jsonify, send_file, request
import os

maps_bp = Blueprint('maps', __name__)

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets')
MAPS_DIR = os.path.join(ASSETS_DIR, 'maps')

@maps_bp.route('/api/map')
def get_map():
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"error": "No map selected"}), 404

    map_path = os.path.join(MAPS_DIR, filename)
    if not os.path.exists(map_path):
        return jsonify({"error": "Map file not found"}), 404
    return send_file(map_path, mimetype='image/svg+xml')