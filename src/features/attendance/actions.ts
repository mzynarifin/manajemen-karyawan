'use server'

import { actionFailure, actionSuccess, type ActionResult } from '@/lib/action-result'
import { requireEmployeeSession } from '@/lib/supabase/session'
import { checkIn, checkOut } from '@/services/attendance.service'

export async function checkInAction(): Promise<ActionResult> {
  const session = await requireEmployeeSession()

  try {
    const attendance = await checkIn(session)
    return actionSuccess('Checked in successfully.', attendance)
  } catch (error) {
    return actionFailure(error)
  }
}

export async function checkOutAction(): Promise<ActionResult> {
  const session = await requireEmployeeSession()

  try {
    const attendance = await checkOut(session)
    return actionSuccess('Checked out successfully.', attendance)
  } catch (error) {
    return actionFailure(error)
  }
}