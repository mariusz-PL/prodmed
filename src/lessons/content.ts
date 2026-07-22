import type { Lang } from "../i18n";

export interface Lesson {
  title: string;
  lead: string;
  body: string[];
}

export const LESSONS: Record<Lang, Lesson[]> = {
  pl: [
    {
      title: "Kotwica",
      lead: "Pierwsze minuty każdego spaceru: sama uwaga w ciele.",
      body: [
        "Zanim zaczniesz myśleć, ustabilizuj uwagę. Pierwsze kilka minut idź wolno i nie rób nic więcej: czuj stopy dotykające ziemi, zauważ oddech. Żadnego problemu, żadnego planu.",
        "Dlaczego: analiza bez stabilnej uwagi degeneruje w dryf. To odpowiednik strojenia instrumentu przed graniem — w tradycjach medytacyjnych nazywa się to śamathą, stabilizacją przed wglądem. Kotwica zostaje z tobą na cały spacer jako miejsce powrotu: gdy umysł się rozsypie, wracasz na chwilę do kroku i oddechu.",
        "W aplikacji: faza „kotwica” zaczyna każdą sesję. Ekran nic od ciebie nie chce. Dzwonek oznajmi przejście do pracy.",
      ],
    },
    {
      title: "Załadunek",
      lead: "Jedno pytanie zapisane przed wyjściem — nie temat, pytanie.",
      body: [
        "„Pomyślę o strategii” to temat, nie problem. Bez pytania zdefiniowanego przed wyjściem spacer zjada dryf. Przed drzwiami zapisz jedno pytanie: „Jak zrobić X przy ograniczeniu Y?”.",
        "Po kotwicy przejrzyj w myślach zmienne: co wiesz, co ogranicza, czego nie wiesz. Potem sformułuj pytanie następnego kroku — najmniejsze pytanie, którego rozstrzygnięcie posuwa całość. Trzymaj się go.",
        "Uwaga na pamięć roboczą: bez kartki utrzymasz trzy–cztery zmienne. Ta metoda służy decyzjom, strukturze i nazywaniu sedna — nie arytmetyce i nie przeszukiwaniu danych.",
        "W aplikacji: załadunek wypełniasz przed startem; wynik poprzedniego spaceru czeka w wątku jako punkt wejścia.",
      ],
    },
    {
      title: "Dryf i pętla",
      lead: "Dwa sposoby, na jakie umysł schodzi z toru — i co z nimi robić.",
      body: [
        "Dryf: myśli uciekają do niezwiązanych spraw. Zauważ bez pretensji i wróć do pytania. Dokładnie ten ruch — zauważyć, wrócić — jest treningiem; to tu rośnie mięsień uwagi.",
        "Pętla: podstępniejsza. Umysł odtwarza w kółko to, co już wiesz o problemie, i symuluje pracę. Przyłap się, nazwij w duchu „pętla” i przejdź siłą do pytania następnego kroku.",
        "Trzeci przeciwnik: ruminacja. Metoda działa na problemy o strukturze; na tematach emocjonalnych przechodzi w przeżuwanie. Gdy wchodzi ładunek emocjonalny, zrzuć wszystko i wróć do czystej kotwicy — krok, oddech.",
        "W aplikacji: dyskretny dzwonek co kilka minut to punkt kontrolny — jedno pytanie do siebie: „jestem przy pytaniu, w pętli czy w dryfie?”.",
      ],
    },
    {
      title: "Analiza i spoczynek",
      lead: "Po każdym wglądzie — przestań analizować. To nie przerwa, to część metody.",
      body: [
        "Gdy pojawi się wgląd albo jasna konkluzja, nie ciągnij dalej. Zapisz znacznik lub nagraj zdanie i pozwól wnioskowi osiąść: minutę idź z samym chodzeniem.",
        "Dlaczego: spoczynek konsoliduje. Tradycja tybetańska naprzemienność analizy i spoczynku uważa za rdzeń medytacji analitycznej — a współczesna psychologia dodaje, że „aha” częściej przychodzi w przerwie niż w naporze. Docisk bywa najdroższą formą lenistwa.",
        "W aplikacji: każdy zapisany wgląd automatycznie otwiera krótki spoczynek. Ekran przygasa; dzwonek wraca, gdy czas znowu pracować.",
      ],
    },
    {
      title: "Domknięcie",
      lead: "Jedno zdanie wyniku — albo uczciwy dryf.",
      body: [
        "Ostatnie minuty spaceru należą do domknięcia: powiedz sobie wynik jednym zdaniem. „Dziś ustalone: …; następne pytanie brzmi: …”. Zapisz je od razu — niezapisany zysk wyparowuje w godzinę.",
        "Zdanie-wynik jest też testem. Nie umiesz go sformułować? To był dryf — zaznacz to szczerze. Dryf zapisany to informacja o doborze problemu i formie dnia; dryf ukryty to skasowany spacer.",
        "W aplikacji: sesja kończy się polem na jedno zdanie i pytaniem na następny spacer. Wątek niesie stan dalej — kolejny załadunek zaczyna się tam, gdzie dziś skończysz.",
      ],
    },
    {
      title: "Dobór problemów",
      lead: "Co brać na spacer, a czego nie — i jak podnosić ciężar.",
      body: [
        "Na spacer nadają się: decyzje z wymiennikami, architektura rzeczy, struktura tekstu, nazwanie sedna, „czego NIE robić”. Nie nadają się: liczby, szczegóły wymagające danych, sprawy świeżo bolesne.",
        "Trudność podnoś jak ciężar na siłowni: od pytań na dwadzieścia minut do problemów wielospacerowych, gdzie zdanie-wynik z poprzedniego spaceru jest załadunkiem następnego.",
        "Po kilku tygodniach przejrzyj wątki: które typy pytań chodzą dobrze, które kończą się dryfem. To twoja mapa — metoda kalibruje się do głowy, nie odwrotnie.",
        "I pamiętaj o trzecim trybie: czasem najlepsze, co można zrobić z problemem, to nie myśleć o nim wcale. Reset też jest pracą — inkubacja oddaje rozwiązania, których nie da się wymusić.",
      ],
    },
  ],
  en: [
    {
      title: "The anchor",
      lead: "The first minutes of every walk: attention in the body, nothing else.",
      body: [
        "Before you start thinking, stabilise attention. For the first few minutes walk slowly and do nothing more: feel your feet meeting the ground, notice the breath. No problem, no plan.",
        "Why: analysis without stable attention degenerates into drift. This is tuning the instrument before playing — meditation traditions call it śamatha, stabilisation before insight. The anchor stays with you for the whole walk as a place to return to: when the mind scatters, come back to step and breath for a moment.",
        "In the app: the “anchor” phase opens every session. The screen asks nothing of you. A bell announces the shift to work.",
      ],
    },
    {
      title: "Loading up",
      lead: "One question written down before you leave — a question, not a topic.",
      body: [
        "“I'll think about strategy” is a topic, not a problem. Without a question defined before you leave, drift eats the walk. At the door, write one question: “How to do X within constraint Y?”.",
        "After the anchor, review the variables in your head: what you know, what constrains, what you don't know. Then form the next-step question — the smallest question whose answer moves the whole. Hold on to it.",
        "Mind working memory: without paper you can hold three or four variables. This method serves decisions, structure and naming the crux — not arithmetic, not data-digging.",
        "In the app: you fill the load-up before starting; the last walk's result waits in the thread as your entry point.",
      ],
    },
    {
      title: "Drift and loop",
      lead: "The two ways the mind leaves the track — and what to do about each.",
      body: [
        "Drift: thoughts wander to unrelated things. Notice without blame and return to the question. That exact move — notice, return — is the training; this is where the attention muscle grows.",
        "Loop: sneakier. The mind replays what you already know and simulates work. Catch it, silently name it “loop”, and push through to the next-step question.",
        "The third opponent: rumination. The method works on problems with structure; on emotionally hot topics it turns into brooding. When the charge rises, drop everything and return to the pure anchor — step, breath.",
        "In the app: a discreet bell every few minutes is a checkpoint — one question to yourself: “am I with the question, in a loop, or drifting?”.",
      ],
    },
    {
      title: "Analysis and rest",
      lead: "After every insight — stop analysing. Not a break; part of the method.",
      body: [
        "When an insight or a clear conclusion arrives, don't push on. Save a marker or record a sentence, then let the conclusion settle: walk with nothing but the walking for a minute.",
        "Why: rest consolidates. The Tibetan tradition holds the alternation of analysis and rest to be the core of analytical meditation — and modern psychology adds that the “aha” tends to arrive in the pause, not in the push. Forcing is often the most expensive form of laziness.",
        "In the app: every saved insight automatically opens a short rest. The screen dims; a bell returns you when it's time to work again.",
      ],
    },
    {
      title: "Closing",
      lead: "One sentence of result — or an honest drift.",
      body: [
        "The last minutes of the walk belong to closing: state the result in one sentence. “Settled today: …; the next question is: …”. Save it immediately — an unsaved gain evaporates within the hour.",
        "The result sentence is also a test. Can't form it? That was drift — mark it honestly. A recorded drift is information about problem choice and the shape of your day; a hidden drift is a deleted walk.",
        "In the app: the session ends with a field for one sentence and a question for the next walk. The thread carries state forward — the next load-up starts where you finish today.",
      ],
    },
    {
      title: "Choosing problems",
      lead: "What to take on a walk, what to leave — and how to add weight.",
      body: [
        "Good on a walk: decisions with trade-offs, the architecture of things, the structure of a text, naming the crux, “what NOT to do”. Bad on a walk: numbers, data-hungry detail, freshly painful matters.",
        "Raise difficulty like weight at a gym: from twenty-minute questions to multi-walk problems, where the result sentence of one walk is the load-up of the next.",
        "After a few weeks review your threads: which kinds of questions walk well, which end in drift. That is your map — the method calibrates to your head, not the other way round.",
        "And remember the third mode: sometimes the best thing to do with a problem is not to think about it at all. Reset is work too — incubation returns answers that cannot be forced.",
      ],
    },
  ],
};

