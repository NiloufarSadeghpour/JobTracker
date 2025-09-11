import React from "react";
import { useJobStats } from "../hooks/useJobStats";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";


function pct(x) { return `${Math.round((x || 0) * 100)}%`; }


export default function AnalyticsSummary(props) {
const { total, interviews, offers, rejections, successRate, byMonth, loading } = useJobStats(props);


return (
<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
{/* Total */}
<div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
<div className="text-xs text-slate-600">Applications</div>
<div className="text-3xl font-extrabold text-blue-900">{loading ? "…" : total}</div>
<div className="mt-3 h-16">
<ResponsiveContainer width="100%" height="100%">
<AreaChart data={byMonth} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
<XAxis dataKey="date" hide />
<YAxis hide />
<Tooltip formatter={(v) => [v, "Applied"]} labelFormatter={(l) => l} />
<Area type="monotone" dataKey="applied" fillOpacity={0.15} strokeWidth={2} />
</AreaChart>
</ResponsiveContainer>
</div>
</div>


{/* Interviews */}
<div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
<div className="text-xs text-slate-600">Interviews</div>
<div className="text-3xl font-extrabold text-blue-900">{loading ? "…" : interviews}</div>
<div className="text-xs text-slate-500">{pct(total ? interviews / total : 0)} of applied</div>
</div>


{/* Offers */}
<div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
<div className="text-xs text-slate-600">Offers</div>
<div className="text-3xl font-extrabold text-blue-900">{loading ? "…" : offers}</div>
<div className="text-xs text-slate-500">Success rate {pct(successRate)}</div>
</div>


{/* Rejections */}
<div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
<div className="text-xs text-slate-600">Rejections</div>
<div className="text-3xl font-extrabold text-blue-900">{loading ? "…" : rejections}</div>
<div className="text-xs text-slate-500">{pct(total ? rejections / total : 0)} of applied</div>
</div>
</section>
);
}