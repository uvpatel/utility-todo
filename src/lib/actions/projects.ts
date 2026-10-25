"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth-guard";
import { projects } from "@/schema/schema";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/todo";

export async function getProjects() {
  const session = await requireAuth();
  const userId = session.user.id;

  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: [desc(projects.createdAt)],
  });

  return userProjects;
}

export async function createProject(input: CreateProjectInput) {
  const session = await requireAuth();
  const userId = session.user.id;
  const validated = createProjectSchema.parse(input);

  const [created] = await db
    .insert(projects)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: validated.name,
      color: validated.color,
    })
    .returning();

  revalidatePath("/todo");
  revalidatePath("/dashboard");
  return created;
}

export async function deleteProject(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));

  revalidatePath("/todo");
  revalidatePath("/dashboard");
  return { success: true };
}
