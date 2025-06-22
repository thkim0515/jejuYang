// timeUtils.ts

export type DayKey = "day1" | "day2" | "day3" | "day4" | "day5";


export const convertTo24Hour = (time: string): string => time;

export const isCurrentTimeInHourRange = (arrival: string, departure: string): boolean => {
  const nowHour = new Date().getHours();

  const arrivalHour = parseInt(arrival.split(":")[0], 10);
  const departureHour = parseInt(departure.split(":")[0], 10);

  // 예외 처리: 출발 < 도착이면 같은 시간 (예: 16:15 ~ 16:15 등)
  if (arrivalHour === departureHour) {
    return nowHour === arrivalHour;
  }

  return nowHour >= arrivalHour && nowHour <= departureHour;
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
