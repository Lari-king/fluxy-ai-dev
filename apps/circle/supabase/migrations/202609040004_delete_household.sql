create or replace function public.circle_delete_household(target_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1
    from public.circle_households
    where id = target_household_id
      and owner_id = auth.uid()
  ) then
    raise exception 'household_owner_required';
  end if;

  delete from public.circle_households
  where id = target_household_id
    and owner_id = auth.uid();
end;
$$;

grant execute on function public.circle_delete_household(uuid) to authenticated;

comment on function public.circle_delete_household(uuid) is
  'Supprime définitivement un foyer et ses données en cascade. Réservé à son propriétaire.';
