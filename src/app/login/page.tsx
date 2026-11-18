import LoginForm from "@/components/LoginForm";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/");
  return <main className="shell"><div className="top"><div className="brand">NEXA<span>DB</span></div><div className="tag">PRIVATE CONSOLE</div></div><LoginForm /></main>;
}
