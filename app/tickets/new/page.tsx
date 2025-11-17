"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import styles from "./styles.module.css";


const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

const typeOptions = [
  { value: "SERVER", label: "서버" },
  { value: "CAMERA", label: "카메라" },
  { value: "LIGHT", label: "조명" },
  { value: "NETWORK", label: "네트워크" },
  { value: "OTHER", label: "기타" },
];

// tạo key duy nhất cho 1 file (tránh trùng)
const fileKey = (f: File) => `${f.name}@${f.size}@${f.lastModified}`;

export default function TicketCreatePage() {
  const router = useRouter();

  const [type, setType] = useState("OTHER");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDropping, setIsDropping] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // gộp + khử trùng file
  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => {
      const map = new Map<string, File>();
      [...prev, ...newFiles].forEach((f) => map.set(fileKey(f), f));
      return Array.from(map.values());
    });
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
    // reset để lần sau chọn lại cùng 1 file vẫn trigger onChange
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
    if (e.dataTransfer?.files?.length) addFiles(Array.from(e.dataTransfer.files));
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(true);
  };

  const onDragLeave = () => setIsDropping(false);

  const removeFileAt = (idx: number) => {
    setFiles((prev) => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  };

  const clearAllFiles = () => {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("제목은 필수입니다.");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("type", type);
      fd.append("title", title.trim());
      fd.append("content", content);
      files.forEach((f) => fd.append("files", f));

      const res = await fetch("/api/tickets", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "등록 실패");

      alert("등록되었습니다.");
      router.push("/");
    } catch (err: any) {
      alert(err.message || "에러가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className={styles.shell}>
      <h1 className={styles.title}>비전정보통신</h1>

      <form className={styles.card} onSubmit={onSubmit}>
        {/* 업무 구분 */}
        <div className={styles.row}>
          <label className={styles.label}>
            업무 구분 <span className={styles.req}>*</span>
          </label>
          <div className={styles.field}>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={styles.select}
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 제목 */}
        <div className={styles.row}>
          <label className={styles.label}>
            제목 <span className={styles.req}>*</span>
          </label>
          <div className={styles.field}>
            <input
              className={styles.input}
              placeholder="제목을 입력해주세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        {/* 첨부파일 */}
        <div className={styles.row}>
          <label className={styles.label}>첨부파일</label>
          <div className={styles.field}>
            <div
              className={`${styles.dropzone} ${
                isDropping ? styles.dropzoneActive : ""
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                onChange={onPickFiles}
                 className={styles.visuallyHidden}
              />
              <p className={styles.dropText}>
                버튼 클릭 또는 파일을 여기로 드래그하세요
              </p>
              <button
                type="button"
                className={styles.btnGhostSmall}
                onClick={() => inputRef.current?.click()}
              >
                파일선택
              </button>
            </div>

            {files.length > 0 && (
              <div className={styles.filesWrap}>
                <div className={styles.filesHeader}>
                  <strong>선택된 파일</strong>
                  <button
                    type="button"
                    className={styles.btnLinkDanger}
                    onClick={clearAllFiles}
                  >
                    모두 삭제
                  </button>
                </div>
                <ul className={styles.fileList}>
                  {files.map((f, i) => (
                    <li key={fileKey(f)} className={styles.fileItem}>
                      <div className={styles.fileInfo}>
                        <span className={styles.fileName}>{f.name}</span>
                        <span className={styles.fileMeta}>
                          {(f.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        title="삭제"
                        aria-label={`${f.name} 삭제`}
                        className={styles.fileRemove}
                        onClick={() => removeFileAt(i)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 내용 */}
        <div className={styles.row}>
          <label className={styles.label}>내용</label>
          <div className={styles.field}>
           <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            className={styles.editorFixed}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => history.back()}
          >
            취소
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={submitting}>
            {submitting ? "등록중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
