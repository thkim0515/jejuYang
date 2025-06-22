// timeUtils.ts

export type DayKey = "day1" | "day2" | "day3" | "day4" | "day5";

// ✅ 기존 days import 삭제
// import listData from "@/../public/data/list.json"; ❌

export const convertTo24Hour = (time: string): string => {
  if (!time.includes("AM") && !time.includes("PM")) return time;
  const [h, mMeridiem] = time.split(":");
  const minute = mMeridiem.slice(0, 2);
  const meridiem = mMeridiem.slice(2).toUpperCase();
  let hour = parseInt(h);
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, "0")}:${minute}`;
};

export const isCurrentTimeInRange = (arrival: string, departure: string): boolean => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [aH, aM] = convertTo24Hour(arrival).split(":").map(Number);
  const [dH, dM] = convertTo24Hour(departure).split(":").map(Number);

  const arrivalMin = aH * 60 + aM;
  const departureMin = dH * 60 + dM;

  return nowMinutes >= arrivalMin && nowMinutes <= departureMin;
};

export const getTitleDayMap = (days: Record<DayKey, string[]>): Record<string, DayKey> => {
  const map: Record<string, DayKey> = {};
  const orderedDays: DayKey[] = ["day1", "day2", "day3", "day4", "day5"];
  for (const day of orderedDays) {
    if (!days[day]) continue;
    for (const title of days[day]) {
      map[title] = day;
    }
  }
  return map;
};

export const moveHallasanToVisibleCenter = (map: any, leftOffset = 0, bottomOffset = 0) => {
  if (!map || !window.kakao) return;
  const hallasan = new window.kakao.maps.LatLng(33.3617, 126.5292);
  const proj = map.getProjection();
  const pt = proj.containerPointFromCoords(hallasan);
  pt.x += leftOffset / 2;
  pt.y -= bottomOffset / 2;
  const adjusted = proj.coordsFromContainerPoint(pt);
  map.setCenter(adjusted);
};
