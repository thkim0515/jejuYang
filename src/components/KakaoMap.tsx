import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchLocations, Location as RawLocation } from "../utils/fetchLocation";
import listData from "../data/list.json";
import { useKakaoMap } from "../hooks/useKakaoMap";

import markerRed from "../assets/markerColor/markerred.png";
import markerOrange from "../assets/markerColor/markerorange.png";
import markerYellow from "../assets/markerColor/markeryellow.png";
import markerGreen from "../assets/markerColor/markergreen.png";
import markerBlue from "../assets/markerColor/markerblue.png";
import markerNormal from "../assets/markerColor/markernormal.png";

import "./KakaoMap.css";

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
      map[title] = day;
    }
  }
  return map;
};

const KakaoMap = () => {
  const location = useLocation();
  const mapRef = useRef<HTMLDivElement>(null!);
  const { map, isLoaded } = useKakaoMap(mapRef);

  const [selectedCategory, setSelectedCategory] = useState<"all" | "travel" | "cafe" | DayKey>("travel");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
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

  useEffect(() => {
    setSelectedCategory("travel");
    setSelectedLocation(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoaded) return;

    let titles: string[] = [];

    if (selectedCategory === "all") {
      titles = Array.from(new Set(orderedDays.flatMap((d) => days[d])));
      const dayMap = getTitleDayMap();
      fetchLocations(titles).then((results) => {
        setLocations(results.map((loc) => ({ ...loc, dayKey: dayMap[loc.title] })));
      });
    } else {
      if (selectedCategory === "travel") titles = travelList;
      else if (selectedCategory === "cafe") titles = cafeList;
      else titles = days[selectedCategory];

      fetchLocations(titles).then((results) => {
        setLocations(results.map((loc) => ({ ...loc, dayKey: selectedCategory as DayKey })));
      });
    }
  }, [selectedCategory, isLoaded]);

  useEffect(() => {
    if (!map || !window.kakao) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const newMarkers = locations.map((loc) => {
      const pos = new window.kakao.maps.LatLng(loc.lat, loc.lng);
      const markerImage = new window.kakao.maps.MarkerImage(
        selectedCategory === "travel" || selectedCategory === "cafe" ? markerNormal : loc.dayKey ? markerIcons[loc.dayKey] : markerNormal,
        new window.kakao.maps.Size(30, 42)
      );

      const marker = new window.kakao.maps.Marker({ map, position: pos, image: markerImage });

      const info = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 12px;font-size:13px;">${loc.title}</div>`,
      });

      window.kakao.maps.event.addListener(marker, "mouseover", () => info.open(map, marker));
      window.kakao.maps.event.addListener(marker, "mouseout", () => info.close());
      window.kakao.maps.event.addListener(marker, "click", () => {
        setSelectedLocation(loc);
        const proj = map.getProjection();
        const pt = proj.containerPointFromCoords(pos);
        pt.x += 200;
        const center = proj.coordsFromContainerPoint(pt);
        map.setCenter(center);
      });

      return marker;
    });

    markersRef.current = newMarkers;

    return () => newMarkers.forEach((m) => m.setMap(null));
  }, [locations, map]);

  const handleClose = () => {
    setSelectedLocation(null);
    if (map) {
      map.setCenter(new window.kakao.maps.LatLng(33.3617, 126.5292));
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
          overflowX: "auto",
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
              whiteSpace: "nowrap",
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

      <div style={{ display: "flex", height: "calc(100vh - 66px)" }}>
        {selectedLocation && (
          <div
            className="side-area"
            style={{
              background: "linear-gradient(120deg, #fff, #eaf7ff 85%)",
              padding: "30px 24px",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              className="sideAreaCloseButton"
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

            <h3>{selectedLocation.title}</h3>
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
            <p>
              <strong>카테고리:</strong> {selectedLocation.description}
            </p>
            <p>
              <strong>주소:</strong> {selectedLocation.roadAddress || selectedLocation.address}
            </p>
            {selectedLocation.phone && (
              <p>
                <strong>전화:</strong> {selectedLocation.phone}
              </p>
            )}

            <a href={selectedLocation.url} target="_blank" rel="noopener noreferrer" className="sideAreaActionButton">
              카카오 장소보기
            </a>

            <button className="sideAreaActionButton sideAreaFooterClose" onClick={handleClose}>
              닫기
            </button>
          </div>
        )}
        <div ref={mapRef} style={{ flex: 1 }} />
      </div>
    </div>
  );
};

export default KakaoMap;
