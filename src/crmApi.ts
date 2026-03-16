import { supabase } from './supabase'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Firma, HistoriaKontaktu, Osoba, StatusLeada, SlownikPozycja, Uzytkownik } from './types/crm'

export class CrmApiError extends Error {
  operation: string
  code: string | null
  details: string | null
  hint: string | null

  constructor(operation: string, source: PostgrestError) {
    super(source.message)
    this.name = 'CrmApiError'
    this.operation = operation
    this.code = source.code
    this.details = source.details
    this.hint = source.hint
  }
}

export interface FirmaInput {
  nazwa: string
  nip?: string | null
  strona_www?: string | null
  wielkosc_firmy?: string | null
  branza?: string | null
  adres_miasto?: string | null
  przypisany_uzytkownik_id?: string | null
}

export type OsobaInput = Omit<
  Osoba,
  'id' | 'utworzono_at' | 'firma' | 'status' | 'zrodlo' | 'przypisany' | 'ostatni_kontakt'
> & {
  telefon?: string | null
  email?: string | null
  notatki?: string | null
  nastepny_kontakt?: string | null
}

export interface HistoriaKontaktuInput {
  osoba_id: number
  uzytkownik_id: string | null
  typ_kontaktu: HistoriaKontaktu['typ_kontaktu']
  opis: string
  data_kontaktu: string
  nastepny_kontakt: string | null
}

export type StatusLeadaInput = Omit<StatusLeada, 'id'>
export type ZrodloLeadaInput = Omit<SlownikPozycja, 'id'>

function ensureClient() {
  if (!supabase) {
    throw new Error('Brak klienta Supabase. Sprawdź konfigurację .env.local')
  }
  return supabase
}

function normalizeSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function throwSupabaseError(operation: string, error: PostgrestError): never {
  throw new CrmApiError(operation, error)
}

export async function fetchOsoby(): Promise<Osoba[]> {
  const client = ensureClient()
  const { data, error } = await client
    .from('osoby')
    .select(`
      id,
      utworzono_at,
      imie,
      nazwisko,
      telefon,
      email,
      notatki,
      ostatni_kontakt,
      nastepny_kontakt,
      firma_id,
      status_id,
      zrodlo_id,
      przypisany_uzytkownik_id,
      firma:firmy!osoby_firma_id_fkey(id, nazwa),
      status:statusy_leadow!osoby_status_id_fkey(id, nazwa, kolejnosc, zamkniety),
      zrodlo:zrodla_leadow!osoby_zrodlo_id_fkey(id, nazwa),
      przypisany:uzytkownicy!osoby_przypisany_uzytkownik_id_fkey(id, imie, nazwisko)
    `)
    .order('utworzono_at', { ascending: false })

  if (error) {
    throwSupabaseError('fetchOsoby', error)
  }

  const rows = (data ?? []) as Array<Omit<Osoba, 'firma' | 'status' | 'zrodlo' | 'przypisany'> & {
    firma: Osoba['firma'] | Osoba['firma'][]
    status: Osoba['status'] | Osoba['status'][]
    zrodlo: Osoba['zrodlo'] | Osoba['zrodlo'][]
    przypisany: Osoba['przypisany'] | Osoba['przypisany'][]
  }>

  return rows.map((row) => ({
    ...row,
    firma: normalizeSingle(row.firma),
    status: normalizeSingle(row.status),
    zrodlo: normalizeSingle(row.zrodlo),
    przypisany: normalizeSingle(row.przypisany),
  }))
}

export async function fetchFirmy(): Promise<Firma[]> {
  const client = ensureClient()
  const { data, error } = await client
    .from('firmy')
    .select(`
      id,
      utworzono_at,
      nazwa,
      nip,
      strona_www,
      wielkosc_firmy,
      branza,
      adres_miasto,
      przypisany_uzytkownik_id,
      opiekun:uzytkownicy!firmy_przypisany_uzytkownik_id_fkey(id, imie, nazwisko)
    `)
    .order('utworzono_at', { ascending: false })

  if (error) {
    throwSupabaseError('fetchFirmy', error)
  }

  const rows = (data ?? []) as Array<Omit<Firma, 'opiekun'> & { opiekun: Firma['opiekun'] | Firma['opiekun'][] }>

  return rows.map((row) => ({
    ...row,
    opiekun: normalizeSingle(row.opiekun),
  }))
}

