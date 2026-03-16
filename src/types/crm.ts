export type CRMId = number
export type CRMUserId = string

export interface Uzytkownik {
  id: CRMUserId
  utworzono_at: string
  imie: string
  nazwisko: string
  email: string
  telefon: string | null
  rola: 'admin' | 'handlowiec'
  aktywny: boolean
}

export interface Firma {
  id: CRMId
  utworzono_at: string
  nazwa: string
  nip: string | null
  strona_www: string | null
  wielkosc_firmy: string | null
  branza: string | null
  adres_miasto: string | null
  przypisany_uzytkownik_id: CRMUserId | null
  opiekun: Pick<Uzytkownik, 'id' | 'imie' | 'nazwisko'> | null
}

export interface SlownikPozycja {
  id: number
  nazwa: string
}

export interface StatusLeada extends SlownikPozycja {
  kolejnosc: number
  zamkniety: boolean
}

export interface Osoba {
  id: CRMId
  utworzono_at: string
  imie: string
  nazwisko: string
  telefon: string | null
  email: string | null
  notatki: string | null
  ostatni_kontakt: string | null
  nastepny_kontakt: string | null
  firma_id: CRMId | null
  status_id: number | null
  zrodlo_id: number | null
  przypisany_uzytkownik_id: CRMUserId | null
  utworzyl_uzytkownik_id?: CRMUserId | null
  firma: Pick<Firma, 'id' | 'nazwa'> | null
  status: Pick<StatusLeada, 'id' | 'nazwa' | 'kolejnosc' | 'zamkniety'> | null
  zrodlo: SlownikPozycja | null
  przypisany: Pick<Uzytkownik, 'id' | 'imie' | 'nazwisko'> | null
}

export interface HistoriaKontaktu {
  id: number
  osoba_id: CRMId
  uzytkownik_id: CRMUserId | null
  typ_kontaktu: 'telefon' | 'email' | 'spotkanie' | 'inne'
  opis: string
  data_kontaktu: string
  nastepny_kontakt: string | null
  osoba: Pick<Osoba, 'id' | 'imie' | 'nazwisko'> | null
  uzytkownik: Pick<Uzytkownik, 'id' | 'imie' | 'nazwisko'> | null
}
