'use server'

import { actionFailure, actionSuccess, type ActionResult } from '@/lib/action-result'
import { requireAdminSession, requireEmployeeSession } from '@/lib/supabase/session'
import { leaveCreateSchema, leaveRejectSchema } from '@/lib/validations/leave'
import { approveLeave, createLeave, rejectLeave } from '@/services/leave.service'

export type LeaveForm = {
  leave_type: 'annual' | 'sick' | 'personal'
  start_date: string
  end_date: string
  reason: string
}

export async function submitLeaveAction(input: LeaveForm): Promise<ActionResult> {
  const session = await requireEmployeeSession()
  const parsed = leaveCreateSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, message: 'End date must be after start date.' }
  }

  try {
    const leave = await createLeave(session, parsed.data)
    return actionSuccess('Leave request submitted.', leave)
  } catch (error) {
    return actionFailure(error)
  }
}

export async function approveLeaveAction(id: string): Promise<ActionResult> {
  const session = await requireAdminSession()

  try {
    const leave = await approveLeave(session, id)
    return actionSuccess('Leave request approved.', leave)
  } catch (error) {
    return actionFailure(error)
  }
}

export async function rejectLeaveAction(id: string, reason: string): Promise<ActionResult> {
  const session = await requireAdminSession()
  const parsed = leaveRejectSchema.safeParse({ reason })

  if (!parsed.success) {
    return { ok: false, message: 'A rejection reason is required.' }
  }

  try {
    const leave = await rejectLeave(session, id, parsed.data.reason)
    return actionSuccess('Leave request rejected.', leave)
  } catch (error) {
    return actionFailure(error)
  }
}