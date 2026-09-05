export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="main"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-600/22 blur-[110px] animate-pulse-glow" />
        <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-violet-600/18 blur-[110px] animate-pulse-glow [animation-delay:2s]" />
      </div>
      <div className="relative flex w-full justify-center">{children}</div>
    </main>
  );
}
