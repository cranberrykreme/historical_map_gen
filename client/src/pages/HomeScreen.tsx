import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import styles from "./HomeScreen.module.css";

interface ProjectInfo {
  name: string;
  lastModified: string;
}

function HomeScreen() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`);
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setIsCreating(false);
        setNewProjectName("");
        navigate(`/project/${data.project}`);
      } else {
        alert(data.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleDelete = async (projectName: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectName}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (data.success) {
        setProjectToDelete(null);
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>HistoryMapTool</h1>

      <button
        className={styles.createButton}
        onClick={() => setIsCreating(true)}
      >
        + New Project
      </button>

      <div className={styles.projectList}>
        {projects.length === 0 && (
          <p className={styles.emptyMessage}>
            No projects yet — create one to get started.
          </p>
        )}
        {projects.map((project) => (
          <div
            key={project.name}
            className={styles.projectRow}
            onClick={() => navigate(`/project/${project.name}`)}
          >
            <div className={styles.projectInfo}>
              <span className={styles.projectName}>{project.name}</span>
              <span className={styles.projectDate}>
                Last edited {formatDate(project.lastModified)}
              </span>
            </div>
            <button
              className={styles.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                setProjectToDelete(project.name);
              }}
              title="Delete project"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {isCreating && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setIsCreating(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-lg)",
              width: "320px",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <h2
              style={{
                color: "var(--color-gold)",
                fontFamily: "var(--font-ui)",
                fontSize: "var(--font-size-lg)",
                margin: 0,
              }}
            >
              New Project
            </h2>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              style={{
                padding: "var(--space-sm)",
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-ui)",
                fontSize: "var(--font-size-md)",
              }}
            />
            <button
              onClick={handleCreate}
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "var(--color-gold-subtle)",
                border: "1px solid var(--color-gold)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-gold)",
                fontFamily: "var(--font-ui)",
                cursor: "pointer",
              }}
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "transparent",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-dim)",
                fontFamily: "var(--font-ui)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {projectToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setProjectToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-lg)",
              width: "320px",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <h2
              style={{
                color: "#e07070",
                fontFamily: "var(--font-ui)",
                fontSize: "var(--font-size-lg)",
                margin: 0,
              }}
            >
              Delete Project
            </h2>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-ui)",
                margin: 0,
              }}
            >
              Are you sure you want to delete "{projectToDelete}"? This cannot
              be undone.
            </p>
            <button
              onClick={() => handleDelete(projectToDelete)}
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "rgba(224, 112, 112, 0.15)",
                border: "1px solid #e07070",
                borderRadius: "var(--radius-sm)",
                color: "#e07070",
                fontFamily: "var(--font-ui)",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
            <button
              onClick={() => setProjectToDelete(null)}
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "transparent",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-dim)",
                fontFamily: "var(--font-ui)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeScreen;
