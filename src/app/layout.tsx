import "./globals.css";
import NavBarWrapper from "@/components/NavBarWrapper";

// 애플리케이션의 루트 레이아웃을 정의하는 컴포넌트입니다.
// 네비게이션 바와 메인 콘텐츠 영역을 포함합니다.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <NavBarWrapper />
        <main>{children}</main>
      </body>
    </html>
  );
}
