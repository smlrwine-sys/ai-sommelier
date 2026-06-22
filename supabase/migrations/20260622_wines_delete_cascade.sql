begin;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select
      constraint_definition.conname,
      constraint_definition.conrelid::regclass as child_table
    from pg_constraint as constraint_definition
    where constraint_definition.contype = 'f'
      and constraint_definition.confrelid = 'public.wines'::regclass
      and constraint_definition.conrelid in (
        'public.store_inventory'::regclass,
        'public.wine_comments'::regclass,
        'public.dishes'::regclass,
        'public.retail_menu_tags'::regclass
      )
  loop
    execute format(
      'alter table %s drop constraint %I',
      constraint_record.child_table,
      constraint_record.conname
    );
  end loop;
end
$$;

alter table public.store_inventory
  add constraint store_inventory_jan_code_fkey
  foreign key (jan_code)
  references public.wines (jan_code)
  on update cascade
  on delete cascade;

alter table public.wine_comments
  add constraint wine_comments_jan_code_fkey
  foreign key (jan_code)
  references public.wines (jan_code)
  on update cascade
  on delete cascade;

alter table public.dishes
  add constraint dishes_pairing_wine_id_fkey
  foreign key (pairing_wine_id)
  references public.wines (id)
  on update cascade
  on delete cascade;

alter table public.retail_menu_tags
  add constraint retail_menu_tags_pairing_wine_id_fkey
  foreign key (pairing_wine_id)
  references public.wines (id)
  on update cascade
  on delete cascade;

create index if not exists store_inventory_jan_code_idx
  on public.store_inventory (jan_code);

create index if not exists wine_comments_jan_code_idx
  on public.wine_comments (jan_code);

create index if not exists dishes_pairing_wine_id_idx
  on public.dishes (pairing_wine_id);

create index if not exists retail_menu_tags_pairing_wine_id_idx
  on public.retail_menu_tags (pairing_wine_id);

alter table public.wines enable row level security;

-- Wine deletion is performed by the server-only service role API.
-- Do not add an anon DELETE policy: the anon key is embedded in the browser.
drop policy if exists "Allow public wine deletion" on public.wines;
drop policy if exists "Enable delete access for all users" on public.wines;

commit;
