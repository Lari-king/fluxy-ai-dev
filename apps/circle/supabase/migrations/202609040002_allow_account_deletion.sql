alter table public.circle_records
  alter column created_by drop not null;

alter table public.circle_records
  drop constraint circle_records_created_by_fkey;

alter table public.circle_records
  add constraint circle_records_created_by_fkey
  foreign key (created_by)
  references auth.users(id)
  on delete set null;

comment on column public.circle_records.created_by is
  'Auteur de la saisie. Devient anonyme si son compte est supprimé.';
