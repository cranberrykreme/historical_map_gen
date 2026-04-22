from flask import Flask
from flask_cors import CORS
from routes.health import health_bp
from routes.maps import maps_bp
from routes.assets import assets_bp
from routes.projects import projects_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(health_bp)
app.register_blueprint(maps_bp)
app.register_blueprint(assets_bp)
app.register_blueprint(projects_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
