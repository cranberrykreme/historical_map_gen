import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProjectHeader.module.css";

interface ProjectHeaderProps {
  projectName: string;
}

function ProjectHeader({ projectName }: ProjectHeaderProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div
      className={`${styles.header} ${isExpanded ? styles.headerExpanded : ""}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <button
        className={styles.homeButton}
        onClick={() => navigate("/")}
        title="Back to projects"
      >
        ⌂
      </button>
      <span
        className={`${styles.projectName} ${isExpanded ? styles.projectNameVisible : ""}`}
      >
        {projectName}
      </span>
    </div>
  );
}

export default ProjectHeader;
