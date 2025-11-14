"use client";

import Image from "next/image";
import logo from "@/public/vision_logo.png";
import s from "./main.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/* ===========================
   Kiểu dữ liệu hiển thị
=========================== */
type Row = {
  id: number;
  type: string;
  status: "대기" | "담당자배정" | "진행" | "확인요청" | "보류" | "취소" | "완료";
  title: string;
  author: string;
  assignee?: string;
  date: string;
  views: number;
};

/* ===========================
   Enum -> nhãn tiếng Hàn
=========================== */
const STATUS_KO: Record<string, Row["status"]> = {
  NEW: "대기",
  ASSIGNED: "담당자배정",
  IN_PROGRESS: "진행",
  REVIEW: "확인요청",
  HOLD: "보류",
  CANCELED: "취소",
  DONE: "완료",
};

const TYPE_KO: Record<string, string> = {
  SERVER: "서버",
  CAMERA: "카메라",
  LIGHT: "조명",
  NETWORK: "네트워크",
  OTHER: "기타",
};

/* ===========================
   Kiểu dữ liệu API rút gọn
=========================== */
type ApiTicket = {
  id: number;
  title: string;
  status?: keyof typeof STATUS_KO;
  type?: keyof typeof TYPE_KO;
  createdAt?: string;
  views?: number;
  author?: { name?: string | null; username?: string };
  assignee?: { name?: string | null; username?: string } | null;
};

type ApiRes = {
  ok?: boolean;
  message?: string;
  data?: {
    page?: number;
    size?: number;
    total?: number;
    items?: ApiTicket[];
    summary?: {
      NEW?: number;
      ASSIGNED?: number;
      IN_PROGRESS?: number;
      REVIEW?: number;
      HOLD?: number;
      CANCELED?: number;
      DONE?: number;
    };
  };
};

const EMPTY_SUMMARY = {
  NEW: 0,
  ASSIGNED: 0,
  IN_PROGRESS: 0,
  REVIEW: 0,
  HOLD: 0,
  CANCELED: 0,
  DONE: 0,
};

