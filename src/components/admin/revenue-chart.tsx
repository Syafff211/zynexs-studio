import { formatIDR, formatNumber } from "@/lib/utils";
import type { DailyPoint } from "@/services/account";

/**
 * Lightweight SVG area chart — no charting library, no client JS.
 * Renders revenue as an area and order counts as bars underneath.
 */
export function RevenueChart({ data }: { data: DailyPoint[] }) {
  if (!data.length) return null;

  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 8, bottom: 26, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);

  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + innerH - (d.revenue / maxRevenue) * innerH,
    ...d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(2)},${(padding.top + innerH).toFixed(2)} L${points[0].x.toFixed(2)},${(padding.top + innerH).toFixed(2)} Z`;

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  const barWidth = Math.max(2, Math.min(14, innerW / data.length - 6));

  return (
    <figure className="glass-solid rounded-2xl p-5">
      <figcaption className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-white">Revenue &amp; Pesanan</h2>
          <p className="mt-0.5 text-[12.5px] text-white/45">
            {data.length} hari terakhir · {formatNumber(totalOrders)} pesanan
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-white">{formatIDR(totalRevenue)}</p>
          <p className="text-[12px] text-white/40">total revenue terbayar</p>
        </div>
      </figcaption>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 w-full min-w-[36rem]"
          role="img"
          aria-label={`Grafik revenue ${data.length} hari terakhir, total ${formatIDR(totalRevenue)} dari ${totalOrders} pesanan`}
        >
          <defs>
            <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3366ff" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#3366ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="revLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#598eff" />
              <stop offset="100%" stopColor="#4fd8ee" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + innerH * ratio}
              y2={padding.top + innerH * ratio}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          ))}

          {/* Order bars */}
          {points.map((p) => {
            const barH = (p.orders / maxOrders) * (innerH * 0.32);
            return (
              <rect
                key={`bar-${p.date}`}
                x={p.x - barWidth / 2}
                y={padding.top + innerH - barH}
                width={barWidth}
                height={Math.max(0, barH)}
                rx="2"
                fill="rgba(124,92,255,0.28)"
              />
            );
          })}

          {/* Revenue area + line */}
          <path d={areaPath} fill="url(#revArea)" />
          <path
            d={linePath}
            fill="none"
            stroke="url(#revLine)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p) => (
            <circle key={`dot-${p.date}`} cx={p.x} cy={p.y} r="3" fill="#8eb5ff">
              <title>{`${p.date}: ${formatIDR(p.revenue)} · ${p.orders} pesanan`}</title>
            </circle>
          ))}

          {/* X labels — every other tick to avoid crowding */}
          {points.map((p, i) =>
            i % Math.ceil(points.length / 7) === 0 ? (
              <text
                key={`label-${p.date}`}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fill="rgba(255,255,255,0.35)"
                fontSize="10"
              >
                {p.date.slice(5).replace("-", "/")}
              </text>
            ) : null
          )}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-white/[0.07] pt-3 text-[12px] text-white/45">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-gradient-to-r from-brand-400 to-accent-400" />
          Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-500/45" />
          Jumlah pesanan
        </span>
      </div>
    </figure>
  );
}
