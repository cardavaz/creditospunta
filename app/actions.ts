"use server";

import { redirect } from "next/navigation";
import { logout, getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function logoutAction() {
  const user = await getCurrentUser();
  await logout();
  if (user) {
    await recordAudit({ actorId: user.userId, action: "LOGOUT", entity: "User", entityId: user.userId, result: "OK" });
  }
  redirect("/login");
}
