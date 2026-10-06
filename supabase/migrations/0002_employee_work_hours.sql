-- ---------------------------------------------------------------------------
-- Per-employee working hours, set by HR on the employee record.
--
-- Until now the only schedule was the global ATTENDANCE_START_TIME /
-- ATTENDANCE_GRACE_MINUTES pair in the app env, which is the same for everyone.
-- These columns let one employee work a different shift from the rest: a null
-- work_start keeps the global default, so existing employees are unaffected.
--
-- work_start   first minute of the shift, decides late vs present on check-in
-- work_end     end of the shift, shown on the payslip and the detail page
-- break_minutes unpaid break inside the shift, subtracted from working_minutes
-- ---------------------------------------------------------------------------

alter table public.employees
  add column if not exists work_start time,
  add column if not exists work_end time,
  add column if not exists break_minutes integer not null default 0;

-- Both times or neither, and no overnight shifts: work_end > work_start.
alter table public.employees
  drop constraint if exists employees_work_hours_check;
alter table public.employees
  add constraint employees_work_hours_check
  check (
    (work_start is null and work_end is null)
    or (work_start is not null and work_end is not null and work_end > work_start)
  );

alter table public.employees
  drop constraint if exists employees_break_minutes_check;
alter table public.employees
  add constraint employees_break_minutes_check check (break_minutes >= 0 and break_minutes <= 480);

-- ---------------------------------------------------------------------------
-- create_employee gains the three new arguments. Postgres keeps the old
-- signature around on CREATE OR REPLACE, so the previous one is dropped first.
-- ---------------------------------------------------------------------------

drop function if exists public.create_employee(
  uuid, uuid, varchar, varchar, varchar, date, varchar, text, uuid, varchar, date, varchar, numeric, text, integer
);

create or replace function public.create_employee(
  p_actor_id       uuid,
  p_user_id        uuid,
  p_employee_code  varchar,
  p_full_name      varchar,
  p_gender         varchar default null,
  p_birth_date     date default null,
  p_phone          varchar default null,
  p_address        text default null,
  p_department_id  uuid default null,
  p_position       varchar default null,
  p_join_date      date default null,
  p_employment_type varchar default null,
  p_base_salary    numeric default 0,
  p_avatar_url     text default null,
  p_default_annual_leave integer default 12,
  p_work_start     time default null,
  p_work_end       time default null,
  p_break_minutes  integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
  v_year integer := extract(year from (now() at time zone 'Asia/Jakarta'))::integer;
begin
  insert into public.employees (
    user_id, employee_code, full_name, gender, birth_date, phone, address,
    department_id, position, join_date, employment_type, base_salary, status,
    work_start, work_end, break_minutes
  )
  values (
    p_user_id, p_employee_code, p_full_name, p_gender, p_birth_date, p_phone, p_address,
    p_department_id, p_position, p_join_date, p_employment_type, p_base_salary, 'active',
    p_work_start, p_work_end, coalesce(p_break_minutes, 0)
  )
  returning id into v_employee_id;

  insert into public.leave_balances (employee_id, year, total_leave, used_leave, remaining_leave)
  values (v_employee_id, v_year, p_default_annual_leave, 0, p_default_annual_leave)
  on conflict (employee_id, year) do nothing;

  update public.profiles
    set full_name = p_full_name, avatar_url = coalesce(p_avatar_url, avatar_url)
    where id = p_user_id;

  insert into public.notifications (user_id, title, message, type, reference_id)
  values (
    p_user_id,
    'Akun HRIS berhasil dibuat',
    'Selamat datang di HRIS PT Sentra Karya Digital. Hubungi HR bila perlu bantuan.',
    'employee',
    v_employee_id
  );

  insert into public.audit_logs (user_id, action, entity, entity_id, description)
  values (p_actor_id, 'create_employee', 'employees', v_employee_id, 'Created employee ' || p_employee_code || ' (' || p_full_name || ')');

  return v_employee_id;
end;
$$;

-- create_employee is service role only (it bypasses RLS on purpose).
revoke all on function public.create_employee(
  uuid, uuid, varchar, varchar, varchar, date, varchar, text, uuid, varchar, date, varchar, numeric, text, integer,
  time, time, integer
) from public, anon, authenticated;
grant execute on function public.create_employee(
  uuid, uuid, varchar, varchar, varchar, date, varchar, text, uuid, varchar, date, varchar, numeric, text, integer,
  time, time, integer
) to service_role;
