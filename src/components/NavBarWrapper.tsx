
"use client";

import dynamic from "next/dynamic";

const NavBar = dynamic(() => import("./NavBar"), { ssr: false });

export default function NavBarWrapper() {
  return <NavBar />;
}
