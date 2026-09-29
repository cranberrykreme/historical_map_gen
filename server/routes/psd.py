from flask import Blueprint, jsonify, send_file, request
import os
import re
from psd_tools import PSDImage

psd_bp = Blueprint('psd', __name__)

PROJECTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'projects')
NAME_PATTERN = re.compile(r'^[A-Za-z0-9_-]+$')


def get_psd_root(project_name: str) -> str:
    return os.path.join(PROJECTS_DIR, project_name, 'psd')


def safe_name(name: str) -> str:
    stem = os.path.splitext(name)[0]
    return "".join(c if c.isalnum() or c in "-_" else "_" for c in stem)


def unique_psd_dir(psd_root: str, base_name: str) -> str:
    candidate = base_name
    counter = 1
    while os.path.exists(os.path.join(psd_root, candidate)):
        candidate = f"{base_name}{counter}"
        counter += 1
    return candidate


def extract_layers(psd_path: str, layers_dir: str):
    os.makedirs(layers_dir, exist_ok=True)
    psd = PSDImage.open(psd_path)
    layer_meta = []

    for i, layer in enumerate(psd.descendants()):
        if layer.width == 0 or layer.height == 0:
            continue
        img = layer.composite(viewport=psd.viewbox)
        if img is None:
            continue
        layer_filename = f"{i}_{safe_name(layer.name)}.png"
        img.save(os.path.join(layers_dir, layer_filename))
        layer_meta.append({
            "index": i,
            "name": layer.name,
            "filename": layer_filename,
        })

    return layer_meta


@psd_bp.route('/api/projects/<project_name>/psd/upload', methods=['POST'])
def upload_psd(project_name: str):
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '' or not file.filename.lower().endswith('.psd'):
        return jsonify({"error": "A .psd file is required"}), 400

    psd_root = get_psd_root(project_name)
    os.makedirs(psd_root, exist_ok=True)

    base_name = safe_name(file.filename)
    psd_dir_name = unique_psd_dir(psd_root, base_name)
    psd_dir = os.path.join(psd_root, psd_dir_name)
    os.makedirs(psd_dir, exist_ok=True)

    source_path = os.path.join(psd_dir, 'source.psd')
    file.save(source_path)

    try:
        layer_meta = extract_layers(source_path, os.path.join(psd_dir, 'layers'))
    except Exception as e:
        return jsonify({"error": f"Failed to process PSD: {str(e)}"}), 500

    return jsonify({"success": True, "name": psd_dir_name, "layers": layer_meta})


@psd_bp.route('/api/projects/<project_name>/psd')
def list_psds(project_name: str):
    psd_root = get_psd_root(project_name)
    if not os.path.exists(psd_root):
        return jsonify({"psds": []})

    psds = sorted(
        name for name in os.listdir(psd_root)
        if os.path.isdir(os.path.join(psd_root, name))
    )
    return jsonify({"psds": psds})


@psd_bp.route('/api/projects/<project_name>/psd/<psd_name>/layers')
def get_psd_layers(project_name: str, psd_name: str):
    layers_dir = os.path.join(get_psd_root(project_name), psd_name, 'layers')
    if not os.path.exists(layers_dir):
        return jsonify({"error": "PSD not found"}), 404

    layer_files = sorted(
        f for f in os.listdir(layers_dir) if f.endswith('.png')
    )
    layers = []
    for f in layer_files:
        index_str, _, rest = f.partition('_')
        name = rest.rsplit('.', 1)[0]
        layers.append({"index": int(index_str), "name": name, "filename": f})

    layers.sort(key=lambda l: l["index"])
    return jsonify({"layers": layers})


@psd_bp.route('/api/projects/<project_name>/psd/<psd_name>/layers/<filename>')
def get_psd_layer_image(project_name: str, psd_name: str, filename: str):
    file_path = os.path.join(get_psd_root(project_name), psd_name, 'layers', filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "Layer not found"}), 404
    return send_file(file_path)


@psd_bp.route('/api/projects/<project_name>/psd/<psd_name>', methods=['DELETE'])
def delete_psd(project_name: str, psd_name: str):
    import shutil
    psd_dir = os.path.join(get_psd_root(project_name), psd_name)
    if not os.path.exists(psd_dir):
        return jsonify({"error": "PSD not found"}), 404
    shutil.rmtree(psd_dir)
    return jsonify({"success": True})