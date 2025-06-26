// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, title, content, date } = body;

    // 필수값 검증
    if (!category || !title || !content || !date) {
      return NextResponse.json({ message: "모든 필드가 필요합니다." }, { status: 400 });
    }

    // MongoDB 연결 및 데이터 삽입
    const client = await getMongoClient();
    const db = client.db("Yang"); // 'board'를 'Yang'으로 변경
    const posts = db.collection("posts");
    const result = await posts.insertOne({ category, title, content, date });

    return NextResponse.json({ message: "성공적으로 저장되었습니다.", id: result.insertedId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: "서버 오류 발생", error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const client = await getMongoClient();
    const db = client.db("Yang"); // 'board'를 'Yang'으로 변경
    const posts = await db.collection("posts").find({}).sort({ date: -1 }).toArray();

    return NextResponse.json({ posts }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: "게시글 조회 중 오류 발생", error: String(err) }, { status: 500 });
  }
}
