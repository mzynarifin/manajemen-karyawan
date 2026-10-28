'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import { Placeholder } from '@/components/ui/states'

/**
 * Recharts is heavy, so the two dashboard charts load only when the dashboard
 * renders. These wrappers keep the dynamic() calls out of the page components.
 */
function placeholder() {
  return <Placeholder className="h-64" />
}

const AttendanceChartInner = dynamic(() => import('@/components/dashboard/charts').then((m) => m.AttendanceChart), {
  ssr: false,
  loading: placeholder,
})

const DepartmentChartInner = dynamic(() => import('@/components/dashboard/charts').then((m) => m.DepartmentChart), {
  ssr: false,
  loading: placeholder,
})

export function AttendanceChart(props: ComponentProps<typeof AttendanceChartInner>) {
  return <AttendanceChartInner {...props} />
}

export function DepartmentChart(props: ComponentProps<typeof DepartmentChartInner>) {
  return <DepartmentChartInner {...props} />
}
