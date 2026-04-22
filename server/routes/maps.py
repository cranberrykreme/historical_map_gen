from flask import Blueprint, jsonify, send_file
import os

maps_bp = Blueprint('maps', __name__)

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets')

@maps_bp.route('/api/map')
def get_map():
    map_path = os.path.join(ASSETS_DIR, 'maps', 'MasterMapV1.svg')
    if not os.path.exists(map_path):
        return jsonify({"error": "Map file not found"}), 404
    return send_file(map_path, mimetype='image/svg+xml')