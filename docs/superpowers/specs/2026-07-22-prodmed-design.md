# ProdMed — spec (2026-07-22)

## Czym jest

Aplikacja-artefakt „Laboratorium" postcognitive.pl (`prodmed.postcognitive.pl`, do wpięcia DNS tymczasowo na sslip.io). Wspiera **medytację produktywną w spacerze**: wolne, świadome chodzenie + praca nad jednym problemem/ideą. Cel (za Mariuszem): wspomagać relaksację, medytację, wgląd, rozwój siebie i biznesu.

Rama metodyczna (sesja 2026-07-22): productive meditation (Newport, *Deep Work*) + medytacja analityczna (dpyad sgom, cykl analiza→spoczynek) + medytacja chodzona (kinhin — kotwica w ciele). Kurs L1–L6 wbudowany.

## Zasady projektowe (niepodważalne)

1. **Appka MILCZY w trakcie spaceru** — guardrail, nie kompan. Zero czatu, zero AI w sesji. „Siłownia, nie proteza".
2. **Myśli nie opuszczają urządzenia** — local-first: brak backendu, kont, analityki, speech-to-text w chmurze. Po załadowaniu zero requestów sieciowych. RODO trywialne (hosting statyczny), zgodne ze statusem osoby prywatnej niekomercyjnie.
3. **Ekran czynny podczas sesji** (baseline iOS Safari; wake lock gdzie dostępny). Nie projektujemy pracy przy zablokowanym ekranie w MVP.
4. **Portable** — eksport Markdown (Obsidian-ready) + JSON, import JSON. Zero lock-inu.

## Tryby (3 tradycje → 3 tryby)

- **Problem** (rozwój biznesu/decyzje): pełny protokół — załadunek pytania, kotwica, praca z dzwonkami, wgląd→spoczynek, konsolidacja jednym zdaniem. Bank problemów z przenoszonym stanem między spacerami.
- **Wgląd** (rozwój siebie/kontemplacja idei): ten sam silnik, obiekt = idea/pytanie osobiste, miękkie prompty.
- **Reset** (relaksacja/medytacja): czysta kotwica — tylko dzwonki i zakończenie, bez problemu.

## Fazy sesji (silnik FSM; domyślne konfigurowalne)

anchor (4 min) → work (dzwonek co 5 min; licznik dzwonka pauzuje w rest) ⇄ rest (75 s po każdym wglądzie, wymuszony) → consolidate (ręcznie „Kończę" lub automatycznie: ostatnie 3 min planu, gdy plan > 0) → done.

Wgląd w work: hold-to-record notatka głosowa (MediaRecorder, max 60 s, blob lokalnie) lub tap-znacznik czasowy. Konsolidacja: odsłuch wglądów + **jedno zdanie wyniku** (puste = jawnie „dryf" — uczciwa metryka) + pytanie następnego kroku (zasila kolejny załadunek).

## Architektura

- **Vite + TypeScript strict, ZERO runtime deps** (supply-chain, portability). Vitest na silnik. Hash-router, render funkcyjny na DOM.
- **Silnik czysty**: `init/tick(dt)/captureInsight/beginConsolidate/finish` → `{state, effects[]}`; efekty jako dane (`bell`, `phaseChange`, `vibrate`); czas wstrzykiwany (testowalność, brak Date.now w silniku).
- **Storage**: IndexedDB `prodmed` (stores: problems, sessions, audio-bloby); localStorage (settings, postęp lekcji). `navigator.storage.persist()` + hint instalacji A2HS (iOS eviction po ~7 dniach!).
- **PWA**: manifest + ręczny service worker (cache-first, precache shell; offline po 1. wizycie — spacery bywają poza zasięgiem).
- **Audio**: dzwonek syntetyzowany Web Audio (2 sinusoidy + decay, bez assetów); wibracja Android jako dublet.
- **Ekran sesji**: wake lock + auto-przyciemnienie (OLED czerń) + touch-lock (odblokowanie hold ~1,2 s) przeciw kieszeni.
- **Brand**: rodzina postcognitive — navy `#0b0e1d`, złoto `#d4a878`, rdzeń `#f0d6ad`, cream `#e7dfcf`; Lora (nagłówki) + Inter (UI), self-host OFL. Dark-only.
- **i18n**: PL (domyślny) + EN, słownik centralny.
- **Strona `#/metoda`**: statyczny, cytowalne (GEO) omówienie metody + skrót L1–L6 + źródła.

## Ekrany

Home (wybór trybu, bieżąca lekcja, ostatnie sesje) · Załadunek (problem/idea + pytanie nast. kroku + zmienne + test mikrofonu) · Sesja (faza, zegar dyskretny, wgląd, dim/touch-lock) · Konsolidacja · Problemy (wątki + historia) · Lekcje (L1–L6) · Metoda · Ustawienia (czasy, dzwonki, język, eksport/import/usuń dane, prywatność).

## Deploy

Dockerfile: build node:22-alpine → nginx:alpine (SPA fallback, CSP `default-src 'self'`, cache immutable dla assetów, no-cache index+sw). **Coolify: Exposes=80** (gotcha 502). GitHub public `mariusz-PL/prodmed` → Coolify app (API przez SSH VPS), domena tymczasowa sslip.io, docelowo `prodmed.postcognitive.pl` (rekord A — krok Mariusza w hPanel; subdomena auto-objęta GSC property).

## Weryfikacja

vitest (przejścia faz, dzwonki+pauza w rest, wgląd→rest, auto-konsolidacja, dryf, tryb otwarty), `tsc --noEmit`, build, screenshot mobile (system Chrome headless), curl na prod (200, brak zewnętrznych originów w dist).

## Poza MVP (świadomie)

Tryb słuchawkowy locked-screen (silent-audio keepalive + MediaSession), transkrypcja on-device, 7 języków, esej-towarzysz + link z Laboratorium książki (wymaga akceptacji Mariusza), OG image, analityka opt-in.
