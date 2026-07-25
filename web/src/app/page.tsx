import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const user = await getSession();
  // Kirmagan tashrifchi — o'quvchi ilovasi (ochiq). Xodimlar /login orqali kiradi.
  if (!user) redirect("/student");
  redirect(user.role === "admin" ? "/admin" : "/teacher");
}
