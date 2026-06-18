'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export interface ChartPoint {
  date: string;
  weight: number;
  chest: number;
  waist: number;
  arms: number;
}

/**
 * Recharts is ~110 kB of JS. It lives in its own client module so the parent Progress page can
 * `next/dynamic`-import it (ssr:false) — keeping it out of the route's initial bundle and SSR.
 */
export default function ProgressChart({
  data,
  metric,
}: {
  data: ChartPoint[];
  metric: 'weight' | 'measurements';
}) {
  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
        Log metrics to begin plotting your fitness chart.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {metric === 'weight' ? (
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
          <YAxis stroke="#9ca3af" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip
            contentStyle={{ backgroundColor: '#131722', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
          <Area type="monotone" dataKey="weight" name="Weight (kg)" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#weightGrad)" />
        </AreaChart>
      ) : (
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
          <YAxis stroke="#9ca3af" fontSize={11} />
          <Tooltip
            contentStyle={{ backgroundColor: '#131722', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
          <Line type="monotone" dataKey="chest" name="Chest (in)" stroke="#06b6d4" strokeWidth={2} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="waist" name="Waist (in)" stroke="#8b5cf6" strokeWidth={2} />
          <Line type="monotone" dataKey="arms" name="Arms (in)" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
