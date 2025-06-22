"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

// 카카오맵을 초기화하고 로드하는 커스텀 훅입니다.
// 주어진 mapRef를 사용하여 맵 인스턴스를 생성하고 로드 상태를 반환합니다.
export const useKakaoMap = (mapRef: React.RefObject<HTMLDivElement>) => {
  const [loaded, setLoaded] = useState(false);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    // 카카오맵 스크립트를 비동기로 로드합니다.
    const loadScript = (): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window === "undefined") return;

        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => resolve());
        } else {
          const script = document.createElement("script");
          script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false&libraries=services`;
          script.async = true;
          script.onload = () => {
            window.kakao.maps.load(() => resolve());
          };
          document.head.appendChild(script);
        }
      });
    };

    loadScript().then(() => {
      if (mapRef.current && !mapInstance.current) {
        mapInstance.current = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(33.3617, 126.5292),
          level: 10,
        });
        setLoaded(true);
      }
    });
  }, [mapRef]);

  return { map: mapInstance.current, isLoaded: loaded };
};
