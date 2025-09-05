import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "public", "games");
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.endsWith(".json"))
      .map((e) => ({
        name: e.name,
        url: `/games/${e.name}`,
      }));
    return NextResponse.json({ files });
  } catch (e) {
    return NextResponse.json({ files: [], error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}