export async function fetchUzytkownicy(): Promise<Uzytkownik[]> {
  const client = ensureClient()
  const { data, error } = await client
    .from('uzytkownicy')
    .select('id, utworzono_at, imie, nazwisko, email, telefon, rola, aktywny')
    .order('utworzono_at', { ascending: false })

  if (error) {
    throwSupabaseError('fetchUzytkownicy', error)
  }

  return (data ?? []) as Uzytkownik[]
}

export async function fetchHistoriaKontaktu(limit = 50): Promise<HistoriaKontaktu[]> {
  const client = ensureClient()
  const { data, error } = await client
    .from('historia_kontaktu')
    .select(`
      id,
      osoba_id,
      uzytkownik_id,
      typ_kontaktu,
      opis,
      data_kontaktu,
      nastepny_kontakt,
      osoba:osoby!historia_kontaktu_osoba_id_fkey(id, imie, nazwisko),
      uzytkownik:uzytkownicy!historia_kontaktu_uzytkownik_id_fkey(id, imie, nazwisko)
    `)
    .order('data_kontaktu', { ascending: false })
    .limit(limit)

  if (error) {
    throwSupabaseError('fetchHistoriaKontaktu', error)
  }

  const rows = (data ?? []) as Array<Omit<HistoriaKontaktu, 'osoba' | 'uzytkownik'> & {
    osoba: HistoriaKontaktu['osoba'] | HistoriaKontaktu['osoba'][]
    uzytkownik: HistoriaKontaktu['uzytkownik'] | HistoriaKontaktu['uzytkownik'][]
  }>

  return rows.map((row) => ({
    ...row,
    osoba: normalizeSingle(row.osoba),
    uzytkownik: normalizeSingle(row.uzytkownik),
  }))
}

export async function fetchStatusyLeadow(): Promise<StatusLeada[]> {
  const client = ensureClient()
  const { data, error } = await client
    .from('statusy_leadow')
    .select('id, nazwa, kolejnosc, zamkniety')
    .order('kolejnosc', { ascending: true })

  if (error) {
    throwSupabaseError('fetchStatusyLeadow', error)
  }

  return (data ?? []) as StatusLeada[]
}

export async function fetchZrodlaLeadow(): Promise<SlownikPozycja[]> {
  const client = ensureClient()
  const { data, error } = await client
    .from('zrodla_leadow')
    .select('id, nazwa')
    .order('nazwa', { ascending: true })

  if (error) {
    throwSupabaseError('fetchZrodlaLeadow', error)
  }

  return (data ?? []) as SlownikPozycja[]
}

export async function createFirme(input: FirmaInput): Promise<Firma> {
  const client = ensureClient()
  const { data, error } = await client
    .from('firmy')
    .insert(input)
    .select(
      `
      id,
      utworzono_at,
      nazwa,
      nip,
      strona_www,
      wielkosc_firmy,
      branza,
      adres_miasto,
      przypisany_uzytkownik_id,
      opiekun:uzytkownicy!firmy_przypisany_uzytkownik_id_fkey(id, imie, nazwisko)
    `,
    )
    .single()

  if (error) {
    throwSupabaseError('createFirme', error)
  }

  return {
    ...(data as Omit<Firma, 'opiekun'> & { opiekun: Firma['opiekun'] | Firma['opiekun'][] }),
    opiekun: normalizeSingle((data as { opiekun: Firma['opiekun'] | Firma['opiekun'][] }).opiekun),
  }
}

export async function updateFirme(id: number, input: Partial<FirmaInput>): Promise<Firma> {
  const client = ensureClient()
  const { data, error } = await client
    .from('firmy')
    .update(input)
    .eq('id', id)
    .select(
      `
      id,
      utworzono_at,
      nazwa,
      nip,
      strona_www,
      wielkosc_firmy,
      branza,
      adres_miasto,
      przypisany_uzytkownik_id,
      opiekun:uzytkownicy!firmy_przypisany_uzytkownik_id_fkey(id, imie, nazwisko)
    `,
    )
    .single()

  if (error) {
    throwSupabaseError('updateFirme', error)
  }

  return {
    ...(data as Omit<Firma, 'opiekun'> & { opiekun: Firma['opiekun'] | Firma['opiekun'][] }),
    opiekun: normalizeSingle((data as { opiekun: Firma['opiekun'] | Firma['opiekun'][] }).opiekun),
  }
}

