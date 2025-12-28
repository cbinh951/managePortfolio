import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

interface ChartSeries {
    id: string;
    name: string;
    color: string;
}

interface ComparisonChartProps {
    data: any[]; // Array of objects with date and keys corresponding to series IDs
    series: ChartSeries[];
}

export default function ComparisonChart({ data, series }: ComparisonChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-80 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="text-center">
                    <p className="text-slate-500 mb-2">No comparison data available</p>
                    <p className="text-xs text-slate-600">Select at least one portfolio with history to view chart</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Growth of Investment</h3>
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis
                            dataKey="displayDate"
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl max-w-[250px]">
                                            <p className="text-slate-400 text-xs mb-2">{label}</p>
                                            <div className="space-y-1">
                                                {payload.map((entry: any) => (
                                                    <div key={entry.name} className="flex items-center justify-between gap-4">
                                                        <span className="text-xs font-medium" style={{ color: entry.color }}>
                                                            {entry.name}
                                                        </span>
                                                        <span className={`text-sm font-bold ${Number(entry.value) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {Number(entry.value) > 0 ? '+' : ''}{Number(entry.value).toFixed(2)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />

                        {series.map((s) => (
                            <Line
                                key={s.id}
                                type="monotone"
                                dataKey={s.id}
                                name={s.name}
                                stroke={s.color}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
