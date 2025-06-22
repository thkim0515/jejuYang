import axios from "axios";

export type Location = {
  title: string;
  lat: number;
  lng: number;
  description?: string;
  address?: string;
  roadAddress?: string;
  url?: string;
  phone?: string;
  thumbnail?: string;
};

const KAKAO_REST_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_KEY;

export const fetchLocations = async (list: string[]): Promise<Location[]> => {
  if (!KAKAO_REST_KEY) {
    console.error("❌ 환경변수 NEXT_PUBLIC_KAKAO_REST_KEY가 정의되어 있지 않습니다.");
    return [];
  }

  const promises = list.map((place) =>
    axios
      .get("https://dapi.kakao.com/v2/local/search/keyword.json", {
        params: { query: place },
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_KEY}`,
        },
      })
      .then((res: { data: { documents: any[] } }) => {
        if (res.data.documents.length > 0) {
          const loc = res.data.documents[0];
          return {
            title: loc.place_name,
            lat: parseFloat(loc.y),
            lng: parseFloat(loc.x),
            description: loc.category_name || "",
            address: loc.address_name || "",
            roadAddress: loc.road_address_name || "",
            url: loc.place_url || "",
            phone: loc.phone || "",
            thumbnail: loc.thumbnail_url || "",
          };
        } else {
          console.warn(`❗ ${place} 검색 결과 없음`);
          return null;
        }
      })
      .catch((err) => {
        console.error(`${place} 검색 실패`, err);
        return null;
      })
  );

  const results = await Promise.all(promises);
  return results.filter(Boolean) as Location[];
};
