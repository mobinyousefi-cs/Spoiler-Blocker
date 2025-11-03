#!/usr/bin/env python3
// -*- coding: utf-8 -*-
/*
=================================================================================================================
Project: Spoiler Blocker Extension
File: popup.js
Author: Mobin Yousefi (GitHub: github.com/mobinyousefi-cs)
Created: 2025-11-03
Updated: 2025-11-03
License: MIT License (see LICENSE file for details)
=

Description:
Popup logic for enabling/disabling, snoozing, keyword management, and quick mode/intensity control.

Usage:
- Loaded by popup.html.

Notes:
- Reads/writes chrome.storage.sync and broadcasts updates implicitly via background listener.
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

function getAll() {
  return new Promise((resolve) => chrome.storage.sync.get(DEFAULTS, resolve));
}
function set(obj) {
  return new Promise((resolve) => chrome.storage.sync.set(obj, resolve));
}

function renderKeywords(list) {
  const root = document.getElementById('kw-list');
  root.innerHTML = '';
  for (const term of list) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = term + ' ';
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.title = 'Remove';
    btn.addEventListener('click', async () => {
      const next = list.filter(x => x !== term);
      await set({ keywords: next });
      renderKeywords(next);
    });
    tag.appendChild(btn);
    root.appendChild(tag);
  }
}

async function init() {
  const els = {
    enabled: document.getElementById('toggle-enabled'),
    snooze: document.getElementById('snooze-30'),
    mode: document.getElementById('mode'),
    intensity: document.getElementById('intensity'),
    kw: document.getElementById('kw'),
    add: document.getElementById('add-kw'),
    clear: document.getElementById('clear-kw')
  };

  const s = await getAll();
  els.enabled.checked = !!s.enabled;
  els.mode.value = s.mode;
  els.intensity.value = s.intensity;
  renderKeywords(s.keywords || []);

  els.enabled.addEventListener('change', async () => set({ enabled: els.enabled.checked }));
  els.mode.addEventListener('change', async () => set({ mode: els.mode.value }));
  els.intensity.addEventListener('input', async () => set({ intensity: Number(els.intensity.value) }));
  els.snooze.addEventListener('click', async () => {
    const until = Date.now() + 30 * 60 * 1000;
    await set({ snoozeUntil: until });
  });

  els.add.addEventListener('click', async () => {
    const term = String(els.kw.value || '').trim();
    if (!term) return;
    const s2 = await getAll();
    const setKw = new Set(s2.keywords || []);
    setKw.add(term);
    const arr = [...setKw];
    await set({ keywords: arr });
    els.kw.value = '';
    renderKeywords(arr);
  });

  els.clear.addEventListener('click', async () => {
    await set({ keywords: [] });
    renderKeywords([]);
  });
}

document.addEventListener('DOMContentLoaded', init);
