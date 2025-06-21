import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

export const useKakaoMap = (mapRef: React.RefObject<HTMLDivElement>) => {
  const [loaded, setLoaded] = useState(false);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const loadScript = () => {
      return new Promise<void>((resolve) => {
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            resolve();
          });
        } else {
          const script = document.createElement("script");
          script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_JS_KEY}&autoload=false&libraries=services`;
          script.async = true;
          script.onload = () => {
            window.kakao.maps.load(() => {
              resolve();
            });
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
