"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/first");
    router.prefetch("/second");
  }, []);

  return (
    <nav>
      <ul>
        <li>
          <Link className="nav-link" href="/">
            양이랑 제주 여행!
          </Link>
        </li>
        {/* <li>
          <Link className="nav-link" href="/first">
            First
          </Link>
        </li>
        <li>
          <Link className="nav-link" href="/second">
            Second
          </Link>
        </li> */}
      </ul>
    </nav>
  );
}
