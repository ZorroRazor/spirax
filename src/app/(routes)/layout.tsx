import { Sidebar } from "./components/Sidebar";

export default function LayoutDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh overflow-hidden bg-zinc-100 p-3 text-zinc-900 md:p-4">
      <div className="flex h-full gap-3">
        <Sidebar />
        <main className="h-full min-w-0 flex-1 overflow-y-auto rounded-xl bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}