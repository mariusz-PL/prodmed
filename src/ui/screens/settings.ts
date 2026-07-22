import { getLang, setLang, t, type Lang } from "../../i18n";
import { exportJson, exportMarkdown, importJson, loadSettings, saveSettings, wipeEverything } from "../../storage/repo";
import { h, mount } from "../dom";
import { navigate } from "../router";
import { shell } from "../shell";

declare const __APP_VERSION__: string;

function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = h("a", { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function settingsScreen(root: HTMLElement): void {
  const settings = loadSettings();

  const langSelect = h("select", { class: "input select" }) as HTMLSelectElement;
  for (const [value, label] of [
    ["pl", "polski"],
    ["en", "English"],
  ] as const) {
    const opt = h("option", { value }, label) as HTMLOptionElement;
    if (value === getLang()) opt.selected = true;
    langSelect.append(opt);
  }
  langSelect.addEventListener("change", () => {
    const lang = langSelect.value as Lang;
    saveSettings({ ...loadSettings(), lang });
    setLang(lang);
    settingsScreen(root);
  });

  const numField = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
  ): HTMLElement => {
    const input = h("input", {
      class: "input num",
      type: "number",
      value: String(value),
      min: String(min),
      max: String(max),
      step: String(step),
    }) as HTMLInputElement;
    input.addEventListener("change", () => {
      const v = Math.min(max, Math.max(min, Number(input.value) || 0));
      input.value = String(v);
      onChange(v);
    });
    return h("div", { class: "num-row" }, h("label", { class: "label" }, label), input);
  };

  const persistNote = h("p", { class: "muted" }, "…");
  if (navigator.storage?.persist) {
    void navigator.storage.persisted().then(async (already) => {
      const granted = already || (await navigator.storage.persist());
      persistNote.textContent = granted ? t("settings.persist.granted") : t("settings.persist.denied");
    });
  } else {
    persistNote.textContent = t("settings.persist.denied");
  }

  const importInput = h("input", { class: "file-hidden", type: "file", accept: "application/json" }) as HTMLInputElement;
  const importStatus = h("p", { class: "muted" }, "");
  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (!file) return;
    void file.text().then(async (raw) => {
      try {
        const res = await importJson(raw);
        importStatus.textContent = t("settings.import.ok", { p: res.problems, s: res.sessions });
      } catch {
        importStatus.textContent = t("settings.import.bad");
      }
    });
  });

  const wipeBtn = h("button", { class: "quiet danger", type: "button" }, t("settings.wipe"));
  let armed = false;
  wipeBtn.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      wipeBtn.textContent = t("settings.wipeConfirm");
      window.setTimeout(() => {
        armed = false;
        wipeBtn.textContent = t("settings.wipe");
      }, 3500);
      return;
    }
    void wipeEverything().then(() => navigate("#/"));
  });

  mount(
    root,
    shell(
      h(
        "div",
        {},
        h("h1", { class: "screen-h" }, t("settings.title")),

        h(
          "section",
          { class: "settings-group" },
          h("h2", { class: "section-h" }, t("settings.language")),
          langSelect,
        ),

        h(
          "section",
          { class: "settings-group" },
          h("h2", { class: "section-h" }, t("settings.durations")),
          numField(t("settings.anchor"), settings.anchorMin, 0, 10, 1, (v) =>
            saveSettings({ ...loadSettings(), anchorMin: v }),
          ),
          numField(t("settings.bell"), settings.bellEveryMin, 0, 15, 1, (v) =>
            saveSettings({ ...loadSettings(), bellEveryMin: v }),
          ),
          h("p", { class: "hint" }, `0 = ${t("settings.bell.off")}`),
          numField(t("settings.rest"), settings.restSec, 0, 180, 15, (v) =>
            saveSettings({ ...loadSettings(), restSec: v }),
          ),
        ),

        h(
          "section",
          { class: "settings-group" },
          h("h2", { class: "section-h" }, t("settings.data")),
          h(
            "button",
            {
              class: "quiet",
              type: "button",
              onclick: () => {
                void exportMarkdown(getLang()).then((md) => download("prodmed.md", md, "text/markdown"));
              },
            },
            t("settings.exportMd"),
          ),
          h(
            "button",
            {
              class: "quiet",
              type: "button",
              onclick: () => {
                void exportJson().then((json) => download("prodmed-backup.json", json, "application/json"));
              },
            },
            t("settings.exportJson"),
          ),
          h("button", { class: "quiet", type: "button", onclick: () => importInput.click() }, t("settings.import")),
          importInput,
          importStatus,
          wipeBtn,
        ),

        h(
          "section",
          { class: "settings-group" },
          h("h2", { class: "section-h" }, t("settings.privacy")),
          h("p", { class: "privacy-box" }, t("settings.privacy.text")),
          persistNote,
          h("p", { class: "hint" }, t("settings.installHint")),
        ),

        h("p", { class: "lab-note" }, `ProdMed ${__APP_VERSION__} · ${t("laboratorium")}`),
      ),
      { back: "#/" },
    ),
  );
}