export async function deleteFirme(id: number): Promise<void> {
  const client = ensureClient()
  const { error } = await client.from('firmy').delete().eq('id', id)

  if (error) {
    throwSupabaseError('deleteFirme', error)
  }
}

export async function createOsobe(input: OsobaInput): Promise<Osoba> {
  const client = ensureClient()
  const { data, error } = await client
    .from('osoby')
    .insert(input)
    .select(
      `
      id,
      utworzono_at,
      imie,
      nazwisko,
      telefon,
      email,
      notatki,
      ostatni_kontakt,
      nastepny_kontakt,
      firma_id,
      status_id,
      zrodlo_id,
      przypisany_uzytkownik_id,
      utworzyl_uzytkownik_id,
      firma:firmy!osoby_firma_id_fkey(id, nazwa),
      status:statusy_leadow!osoby_status_id_fkey(id, nazwa, kolejnosc, zamkniety),
      zrodlo:zrodla_leadow!osoby_zrodlo_id_fkey(id, nazwa),
      przypisany:uzytkownicy!osoby_przypisany_uzytkownik_id_fkey(id, imie, nazwisko)
    `,
    )
    .single()

  if (error) {
    throwSupabaseError('createOsobe', error)
  }

  const row = data as Omit<Osoba, 'firma' | 'status' | 'zrodlo' | 'przypisany'> & {
    firma: Osoba['firma'] | Osoba['firma'][]
    status: Osoba['status'] | Osoba['status'][]
    zrodlo: Osoba['zrodlo'] | Osoba['zrodlo'][]
    przypisany: Osoba['przypisany'] | Osoba['przypisany'][]
  }

  return {
    ...row,
    firma: normalizeSingle(row.firma),
    status: normalizeSingle(row.status),
    zrodlo: normalizeSingle(row.zrodlo),
    przypisany: normalizeSingle(row.przypisany),
  }
}

export async function updateOsobe(id: number, input: Partial<OsobaInput>): Promise<Osoba> {
  const client = ensureClient()
  const { data, error } = await client
    .from('osoby')
    .update(input)
    .eq('id', id)
    .select(
      `
      id,
      utworzono_at,
      imie,
      nazwisko,
      telefon,
      email,
      notatki,
      ostatni_kontakt,
      nastepny_kontakt,
      firma_id,
      status_id,
      zrodlo_id,
      przypisany_uzytkownik_id,
      utworzyl_uzytkownik_id,
      firma:firmy!osoby_firma_id_fkey(id, nazwa),
      status:statusy_leadow!osoby_status_id_fkey(id, nazwa, kolejnosc, zamkniety),
      zrodlo:zrodla_leadow!osoby_zrodlo_id_fkey(id, nazwa),
      przypisany:uzytkownicy!osoby_przypisany_uzytkownik_id_fkey(id, imie, nazwisko)
    `,
    )
    .single()

  if (error) {
    throwSupabaseError('updateOsobe', error)
  }

  const row = data as Omit<Osoba, 'firma' | 'status' | 'zrodlo' | 'przypisany'> & {
    firma: Osoba['firma'] | Osoba['firma'][]
    status: Osoba['status'] | Osoba['status'][]
    zrodlo: Osoba['zrodlo'] | Osoba['zrodlo'][]
    przypisany: Osoba['przypisany'] | Osoba['przypisany'][]
  }

  return {
    ...row,
    firma: normalizeSingle(row.firma),
    status: normalizeSingle(row.status),
    zrodlo: normalizeSingle(row.zrodlo),
    przypisany: normalizeSingle(row.przypisany),
  }
}

export async function deleteOsobe(id: number): Promise<void> {
  const client = ensureClient()
  const { error } = await client.from('osoby').delete().eq('id', id)

  if (error) {
    throwSupabaseError('deleteOsobe', error)
  }
}

