import "server-only";
import { redirect, notFound } from "next/navigation";
import { supabase, isConfigured } from "./supabase/server";
import { z } from "zod";
export async function requireUser() {
  if (!isConfigured()) redirect("/login?setup=1");
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  return { db, user };
}
export async function requireOrg(org: string, write = false) {
  if (!z.uuid().safeParse(org).success) notFound();
  const { db, user } = await requireUser();
  const { data: member } = await db
    .from("organization_members")
    .select("role")
    .eq("organization_id", org)
    .eq("user_id", user.id)
    .single();
  if (!member) notFound();
  if (write && !["owner", "admin", "editor"].includes(member.role))
    throw new Error("Seu perfil não permite alterar este recurso.");
  const { data: organization } = await db
    .from("organizations")
    .select("*, plans(*)")
    .eq("id", org)
    .single();
  if (!organization) notFound();
  return { db, user, member, organization };
}
