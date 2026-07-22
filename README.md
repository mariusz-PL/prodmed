# ProdMed — medytacja produktywna w spacerze

Artefakt Laboratorium [postcognitive.pl](https://postcognitive.pl). Aplikacja, która **milczy**: prowadzi protokół medytacji produktywnej (wolne, świadome chodzenie + jedno dobrze zdefiniowane pytanie) i niczego nigdzie nie wysyła.

Rama metodyczna: productive meditation (Cal Newport, *Deep Work*) + medytacja analityczna (tyb. *dpyad sgom*) + medytacja chodzona (kinhin/caṅkama). Trzy tryby: **Problem** (decyzje/biznes), **Wgląd** (kontemplacja idei), **Reset** (czysta kotwica). Wbudowany kurs 6 lekcji.

## Zasady

- **Local-first**: brak backendu, kont, analityki i zewnętrznych requestów. Dane w IndexedDB/localStorage; eksport Markdown (Obsidian) + JSON.
- **Appka milczy w trakcie spaceru** — struktura faz (kotwica → praca ⇄ spoczynek → domknięcie), dzwonki Web Audio, notatki głosowe lokalnie (MediaRecorder).
- **PWA offline** po pierwszej wizycie; ekran sesji z wake lock, przyciemnieniem i blokadą dotyku.

## Dev

```bash
npm ci
npm run dev        # dev server
npm test           # vitest — silnik sesji (czysty FSM)
npm run build      # tsc --noEmit + vite build → dist/
```

Zero zależności runtime; TypeScript strict; silnik sesji testowany (efekty jako dane, czas wstrzykiwany).

## Deploy

Docker: build node → statyczny nginx (SPA fallback, CSP `default-src 'self'`). W Coolify: **Exposes = 80**. Spec projektu: `docs/superpowers/specs/2026-07-22-prodmed-design.md`.

## Licencje

- Kod: MIT (patrz `LICENSE`).
- Fonty: Lora i Inter — SIL Open Font License 1.1 (self-hosted, `public/fonts/`).
- Treści lekcji i metody: © postcognitive.pl.
