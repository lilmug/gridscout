import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { initialProjects, type Project } from "@/app/data/projects";

export const dynamic = "force-dynamic";

function isProject(value: unknown): value is Project {
  return Boolean(value && typeof value === "object" && "id" in value && typeof value.id === "number");
}

export async function GET() {
  try {
    const sql = database();
    const rows = await sql`select data from projects order by id`;
    if (rows.length === 0) {
      await sql`insert into projects (id, data) select ${initialProjects[0].id}, ${JSON.stringify(initialProjects[0])}::jsonb where not exists (select 1 from projects)`;
      for (const project of initialProjects.slice(1)) {
        await sql`insert into projects (id, data) values (${project.id}, ${JSON.stringify(project)}::jsonb) on conflict (id) do nothing`;
      }
      return NextResponse.json(initialProjects);
    }
    return NextResponse.json(rows.map((row) => row.data));
  } catch (error) {
    console.error("Unable to load projects from Neon.", error);
    return NextResponse.json({ error: "Unable to load projects." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const project = await request.json();
    if (!isProject(project)) {
      return NextResponse.json({ error: "Invalid project payload." }, { status: 400 });
    }
    const sql = database();
    await sql`insert into projects (id, data, updated_at) values (${project.id}, ${JSON.stringify(project)}::jsonb, now()) on conflict (id) do update set data = excluded.data, updated_at = now()`;
    return NextResponse.json(project);
  } catch (error) {
    console.error("Unable to save project to Neon.", error);
    return NextResponse.json({ error: "Unable to save project." }, { status: 500 });
  }
}
