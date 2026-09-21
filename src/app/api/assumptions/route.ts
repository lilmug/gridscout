import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { defaultCableAssumptions, defaultRegionalQuoteParts } from "@/app/data/assumptions";

export const dynamic = "force-dynamic";

const defaultData = {
  cables: defaultCableAssumptions,
  quoteParts: defaultRegionalQuoteParts,
};

export async function GET() {
  try {
    const sql = database();
    const rows = await sql`select data from assumptions where key = 'global'`;
    if (rows.length === 0) {
      await sql`insert into assumptions (key, data) values ('global', ${JSON.stringify(defaultData)}::jsonb)`;
      return NextResponse.json(defaultData);
    }
    return NextResponse.json(rows[0].data);
  } catch (error) {
    console.error("Unable to load assumptions from Neon.", error);
    return NextResponse.json({ error: "Unable to load assumptions." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data || !Array.isArray(data.cables) || !Array.isArray(data.quoteParts)) {
      return NextResponse.json({ error: "Invalid assumptions payload." }, { status: 400 });
    }
    const sql = database();
    await sql`insert into assumptions (key, data, updated_at) values ('global', ${JSON.stringify(data)}::jsonb, now()) on conflict (key) do update set data = excluded.data, updated_at = now()`;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unable to save assumptions to Neon.", error);
    return NextResponse.json({ error: "Unable to save assumptions." }, { status: 500 });
  }
}
