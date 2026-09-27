import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProjectHeader.module.css";

interface ProjectHeaderProps {
  projectName: string;
}

function ProjectHeader({ projectName }: ProjectHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.header}>
      <button
        className={styles.homeButton}
        onClick={() => navigate("/")}
        title="Back to projects"
      >
        ⌂
      </button>
      <span className={styles.projectName}>{projectName}</span>
    </div>
  );
}

export default ProjectHeader;
