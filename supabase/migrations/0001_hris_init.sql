-- =====================================================================
-- HRIS PT Sentra Karya Digital - initial schema
-- Run this file once in Supabase Dashboard > SQL Editor (or `supabase db push`).
-- Idempotent: safe to re-run on an empty project.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Profiles (PRD section 8)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       varchar not null unique,
  full_name   varchar not null default '',
  role        varchar not null default 'employee' check (role in ('admin', 'employee')),
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is '1:1 with auth.users. role is the only source of authorization.';

-- ---------------------------------------------------------------------
-- 2. Departments (PRD section 13)
-- ---------------------------------------------------------------------
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        varchar not null unique,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Employees (PRD section 9)
-- ---------------------------------------------------------------------
create table if not exists public.employees (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles (id),
  employee_code   varchar not null unique,
  full_name       varchar not null,
  gender          varchar check (gender in ('male', 'female')),
  birth_date      date,
  phone           varchar,
  address         text,
  department_id   uuid references public.departments (id),
  position        varchar,
  join_date       date,
  employment_type varchar check (employment_type in ('permanent', 'contract')),
  base_salary     numeric(14, 2) not null default 0 check (base_salary >= 0),
  status          varchar not null default 'active' check (status in ('active', 'inactive')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Attendance (PRD section 15)
-- ---------------------------------------------------------------------
create table if not exists public.attendance (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references public.employees (id),
  attendance_date date not null,
  check_in        timestamptz not null,
  check_out       timestamptz,
  working_minutes integer check (working_minutes is null or working_minutes >= 0),
  status          varchar not null check (status in ('present', 'late', 'absent', 'leave')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint attendance_employee_date_key unique (employee_id, attendance_date),
  constraint attendance_checkout_after_checkin check (check_out is null or check_out >= check_in)
);

-- ---------------------------------------------------------------------
-- 5. Leave requests (PRD section 21)
-- ---------------------------------------------------------------------
create table if not exists public.leave_requests (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references public.employees (id),
  leave_type      varchar not null check (leave_type in ('annual', 'sick', 'personal')),
  start_date      date not null,
  end_date        date not null,
  total_days      integer not null check (total_days >= 1),
  reason          text not null,
  status          varchar not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by     uuid references public.profiles (id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint leave_requests_date_range check (start_date <= end_date),
  constraint leave_requests_rejection_reason check (status <> 'rejected' or rejection_reason is not null)
);

-- ---------------------------------------------------------------------
-- 6. Leave balances (PRD section 26)
-- ---------------------------------------------------------------------
create table if not exists public.leave_balances (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references public.employees (id),
  year            integer not null check (year between 2000 and 2100),
  total_leave     integer not null default 12 check (total_leave >= 0),
  used_leave      integer not null default 0 check (used_leave >= 0),
  remaining_leave integer not null default 12 check (remaining_leave >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint leave_balances_employee_year_key unique (employee_id, year),
  constraint leave_balances_consistent check (remaining_leave = total_leave - used_leave)
);

-- ---------------------------------------------------------------------
-- 7. Payrolls (PRD section 32)
-- ---------------------------------------------------------------------
create table if not exists public.payrolls (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.employees (id),
  period_month  integer not null check (period_month between 1 and 12),
  period_year   integer not null check (period_year between 2000 and 2100),
  base_salary   numeric(14, 2) not null default 0 check (base_salary >= 0),
  allowance     numeric(14, 2) not null default 0 check (allowance >= 0),
  bonus         numeric(14, 2) not null default 0 check (bonus >= 0),
  deduction     numeric(14, 2) not null default 0 check (deduction >= 0),
  net_salary    numeric(14, 2) not null default 0 check (net_salary >= 0),
  status        varchar not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  created_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint payrolls_employee_period_key unique (employee_id, period_month, period_year),
  constraint payrolls_net_salary_consistent check (net_salary = base_salary + allowance + bonus - deduction),
  constraint payrolls_published_at check (status <> 'published' or published_at is not null)
);

-- ---------------------------------------------------------------------
-- 8. Notifications (PRD section 40)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  title        varchar not null,
  message      text not null,
  type         varchar not null check (type in ('leave', 'payroll', 'employee', 'system')),
  reference_id uuid,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9. Audit logs (PRD section 44)
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  action      varchar not null,
  entity      varchar not null,
  entity_id   uuid,
  description text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10. Indexes (PRD section 46)
-- ---------------------------------------------------------------------
create unique index if not exists employees_user_id_key on public.employees (user_id) where user_id is not null;
create index if not exists employees_department_id_idx on public.employees (department_id);
create index if not exists attendance_employee_id_idx on public.attendance (employee_id);
create index if not exists attendance_attendance_date_idx on public.attendance (attendance_date);
create index if not exists attendance_status_idx on public.attendance (status);
create index if not exists leave_requests_employee_id_idx on public.leave_requests (employee_id);
create index if not exists leave_requests_status_idx on public.leave_requests (status);
create index if not exists leave_requests_range_idx on public.leave_requests (start_date, end_date);
create index if not exists payrolls_employee_id_idx on public.payrolls (employee_id);
create index if not exists payrolls_period_idx on public.payrolls (period_year, period_month);
create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_is_read_idx on public.notifications (is_read);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------
-- 11. updated_at trigger (PRD section 74)
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.departments;
create trigger set_updated_at before update on public.departments for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.employees;
create trigger set_updated_at before update on public.employees for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.attendance;
create trigger set_updated_at before update on public.attendance for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.leave_requests;
create trigger set_updated_at before update on public.leave_requests for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.leave_balances;
create trigger set_updated_at before update on public.leave_balances for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.payrolls;
create trigger set_updated_at before update on public.payrolls for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 12. Auto-create profile for every auth user (PRD section 5)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- role is intentionally NOT read from metadata: users control their own
  -- metadata at sign up, so it must never be able to grant itself 'admin'.
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 13. RLS helper functions
--     SECURITY DEFINER so they can read profiles/employees without
--     re-entering the policies below.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active
  );
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id from public.employees e where e.user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 14. Row Level Security (PRD section 47-53)
--     Reads run as the logged-in user, so these policies are the real
--     enforcement point. Privileged writes (create/update employee,
--     department, payroll, publish) go through the service role client in
--     src/lib/supabase/admin.ts after an admin session check in the route.
-- ---------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.departments     enable row level security;
alter table public.employees       enable row level security;
alter table public.attendance      enable row level security;
alter table public.leave_requests  enable row level security;
alter table public.leave_balances  enable row level security;
alter table public.payrolls        enable row level security;
alter table public.notifications   enable row level security;
alter table public.audit_logs      enable row level security;

-- profiles: own row or admin reads. UPDATE is limited to
-- (full_name, avatar_url) by the column grant in section 16.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- departments: readable by any signed-in user, written by admin only
drop policy if exists departments_select on public.departments;
create policy departments_select on public.departments
  for select to authenticated
  using (true);

-- employees: own record or admin. UPDATE limited to (phone, address).
drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists employees_update_self on public.employees;
create policy employees_update_self on public.employees
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- attendance: own rows only (check-in is done by the backend flow)
drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
  for select to authenticated
  using (employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists attendance_insert_own on public.attendance;
create policy attendance_insert_own on public.attendance
  for insert to authenticated
  with check (
    employee_id = public.current_employee_id()
    and check_out is null
    and working_minutes is null
  );

-- leave_requests: employee may submit (always pending) and read own rows.
-- Status changes only happen through approve_leave / reject_leave below.
drop policy if exists leave_requests_select on public.leave_requests;
create policy leave_requests_select on public.leave_requests
  for select to authenticated
  using (employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists leave_requests_insert_own on public.leave_requests;
create policy leave_requests_insert_own on public.leave_requests
  for insert to authenticated
  with check (
    employee_id = public.current_employee_id()
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and rejection_reason is null
  );

-- leave_balances: read only, mutations happen in approve_leave
drop policy if exists leave_balances_select on public.leave_balances;
create policy leave_balances_select on public.leave_balances
  for select to authenticated
  using (employee_id = public.current_employee_id() or public.is_admin());

-- payrolls: employee sees own rows only when published
drop policy if exists payrolls_select on public.payrolls;
create policy payrolls_select on public.payrolls
  for select to authenticated
  using (public.is_admin() or (employee_id = public.current_employee_id() and status = 'published'));

-- notifications: own rows, is_read only
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- audit_logs: admin only
drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 15. Transactions as functions (PRD section 31, 56)
--     PostgREST cannot run BEGIN/COMMIT across requests, so the leave
--     review flow and employee creation live in plpgsql.
-- ---------------------------------------------------------------------

-- Create employee + leave balance + welcome notification + audit log.
-- Called with the service role client (auth.uid() is NULL there), so the
-- acting admin is passed in explicitly.
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
  p_default_annual_leave integer default 12
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
    department_id, position, join_date, employment_type, base_salary, status
  )
  values (
    p_user_id, p_employee_code, p_full_name, p_gender, p_birth_date, p_phone, p_address,
    p_department_id, p_position, p_join_date, p_employment_type, p_base_salary, 'active'
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

-- Approve leave + deduct balance + notify, atomically (PRD section 28, 30, 31)
create or replace function public.approve_leave(p_leave_id uuid)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leave public.leave_requests;
  v_balance public.leave_balances;
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_leave from public.leave_requests where id = p_leave_id for update;
  if v_leave.id is null then
    raise exception 'LEAVE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_leave.status <> 'pending' then
    raise exception 'LEAVE_ALREADY_REVIEWED' using errcode = 'P0001';
  end if;

  select user_id into v_user_id from public.employees where id = v_leave.employee_id;

  if v_leave.leave_type = 'annual' then
    select * into v_balance
      from public.leave_balances
      where employee_id = v_leave.employee_id
        and year = extract(year from v_leave.start_date)::integer
      for update;

    if v_balance.id is null then
      raise exception 'LEAVE_BALANCE_NOT_FOUND' using errcode = 'P0002';
    end if;
    if v_balance.remaining_leave < v_leave.total_days then
      raise exception 'LEAVE_BALANCE_INSUFFICIENT' using errcode = 'P0001';
    end if;

    update public.leave_balances
      set used_leave = used_leave + v_leave.total_days,
          remaining_leave = remaining_leave - v_leave.total_days
      where id = v_balance.id;
  end if;

  update public.leave_requests
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_leave_id
    returning * into v_leave;

  insert into public.notifications (user_id, title, message, type, reference_id)
  values (
    v_user_id,
    'Pengajuan cuti disetujui',
    'Pengajuan cuti ' || v_leave.leave_type || ' tanggal ' || v_leave.start_date
      || ' s.d. ' || v_leave.end_date || ' (' || v_leave.total_days || ' hari) telah disetujui.',
    'leave',
    p_leave_id
  );

  insert into public.audit_logs (user_id, action, entity, entity_id, description)
  values (auth.uid(), 'approve_leave', 'leave_requests', p_leave_id, 'Approved ' || v_leave.total_days || ' day(s) leave');

  return v_leave;
end;
$$;

-- Reject leave + notify, atomically (PRD section 29, 31)
create or replace function public.reject_leave(p_leave_id uuid, p_reason text)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leave public.leave_requests;
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'REASON_REQUIRED' using errcode = '22023';
  end if;

  select * into v_leave from public.leave_requests where id = p_leave_id for update;
  if v_leave.id is null then
    raise exception 'LEAVE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_leave.status <> 'pending' then
    raise exception 'LEAVE_ALREADY_REVIEWED' using errcode = 'P0001';
  end if;

  select user_id into v_user_id from public.employees where id = v_leave.employee_id;

  update public.leave_requests
    set status = 'rejected', rejection_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_leave_id
    returning * into v_leave;

  insert into public.notifications (user_id, title, message, type, reference_id)
  values (
    v_user_id,
    'Pengajuan cuti ditolak',
    'Pengajuan cuti ' || v_leave.leave_type || ' tanggal ' || v_leave.start_date
      || ' s.d. ' || v_leave.end_date || ' ditolak. Alasan: ' || p_reason,
    'leave',
    p_leave_id
  );

  insert into public.audit_logs (user_id, action, entity, entity_id, description)
  values (auth.uid(), 'reject_leave', 'leave_requests', p_leave_id, 'Rejected leave: ' || p_reason);

  return v_leave;
end;
$$;

-- ---------------------------------------------------------------------
-- 16. Grants (PRD section 47, 48-53)
--     Supabase grants ALL on new public tables by default, so start from
--     zero and hand out the minimum each role needs (PRD section 95).
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select on
  public.profiles, public.departments, public.employees, public.attendance,
  public.leave_requests, public.leave_balances, public.payrolls,
  public.notifications, public.audit_logs
  to authenticated;

grant insert on public.attendance, public.leave_requests to authenticated;

grant update (phone, address) on public.employees to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant update (is_read) on public.notifications to authenticated;

grant execute on function public.approve_leave(uuid) to authenticated;
grant execute on function public.reject_leave(uuid, text) to authenticated;

-- create_employee is service role only (it bypasses RLS on purpose).
revoke all on function public.create_employee(
  uuid, uuid, varchar, varchar, varchar, date, varchar, text, uuid, varchar, date, varchar, numeric, text, integer
) from public, anon, authenticated;
grant execute on function public.create_employee(
  uuid, uuid, varchar, varchar, varchar, date, varchar, text, uuid, varchar, date, varchar, numeric, text, integer
) to service_role;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
revoke all on function public.current_employee_id() from public, anon;
grant execute on function public.current_employee_id() to authenticated, service_role;