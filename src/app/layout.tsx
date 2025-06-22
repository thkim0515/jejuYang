import "./globals.css";
import NavBarWrapper from "@/components/NavBarWrapper";

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
