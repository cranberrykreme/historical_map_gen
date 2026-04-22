from flask import Blueprint, jsonify, request
import os
import json

projects_bp = Blueprint('projects', __name__)

PROJECTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'projects')

@projects_bp.route('/api/projects/save', methods=['POST'])
def save_project():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    project_name = data.get('name', 'default')
    project_path = os.path.join(PROJECTS_DIR, f"{project_name}.json")
    
    with open(project_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    return jsonify({"success": True, "project": project_name})

@projects_bp.route('/api/projects/load/<project_name>')
def load_project(project_name: str):
    project_path = os.path.join(PROJECTS_DIR, f"{project_name}.json")
    if not os.path.exists(project_path):
        return jsonify({"error": "Project not found"}), 404
    
    with open(project_path, 'r') as f:
        data = json.load(f)
    
    return jsonify(data)

@projects_bp.route('/api/projects')
def list_projects():
    if not os.path.exists(PROJECTS_DIR):
        return jsonify({"projects": []})
    projects = [f.replace('.json', '') for f in os.listdir(PROJECTS_DIR) if f.endswith('.json')]
    return jsonify({"projects": projects})
