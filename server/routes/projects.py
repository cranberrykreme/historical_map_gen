from flask import Blueprint, jsonify, request
import os
import json
import shutil
from datetime import datetime

projects_bp = Blueprint('projects', __name__)

PROJECTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'projects')


def get_project_dir(project_name: str) -> str:
    return os.path.join(PROJECTS_DIR, project_name)


def ensure_project_structure(project_name: str):
    project_dir = get_project_dir(project_name)
    os.makedirs(os.path.join(project_dir, 'assets', 'units'), exist_ok=True)
    os.makedirs(os.path.join(project_dir, 'assets', 'portraits'), exist_ok=True)
    os.makedirs(os.path.join(project_dir, 'assets', 'maps'), exist_ok=True)


@projects_bp.route('/api/projects/save', methods=['POST'])
def save_project():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    project_name = data.get('name', 'default')
    ensure_project_structure(project_name)
    project_path = os.path.join(get_project_dir(project_name), 'project.json')

    with open(project_path, 'w') as f:
        json.dump(data, f, indent=2)

    return jsonify({"success": True, "project": project_name})


@projects_bp.route('/api/projects/load/<project_name>')
def load_project(project_name: str):
    project_path = os.path.join(get_project_dir(project_name), 'project.json')
    if not os.path.exists(project_path):
        return jsonify({"error": "Project not found"}), 404

    with open(project_path, 'r') as f:
        data = json.load(f)

    return jsonify(data)


@projects_bp.route('/api/projects', methods=['GET'])
def list_projects():
    if not os.path.exists(PROJECTS_DIR):
        return jsonify({"projects": []})

    projects = []
    for name in os.listdir(PROJECTS_DIR):
        project_dir = os.path.join(PROJECTS_DIR, name)
        project_json = os.path.join(project_dir, 'project.json')
        if os.path.isdir(project_dir) and os.path.exists(project_json):
            modified_timestamp = os.path.getmtime(project_json)
            projects.append({
                "name": name,
                "lastModified": datetime.fromtimestamp(modified_timestamp).isoformat(),
            })

    projects.sort(key=lambda p: p["lastModified"], reverse=True)
    return jsonify({"projects": projects})


@projects_bp.route('/api/projects/create', methods=['POST'])
def create_project():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"error": "Project name required"}), 400

    project_name = data['name']
    project_dir = get_project_dir(project_name)

    if os.path.exists(project_dir):
        return jsonify({"error": "Project already exists"}), 409

    ensure_project_structure(project_name)
    project_path = os.path.join(project_dir, 'project.json')
    with open(project_path, 'w') as f:
        json.dump({"name": project_name, "units": [], "selectedMapFilename": None}, f, indent=2)

    return jsonify({"success": True, "project": project_name})


@projects_bp.route('/api/projects/<project_name>', methods=['DELETE'])
def delete_project(project_name: str):
    project_dir = get_project_dir(project_name)
    if not os.path.exists(project_dir):
        return jsonify({"error": "Project not found"}), 404

    shutil.rmtree(project_dir)
    return jsonify({"success": True})