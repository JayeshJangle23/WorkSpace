
import React from "react";

const statusStyles = {
  TODO: {
    label: "To Do",
    className: "task-status-todo",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "task-status-progress",
  },
  IN_REVIEW: {
    label: "In Review",
    className: "task-status-review",
  },
  COMPLETED: {
    label: "Completed",
    className: "task-status-completed",
  },
  BLOCKED: {
    label: "Blocked",
    className: "task-status-blocked",
  },
};

export default function TaskStatusBadge({ status }) {
  const config = statusStyles[status] || statusStyles.TODO;

  return (
    <span className={`task-status ${config.className}`}>
      <span className="status-dot" />
      {config.label}
    </span>
  );
}
