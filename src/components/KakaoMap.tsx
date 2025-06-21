import React, { useEffect, useRef, useState } from "react";
import { fetchLocations, Location as RawLocation } from "../utils/fetchLocation";
import listData from "../data/list.json";
import "./KakaoMap.css";

import markerRed from "../assets/markerColor/markerred.png";
import markerOrange from "../assets/markerColor/markerorange.png";
import markerYellow from "../assets/markerColor/markeryellow.png";
import markerGreen from "../assets/markerColor/markergreen.png";
import markerBlue from "../assets/markerColor/markerblue.png";

type DayKey = "day1" | "day2" | "day3" | "day4" | "day5";

interface ListData {
  travelList: string[];
  cafeList: string[];
  days: Record<DayKey, string[]>;
}

interface Location extends RawLocation {
  dayKey?: DayKey;
}

const { travelList, cafeList, days }: ListData = listData;

const orderedDays: DayKey[] = ["day1", "day2", "day3", "day4", "day5"];

const markerIcons: Record<DayKey, string> = {
  day1: markerRed,
  day2: markerOrange,
  day3: markerYellow,
  day4: markerGreen,
  day5: markerBlue,
};

const getTitleDayMap = (): Record<string, DayKey> => {
  const map: Record<string, DayKey> = {};
  for (const day of orderedDays) {
    for (const title of days[day]) {
      if (!map[title]) {
        map[title] = day;
      }
    }
  }
  return map;
};

