# fuzja-crm

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## Supabase - inicjalizacja CRM

1. Otwórz SQL Editor w Supabase.
2. Wklej i uruchom skrypt z pliku `supabase/init_crm.sql`.
3. Upewnij się, że `.env.local` zawiera poprawne wartości:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
4. Uruchom aplikację: `npm run dev`.

## RLS i tryb bez logowania (dev)

Jeśli widzisz błąd typu `new row violates row-level security policy`, to znaczy, że działasz jako rola `anon`, a polityki masz tylko dla `authenticated`.

W SQL Editor uruchom:

- `supabase/rls_dev_anon_patch.sql`

To odblokuje CRUD dla roli `anon` w środowisku developerskim.

## Debugowanie CRUD

W aplikacji jest dedykowany widok `Konsola`, który pokazuje:

- start/sukces operacji CRUD,
- dokładne błędy API (`operation`, `code`, `details`, `hint`),
- aktualny UUID użytkownika pobrany z `VITE_SUPABASE_USER_ID`.

## UUID użytkownika z ENV

Aplikacja używa stałego UUID użytkownika z `VITE_SUPABASE_USER_ID` (nie z sesji Supabase).

- tworzenie osoby ustawia `utworzyl_uzytkownik_id` z ENV,
- tworzenie/edycja historii kontaktu ustawia `uzytkownik_id` z ENV.
