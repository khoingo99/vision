// Root Layout – bắt buộc có <html> và <body>
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "비전정보통신",
  description: "현장 이슈/장애 관리",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
