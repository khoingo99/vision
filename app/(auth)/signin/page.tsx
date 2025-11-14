"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./styles.module.css";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
     const res = await signIn("credentials", { redirect: false, username, password });
    setLoading(false);
    if (res?.error) { setError("로그인에 실패했어요. 다시 시도해 주세요."); return; }
    router.push(params.get("callbackUrl") || "/");
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>장애 모니터링 로그인</h1>

      <form onSubmit={onSubmit} className={styles.form} aria-label="로그인">
        <div className={styles.field}>
          <input
            className={styles.input}
            placeholder="아이디"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="아이디"
            required
          />
          {username && (
            <button type="button" className={styles.iconBtn} onClick={() => setUsername("")} aria-label="지우기">×</button>
          )}
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="비밀번호"
            required
          />
        </div>

        <div className={styles.optionRow}>
          <label className={styles.check}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>자동로그인</span>
          </label>
          <span />
        </div>

        <button className={styles.submit} disabled={loading}>
          {loading ? "로그인 중…" : "로그인"}
        </button>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.signupRow}>
          <span>아직 가입전이신가요?</span>
          <a href="/signup" className={styles.signupLink}>회원가입</a>
        </div>
      </form>

      {/* copy@ */}
      <footer className={styles.footer}>
        Copyright © (주)비전정보통신 All Rights Reserved.
      </footer>
    </main>
  );
}
