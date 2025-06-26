"use client";

import React, { useEffect, useRef, useState } from "react";
import { fetchLocations, Location as RawLocation } from "@/utils/fetchLocation";
import { fetchListData, fetchScheduleData, fetchAccommodationData } from "@/utils/api";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { convertTo24Hour, isCurrentTimeInHourRange, getTitleDayMap, moveHallasanToVisibleCenter } from "@/utils/timeUtils";
import type { DayKey } from "@/utils/timeUtils";
import "@/components/KakaoMap.css";

// 여행 일정 항목 타입 정의
interface ScheduleEntry {
  place: string;
  travelTime: string;
  stayTime: string;
  arrival: string;
  departure: string;
}

interface Accommodation {
  name: string;
  link: string;
  checkIn: string;
  checkOut: string;
  parking: string;
  note: string;
  day: DayKey;
}


// 일차별 스케줄 데이터 타입
type ScheduleData = Record<DayKey, ScheduleEntry[]>;

// RawLocation에 dayKey를 추가한 확장 타입
interface Location extends RawLocation {
  dayKey?: DayKey;
}

// 순차적으로 일차 배열
const orderedDays: DayKey[] = ["day1", "day2", "day3", "day4", "day5"];

// 각 일차별 마커 이미지 경로
const markerIcons: Record<DayKey, string> = {
  day1: "/assets/markerColor/markerred.png",
  day2: "/assets/markerColor/markerorange.png",
  day3: "/assets/markerColor/markeryellow.png",
  day4: "/assets/markerColor/markergreen.png",
  day5: "/assets/markerColor/markerblue.png",
};

