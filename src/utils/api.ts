// src/utils/api.ts
import axios from "axios";

export async function fetchListData() {
  const res = await axios.get("/api/list");
  return res.data;
}

export async function fetchScheduleData() {
  const res = await axios.get("/api/schedule");
  return res.data;
}
