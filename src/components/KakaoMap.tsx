import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchLocations, Location as RawLocation } from "../utils/fetchLocation";
import listData from "../data/list.json";
import scheduleDataRaw from "../data/schedule.json";
import { useKakaoMap } from "../hooks/useKakaoMap";

import markerRed from "../assets/markerColor/markerred.png";
import markerOrange from "../assets/markerColor/markerorange.png";
import markerYellow from "../assets/markerColor/markeryellow.png";
import markerGreen from "../assets/markerColor/markergreen.png";
import markerBlue from "../assets/markerColor/markerblue.png";
import markerNormal from "../assets/markerColor/markernormal.png";

import "./KakaoMap.css";

type DayKey = "day1" | "day2" | "day3" | "day4" | "day5";

interface ScheduleEntry {
  place: string;
  travelTime: string;
  stayTime: string;
  arrival: string;
  departure: string;
}
type ScheduleData = Record<DayKey, ScheduleEntry[]>;
interface Location extends RawLocation {
  dayKey?: DayKey;
}

const { travelList, cafeList, days } = listData;
const scheduleData = scheduleDataRaw as ScheduleData;
const orderedDays: DayKey[] = ["day1", "day2", "day3", "day4", "day5"];

const markerIcons: Record<DayKey, string> = {
  day1: markerRed,
  day2: markerOrange,
  day3: markerYellow,
  day4: markerGreen,
  day5: markerBlue,
};

const convertTo24Hour = (time: string) => {
  if (!time.includes("AM") && !time.includes("PM")) return time;
  const [h, mMeridiem] = time.split(":");
  const minute = mMeridiem.slice(0, 2);
  const meridiem = mMeridiem.slice(2).toUpperCase();
  let hour = parseInt(h);
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, "0")}:${minute}`;
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

const moveHallasanToVisibleCenter = (map: any, leftOffset = 0, bottomOffset = 0) => {
  if (!map || !window.kakao) return;

  const hallasan = new window.kakao.maps.LatLng(33.3617, 126.5292);
  const proj = map.getProjection();
  const pt = proj.containerPointFromCoords(hallasan);

  pt.x += leftOffset / 2;
  pt.y -= bottomOffset / 2;

  const adjusted = proj.coordsFromContainerPoint(pt);
  map.setCenter(adjusted);
};

const KakaoMap = () => {
  const location = useLocation();
  const mapRef = useRef<HTMLDivElement>(null!);
  const panelRef = useRef<HTMLDivElement>(null);
  const { map, isLoaded } = useKakaoMap(mapRef);

  const [selectedCategory, setSelectedCategory] = useState<"all" | "travel" | "cafe" | DayKey>("travel");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    setSelectedCategory("travel");
    setSelectedLocation(null);
    setSelectedDay(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoaded) return;

    let titles: string[] = [];
    if (selectedCategory === "all") {
      titles = Array.from(new Set(orderedDays.flatMap((d) => days[d])));
      const dayMap = getTitleDayMap();
      fetchLocations(titles).then((res) => {
        setLocations(res.map((l) => ({ ...l, dayKey: dayMap[l.title] })));
      });
    } else {
      const titles = selectedCategory === "travel" ? travelList : selectedCategory === "cafe" ? cafeList : days[selectedCategory];

      fetchLocations(titles).then((res) => {
        setLocations(res.map((l) => ({ ...l, dayKey: selectedCategory as DayKey })));
      });
    }
  }, [selectedCategory, isLoaded]);

  useEffect(() => {
    if (!map || !window.kakao) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const newMarkers = locations.map((loc) => {
      const pos = new window.kakao.maps.LatLng(loc.lat, loc.lng);
      const image = new window.kakao.maps.MarkerImage(
        selectedCategory === "travel" || selectedCategory === "cafe" ? markerNormal : loc.dayKey ? markerIcons[loc.dayKey] : markerNormal,
        new window.kakao.maps.Size(30, 42)
      );
      const marker = new window.kakao.maps.Marker({ map, position: pos, image });
      const info = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 12px;font-size:13px;">${loc.title}</div>`,
      });
      window.kakao.maps.event.addListener(marker, "mouseover", () => info.open(map, marker));
      window.kakao.maps.event.addListener(marker, "mouseout", () => info.close());
      window.kakao.maps.event.addListener(marker, "click", () => {
        setSelectedLocation(loc);
        setSelectedDay(null);
        const proj = map.getProjection();
        const pt = proj.containerPointFromCoords(pos);
        pt.x += 200;
        map.setCenter(proj.coordsFromContainerPoint(pt));
      });
      return marker;
    });

    markersRef.current = newMarkers;

    return () => newMarkers.forEach((m) => m.setMap(null));
  }, [locations, map, selectedCategory]);

  useEffect(() => {
    if (!map || !window.kakao) return;

    const isMobile = window.innerWidth <= 600;
    const bottomOffset = isMobile ? panelRef.current?.offsetHeight || 0 : 0;
    const isDayPanel = selectedDay && !selectedLocation;
    const leftOffset = !isMobile ? (isDayPanel ? 480 : 350) : 0;

    if (selectedDay || selectedLocation) {
      moveHallasanToVisibleCenter(map, leftOffset, bottomOffset);
    }
  }, [selectedDay, selectedLocation, map]);

  const handleClose = () => {
    setSelectedLocation(null);
    setSelectedDay(null);

    const isMobile = window.innerWidth <= 600;
    const leftOffset = !isMobile ? 350 : 0;
    moveHallasanToVisibleCenter(map, leftOffset, 0);
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f6f7fb" }}>
      <div className="category-bar">
        {["travel", "cafe", "all", "day1", "day2", "day3", "day4", "day5"].map((key) => (
          <button
            key={key}
            onClick={() => {
              setSelectedCategory(key as typeof selectedCategory);
              if (key.startsWith("day")) {
                setSelectedDay(key as DayKey);
                setSelectedLocation(null);
              } else {
                setSelectedDay(null);
              }
            }}
            className={selectedCategory === key ? "active-category" : ""}
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

      <div style={{ display: "flex", height: "calc(100vh - 66px)", position: "relative" }}>
        {(selectedLocation || selectedDay) && (
          <div ref={panelRef} className="side-panel">
            <button className="sideAreaCloseButton" onClick={handleClose}>
              ×
            </button>

            {selectedLocation && (
              <>
                <h3>{selectedLocation.title}</h3>
                {selectedLocation.thumbnail && (
                  <img src={selectedLocation.thumbnail} alt={selectedLocation.title} style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "12px" }} />
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
              </>
            )}

            {selectedDay && (
              <>
                <h3>{selectedDay.toUpperCase()} 일정표</h3>
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>장소</th>
                      <th>이동</th>
                      <th>체류</th>
                      <th>도착</th>
                      <th>출발</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(scheduleData[selectedDay] || []).map((item, idx) => (
                      <tr key={idx}>
                        <td title={item.place}>{item.place}</td>
                        <td>{item.travelTime}</td>
                        <td>{item.stayTime}</td>
                        <td>{convertTo24Hour(item.arrival)}</td>
                        <td>{convertTo24Hour(item.departure)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
        <div ref={mapRef} style={{ flex: 1 }} />
      </div>
    </div>
  );
};

export default KakaoMap;
