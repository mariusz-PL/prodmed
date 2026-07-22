import "./styles.css";
import { detectLang, setLang } from "./i18n";
import { loadSettings, saveSettings } from "./storage/repo";
import { route, setFallback, startRouter } from "./ui/router";
import { homeScreen } from "./ui/screens/home";
import { lessonScreen, lessonsScreen } from "./ui/screens/lessons";
import { loadScreen } from "./ui/screens/load";
import { methodScreen } from "./ui/screens/method";
import { problemDetailScreen, problemsScreen } from "./ui/screens/problems";
import { leaveSession, sessionScreen } from "./ui/screens/session";
import { settingsScreen } from "./ui/screens/settings";

const root = document.getElementById("app");
if (!root) throw new Error("missing #app");

const settings = loadSettings();
const lang = localStorage.getItem("prodmed:settings") ? settings.lang : detectLang();
if (lang !== settings.lang) saveSettings({ ...settings, lang });
setLang(lang);

route("/", () => {
  leaveSession();
  void homeScreen(root);
});
route("/load", (p) => {
  leaveSession();
  void loadScreen(root, p);
});
route("/session", () => sessionScreen(root));
route("/problems", () => {
  leaveSession();
  void problemsScreen(root);
});
route("/problem/:id", (p) => {
  leaveSession();
  void problemDetailScreen(root, p);
});
route("/lessons", () => {
  leaveSession();
  lessonsScreen(root);
});
route("/lesson/:n", (p) => {
  leaveSession();
  lessonScreen(root, p);
});
route("/method", () => {
  leaveSession();
  methodScreen(root);
});
route("/settings", () => {
  leaveSession();
  settingsScreen(root);
});
setFallback(() => {
  leaveSession();
  void homeScreen(root);
});

startRouter();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
