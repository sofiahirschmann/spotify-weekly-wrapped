import { redirect } from "next/navigation";
import { getSession, isLoggedIn } from "@/lib/session";
import { demoEnabled } from "@/lib/demo";
import Dashboard from "@/app/components/Dashboard";

export const metadata = { title: "Your Weekly Wrapped" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!isLoggedIn(session) && !demoEnabled()) redirect("/");
  return <Dashboard />;
}