const KakaoMap = () => {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "travel" | "cafe" | DayKey>("travel");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const buttonBackgrounds: Record<string, string> = {
    travel: "white",
    cafe: "white",
    all: "linear-gradient(90deg, #fcdede, #fff4d6, #fffde1, #e3fcec, #e3f0ff)",
    day1: "linear-gradient(90deg, #fcdede, #f8b4b4)",
    day2: "linear-gradient(90deg, #fff4d6, #fddca9)",
    day3: "linear-gradient(90deg, #fffde1, #fef9c3)",
    day4: "linear-gradient(90deg, #e3fcec, #b3e9c7)",
    day5: "linear-gradient(90deg, #e3f0ff, #c0d9f8)",
  };

  const loadKakaoMapScript = () => {
    return new Promise<void>((resolve) => {
      if (window.kakao && window.kakao.maps) return resolve();
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_JS_KEY}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        setIsKakaoLoaded(true);
        resolve();
      };
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    loadKakaoMapScript().then(() => {
      window.kakao.maps.load(() => {
        if (mapRef.current && !mapInstance.current) {
          mapInstance.current = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(33.3617, 126.5292),
            level: 10,
          });
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!isKakaoLoaded) return;

    let list: string[] = [];

    if (selectedCategory === "all") {
      const uniqueTitles = Array.from(new Set(orderedDays.flatMap((day) => days[day])));
      const titleDayMap = getTitleDayMap();

      fetchLocations(uniqueTitles).then((results) => {
        const withDay = results.map((loc) => ({
          ...loc,
          dayKey: titleDayMap[loc.title],
        }));
        setLocations(withDay);
      });
    } else {
      if (selectedCategory === "travel") list = travelList;
      else if (selectedCategory === "cafe") list = cafeList;
      else list = days[selectedCategory] || [];

      fetchLocations(list).then((results) => {
        const withDay = results.map((loc) => ({
          ...loc,
          dayKey: selectedCategory as DayKey,
        }));
        setLocations(withDay);
      });
    }
  }, [selectedCategory, isKakaoLoaded]);

  useEffect(() => {
    if (!mapInstance.current) return;

    // 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    locations.forEach((loc) => {
      const markerPosition = new window.kakao.maps.LatLng(loc.lat, loc.lng);
      const imageSrc = loc.dayKey ? markerIcons[loc.dayKey] : undefined;
      const markerImage = imageSrc ? new window.kakao.maps.MarkerImage(imageSrc, new window.kakao.maps.Size(30, 42)) : undefined;

      const marker = new window.kakao.maps.Marker({
        map: mapInstance.current,
        position: markerPosition,
        image: markerImage,
      });

      markersRef.current.push(marker);

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 12px;font-size:13px;">${loc.title}</div>`,
      });

      window.kakao.maps.event.addListener(marker, "mouseover", () => infoWindow.open(mapInstance.current, marker));
      window.kakao.maps.event.addListener(marker, "mouseout", () => infoWindow.close());
      window.kakao.maps.event.addListener(marker, "click", () => {
        setSelectedLocation(loc);
        const projection = mapInstance.current.getProjection();
        const point = projection.containerPointFromCoords(markerPosition);
        point.x += 200;
        const newCenter = projection.coordsFromContainerPoint(point);
        mapInstance.current.setCenter(newCenter);
      });
    });
  }, [locations]);

  const handleClose = () => {
    setSelectedLocation(null);
    if (mapInstance.current) {
      mapInstance.current.setCenter(new window.kakao.maps.LatLng(33.3617, 126.5292));
    }
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f6f7fb" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          padding: "18px 24px",
          background: "linear-gradient(90deg, #D0EFFF 0%, #F0F4FF 100%)",
          borderBottom: "2px solid #dae3ed",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        {["travel", "cafe", "all", "day1", "day2", "day3", "day4", "day5"].map((key) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key as typeof selectedCategory)}
            style={{
              background: selectedCategory === key ? "linear-gradient(90deg, #61dafb 10%, #5eead4 90%)" : buttonBackgrounds[key] || "white",
              color: "#222",
              fontWeight: 600,
              border: "none",
              borderRadius: "40px",
              padding: "10px 24px",
              fontSize: "15px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {
              {
                travel: "여행지 보기",
                cafe: "카페 보기",
                all: "전체 보기",
                day1: "1일차",
                day2: "2일차",
                day3: "3일차",
                day4: "4일차",
                day5: "5일차",
              }[key]
            }
          </button>
        ))}
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 66px)", background: "#f6f7fb" }}>
        {selectedLocation && (
          <div
            className="side-area"
            style={{
              background: "linear-gradient(120deg, #fff, #eaf7ff 85%)",
              padding: "30px 24px",
              borderRight: "2px solid #e1eaf5",
              overflowY: "auto",
              borderRadius: "0 18px 18px 0",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              position: "relative",
            }}
          >
            <button
              onClick={handleClose}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                border: "none",
                background: "rgba(210, 210, 210, 0.12)",
                fontSize: "21px",
                borderRadius: "50%",
                width: "38px",
                height: "38px",
                cursor: "pointer",
                color: "#aaa",
              }}
            >
              ×
            </button>

            <h3 style={{ color: "#2a3c60", fontWeight: 800, fontSize: "1.36rem" }}>{selectedLocation.title}</h3>

            {selectedLocation.thumbnail && (
              <img
                src={selectedLocation.thumbnail}
                alt={selectedLocation.title}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "12px",
                }}
              />
            )}

            <p style={{ color: "#577087", fontSize: "1.07rem" }}>
              <strong>카테고리:</strong> {selectedLocation.description}
            </p>
            <p style={{ color: "#577087", fontSize: "1.07rem" }}>
              <strong>주소:</strong> {selectedLocation.roadAddress || selectedLocation.address}
            </p>
            {selectedLocation.phone && (
              <p style={{ color: "#577087", fontSize: "1.07rem" }}>
                <strong>전화:</strong> {selectedLocation.phone}
              </p>
            )}

            <a
              href={selectedLocation.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#3670f7",
                textDecoration: "none",
                padding: "10px 22px",
                borderRadius: "32px",
                background: "linear-gradient(90deg, #f7fafe, #e0f0ff 80%)",
                fontWeight: 700,
                fontSize: "1.06rem",
                marginTop: "8px",
                textAlign: "center",
              }}
            >
              카카오 장소보기
            </a>
          </div>
        )}
        <div ref={mapRef} style={{ flex: 1 }} />
      </div>
    </div>
  );
};

export default KakaoMap;