export default function KakaoMap() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [accommodationLocations, setAccommodationLocations] = useState<Location[]>([]);

  const [showAccommodation, setShowAccommodation] = useState(false);
  // 현재 시간 상태 (매분 갱신)
  const [, setNow] = useState(new Date());

  // 사이드 패널 열림 여부
  const [panelVisible, setPanelVisible] = useState(false);

  // 지도와 패널 DOM 참조
  const mapRef = useRef<HTMLDivElement>(null!);
  const panelRef = useRef<HTMLDivElement>(null);

  // Kakao map 인스턴스 및 로딩 여부
  const { map, isLoaded } = useKakaoMap(mapRef);

  // 현재 선택된 카테고리 및 선택 항목
  const [selectedCategory, setSelectedCategory] = useState<"all" | "travel" | "cafe" | DayKey>("travel");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);

  // 장소 데이터 상태들
  const [locations, setLocations] = useState<Location[]>([]);
  const [travelList, setTravelList] = useState<string[]>([]);
  const [cafeList, setCafeList] = useState<string[]>([]);
  const [days, setDays] = useState<Record<DayKey, string[]> | null>(null);

  // 스케줄 데이터
  const [scheduleData, setScheduleData] = useState<ScheduleData>({} as ScheduleData);

  // 지도 마커 관리 참조
  const markersRef = useRef<any[]>([]);

  // 매분마다 현재 시간을 갱신하여 일정표 강조 업데이트
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // 초기 데이터 불러오기 (여행지/카페 목록, 일차별 장소, 일정표)
  useEffect(() => {
    async function loadInitialData() {
      const list = await fetchListData();
      const schedule = await fetchScheduleData();
      console.log(list)
      console.log(schedule)
      setTravelList(list.travelList);
      setCafeList(list.cafeList);
      setDays(list.days);
      setScheduleData(schedule);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      const list = await fetchListData();
      const schedule = await fetchScheduleData();
      const acc = await fetchAccommodationData();
      setTravelList(list.travelList);
      setCafeList(list.cafeList);
      setDays(list.days);
      setScheduleData(schedule);
      setAccommodations(acc);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function fetchAllLocations() {
      const acc: Accommodation[] = await fetchAccommodationData(); // 타입 명시
      setAccommodations(acc);

      // 숙소 이름만 추출 (타입 명시)
      const accommodationNames: string[] = acc.map((a: Accommodation) => a.name);

      // 기존 fetchLocations 재사용
      const accLocs: Location[] = await fetchLocations(accommodationNames);

      // 각 숙소에 dayKey 주입
      const accWithDayKey: Location[] = accLocs.map((loc) => {
        const accItem = acc.find((a: Accommodation) => a.name === loc.title);
        return { ...loc, dayKey: accItem?.day };
      });

      setAccommodationLocations(accWithDayKey);
    }
    console.log(accommodationLocations);

    fetchAllLocations();
  }, []);
  


  // days 데이터가 로드되면 기본 상태 초기화
  useEffect(() => {
    if (!days) return;
    setSelectedCategory("travel");
    setSelectedLocation(null);
    setSelectedDay(null);
  }, [days]);

  // 카테고리 또는 일차 변경 시 장소 목록 불러오기
  useEffect(() => {
    if (!isLoaded || !days || Object.keys(days).length === 0) return;

    let titles: string[] = [];

    if (selectedCategory === "all") {
      // 전체 보기: 모든 일차 장소 병합 후 중복 제거
      titles = Array.from(new Set(orderedDays.flatMap((d) => days[d] || [])));
      const dayMap = getTitleDayMap(days);
      fetchLocations(titles).then((res) => setLocations(res.map((l) => ({ ...l, dayKey: dayMap[l.title] }))));
    } else {
      // 여행지, 카페, 혹은 특정 일차에 따른 장소 불러오기
      const dayTitles = selectedCategory === "travel" ? travelList : selectedCategory === "cafe" ? cafeList : days[selectedCategory] || [];

      fetchLocations(dayTitles).then((res) => setLocations(res.map((l) => ({ ...l, dayKey: selectedCategory as DayKey }))));
    }
  }, [selectedCategory, isLoaded, days]);

  // 장소 변경 시 지도 마커 렌더링
  useEffect(() => {
    if (!map || !window.kakao) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const filteredAccommodationLocations = selectedDay ? accommodationLocations.filter((loc) => loc.dayKey === selectedDay) : accommodationLocations;

    const allLocations = [...locations, ...filteredAccommodationLocations];

    const newMarkers = allLocations.map((loc) => {
      const pos = new window.kakao.maps.LatLng(loc.lat, loc.lng);

      // 숙소 여부 확인
      const isAccommodation = accommodations.some((a) => a.name === loc.title);

      // 마커 이미지 설정
      const image = new window.kakao.maps.MarkerImage(
        isAccommodation
          ? "/assets/accmo/accomo.png" // 숙소용 마커 이미지
          : selectedCategory === "travel" || selectedCategory === "cafe"
          ? "/assets/markerColor/markernormal.png"
          : loc.dayKey
          ? markerIcons[loc.dayKey]
          : "/assets/markerColor/markernormal.png",
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


    // 마커 저장
    markersRef.current = newMarkers;

    return () => newMarkers.forEach((m) => m.setMap(null));
  }, [locations, map, selectedCategory]);

  // 초기 줌 레벨 설정
  useEffect(() => {
    if (!map || !window.kakao || !isLoaded) return;
    const isMobile = window.innerWidth <= 600;
    const zoomLevel = isMobile ? 10 : 10;
    map.setLevel(zoomLevel);
  }, [map, isLoaded]);

  // ✅ 핵심 개선 포인트: selectedDay가 바뀔 때 한라산 중심 이동
  useEffect(() => {
    if (!map || !window.kakao || !selectedDay || selectedLocation) return;

    const timeout = setTimeout(() => {
      const isMobile = window.innerWidth <= 600;
      const baseBottomOffset = isMobile ? panelRef.current?.offsetHeight || 0 : 0;
      const extraMobileOffset = isMobile ? -700 : 0;
      const bottomOffset = baseBottomOffset + extraMobileOffset;
      const leftOffset = !isMobile ? 480 : 0;

      // 패널 크기를 고려하여 한라산 중심으로 이동
      moveHallasanToVisibleCenter(map, leftOffset, bottomOffset);
    }, 100); // 렌더 완료 후 작동하도록 지연

    return () => clearTimeout(timeout);
  }, [selectedDay, map, selectedLocation]);

  // 패널 표시 여부 결정
  useEffect(() => {
    if (selectedLocation || selectedDay) {
      setPanelVisible(true);
    } else {
      const timer = setTimeout(() => setPanelVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [selectedLocation, selectedDay]);

  // 패널 닫기 핸들러
  const handleClose = () => {
    setSelectedLocation(null);
    setSelectedDay(null);
    setPanelVisible(false);
    const isMobile = window.innerWidth <= 600;
    const leftOffset = !isMobile ? 350 : 0;
    moveHallasanToVisibleCenter(map, leftOffset, 0);
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f6f7fb" }}>
      {/* 카테고리 버튼 바 */}
      <div className="category-bar">
        {["all", ...orderedDays].map((key) => (
          // {["travel", "cafe", "all", ...orderedDays].map((key) => (
          <button
            key={key}
            onClick={() => {
              setSelectedCategory(key as typeof selectedCategory);
              if (key.startsWith("day")) {
                setSelectedDay(key as DayKey);
                setSelectedLocation(null);
              } else {
                setSelectedDay(null);
                setSelectedLocation(null);
                setPanelVisible(false);
                const isMobile = window.innerWidth <= 600;
                const leftOffset = !isMobile ? 350 : 0;
                moveHallasanToVisibleCenter(map, leftOffset, 0);
              }
            }}
            className={selectedCategory === key ? "active-category" : ""}
          >
            {
              {
                // travel: "여행지 보기",
                // cafe: "카페 보기",
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

      {/* 메인 지도와 패널 */}
      <div style={{ display: "flex", height: "calc(100vh - 66px)", position: "relative" }}>
        {/* 사이드 패널 */}
        {panelVisible && (
          <div ref={panelRef} className="side-panel open">
            <button className="sideAreaCloseButton" onClick={handleClose}>
              ×
            </button>

            {/* 장소 상세 정보 */}
            {selectedLocation && (
              <>
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
              </>
            )}
            {/* 일차별 숙소 */}
            {selectedDay && scheduleData[selectedDay] && (
              <>
                {/* 상단 행: 일정표 제목 + 숙소 버튼 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h3 style={{ margin: 0 }}>{selectedDay.toUpperCase()} 일정표</h3>
                  <button
                    onClick={() => setShowAccommodation((prev) => !prev)}
                    style={{
                      padding: "6px 12px",
                      background: "#1976d2",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    {showAccommodation ? "숙소 정보 접기" : "🏨 숙소 정보 보기"}
                  </button>
                </div>

                {/* 숙소 정보 테이블 */}
                {showAccommodation &&
                  accommodations
                    .filter((a) => a.day === selectedDay)
                    .map((a, i) => (
                      <div key={i} style={{ marginTop: "20px" }}>
                        <h4 style={{ marginBottom: "10px" }}>🏨 숙소 정보</h4>
                        <table className="schedule-table">
                          <thead>
                            <tr>
                              <th>이름</th>
                              <th>체크인</th>
                              <th>체크아웃</th>
                              <th>주차</th>
                              <th>비고</th>
                              <th>예약링크</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{a.name}</td>
                              <td>{a.checkIn}</td>
                              <td>{a.checkOut}</td>
                              <td>{a.parking}</td>
                              <td>{a.note}</td>
                              <td>
                                <a href={a.link} target="_blank" rel="noopener noreferrer">
                                  바로가기
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}

                {/* 일정표 테이블 */}
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
                      <tr key={idx} className={isCurrentTimeInHourRange(item.arrival, item.departure) ? "highlight-row" : ""}>
                        <td title={item.place}>{item.place}</td>
                        <td>{item.travelTime}</td>
                        <td>{item.stayTime}</td>
                        <td>{item.arrival}</td>
                        <td>{item.departure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* 지도 영역 */}
        <div ref={mapRef} style={{ flex: 1 }} />
      </div>
    </div>
  );
}
