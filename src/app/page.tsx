import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import Console from "@/components/Console";

export default async function Home() {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  return <Console username={session.username} />;
}
