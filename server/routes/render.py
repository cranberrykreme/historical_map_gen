from flask import Blueprint, jsonify, request, send_file
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
import uuid
from datetime import datetime

render_bp = Blueprint('render', __name__)

PROJECTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'projects')

# Where ffmpeg usually lives on a Mac with Homebrew, for when Flask is started without the
# shell's PATH (from an editor, say)
FFMPEG_FALLBACKS = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg']

# A render nobody has sent a frame to for this long has been abandoned (the tab was closed)
IDLE_SECONDS = 10 * 60

# The sizes and speeds the editor can ask for
ALLOWED_SIZES = {(1920, 1080), (1080, 1920)}
MIN_FPS, MAX_FPS = 1, 60
MIN_CRF, MAX_CRF = 0, 51
PRESETS = {'ultrafast', 'superfast', 'veryfast', 'faster', 'fast',
           'medium', 'slow', 'slower', 'veryslow'}

# Renders under way, by job id. Each frame arrives in its own request, so they are kept here
# between requests; Flask's development server handles requests on threads, hence the lock.
_jobs = {}
_jobs_lock = threading.Lock()


def find_ffmpeg():
    found = shutil.which('ffmpeg')
    if found:
        return found
    for path in FFMPEG_FALLBACKS:
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path
    return None


def safe_stem(name: str) -> str:
    stem = os.path.splitext(name or '')[0]
    cleaned = "".join(c if c.isalnum() or c in "-_" else "_" for c in stem).strip('_')
    return cleaned[:60] or 'video'


def project_dir(project_name: str):
    # Only a plain folder name inside the projects folder, never a path out of it
    if not project_name or project_name != os.path.basename(project_name) or project_name.startswith('.'):
        return None
    path = os.path.join(PROJECTS_DIR, project_name)
    return path if os.path.isdir(path) else None


def exports_dir(project_name: str):
    folder = project_dir(project_name)
    if folder is None:
        return None
    path = os.path.join(folder, 'exports')
    os.makedirs(path, exist_ok=True)
    return path