/* ===========================
   Helpers
=========================== */
function buildPages(current: number, totalPages: number, max = 7): number[] {
  // luôn ít nhất 1 trang
  totalPages = Math.max(1, totalPages);
  const half = Math.floor(max / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, start + max - 1);
  start = Math.max(1, end - max + 1);

  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

/* ===========================
   Component
=========================== */
export default function MainPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // gọi API
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);

        const res = await fetch(`/api/tickets?page=${page}&size=${size}`, {
          signal: ac.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const tmp = (await res.json()) as any;
            if (tmp?.message) msg = tmp.message;
          } catch {}
          throw new Error(msg);
        }

        const json = (await res.json()) as ApiRes;
        if (json.ok === false) throw new Error(json.message || "API error");

        const d = json.data ?? {};
        const items: ApiTicket[] = Array.isArray(d.items) ? d.items : [];

        const mapped: Row[] = items.map((t) => {
          const statusKo = STATUS_KO[t.status ?? "NEW"] ?? "대기";
          const typeKo = TYPE_KO[t.type ?? "OTHER"] ?? "기타";

          return {
            id: Number(t.id),
            type: typeKo,
            status: statusKo,
            title: t.title ?? "-",
            author: t.author?.name || t.author?.username || "-",
            assignee: t.assignee?.name || t.assignee?.username || "-",
            date: t.createdAt
              ? new Date(t.createdAt).toLocaleDateString("ko-KR")
              : "",
            views: Number(t.views ?? 0),
          };
        });

        const sm = { ...EMPTY_SUMMARY, ...(d.summary || {}) };
        setRows(mapped);
        setTotal(Number(d.total ?? 0));
        setSummary({
          NEW: sm.NEW ?? 0,
          ASSIGNED: sm.ASSIGNED ?? 0,
          IN_PROGRESS: sm.IN_PROGRESS ?? 0,
          REVIEW: sm.REVIEW ?? 0,
          HOLD: sm.HOLD ?? 0,
          CANCELED: sm.CANCELED ?? 0,
          DONE: sm.DONE ?? 0,
        });
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErrMsg(e?.message || "불러오기 실패");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [page, size]);

  // tổng số trang và dãy trang
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / size)),
    [total, size]
  );
  const pages = useMemo(
    () => buildPages(page, totalPages, 7),
    [page, totalPages]
  );

  const stats = [
    { label: "대기 업무", value: summary.NEW, icon: "🕒", cls: s.icoWait },
    { label: "담당자 배정", value: summary.ASSIGNED, icon: "📝", cls: s.icoAssign },
    { label: "처리 중인 업무", value: summary.IN_PROGRESS, icon: "🏃", cls: s.icoProgress },
    { label: "확인요청", value: summary.REVIEW, icon: "✨", cls: s.icoCheckReq },
    { label: "보류", value: summary.HOLD, icon: "📂", cls: s.icoHold },
    { label: "취소", value: summary.CANCELED, icon: "⛔", cls: s.icoCancel },
    { label: "완료", value: summary.DONE, icon: "✅", cls: s.icoDone },
    { label: "전체", value: total, icon: "📈", cls: s.icoAll },
  ];

  return (
    <div className={s.shell}>
      {/* TOP BAR */}
      <header className={s.topbar}>
        <div className={s.logoWrap}>
          <Image src={logo} alt="VISION" width={100} height={50} priority />
        </div>

        <nav className={s.topLinks}>
          <a href="#" className={s.link}>
            회원 정보 수정
          </a>
          <a href="/api/auth/signout" className={s.link}>
            로그아웃
          </a>
        </nav>
      </header>

      <main className={s.container}>
        <div className={s.titleRow}>
          <h1 className={s.pageTitle}>비전정보통신</h1>
          <button
            className={s.writeBtn}
            onClick={() => router.push("/tickets/new")}
          >
            작성하기
          </button>
        </div>

        {/* STATS */}
        <section className={s.statsCard}>
          {stats.map((x) => (
            <div key={x.label} className={s.statItem}>
              <div className={`${s.statIcon} ${x.cls}`} aria-hidden>
                {x.icon}
              </div>
              <div className={s.statMeta}>
                <div className={s.statLabel}>{x.label}</div>
                <div className={s.statValueRow}>
                  <span className={s.statValue}>{x.value}</span>
                  <span className={s.statUnit}>건</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* CARD: filter + table + pagination */}
        <section className={s.card}>
          <div className={s.toolbar}>
            <div className={s.filters}>
              <select className={s.select}>
                <option>정렬순서 선택</option>
              </select>
              <select className={s.select}>
                <option>요청상태 선택</option>
              </select>
              <input className={s.titleInput} placeholder="제목" />
              <div className={s.searchBox}>
                <input className={s.keyword} placeholder="검색어를 입력하세요" />
                <button className={s.searchBtn}>검색</button>
              </div>
            </div>

            {/* per page */}
            {/* <div className={s.perPage}>
              <select
                className={s.perSelect}
                value={size}
                onChange={(e) => {
                  const v = Number(e.target.value || 10);
                  setPage(1);
                  setSize(v);
                }}
              >
                <option value={10}>10개씩 보기</option>
                <option value={20}>20개씩 보기</option>
                <option value={50}>50개씩 보기</option>
                <option value={100}>100개씩 보기</option>
              </select>
            </div> */}
          </div>

          <div className={s.tableWrap}>
            {loading ? (
              <div className={s.loading}>불러오는 중…</div>
            ) : errMsg ? (
              <div className={s.error}>오류: {errMsg}</div>
            ) : (
              <table className={s.table}>
                <thead>
                  <tr>
                    <th className={s.colNo}>번호</th>
                    <th className={s.colType}>요청 구분</th>
                    <th className={s.colStatus}>요청 상태</th>
                    <th className={s.colTitle}>제목</th>
                    <th className={s.colAuthor}>작성자</th>
                    <th className={s.colAssignee}>담당자</th>
                    <th className={s.colDate}>작성일</th>
                    <th className={s.colViews}>조회수</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.type}</td>
                      <td>
                        <span className={`${s.badge} ${s[`st_${r.status}`]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className={s.tdTitle}>
                        {/* TODO: chuyển sang /tickets/[id] khi có trang chi tiết */}
                        <a href="#">{r.title}</a>
                      </td>
                      <td>{r.author}</td>
                      <td>{r.assignee ?? "-"}</td>
                      <td>{r.date}</td>
                      <td>{r.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* PAGINATION – luôn hiển thị, margin-left: 5px ở CSS */}
          <div className={s.pagination}>
            {totalPages === 1 ? (
              <button className={s.pageCurrent} aria-current="page">
                1
              </button>
            ) : (
              <>
                {pages[0] > 1 && (
                  <>
                    <button
                      className={page === 1 ? s.pageCurrent : s.pageBtn}
                      onClick={() => setPage(1)}
                    >
                      1
                    </button>
                    <span className={s.ellipsis}>…</span>
                  </>
                )}

                {pages.map((p) => (
                  <button
                    key={p}
                    className={p === page ? s.pageCurrent : s.pageBtn}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}

                {pages[pages.length - 1] < totalPages && (
                  <>
                    <span className={s.ellipsis}>…</span>
                    <button
                      className={
                        page === totalPages ? s.pageCurrent : s.pageBtn
                      }
                      onClick={() => setPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
