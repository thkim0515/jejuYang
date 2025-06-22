"use client";

import dynamic from "next/dynamic";

const NavBar = dynamic(() => import("./NavBar"), { ssr: false });

// NavBar 컴포넌트를 동적으로 로드하는 래퍼 컴포넌트입니다.
export default function NavBarWrapper() {
  return <NavBar />;
}
