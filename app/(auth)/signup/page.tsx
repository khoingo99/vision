"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import s from "./signup.module.css";           // CSS riêng cho signup

export default function SignUp() {
  const [username, setUsername] = useState("");   // 아이디
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");           // 이름
  const [email, setEmail] = useState("");         // 이메일
  const [phone, setPhone] = useState("");         // 전화번호 
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== password2) return setError("비밀번호가 동일하지 않습니다.");

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, name, email, phone, password })
    });
    setLoading(false);

    if (!res.ok) return setError((await res.text()) || "회원가입에 실패했습니다.");

    await signIn("credentials", { redirect: false, identifier: username, password });
    router.push("/");
  }

  return (
    <main className={s.wrap}>
      <h1 className={s.title}>회원가입</h1>

      <form onSubmit={onSubmit} className={s.form}>
        {/* 안내줄 trên cùng */}
        <div className={s.hrTitle}><span className={s.req} /> 표시는 반드시 입력하셔야 합니다.</div>

        {/* 아이디 */}
        <div className={s.row}>
          <div className={s.label}><span className={s.req} />아이디</div>
          <div className={s.fieldCol}>
            <input className={s.input} placeholder="아이디을 입력하세요" value={username}
                   onChange={e=>setUsername(e.target.value)} required />
            <div className={s.help}>ID는 4~16자의 영문자나 숫자를 조합하여 만들 수 있으며, 한글이나 특수문자(스페이스 포함) 등은 사용할 수 없습니다.</div>
          </div>
        </div>

        {/* 비밀번호 */}
        <div className={s.row}>
          <div className={s.label}><span className={s.req} />비밀번호</div>
          <div className={s.fieldCol}>
            <input className={s.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <div className={s.help}>영문자, 숫자, 특수문자 중 임의로 8자에서 16자까지 조합<br/>대소문자를 구분하오니 입력시 대소문자의 상태를 확인 하시기 바랍니다.</div>
          </div>
        </div>

        {/* 비밀번호 확인 */}
        <div className={s.row}>
          <div className={s.label}><span className={s.req} />비밀번호 확인</div>
          <div className={s.fieldCol}>
            <input className={s.input} type="password" placeholder="비밀번호를 한번 더 입력하세요."
                   value={password2} onChange={e=>setPassword2(e.target.value)} required />
          </div>
        </div>

        {/* 이름 */}
        <div className={s.row}>
          <div className={s.label}><span className={s.req} />이름</div>
          <div className={s.fieldCol}>
            <input className={s.input} placeholder="이름을 입력하세요." value={name}
                   onChange={e=>setName(e.target.value)} required />
          </div>
        </div>

        {/* 이메일 */}
        <div className={s.row}>
          <div className={s.label}><span className={s.req} />이메일</div>
          <div className={s.fieldCol}>
            <input className={s.input} type="email" placeholder="이메일 주소를 입력하세요."
                   value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
        </div>

        {/* 전화번호 (선택) */}
        <div className={s.row}>
  <div className={s.label}><span className={s.req}/>전화번호</div>
  <div className={s.fieldCol}>
    <input
      className={s.input}
      type="tel"
      inputMode="numeric"
      placeholder="'-'를 제외한 숫자만 입력하세요."
      value={phone}
      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} // chỉ giữ số
      minLength={9}
      maxLength={15}
      required
      aria-label="전화번호"
    />
  </div>
</div>

        {/* bỏ 법인 및 지자체명 / 요청권한 — KHÔNG render */}

        {/* actions */}
        {error && <p className={s.error}>{error}</p>}
        <div className={s.actions}>
          <a href="/signin" className={s.btnGhost}>취소</a>
          <button className={s.btn} disabled={loading}>{loading ? "처리 중…" : "회원가입"}</button>
        </div>
      </form>
    </main>
  );
}