export async function createWpisHistorii(input: HistoriaKontaktuInput): Promise<HistoriaKontaktu> {
  const client = ensureClient()
  const { data, error } = await client
    .from('historia_kontaktu')
    .insert(input)
    .select(
      `
      id,
      osoba_id,
      uzytkownik_id,
      typ_kontaktu,
      opis,
      data_kontaktu,
      nastepny_kontakt,
      osoba:osoby!historia_kontaktu_osoba_id_fkey(id, imie, nazwisko),
      uzytkownik:uzytkownicy!historia_kontaktu_uzytkownik_id_fkey(id, imie, nazwisko)
    `,
    )
    .single()

  if (error) {
    throwSupabaseError('createWpisHistorii', error)
  }

  const row = data as Omit<HistoriaKontaktu, 'osoba' | 'uzytkownik'> & {
    osoba: HistoriaKontaktu['osoba'] | HistoriaKontaktu['osoba'][]
    uzytkownik: HistoriaKontaktu['uzytkownik'] | HistoriaKontaktu['uzytkownik'][]
  }

  return {
    ...row,
    osoba: normalizeSingle(row.osoba),
    uzytkownik: normalizeSingle(row.uzytkownik),
  }
}

export async function updateWpisHistorii(id: number, input: Partial<HistoriaKontaktuInput>): Promise<HistoriaKontaktu> {
  const client = ensureClient()
  const { data, error } = await client
    .from('historia_kontaktu')
    .update(input)
    .eq('id', id)
    .select(
      `
      id,
      osoba_id,
      uzytkownik_id,
      typ_kontaktu,
      opis,
      data_kontaktu,
      nastepny_kontakt,
      osoba:osoby!historia_kontaktu_osoba_id_fkey(id, imie, nazwisko),
      uzytkownik:uzytkownicy!historia_kontaktu_uzytkownik_id_fkey(id, imie, nazwisko)
    `,
    )
    .single()

  if (error) {
    throwSupabaseError('updateWpisHistorii', error)
  }

  const row = data as Omit<HistoriaKontaktu, 'osoba' | 'uzytkownik'> & {
    osoba: HistoriaKontaktu['osoba'] | HistoriaKontaktu['osoba'][]
    uzytkownik: HistoriaKontaktu['uzytkownik'] | HistoriaKontaktu['uzytkownik'][]
  }

  return {
    ...row,
    osoba: normalizeSingle(row.osoba),
    uzytkownik: normalizeSingle(row.uzytkownik),
  }
}

export async function deleteWpisHistorii(id: number): Promise<void> {
  const client = ensureClient()
  const { error } = await client.from('historia_kontaktu').delete().eq('id', id)

  if (error) {
    throwSupabaseError('deleteWpisHistorii', error)
  }
}

export async function createStatusLeada(input: StatusLeadaInput): Promise<StatusLeada> {
  const client = ensureClient()
  const { data, error } = await client.from('statusy_leadow').insert(input).select('id, nazwa, kolejnosc, zamkniety').single()

  if (error) {
    throwSupabaseError('createStatusLeada', error)
  }

  return data as StatusLeada
}

export async function updateStatusLeada(id: number, input: Partial<StatusLeadaInput>): Promise<StatusLeada> {
  const client = ensureClient()
  const { data, error } = await client
    .from('statusy_leadow')
    .update(input)
    .eq('id', id)
    .select('id, nazwa, kolejnosc, zamkniety')
    .single()

  if (error) {
    throwSupabaseError('updateStatusLeada', error)
  }

  return data as StatusLeada
}

export async function deleteStatusLeada(id: number): Promise<void> {
  const client = ensureClient()
  const { error } = await client.from('statusy_leadow').delete().eq('id', id)

  if (error) {
    throwSupabaseError('deleteStatusLeada', error)
  }
}

export async function createZrodloLeada(input: ZrodloLeadaInput): Promise<SlownikPozycja> {
  const client = ensureClient()
  const { data, error } = await client.from('zrodla_leadow').insert(input).select('id, nazwa').single()

  if (error) {
    throwSupabaseError('createZrodloLeada', error)
  }

  return data as SlownikPozycja
}

export async function updateZrodloLeada(id: number, input: Partial<ZrodloLeadaInput>): Promise<SlownikPozycja> {
  const client = ensureClient()
  const { data, error } = await client.from('zrodla_leadow').update(input).eq('id', id).select('id, nazwa').single()

  if (error) {
    throwSupabaseError('updateZrodloLeada', error)
  }

  return data as SlownikPozycja
}

export async function deleteZrodloLeada(id: number): Promise<void> {
  const client = ensureClient()
  const { error } = await client.from('zrodla_leadow').delete().eq('id', id)

  if (error) {
    throwSupabaseError('deleteZrodloLeada', error)
  }
}
