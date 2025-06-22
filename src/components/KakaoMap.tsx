"use client";

import React, { useEffect, useRef, useState } from "react";
import { fetchLocations, Location as RawLocation } from "@/utils/fetchLocation";
import { fetchListData, fetchScheduleData } from "@/utils/api";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { convertTo24Hour, isCurrentTimeInRange, getTitleDayMap, moveHallasanToVisibleCenter } from "@/utils/timeUtils";
import type { DayKey } from "@/utils/timeUtils";

import "@/components/KakaoMap.css";

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

const orderedDays: DayKey[] = ["day1", "day2", "day3", "day4", "day5"];

const markerIcons: Record<DayKey, string> = {
  day1: "/assets/markerColor/markerred.png",
  day2: "/assets/markerColor/markerorange.png",
  day3: "/assets/markerColor/markeryellow.png",
  day4: "/assets/markerColor/markergreen.png",
  day5: "/assets/markerColor/markerblue.png",
};

export default function KakaoMap() {
  const [, setNow] = useState(new Date());

  const mapRef = useRef<HTMLDivElement>(null!);
  const panelRef = useRef<HTMLDivElement>(null);
  const { map, isLoaded } = useKakaoMap(mapRef);

  const [selectedCategory, setSelectedCategory] = useState<"all" | "travel" | "cafe" | DayKey>("travel");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [travelList, setTravelList] = useState<string[]>([]);
  const [cafeList, setCafeList] = useState<string[]>([]);
  const [days, setDays] = useState<Record<DayKey, string[]> | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({} as ScheduleData);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      const list = await fetchListData();
      console.log(list)
      const schedule = await fetchScheduleData();
      setTravelList(list.travelList);
      setCafeList(list.cafeList);
      setDays(list.days);
      setScheduleData(schedule);
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!days) return;
    setSelectedCategory("travel");
    setSelectedLocation(null);
    setSelectedDay(null);
  }, [days]);

  useEffect(() => {
    if (!isLoaded || !days || Object.keys(days).length === 0) return;

    let titles: string[] = [];

    if (selectedCategory === "all") {
      titles = Array.from(new Set(orderedDays.flatMap((d) => days[d] || [])));
      
      const dayMap = getTitleDayMap(days);
      fetchLocations(titles).then((res) => setLocations(res.map((l) => ({ ...l, dayKey: dayMap[l.title] }))));
    } else {
      if (selectedCategory === "travel" || selectedCategory === "cafe" || (orderedDays.includes(selectedCategory) && days[selectedCategory])) {
        titles = selectedCategory === "travel" ? travelList : selectedCategory === "cafe" ? cafeList : days[selectedCategory] || [];

        fetchLocations(titles).then((res) => setLocations(res.map((l) => ({ ...l, dayKey: selectedCategory as DayKey }))));
      }
    }
  }, [selectedCategory, isLoaded, days]);
  

  useEffect(() => {
    if (!map || !window.kakao) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const newMarkers = locations.map((loc) => {
      const pos = new window.kakao.maps.LatLng(loc.lat, loc.lng);
      const image = new window.kakao.maps.MarkerImage(
        selectedCategory === "travel" || selectedCategory === "cafe" ? "/assets/markerColor/markernormal.png" : loc.dayKey ? markerIcons[loc.dayKey] : "/assets/markerColor/markernormal.png",
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
        {["travel", "cafe", "all", ...orderedDays].map((key) => (
          <button
            key={key}
            onClick={() => {
              setSelectedCategory(key as typeof selectedCategory);
              if (key.startsWith("day")) {
                setSelectedDay(key as DayKey);
                console.log(selectedDay)
                setSelectedLocation(null);
              } else {
                setSelectedDay(null);
                console.log(selectedDay);
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

            {selectedDay && scheduleData[selectedDay] && (
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
                    {scheduleData[selectedDay].map((item, idx) => (
                      <tr key={idx} className={isCurrentTimeInRange(item.arrival, item.departure) ? "highlight-row" : ""}>
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
}
