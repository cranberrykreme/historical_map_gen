import React from "react";
import { RecentUpload } from "../../hooks/useAssetUploads";
import { uploadedMessage } from "../../utils/project/uploads";
import styles from "./UploadMessage.module.css";

// The short message after files went straight into a Library section:
// "3 portraits added · Change type · Undo"
function UploadMessage({
  upload,
  onChangeType,
  onUndo,
  onClose,
}: {
  upload: RecentUpload | null;
  onChangeType: () => void;
  onUndo: () => void;
  onClose: () => void;
}) {
  if (!upload) return null;
  return (
    <div className={styles.message} role="status">
      <span>{uploadedMessage(upload.files.length, upload.type)}</span>
      <span className={styles.dot}>·</span>
      <button
        className={styles.link}
        onClick={onChangeType}
        title="Move them to another part of the Library"
      >
        Change type
      </button>
      <span className={styles.dot}>·</span>
      <button
        className={styles.link}
        onClick={onUndo}
        disabled={upload.added.length === 0}
        title={
          upload.added.length === 0
            ? "These replaced pictures of the same name, so there is nothing to take away"
            : "Take them out of the Library again"
        }
      >
        Undo
      </button>
      <button className={styles.close} onClick={onClose} title="Close">
        ×
      </button>
    </div>
  );
}

export default UploadMessage;
