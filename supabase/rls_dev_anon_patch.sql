begin;

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.uzytkownicy to anon, authenticated;
grant select, insert, update, delete on table public.firmy to anon, authenticated;
grant select, insert, update, delete on table public.osoby to anon, authenticated;
grant select, insert, update, delete on table public.historia_kontaktu to anon, authenticated;
grant select, insert, update, delete on table public.zrodla_leadow to anon, authenticated;
grant select, insert, update, delete on table public.statusy_leadow to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;

drop policy if exists p_uzytkownicy_all_anon on public.uzytkownicy;
create policy p_uzytkownicy_all_anon on public.uzytkownicy
for all to anon
using (true)
with check (true);

drop policy if exists p_firmy_all_anon on public.firmy;
create policy p_firmy_all_anon on public.firmy
for all to anon
using (true)
with check (true);

drop policy if exists p_osoby_all_anon on public.osoby;
create policy p_osoby_all_anon on public.osoby
for all to anon
using (true)
with check (true);

drop policy if exists p_historia_kontaktu_all_anon on public.historia_kontaktu;
create policy p_historia_kontaktu_all_anon on public.historia_kontaktu
for all to anon
using (true)
with check (true);

drop policy if exists p_zrodla_leadow_all_anon on public.zrodla_leadow;
create policy p_zrodla_leadow_all_anon on public.zrodla_leadow
for all to anon
using (true)
with check (true);

drop policy if exists p_statusy_leadow_all_anon on public.statusy_leadow;
create policy p_statusy_leadow_all_anon on public.statusy_leadow
for all to anon
using (true)
with check (true);

commit;
