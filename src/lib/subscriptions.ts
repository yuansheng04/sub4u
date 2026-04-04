import fs from "fs/promises";
import path from "path";
import { Subscription } from "./types";

const FILE = path.join(process.cwd(), "data", "subs.json");

async function read(): Promise<Subscription[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function write(subs: Subscription[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(subs, null, 2));
}

export async function findAll(): Promise<Subscription[]> {
  const subs = await read();
  return subs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findById(id: string): Promise<Subscription | null> {
  return (await read()).find((s) => s.id === id) ?? null;
}

export async function create(
  data: Omit<Subscription, "id" | "createdAt" | "updatedAt">
): Promise<Subscription> {
  const subs = await read();
  const now = new Date().toISOString();
  const sub: Subscription = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  subs.push(sub);
  await write(subs);
  return sub;
}

export async function update(
  id: string,
  patch: Partial<Subscription>
): Promise<Subscription | null> {
  const subs = await read();
  const i = subs.findIndex((s) => s.id === id);
  if (i === -1) return null;
  subs[i] = { ...subs[i], ...patch, id, updatedAt: new Date().toISOString() };
  await write(subs);
  return subs[i];
}

export async function remove(id: string): Promise<boolean> {
  const subs = await read();
  const next = subs.filter((s) => s.id !== id);
  if (next.length === subs.length) return false;
  await write(next);
  return true;
}
