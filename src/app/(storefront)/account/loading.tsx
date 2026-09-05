/**
 * Account routes are `noindex`, so a segment-level loading file is safe here:
 * the streaming-vs-404 tradeoff that applies to /store only matters for pages
 * search engines crawl.
 */
export default function AccountLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Memuat halaman akun">
      <div className="skeleton h-9 w-52 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="glass rounded-2xl p-5">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton mt-3 h-7 w-28 rounded" />
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
