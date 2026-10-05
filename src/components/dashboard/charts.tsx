'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#047857', '#059669', '#10b981', '#a7f3d0', '#065f46', '#6ee7b7']

// recharts needs literal strings, but CSS variables resolve in SVG fill/stroke,
// so grid, ticks and cursor re-theme with the rest of the app.
const LINE = 'rgb(var(--line))'
const MUTED = 'rgb(var(--muted))'
const CANVAS = 'rgb(var(--canvas))'
const SURFACE = 'rgb(var(--surface))'
const INK = 'rgb(var(--ink))'

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: `1px solid ${LINE}`,
  background: SURFACE,
  color: INK,
  fontSize: 12,
}

/** Two charts maximum (PRD section 17): today's attendance and headcount mix. */
export function AttendanceChart({ present, late, leave }: { present: number; late: number; leave: number }) {
  const data = [
    { name: 'Present', value: present },
    { name: 'Late', value: late },
    { name: 'On leave', value: leave },
  ].filter((item) => item.value > 0)

  if (data.length === 0) {
    return <p className="py-10 text-center text-[13px] text-muted">No attendance recorded today yet.</p>
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={LINE} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: MUTED }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 12, fill: MUTED }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: CANVAS }} contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="value" name="Employees" fill="#047857" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DepartmentChart({ items }: { items: Array<{ id: string; name: string; count: number }> }) {
  const data = items.filter((item) => item.count > 0)

  if (data.length === 0) {
    return <p className="py-10 text-center text-[13px] text-muted">No employees assigned yet.</p>
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={2}>
            {data.map((item, index) => (
              <Cell key={item.id} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [`${value} employees`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((item, index) => (
          <li key={item.id} className="flex items-center gap-2 text-[12px] text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} aria-hidden />
            <span className="flex-1 truncate">{item.name}</span>
            <span className="font-medium text-ink tabular-nums">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}