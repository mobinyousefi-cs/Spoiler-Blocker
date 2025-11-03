#!/usr/bin/env python3
// -*- coding: utf-8 -*-
/*
=================================================================================================================
Project: Spoiler Blocker Extension
File: background.js
Author: Mobin Yousefi (GitHub: github.com/mobinyousefi-cs)
Created: 2025-11-03
Updated: 2025-11-03
License: MIT License (see LICENSE file for details)
=

Description:
Service Worker (MV3): manages context menus, storage defaults, message fanout, and per‑site toggles.

Usage:
- Runs in the background; listens to installation and context menu commands.

Notes:
- Uses chrome.storage.sync with sensible defaults.
- Broadcasts setting changes to all tabs.

=================================================================================================================
*/

const DEFAULTS = {
  enabled: true,
  snoozeUntil: 0,
  keywords: [],
  mode: 'blur',
  intensity: 8,
  partial: false,
  highlightDebug: false,
  siteRules: {}
};

function pushSettingsToTabs(payload = {}) {
  chrome.tabs.query({}, (tabs) => {
    for (const t of tabs) {
      if (!t.id) continue;
      chrome.tabs.sendMessage(t.id, { type: 'SB_SETTINGS_UPDATED', payload });
    }
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(DEFAULTS);
  const merged = { ...DEFAULTS, ...current };
  await chrome.storage.sync.set(merged);

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'sb-add-selection', title: 'Spoiler Blocker: Add “%s”', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'sb-toggle-site', title: 'Spoiler Blocker: Toggle on this site', contexts: ['page'] });
    chrome.contextMenus.create({ id: 'sb-snooze-30', title: 'Spoiler Blocker: Snooze 30 min', contexts: ['page'] });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  const { menuItemId } = info;
  const url = new URL(tab.url || 'http://example.com');
  const host = url.hostname.replace(/^www\./, '');

  if (menuItemId === 'sb-add-selection' && info.selectionText) {
    const text = String(info.selectionText).trim();
    if (text) {
      const data = await chrome.storage.sync.get(DEFAULTS);
      const set = new Set(data.keywords || []);
      set.add(text);
      await chrome.storage.sync.set({ keywords: [...set] });
      pushSettingsToTabs({ keywords: [...set] });
    }
  } else if (menuItemId === 'sb-toggle-site') {
    const data = await chrome.storage.sync.get(DEFAULTS);
    const siteRules = { ...(data.siteRules || {}) };
    const current = siteRules[host]?.enabled ?? true;
    siteRules[host] = { enabled: !current };
    await chrome.storage.sync.set({ siteRules });
    pushSettingsToTabs({ siteRules });
  } else if (menuItemId === 'sb-snooze-30') {
    const until = Date.now() + 30 * 60 * 1000;
    await chrome.storage.sync.set({ snoozeUntil: until });
    pushSettingsToTabs({ snoozeUntil: until });
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  const payload = {};
  for (const k of Object.keys(changes)) {
    payload[k] = changes[k].newValue;
  }
  pushSettingsToTabs(payload);
});
