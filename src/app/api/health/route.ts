import { ok } from '@/lib/api-response'

export function GET() {
  return ok({ status: 'ok', time: new Date().toISOString() }, 'HRIS API is running')
}