import { requireSession } from "@/lib/session";
import Header from "@/components/Header";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  return (
    <div className="min-h-screen">
      <Header name={user.name || user.email} role={user.role} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
