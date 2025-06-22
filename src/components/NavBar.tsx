"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 네비게이션 바를 렌더링하는 컴포넌트입니다.
// 페이지 간의 빠른 이동을 위해 링크를 미리 로드합니다.
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