class RenderJob:
    def __init__(self, project, width, height, fps, crf, preset, out_path, ffmpeg):
        self.id = uuid.uuid4().hex
        self.project = project
        self.width = width
        self.height = height
        self.fps = fps
        self.frame_bytes = width * height * 4
        self.out_path = out_path
        self.frames = 0
        self.started = time.time()
        self.touched = time.time()
        self.lock = threading.Lock()
        # ffmpeg's messages go to a file rather than a pipe: a pipe nobody reads fills up and
        # stalls ffmpeg part way through a long render
        self.log = tempfile.TemporaryFile()
        self.proc = subprocess.Popen(
            [
                ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
                # The frames: raw RGBA pixels, one frame after another, as the browser draws them
                '-f', 'rawvideo', '-pix_fmt', 'rgba',
                '-s', f'{width}x{height}', '-framerate', str(fps),
                '-i', '-',
                # H.264 in the colours every player understands, with the index at the front so
                # the file starts playing straight away. There's no audio yet; Week 10 adds a
                # track to the finished file without encoding the picture again.
                '-c:v', 'libx264', '-preset', preset, '-crf', str(crf),
                '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                out_path,
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=self.log,
        )

    def error_text(self) -> str:
        try:
            self.log.seek(0)
            return self.log.read().decode('utf-8', 'replace').strip()[-2000:]
        except Exception:
            return ''

    def kill(self):
        try:
            if self.proc.stdin and not self.proc.stdin.closed:
                self.proc.stdin.close()
        except Exception:
            pass
        if self.proc.poll() is None:
            self.proc.kill()
            try:
                self.proc.wait(timeout=5)
            except Exception:
                pass
        self.log.close()
        if os.path.exists(self.out_path):
            try:
                os.remove(self.out_path)
            except OSError:
                pass


def _reap_idle():
    # Throws away renders left behind by a closed tab, so their ffmpeg doesn't run forever
    now = time.time()
    with _jobs_lock:
        stale = [job for job in _jobs.values() if now - job.touched > IDLE_SECONDS]
        for job in stale:
            _jobs.pop(job.id, None)
    for job in stale:
        job.kill()


def _get_job(job_id: str):
    with _jobs_lock:
        return _jobs.get(job_id)


@render_bp.route('/api/render/ffmpeg', methods=['GET'])
def ffmpeg_status():
    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        return jsonify({"available": False})
    try:
        out = subprocess.run([ffmpeg, '-version'], capture_output=True, text=True, timeout=10)
        first = out.stdout.splitlines()[0] if out.stdout else ''
    except Exception:
        first = ''
    return jsonify({"available": True, "path": ffmpeg, "version": first})


@render_bp.route('/api/projects/<project_name>/render', methods=['POST'])
def start_render(project_name: str):
    _reap_idle()
    folder = exports_dir(project_name)
    if folder is None:
        return jsonify({"error": "No such project"}), 404

    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        return jsonify({"error": "ffmpeg isn't installed (brew install ffmpeg), or Flask can't find it"}), 503

    body = request.get_json(silent=True) or {}
    try:
        width = int(body.get('width', 1920))
        height = int(body.get('height', 1080))
        fps = int(body.get('fps', 24))
        crf = int(body.get('crf', 16))
    except (TypeError, ValueError):
        return jsonify({"error": "width, height, fps and crf must be numbers"}), 400
    preset = str(body.get('preset', 'slow'))
    if (width, height) not in ALLOWED_SIZES:
        return jsonify({"error": f"Unsupported size {width}x{height}"}), 400
    if not MIN_FPS <= fps <= MAX_FPS:
        return jsonify({"error": f"fps must be {MIN_FPS} to {MAX_FPS}"}), 400
    if not MIN_CRF <= crf <= MAX_CRF:
        return jsonify({"error": f"crf must be {MIN_CRF} to {MAX_CRF}"}), 400
    if preset not in PRESETS:
        return jsonify({"error": f"Unknown preset {preset}"}), 400

    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    filename = f"{safe_stem(body.get('name') or project_name)}-{stamp}.mp4"
    out_path = os.path.join(folder, filename)

    try:
        job = RenderJob(project_name, width, height, fps, crf, preset, out_path, ffmpeg)
    except OSError as error:
        return jsonify({"error": f"Couldn't start ffmpeg: {error}"}), 500
    with _jobs_lock:
        _jobs[job.id] = job
    return jsonify({"jobId": job.id, "filename": filename})


@render_bp.route('/api/render/<job_id>/frame', methods=['POST'])
def add_frame(job_id: str):
    job = _get_job(job_id)
    if job is None:
        return jsonify({"error": "No such render (it may have been cancelled)"}), 404

    data = request.get_data(cache=False)
    if len(data) != job.frame_bytes:
        return jsonify({"error": f"A frame must be {job.frame_bytes} bytes, got {len(data)}"}), 400

    index = request.headers.get('X-Frame-Index')
    with job.lock:
        # Frames must arrive in order: ffmpeg just takes them one after another
        if index is not None and index.isdigit() and int(index) != job.frames:
            return jsonify({"error": f"Expected frame {job.frames}, got {index}"}), 409
        try:
            job.proc.stdin.write(data)
        except (BrokenPipeError, OSError, ValueError):
            message = job.error_text() or "ffmpeg stopped"
            with _jobs_lock:
                _jobs.pop(job.id, None)
            job.kill()
            return jsonify({"error": message}), 500
        job.frames += 1
        job.touched = time.time()
        frames = job.frames
    return jsonify({"frames": frames})


@render_bp.route('/api/render/<job_id>/finish', methods=['POST'])
def finish_render(job_id: str):
    with _jobs_lock:
        job = _jobs.pop(job_id, None)
    if job is None:
        return jsonify({"error": "No such render"}), 404

    with job.lock:
        try:
            job.proc.stdin.close()
        except Exception:
            pass
        try:
            code = job.proc.wait(timeout=600)
        except subprocess.TimeoutExpired:
            job.kill()
            return jsonify({"error": "ffmpeg took too long to finish"}), 500

    if code != 0 or job.frames == 0:
        message = job.error_text() or ("No frames were sent" if job.frames == 0 else f"ffmpeg failed ({code})")
        job.kill()
        return jsonify({"error": message}), 500

    job.log.close()
    return jsonify({
        "filename": os.path.basename(job.out_path),
        "frames": job.frames,
        "seconds": job.frames / job.fps,
        "bytes": os.path.getsize(job.out_path),
        "path": os.path.abspath(job.out_path),
        "tookSeconds": round(time.time() - job.started, 1),
    })


@render_bp.route('/api/render/<job_id>/cancel', methods=['POST'])
def cancel_render(job_id: str):
    with _jobs_lock:
        job = _jobs.pop(job_id, None)
    if job is None:
        return jsonify({"cancelled": False})
    with job.lock:
        job.kill()
    return jsonify({"cancelled": True})


@render_bp.route('/api/projects/<project_name>/exports', methods=['GET'])
def list_exports(project_name: str):
    folder = exports_dir(project_name)
    if folder is None:
        return jsonify({"error": "No such project"}), 404
    files = []
    for name in os.listdir(folder):
        if not name.lower().endswith('.mp4'):
            continue
        path = os.path.join(folder, name)
        files.append({
            "filename": name,
            "bytes": os.path.getsize(path),
            "modified": os.path.getmtime(path),
        })
    files.sort(key=lambda f: f["modified"], reverse=True)
    return jsonify(files)


def export_path(project_name: str, filename: str):
    # A video in the project's exports folder, by its plain file name; None for anything else
    folder = exports_dir(project_name)
    if folder is None or filename != os.path.basename(filename) or not re.fullmatch(r'[\w.-]+\.mp4', filename):
        return None
    path = os.path.join(folder, filename)
    return path if os.path.isfile(path) else None


@render_bp.route('/api/projects/<project_name>/exports/<filename>', methods=['GET'])
def get_export(project_name: str, filename: str):
    path = export_path(project_name, filename)
    if path is None:
        return jsonify({"error": "Not found"}), 404
    download = request.args.get('download') == '1'
    return send_file(path, mimetype='video/mp4', as_attachment=download,
                     download_name=filename, conditional=True)


@render_bp.route('/api/projects/<project_name>/exports/<filename>', methods=['DELETE'])
def delete_export(project_name: str, filename: str):
    path = export_path(project_name, filename)
    if path is None:
        return jsonify({"error": "Not found"}), 404
    # A video still being rendered is removed by cancelling its render instead
    with _jobs_lock:
        busy = any(os.path.abspath(job.out_path) == os.path.abspath(path) for job in _jobs.values())
    if busy:
        return jsonify({"error": "That video is still being rendered"}), 409
    try:
        os.remove(path)
    except OSError as error:
        return jsonify({"error": f"Couldn't delete it: {error}"}), 500
    return jsonify({"deleted": filename})