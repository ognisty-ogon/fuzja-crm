<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  CrmApiError,
  createFirme,
  createOsobe,
  createStatusLeada,
  createWpisHistorii,
  createZrodloLeada,
  deleteFirme,
  deleteOsobe,
  deleteStatusLeada,
  deleteWpisHistorii,
  deleteZrodloLeada,
  fetchFirmy,
  fetchHistoriaKontaktu,
  fetchOsoby,
  fetchStatusyLeadow,
  fetchUzytkownicy,
  fetchZrodlaLeadow,
  updateFirme,
  updateOsobe,
  updateStatusLeada,
  updateWpisHistorii,
  updateZrodloLeada,
} from './crmApi'
import { configuredUserId, supabaseConfigError } from './supabase'
import type { Firma, HistoriaKontaktu, Osoba, StatusLeada, SlownikPozycja, Uzytkownik } from './types/crm'

const loading = ref(true)
const status = ref('Inicjalizacja...')
const actionInProgress = ref(false)
const activeView = ref<'crm' | 'console'>('crm')

type ConsoleLevel = 'info' | 'error'
type ConsoleEntry = {
  id: number
  at: string
  level: ConsoleLevel
  action: string
  message: string
  meta?: Record<string, unknown>
}

const consoleEntries = ref<ConsoleEntry[]>([])

const osoby = ref<Osoba[]>([])
const firmy = ref<Firma[]>([])
const uzytkownicy = ref<Uzytkownik[]>([])
const historiaKontaktu = ref<HistoriaKontaktu[]>([])
const statusyLeadow = ref<StatusLeada[]>([])
const zrodlaLeadow = ref<SlownikPozycja[]>([])

const firmaForm = ref({
  id: null as number | null,
  nazwa: '',
  nip: '',
  branza: '',
  adres_miasto: '',
  przypisany_uzytkownik_id: '',
})

const osobaForm = ref({
  id: null as number | null,
  imie: '',
  nazwisko: '',
  telefon: '',
  email: '',
  notatki: '',
  firma_id: '',
  status_id: '',
  zrodlo_id: '',
  przypisany_uzytkownik_id: '',
  nastepny_kontakt: '',
})

const historiaForm = ref({
  id: null as number | null,
  osoba_id: '',
  typ_kontaktu: 'telefon' as HistoriaKontaktu['typ_kontaktu'],
  opis: '',
  data_kontaktu: '',
  nastepny_kontakt: '',
})

const statusForm = ref({
  id: null as number | null,
  nazwa: '',
  kolejnosc: '1',
  zamkniety: false,
})

const zrodloForm = ref({
  id: null as number | null,
  nazwa: '',
})

const podsumowanie = computed(() => ({
  osoby: osoby.value.length,
  firmy: firmy.value.length,
  uzytkownicy: uzytkownicy.value.length,
  historia: historiaKontaktu.value.length,
}))

const formatDate = (value: string | null) => {
  if (!value) {
    return '—'
  }
  return new Date(value).toLocaleString('pl-PL')
}

function pushLog(level: ConsoleLevel, action: string, message: string, meta?: Record<string, unknown>) {
  const entry: ConsoleEntry = {
    id: Date.now() + Math.floor(Math.random() * 10_000),
    at: new Date().toISOString(),
    level,
    action,
    message,
    meta,
  }

  consoleEntries.value = [entry, ...consoleEntries.value].slice(0, 200)
}

function clearLogs() {
  consoleEntries.value = []
}

