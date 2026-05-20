
-- Fix function search_path
create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- Restrict EXECUTE on handle_new_user (only trigger should call it)
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Restrict shared_results insert: require non-null payload and small size
drop policy if exists "shared_insert_all" on public.shared_results;
create policy "shared_insert_valid" on public.shared_results
  for insert to anon, authenticated
  with check (
    payload is not null
    and length(id) between 6 and 64
    and octet_length(payload::text) < 8000
  );
