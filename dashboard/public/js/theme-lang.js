/**
 * Client-side script for Theme (Light/Dark) & Language (ITA/ENG) switching
 * Persisted in localStorage across all dashboard pages.
 */

const translations = {
  it: {
    dashboardTitle: "J.A.R.V.I.S. Dashboard",
    webServerStatus: "Stato Web Server",
    discordStatus: "Connessione Discord",
    activeServers: "Server Attivi",
    botUptime: "Uptime del Bot",
    apiPing: "Latenza API (Ping)",
    memoryUsed: "Memoria Utilizzata",
    leaderboardBtn: "🏆 Classifica Server",
    settingsBtn: "⚙️ Impostazioni Bot",
    selectGuildTitle: "Seleziona un Server",
    selectGuildDesc: "Scegli un server Discord per visualizzarne le impostazioni o la classifica.",
    unauthorizedTitle: "Accesso Negato",
    unauthorizedDesc: "Non sei presente in nessun server gestito da JARVIS.",
    backHome: "🏠 Torna alla Home",
    backBtn: "Indietro",
    searchMember: "Cerca membro...",
    rank: "Pos",
    member: "Membro",
    level: "Livello",
    xpPoints: "Punti XP",
    activeStatus: "🟢 Attivo",
    connectedStatus: "🟢 Connesso",
    saveSettings: "💾 Salva Impostazioni",
    syncMembers: "🔄 Sincronizza Membri",
    noAdminMessage: "🔒 Non hai i permessi per configurare questo server",
    logout: "Esci"
  },
  en: {
    dashboardTitle: "J.A.R.V.I.S. Dashboard",
    webServerStatus: "Web Server Status",
    discordStatus: "Discord Connection",
    activeServers: "Active Servers",
    botUptime: "Bot Uptime",
    apiPing: "API Latency (Ping)",
    memoryUsed: "Memory Usage",
    leaderboardBtn: "🏆 Server Leaderboard",
    settingsBtn: "⚙️ Bot Settings",
    selectGuildTitle: "Select a Server",
    selectGuildDesc: "Choose a Discord server to view settings or leaderboard.",
    unauthorizedTitle: "Access Denied",
    unauthorizedDesc: "You are not a member of any server managed by JARVIS.",
    backHome: "🏠 Back to Home",
    backBtn: "Back",
    searchMember: "Search member...",
    rank: "Rank",
    member: "Member",
    level: "Level",
    xpPoints: "XP Points",
    activeStatus: "🟢 Active",
    connectedStatus: "🟢 Connected",
    saveSettings: "💾 Save Settings",
    syncMembers: "🔄 Sync Members",
    noAdminMessage: "🔒 You don't have permissions to configure this server",
    logout: "Logout"
  }
};

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  localStorage.setItem('jarvis_theme', theme);
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.textContent = theme === 'light' ? '🌙 Dark' : '☀️ Light';
  }
}

function applyLanguage(lang) {
  localStorage.setItem('jarvis_lang', lang);
  const langSelect = document.getElementById('langSelect');
  if (langSelect) langSelect.value = lang;

  const dict = translations[lang] || translations.it;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('jarvis_theme') || 'dark';
  applyTheme(savedTheme);

  const savedLang = localStorage.getItem('jarvis_lang') || 'it';
  applyLanguage(savedLang);

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      applyLanguage(e.target.value);
    });
  }
});
