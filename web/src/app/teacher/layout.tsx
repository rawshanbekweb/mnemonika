import { requireSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  return (
    <div className="pattern-page min-h-screen lg:pl-60">
      <Sidebar name={user.name || user.email} role={user.role} />
      <main className="mx-auto max-w-5xl px-4 pb-10 pt-[4.5rem] lg:pt-8">{children}</main>
    </div>
  );
}