export interface MethodContent {
  title: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  sourcesHeading: string;
  sources: string[];
}

export const METHOD: Record<Lang, MethodContent> = {
  pl: {
    title: "Metoda",
    intro:
      "Medytacja produktywna to praktyka łącząca wolne, świadome chodzenie z myśleniem o jednym, dobrze zdefiniowanym problemie. Ciało jest zajęte, umysł ma jeden obiekt; uwagę trenuje się jak w medytacji — zauważając odejścia i wracając. Nazwę ukuł Cal Newport (Deep Work, 2016); składniki są znacznie starsze.",
    sections: [
      {
        heading: "Trzy tradycje, jeden protokół",
        paragraphs: [
          "Medytacja chodzona (kinhin w zen, caṅkama w therawadzie) wnosi kotwicę: uwaga w krokach i oddechu. Klasycznie myśli się tu puszcza — ProdMed używa jej jako stabilizatora przed pracą i jako spoczynku po wglądzie.",
          "Medytacja analityczna (tyb. dpyad sgom) wnosi rdzeń: ustrukturyzowane myślenie o jednym temacie jako praktykę — z kluczowym rytmem naprzemienności: analizuj, aż pojawi się jasność, potem spocznij na wniosku, potem wróć do analizy.",
          "Tradycja „solvitur ambulando” — od perypatetyków przez Rousseau („umiem rozmyślać tylko idąc”) i Nietzschego („wartość mają tylko myśli wychodzone”) po ścieżkę myślenia Darwina — wnosi samo chodzenie jako maszynę do myślenia. Badanie Oppezzo i Schwartza (Stanford, 2014) pokazało ok. 60% wzrost wyników myślenia dywergencyjnego podczas chodzenia.",
        ],
      },
      {
        heading: "Protokół w sześciu ruchach",
        paragraphs: [
          "1. Kotwica: kilka minut samego chodzenia. 2. Załadunek: jedno pytanie zdefiniowane przed wyjściem, przegląd zmiennych, pytanie następnego kroku. 3. Praca: trzymaj pytanie; dzwonek co kilka minut to punkt kontrolny na dryf i pętlę. 4. Wgląd → spoczynek: po każdej jasnej konkluzji minuta czystego chodzenia. 5. Domknięcie: wynik jednym zdaniem albo uczciwy dryf. 6. Wątek: zdanie-wynik staje się załadunkiem kolejnego spaceru.",
        ],
      },
      {
        heading: "Czym to nie jest",
        paragraphs: [
          "To nie jest mindfulness w sensie ścisłym: celem jest problem, nie obserwacja umysłu bez treści. To nie jest też narzędzie na tematy emocjonalnie gorące — tam struktura zamienia się w ruminację; wtedy właściwy jest tryb Reset: sam spacer, sam oddech.",
          "Aplikacja świadomie milczy: żadnego czatu, żadnych podpowiedzi w trakcie. Myślenie jest twoje; ProdMed tylko pilnuje ram — i niczego nigdzie nie wysyła.",
        ],
      },
    ],
    sourcesHeading: "Źródła",
    sources: [
      "Cal Newport, Deep Work (2016) — „productive meditation”",
      "Dalajlama XIV o medytacji analitycznej (m.in. How to See Yourself As You Really Are)",
      "Thich Nhat Hanh, The Long Road Turns to Joy — medytacja chodzona",
      "Caṅkama Sutta (AN 5.29) — pięć korzyści medytacji chodzonej",
      "Oppezzo & Schwartz, „Give Your Ideas Some Legs”, J. Exp. Psychol. (2014)",
      "Frédéric Gros, Filozofia chodzenia — tradycja myślicieli-piechurów",
    ],
  },
  en: {
    title: "The method",
    intro:
      "Productive meditation is a practice that pairs slow, conscious walking with thinking about one well-defined problem. The body is occupied, the mind holds a single object; attention is trained as in meditation — by noticing departures and returning. Cal Newport coined the name (Deep Work, 2016); the ingredients are much older.",
    sections: [
      {
        heading: "Three traditions, one protocol",
        paragraphs: [
          "Walking meditation (kinhin in Zen, caṅkama in Theravada) contributes the anchor: attention in step and breath. Classically, thoughts are released here — ProdMed uses it as a stabiliser before work and as rest after insight.",
          "Analytical meditation (Tib. dpyad sgom) contributes the core: structured thinking on one theme as practice — with the key rhythm of alternation: analyse until clarity appears, rest on the conclusion, return to analysis.",
          "The “solvitur ambulando” tradition — from the Peripatetics through Rousseau (“I can only meditate when walking”) and Nietzsche (“only thoughts reached by walking have value”) to Darwin's thinking path — contributes walking itself as a thinking machine. Oppezzo & Schwartz (Stanford, 2014) measured roughly a 60% boost in divergent thinking while walking.",
        ],
      },
      {
        heading: "The protocol in six moves",
        paragraphs: [
          "1. Anchor: a few minutes of nothing but walking. 2. Load-up: one question defined before leaving, a review of the variables, a next-step question. 3. Work: hold the question; a bell every few minutes is a checkpoint against drift and loop. 4. Insight → rest: after every clear conclusion, a minute of pure walking. 5. Closing: the result in one sentence, or an honest drift. 6. The thread: the result sentence becomes the load-up of the next walk.",
        ],
      },
      {
        heading: "What this is not",
        paragraphs: [
          "It is not mindfulness in the strict sense: the goal is the problem, not contentless observation of the mind. Nor is it a tool for emotionally hot topics — there structure turns into rumination; that is what the Reset mode is for: just the walk, just the breath.",
          "The app stays silent on purpose: no chat, no prompts mid-walk. The thinking is yours; ProdMed only keeps the frame — and never sends anything anywhere.",
        ],
      },
    ],
    sourcesHeading: "Sources",
    sources: [
      "Cal Newport, Deep Work (2016) — “productive meditation”",
      "The 14th Dalai Lama on analytical meditation (e.g. How to See Yourself As You Really Are)",
      "Thich Nhat Hanh, The Long Road Turns to Joy — walking meditation",
      "Caṅkama Sutta (AN 5.29) — five benefits of walking meditation",
      "Oppezzo & Schwartz, “Give Your Ideas Some Legs”, J. Exp. Psychol. (2014)",
      "Frédéric Gros, A Philosophy of Walking — the walking-thinkers tradition",
    ],
  },
};