function toConsoleMessage(error: unknown) {
  if (error instanceof CrmApiError) {
    return {
      message: `${error.operation}: ${error.message}`,
      meta: {
        operation: error.operation,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      meta: {
        name: error.name,
        stack: error.stack,
      },
    }
  }

  return {
    message: String(error),
    meta: undefined,
  }
}

const toDateTimeInput = (value: string | null) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

const toIsoOrNull = (value: string) => (value ? new Date(value).toISOString() : null)

const asNumberOrNull = (value: string) => {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const asStringOrNull = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function resetFirmaForm() {
  firmaForm.value = {
    id: null,
    nazwa: '',
    nip: '',
    branza: '',
    adres_miasto: '',
    przypisany_uzytkownik_id: '',
  }
}

function resetOsobaForm() {
  osobaForm.value = {
    id: null,
    imie: '',
    nazwisko: '',
    telefon: '',
    email: '',
    notatki: '',
    firma_id: '',
    status_id: '',
    zrodlo_id: '',
    przypisany_uzytkownik_id: '',
    nastepny_kontakt: '',
  }
}

function resetHistoriaForm() {
  historiaForm.value = {
    id: null,
    osoba_id: '',
    typ_kontaktu: 'telefon',
    opis: '',
    data_kontaktu: toDateTimeInput(new Date().toISOString()),
    nastepny_kontakt: '',
  }
}

function resetStatusForm() {
  statusForm.value = {
    id: null,
    nazwa: '',
    kolejnosc: '1',
    zamkniety: false,
  }
}

function resetZrodloForm() {
  zrodloForm.value = {
    id: null,
    nazwa: '',
  }
}

async function loadData() {
  pushLog('info', 'loadData', 'Pobieranie danych CRM...')

  const [osobyData, firmyData, uzytkownicyData, historiaData, statusyData, zrodlaData] = await Promise.all([
    fetchOsoby(),
    fetchFirmy(),
    fetchUzytkownicy(),
    fetchHistoriaKontaktu(),
    fetchStatusyLeadow(),
    fetchZrodlaLeadow(),
  ])

  osoby.value = osobyData
  firmy.value = firmyData
  uzytkownicy.value = uzytkownicyData
  historiaKontaktu.value = historiaData
  statusyLeadow.value = statusyData
  zrodlaLeadow.value = zrodlaData

  pushLog('info', 'loadData', 'Dane CRM załadowane.', {
    osoby: osobyData.length,
    firmy: firmyData.length,
    historia: historiaData.length,
    statusy: statusyData.length,
    zrodla: zrodlaData.length,
  })
}

function startEditFirme(firma: Firma) {
  firmaForm.value = {
    id: firma.id,
    nazwa: firma.nazwa,
    nip: firma.nip ?? '',
    branza: firma.branza ?? '',
    adres_miasto: firma.adres_miasto ?? '',
    przypisany_uzytkownik_id: firma.przypisany_uzytkownik_id ?? '',
  }
}

function startEditOsobe(osoba: Osoba) {
  osobaForm.value = {
    id: osoba.id,
    imie: osoba.imie,
    nazwisko: osoba.nazwisko,
    telefon: osoba.telefon ?? '',
    email: osoba.email ?? '',
    notatki: osoba.notatki ?? '',
    firma_id: osoba.firma_id?.toString() ?? '',
    status_id: osoba.status_id?.toString() ?? '',
    zrodlo_id: osoba.zrodlo_id?.toString() ?? '',
    przypisany_uzytkownik_id: osoba.przypisany_uzytkownik_id ?? '',
    nastepny_kontakt: toDateTimeInput(osoba.nastepny_kontakt),
  }
}

function startEditHistorie(wpis: HistoriaKontaktu) {
  historiaForm.value = {
    id: wpis.id,
    osoba_id: wpis.osoba_id.toString(),
    typ_kontaktu: wpis.typ_kontaktu,
    opis: wpis.opis,
    data_kontaktu: toDateTimeInput(wpis.data_kontaktu),
    nastepny_kontakt: toDateTimeInput(wpis.nastepny_kontakt),
  }
}

function startEditStatus(statusLeada: StatusLeada) {
  statusForm.value = {
    id: statusLeada.id,
    nazwa: statusLeada.nazwa,
    kolejnosc: statusLeada.kolejnosc.toString(),
    zamkniety: statusLeada.zamkniety,
  }
}

function startEditZrodlo(zrodlo: SlownikPozycja) {
  zrodloForm.value = {
    id: zrodlo.id,
    nazwa: zrodlo.nazwa,
  }
}

async function runAction(actionName: string, action: () => Promise<void>, successMessage: string) {
  try {
    pushLog('info', actionName, 'Start operacji')
    actionInProgress.value = true
    await action()
    await loadData()
    status.value = successMessage
    pushLog('info', actionName, successMessage)
  } catch (error) {
    const { message, meta } = toConsoleMessage(error)
    status.value = `Błąd operacji: ${message}`
    pushLog('error', actionName, message, meta)
  } finally {
    actionInProgress.value = false
  }
}

async function submitFirme() {
  const payload = {
    nazwa: firmaForm.value.nazwa.trim(),
    nip: asStringOrNull(firmaForm.value.nip),
    branza: asStringOrNull(firmaForm.value.branza),
    adres_miasto: asStringOrNull(firmaForm.value.adres_miasto),
    przypisany_uzytkownik_id: firmaForm.value.przypisany_uzytkownik_id || null,
  }

  if (!payload.nazwa) {
    status.value = 'Nazwa firmy jest wymagana.'
    return
  }

  await runAction('submitFirme', async () => {
    if (firmaForm.value.id) {
      await updateFirme(firmaForm.value.id, payload)
    } else {
      await createFirme(payload)
    }
    resetFirmaForm()
  }, 'Firma zapisana.')
}

async function removeFirme(id: number) {
  if (!window.confirm('Usunąć firmę?')) {
    return
  }

  await runAction('removeFirme', async () => {
    await deleteFirme(id)
    if (firmaForm.value.id === id) {
      resetFirmaForm()
    }
  }, 'Firma usunięta.')
}

async function submitOsobe() {
  const basePayload = {
    imie: osobaForm.value.imie.trim(),
    nazwisko: osobaForm.value.nazwisko.trim(),
    telefon: asStringOrNull(osobaForm.value.telefon),
    email: asStringOrNull(osobaForm.value.email),
    notatki: asStringOrNull(osobaForm.value.notatki),
    firma_id: asNumberOrNull(osobaForm.value.firma_id),
    status_id: asNumberOrNull(osobaForm.value.status_id),
    zrodlo_id: asNumberOrNull(osobaForm.value.zrodlo_id),
    przypisany_uzytkownik_id: osobaForm.value.przypisany_uzytkownik_id || null,
    nastepny_kontakt: toIsoOrNull(osobaForm.value.nastepny_kontakt),
  }

  if (!basePayload.imie || !basePayload.nazwisko) {
    status.value = 'Imię i nazwisko osoby są wymagane.'
    return
  }

  await runAction('submitOsobe', async () => {
    if (osobaForm.value.id) {
      await updateOsobe(osobaForm.value.id, basePayload)
    } else {
      try {
        await createOsobe({
          ...basePayload,
          utworzyl_uzytkownik_id: configuredUserId,
        })
      } catch (error) {
        if (error instanceof CrmApiError && error.message.includes('row-level security policy')) {
          pushLog('error', 'submitOsobe', 'Retry createOsobe bez utworzyl_uzytkownik_id po błędzie RLS', {
            firstError: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          })
          await createOsobe(basePayload)
        } else {
          throw error
        }
      }
    }
    resetOsobaForm()
  }, 'Osoba zapisana.')
}

async function removeOsobe(id: number) {
  if (!window.confirm('Usunąć osobę?')) {
    return
  }

  await runAction('removeOsobe', async () => {
    await deleteOsobe(id)
    if (osobaForm.value.id === id) {
      resetOsobaForm()
    }
  }, 'Osoba usunięta.')
}

async function submitHistorie() {
  const osobaId = asNumberOrNull(historiaForm.value.osoba_id)
  const dataKontaktu = toIsoOrNull(historiaForm.value.data_kontaktu)
  const opis = historiaForm.value.opis.trim()

  if (!osobaId || !opis || !dataKontaktu) {
    status.value = 'Historia kontaktu wymaga: osoba, data i opis.'
    return
  }

  const payload = {
    osoba_id: osobaId,
    uzytkownik_id: configuredUserId,
    typ_kontaktu: historiaForm.value.typ_kontaktu,
    opis,
    data_kontaktu: dataKontaktu,
    nastepny_kontakt: toIsoOrNull(historiaForm.value.nastepny_kontakt),
  }

  await runAction('submitHistorie', async () => {
    if (historiaForm.value.id) {
      await updateWpisHistorii(historiaForm.value.id, payload)
    } else {
      await createWpisHistorii(payload)
    }
    resetHistoriaForm()
  }, 'Wpis historii zapisany.')
}

async function removeHistorie(id: number) {
  if (!window.confirm('Usunąć wpis historii kontaktu?')) {
    return
  }

  await runAction('removeHistorie', async () => {
    await deleteWpisHistorii(id)
    if (historiaForm.value.id === id) {
      resetHistoriaForm()
    }
  }, 'Wpis historii usunięty.')
}

async function submitStatus() {
  const payload = {
    nazwa: statusForm.value.nazwa.trim(),
    kolejnosc: Number(statusForm.value.kolejnosc),
    zamkniety: statusForm.value.zamkniety,
  }

  if (!payload.nazwa || !Number.isFinite(payload.kolejnosc)) {
    status.value = 'Status wymaga nazwy i poprawnej kolejności.'
    return
  }

  await runAction('submitStatus', async () => {
    if (statusForm.value.id) {
      await updateStatusLeada(statusForm.value.id, payload)
    } else {
      await createStatusLeada(payload)
    }
    resetStatusForm()
  }, 'Status leada zapisany.')
}

async function removeStatus(id: number) {
  if (!window.confirm('Usunąć status leada?')) {
    return
  }

  await runAction('removeStatus', async () => {
    await deleteStatusLeada(id)
    if (statusForm.value.id === id) {
      resetStatusForm()
    }
  }, 'Status leada usunięty.')
}

async function submitZrodlo() {
  const payload = {
    nazwa: zrodloForm.value.nazwa.trim(),
  }

  if (!payload.nazwa) {
    status.value = 'Źródło leada wymaga nazwy.'
    return
  }

  await runAction('submitZrodlo', async () => {
    if (zrodloForm.value.id) {
      await updateZrodloLeada(zrodloForm.value.id, payload)
    } else {
      await createZrodloLeada(payload)
    }
    resetZrodloForm()
  }, 'Źródło leada zapisane.')
}

async function removeZrodlo(id: number) {
  if (!window.confirm('Usunąć źródło leada?')) {
    return
  }

  await runAction('removeZrodlo', async () => {
    await deleteZrodloLeada(id)
    if (zrodloForm.value.id === id) {
      resetZrodloForm()
    }
  }, 'Źródło leada usunięte.')
}

onMounted(async () => {
  resetHistoriaForm()

  if (supabaseConfigError) {
    status.value = `Błąd konfiguracji: ${supabaseConfigError}`
    loading.value = false
    return
  }

  try {
    pushLog('info', 'configuredUserId', 'Używam UUID użytkownika z .env.local', {
      userId: configuredUserId,
      source: 'VITE_SUPABASE_USER_ID',
    })

    status.value = 'Pobieranie danych CRM...'
    await loadData()
    status.value = 'Dane CRM załadowane poprawnie.'
  } catch (error) {
    const { message, meta } = toConsoleMessage(error)
    status.value = `Błąd pobierania danych: ${message}`
    pushLog('error', 'onMounted', message, meta)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="app">
    <header class="header">
      <h1>Fuzja CRM</h1>
      <p>{{ status }}</p>
      <div class="view-switch">
        <button :class="{ secondary: activeView !== 'crm' }" @click="activeView = 'crm'">Widok CRM</button>
        <button :class="{ secondary: activeView !== 'console' }" @click="activeView = 'console'">Konsola</button>
      </div>
    </header>

    <template v-if="activeView === 'crm'">
    <section class="cards">
      <article class="card"><h2>Osoby</h2><p>{{ podsumowanie.osoby }}</p></article>
      <article class="card"><h2>Firmy</h2><p>{{ podsumowanie.firmy }}</p></article>
      <article class="card"><h2>Użytkownicy</h2><p>{{ podsumowanie.uzytkownicy }}</p></article>
      <article class="card"><h2>Kontakty</h2><p>{{ podsumowanie.historia }}</p></article>
    </section>

    <section class="grid">
      <article class="panel">
        <h3>Leady / kontakty (osoby)</h3>
        <form class="object-form" @submit.prevent="submitOsobe">
          <input v-model="osobaForm.imie" type="text" placeholder="Imię" required />
          <input v-model="osobaForm.nazwisko" type="text" placeholder="Nazwisko" required />
          <input v-model="osobaForm.telefon" type="text" placeholder="Telefon" />
          <input v-model="osobaForm.email" type="email" placeholder="Email" />
          <select v-model="osobaForm.firma_id">
            <option value="">Firma (opcjonalnie)</option>
            <option v-for="firma in firmy" :key="firma.id" :value="String(firma.id)">{{ firma.nazwa }}</option>
          </select>
          <select v-model="osobaForm.status_id">
            <option value="">Status (opcjonalnie)</option>
            <option v-for="statusLeada in statusyLeadow" :key="statusLeada.id" :value="String(statusLeada.id)">
              {{ statusLeada.nazwa }}
            </option>
          </select>
          <select v-model="osobaForm.zrodlo_id">
            <option value="">Źródło (opcjonalnie)</option>
            <option v-for="zrodlo in zrodlaLeadow" :key="zrodlo.id" :value="String(zrodlo.id)">{{ zrodlo.nazwa }}</option>
          </select>
          <select v-model="osobaForm.przypisany_uzytkownik_id">
            <option value="">Przypisany użytkownik</option>
            <option v-for="uzytkownik in uzytkownicy" :key="uzytkownik.id" :value="uzytkownik.id">
              {{ uzytkownik.imie }} {{ uzytkownik.nazwisko }}
            </option>
          </select>
          <input v-model="osobaForm.nastepny_kontakt" type="datetime-local" />
          <textarea v-model="osobaForm.notatki" rows="2" placeholder="Notatki"></textarea>
          <div class="form-actions">
            <button type="submit" :disabled="actionInProgress">
              {{ osobaForm.id ? 'Zapisz zmiany osoby' : 'Dodaj osobę' }}
            </button>
            <button v-if="osobaForm.id" type="button" class="secondary" @click="resetOsobaForm">Anuluj edycję</button>
          </div>
        </form>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Imię i nazwisko</th>
                <th>Firma</th>
                <th>Status</th>
                <th>Źródło</th>
                <th>Przypisany</th>
                <th>Następny kontakt</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="osoba in osoby" :key="osoba.id">
                <td>{{ osoba.imie }} {{ osoba.nazwisko }}</td>
                <td>{{ osoba.firma?.nazwa ?? '—' }}</td>
                <td>{{ osoba.status?.nazwa ?? '—' }}</td>
                <td>{{ osoba.zrodlo?.nazwa ?? '—' }}</td>
                <td>{{ osoba.przypisany ? `${osoba.przypisany.imie} ${osoba.przypisany.nazwisko}` : '—' }}</td>
                <td>{{ formatDate(osoba.nastepny_kontakt) }}</td>
                <td>
                  <button class="inline" @click="startEditOsobe(osoba)">Edytuj</button>
                  <button class="inline danger" @click="removeOsobe(osoba.id)">Usuń</button>
                </td>
              </tr>
              <tr v-if="!loading && osoby.length === 0">
                <td colspan="7">Brak danych</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <h3>Firmy</h3>
        <form class="object-form" @submit.prevent="submitFirme">
          <input v-model="firmaForm.nazwa" type="text" placeholder="Nazwa" required />
          <input v-model="firmaForm.nip" type="text" placeholder="NIP" />
          <input v-model="firmaForm.branza" type="text" placeholder="Branża" />
          <input v-model="firmaForm.adres_miasto" type="text" placeholder="Miasto" />
          <select v-model="firmaForm.przypisany_uzytkownik_id">
            <option value="">Opiekun</option>
            <option v-for="uzytkownik in uzytkownicy" :key="uzytkownik.id" :value="uzytkownik.id">
              {{ uzytkownik.imie }} {{ uzytkownik.nazwisko }}
            </option>
          </select>
          <div class="form-actions">
            <button type="submit" :disabled="actionInProgress">
              {{ firmaForm.id ? 'Zapisz zmiany firmy' : 'Dodaj firmę' }}
            </button>
            <button v-if="firmaForm.id" type="button" class="secondary" @click="resetFirmaForm">Anuluj edycję</button>
          </div>
        </form>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>NIP</th>
                <th>Branża</th>
                <th>Miasto</th>
                <th>Opiekun</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="firma in firmy" :key="firma.id">
                <td>{{ firma.nazwa }}</td>
                <td>{{ firma.nip ?? '—' }}</td>
                <td>{{ firma.branza ?? '—' }}</td>
                <td>{{ firma.adres_miasto ?? '—' }}</td>
                <td>{{ firma.opiekun ? `${firma.opiekun.imie} ${firma.opiekun.nazwisko}` : '—' }}</td>
                <td>
                  <button class="inline" @click="startEditFirme(firma)">Edytuj</button>
                  <button class="inline danger" @click="removeFirme(firma.id)">Usuń</button>
                </td>
              </tr>
              <tr v-if="!loading && firmy.length === 0">
                <td colspan="6">Brak danych</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <h3>Historia kontaktu</h3>
        <form class="object-form" @submit.prevent="submitHistorie">
          <select v-model="historiaForm.osoba_id" required>
            <option value="">Osoba</option>
            <option v-for="osoba in osoby" :key="osoba.id" :value="String(osoba.id)">
              {{ osoba.imie }} {{ osoba.nazwisko }}
            </option>
          </select>
          <select v-model="historiaForm.typ_kontaktu" required>
            <option value="telefon">telefon</option>
            <option value="email">email</option>
            <option value="spotkanie">spotkanie</option>
            <option value="inne">inne</option>
          </select>
          <input v-model="historiaForm.data_kontaktu" type="datetime-local" required />
          <input v-model="historiaForm.nastepny_kontakt" type="datetime-local" />
          <textarea v-model="historiaForm.opis" rows="2" placeholder="Opis" required></textarea>
          <div class="form-actions">
            <button type="submit" :disabled="actionInProgress">
              {{ historiaForm.id ? 'Zapisz zmiany wpisu' : 'Dodaj wpis historii' }}
            </button>
            <button v-if="historiaForm.id" type="button" class="secondary" @click="resetHistoriaForm">Anuluj edycję</button>
          </div>
        </form>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Osoba</th>
                <th>Typ</th>
                <th>Użytkownik</th>
                <th>Opis</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="wpis in historiaKontaktu" :key="wpis.id">
                <td>{{ formatDate(wpis.data_kontaktu) }}</td>
                <td>{{ wpis.osoba ? `${wpis.osoba.imie} ${wpis.osoba.nazwisko}` : '—' }}</td>
                <td>{{ wpis.typ_kontaktu }}</td>
                <td>{{ wpis.uzytkownik ? `${wpis.uzytkownik.imie} ${wpis.uzytkownik.nazwisko}` : '—' }}</td>
                <td>{{ wpis.opis }}</td>
                <td>
                  <button class="inline" @click="startEditHistorie(wpis)">Edytuj</button>
                  <button class="inline danger" @click="removeHistorie(wpis.id)">Usuń</button>
                </td>
              </tr>
              <tr v-if="!loading && historiaKontaktu.length === 0">
                <td colspan="6">Brak danych</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <h3>Słowniki</h3>
        <div class="dictionary-grid">
          <div>
            <h4>Statusy leadów</h4>
            <form class="object-form" @submit.prevent="submitStatus">
              <input v-model="statusForm.nazwa" type="text" placeholder="Nazwa statusu" required />
              <input v-model="statusForm.kolejnosc" type="number" min="1" placeholder="Kolejność" required />
              <label class="checkbox-label">
                <input v-model="statusForm.zamkniety" type="checkbox" /> Zamknięty
              </label>
              <div class="form-actions">
                <button type="submit" :disabled="actionInProgress">
                  {{ statusForm.id ? 'Zapisz status' : 'Dodaj status' }}
                </button>
                <button v-if="statusForm.id" type="button" class="secondary" @click="resetStatusForm">Anuluj</button>
              </div>
            </form>
            <ul>
              <li v-for="statusLeada in statusyLeadow" :key="statusLeada.id">
                {{ statusLeada.kolejnosc }}. {{ statusLeada.nazwa }} <span v-if="statusLeada.zamkniety">(zamknięty)</span>
                <button class="inline" @click="startEditStatus(statusLeada)">Edytuj</button>
                <button class="inline danger" @click="removeStatus(statusLeada.id)">Usuń</button>
              </li>
            </ul>
          </div>
          <div>
            <h4>Źródła leadów</h4>
            <form class="object-form" @submit.prevent="submitZrodlo">
              <input v-model="zrodloForm.nazwa" type="text" placeholder="Nazwa źródła" required />
              <div class="form-actions">
                <button type="submit" :disabled="actionInProgress">
                  {{ zrodloForm.id ? 'Zapisz źródło' : 'Dodaj źródło' }}
                </button>
                <button v-if="zrodloForm.id" type="button" class="secondary" @click="resetZrodloForm">Anuluj</button>
              </div>
            </form>
            <ul>
              <li v-for="zrodlo in zrodlaLeadow" :key="zrodlo.id">
                {{ zrodlo.nazwa }}
                <button class="inline" @click="startEditZrodlo(zrodlo)">Edytuj</button>
                <button class="inline danger" @click="removeZrodlo(zrodlo.id)">Usuń</button>
              </li>
            </ul>
          </div>
        </div>
      </article>
    </section>
    </template>

    <section v-else class="grid">
      <article class="panel">
        <h3>Konsola operacji</h3>
        <p>UUID z env: {{ configuredUserId }}</p>
        <div class="form-actions">
          <button @click="clearLogs">Wyczyść logi</button>
        </div>
        <div class="console-list">
          <article v-for="entry in consoleEntries" :key="entry.id" class="console-entry" :class="entry.level">
            <div class="console-top">
              <strong>{{ entry.level.toUpperCase() }}</strong>
              <span>{{ formatDate(entry.at) }}</span>
              <span>{{ entry.action }}</span>
            </div>
            <p>{{ entry.message }}</p>
            <pre v-if="entry.meta">{{ JSON.stringify(entry.meta, null, 2) }}</pre>
          </article>
          <p v-if="consoleEntries.length === 0">Brak logów.</p>
        </div>
      </article>
    </section>
  </main>
</template>
