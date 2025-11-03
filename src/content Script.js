#!/usr/bin/env python3
// -*- coding: utf-8 -*-
/*
=================================================================================================================
Project: Spoiler Blocker Extension
File: contentScript.js
Author: Mobin Yousefi (GitHub: github.com/mobinyousefi-cs)
Created: 2025-11-03
Updated: 2025-11-03
License: MIT License (see LICENSE file for details)
=

Description:
DOM scanner that detects potential spoilers using user-defined keywords and applies masking styles
(blur/blackout/collapse). Works with dynamic content via MutationObserver.

Usage:
- Injected via manifest content_scripts on all pages.
- Communicates with background and popup through chrome.runtime messaging.

Notes:
- Keeps performance by debounced scans and a NodeFilter for visible text nodes.
- Uses word-boundary and optional partial matching.
- Respects per-site enablement and snooze.

=================================================================================================================
*/

(() => {
  const STORAGE_KEYS = {
    ENABLED: 'enabled',
    SNOOZE_UNTIL: 'snoozeUntil',
    KEYWORDS: 'keywords', // array of strings
    MODE: 'mode', // 'blur' | 'blackout' | 'collapse'
    INTENSITY: 'intensity', // blur px, or collapse height
    PARTIAL: 'partial', // boolean: partial/fuzzy matching
    HIGHLIGHT_DEBUG: 'highlightDebug', // boolean: outlines matches for debugging
    SITE_RULES: 'siteRules' // map hostname -> { enabled: boolean }
  };

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

  let state = { ...DEFAULTS };

  function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULTS, (items) => {
        state = { ...DEFAULTS, ...items };
        resolve();
      });
    });
  }

  // Utility: debounce
  function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // Build regex for keywords
  function buildRegex(keywords, partial) {
    if (!Array.isArray(keywords) || keywords.length === 0) return null;
    const escaped = keywords
      .map(k => String(k || '').trim())
      .filter(Boolean)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escaped.length === 0) return null;
    const pattern = partial ? `(${escaped.join('|')})` : `\\b(${escaped.join('|')})\\b`;
    return new RegExp(pattern, 'i');
  }

  // Masking helpers
  function maskElement(el, mode, intensity, debug) {
    if (!el || el.classList?.contains('sb-masked')) return;
    el.classList?.add('sb-masked');
    el.dataset.sbMaskMode = mode;

    switch (mode) {
      case 'blackout':
        el.style.setProperty('color', 'transparent', 'important');
        el.style.setProperty('background', '#000', 'important');
        el.style.setProperty('text-shadow', 'none', 'important');
        el.style.setProperty('filter', 'none', 'important');
        break;
      case 'collapse':
        el.style.setProperty('max-height', `${Math.max(0, Number(intensity) || 0)}px`, 'important');
        el.style.setProperty('overflow', 'hidden', 'important');
        el.style.setProperty('position', 'relative', 'important');
        const overlay = document.createElement('div');
        overlay.className = 'sb-overlay';
        overlay.textContent = 'Spoiler hidden — click to reveal';
        overlay.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;background:rgba(0,0,0,.6);color:#fff;cursor:pointer;`;
        overlay.addEventListener('click', () => unmaskElement(el));
        el.appendChild(overlay);
        break;
      case 'blur':
      default:
        el.style.setProperty('filter', `blur(${Math.max(2, Number(intensity) || 8)}px)`, 'important');
        el.style.setProperty('text-shadow', '0 0 12px rgba(0,0,0,.5)', 'important');
        el.style.setProperty('cursor', 'pointer', 'important');
        el.addEventListener('click', () => unmaskElement(el), { once: true });
    }

    if (debug) {
      el.style.setProperty('outline', '2px dashed #ff4d4f', 'important');
    }
  }

  function unmaskElement(el) {
    if (!el) return;
    el.classList?.remove('sb-masked');
    el.style.removeProperty('filter');
    el.style.removeProperty('color');
    el.style.removeProperty('background');
    el.style.removeProperty('text-shadow');
    el.style.removeProperty('outline');
    el.style.removeProperty('max-height');
    el.style.removeProperty('overflow');
    el.style.removeProperty('position');
    const overlay = el.querySelector('.sb-overlay');
    overlay?.remove();
  }

  // Iterates visible text nodes efficiently
  function* textNodesUnder(root) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (n) => {
          const text = n.nodeValue?.trim();
          if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;
          const parent = n.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const style = parent.ownerDocument?.defaultView?.getComputedStyle(parent);
          if (!style || style.visibility === 'hidden' || style.display === 'none') return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    let current;
    while ((current = walker.nextNode())) {
      yield current;
    }
  }

  function scan(regex) {
    if (!regex) return;
    for (const tn of textNodesUnder(document.body)) {
      if (regex.test(tn.nodeValue)) {
        const el = tn.parentElement;
        maskElement(el, state.mode, state.intensity, state.highlightDebug);
      }
    }
  }

  const runScan = debounce(() => {
    const now = Date.now();
    const snoozed = Number(state.snoozeUntil) > now;
    const site = location.hostname.replace(/^www\./, '');
    const siteRule = state.siteRules?.[site];
    const siteEnabled = siteRule?.enabled ?? true;

    if (!state.enabled || snoozed || !siteEnabled) return;
    const regex = buildRegex(state.keywords, state.partial);
    scan(regex);
  }, 300);

  const observer = new MutationObserver(() => runScan());

  async function init() {
    await loadSettings();
    runScan();
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'SB_SETTINGS_UPDATED') {
      Object.assign(state, msg.payload || {});
      runScan();
    }
  });

  init();
})();
