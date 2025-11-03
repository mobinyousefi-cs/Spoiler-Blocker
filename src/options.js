#!/usr/bin/env python3
// -*- coding: utf-8 -*-
/*
=================================================================================================================
Project: Spoiler Blocker Extension
File: options.js
Author: Mobin Yousefi (GitHub: github.com/mobinyousefi-cs)
Created: 2025-11-03
Updated: 2025-11-03
License: MIT License (see LICENSE file for details)
=

Description:
Handles advanced options, including partial matching, debug highlighting, and per‑site enable/disable rules.

Usage:
- Loaded by options.html.

Notes:
- Rules stored under `siteRules` keyed by hostname.
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

function getAll() { return new Promise((r) => chrome.storage.sync.get(DEFAULTS, r)); }
function set(obj) { return new Promise((r) => chrome.storage.sync.set(obj, r)); }

function renderRules(rules) {
  const tbody = document.querySelector('#rulesTable tbody');
  tbody.innerHTML = '';
  const entries = Object.entries(rules || {}).sort((a,b) => a[0].localeCompare(b[0]));
  for (const [host, rule] of entries) {
    const tr = document.createElement('tr');
    const tdHost = document.createElement('td'); tdHost.textContent = host; tr.appendChild(tdHost);
    const tdStatus = document.createElement('td'); tdStatus.textContent = rule.enabled ? 'Enabled' : 'Disabled'; tr.appendChild(tdStatus);
    tbody.appendChild(tr);
  }
}

async function init() {
  const els = {
    partial: document.getElementById('partial'),
    highlightDebug: document.getElementById('highlightDebug'),
    host: document.getElementById('host'),
    addHost: document.getElementById('addHost'),
    disableHost: document.getElementById('disableHost'),
    removeHost: document.getElementById('removeHost')
  };

  const s = await getAll();
  els.partial.checked = !!s.partial;
  els.highlightDebug.checked = !!s.highlightDebug;
  renderRules(s.siteRules || {});

  els.partial.addEventListener('change', async () => set({ partial: els.partial.checked }));
  els.highlightDebug.addEventListener('change', async () => set({ highlightDebug: els.highlightDebug.checked }));

  els.addHost.addEventListener('click', async () => {
    const host = String(els.host.value || '').trim().replace(/^https?:\/\//,'').replace(/\/$/,'');
    if (!host) return;
    const s2 = await getAll();
    const siteRules = { ...(s2.siteRules || {}) };
    siteRules[host] = { enabled: true };
    await set({ siteRules });
    renderRules(siteRules);
  });

  els.disableHost.addEventListener('click', async () => {
    const host = String(els.host.value || '').trim().replace(/^https?:\/\//,'').replace(/\/$/,'');
    if (!host) return;
    const s2 = await getAll();
    const siteRules = { ...(s2.siteRules || {}) };
    siteRules[host] = { enabled: false };
    await set({ siteRules });
    renderRules(siteRules);
  });

  els.removeHost.addEventListener('click', async () => {
    const host = String(els.host.value || '').trim().replace(/^https?:\/\//,'').replace(/\/$/,'');
    if (!host) return;
    const s2 = await getAll();
    const siteRules = { ...(s2.siteRules || {}) };
    delete siteRules[host];
    await set({ siteRules });
    renderRules(siteRules);
  });
}

document.addEventListener('DOMContentLoaded', init);
