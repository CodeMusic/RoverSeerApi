// Musai AI chat controls
// Externalized to avoid CSP blocking of inline scripts

(function wireMusaiAIChat()
{
  try
  {
    /** DOM references */
    var aiSection = document.getElementById('ai_chat');
    if (!aiSection)
    {
      return;
    }

    if (aiSection.dataset && aiSection.dataset.wired === '1')
    {
      return;
    }

    var aiForm = document.getElementById('ai_chat_form');
    var aiInput = document.getElementById('ai_chat_input');
    var aiOut = document.getElementById('ai_chat_output');
    var aiStatus = document.getElementById('ai_chat_status');
    var aiSend = document.getElementById('ai_chat_send');
    var aiToggle = document.getElementById('ai_chat_toggle');
    var aiMode = document.getElementById('ai_mode');
    var aiPerspective = document.getElementById('ai_perspective');
    var aiBackTop = document.getElementById('ai_backToTop');
    var aiLogo = (aiSection && (aiSection.getAttribute('data-logo') || '').trim()) || '/static/img/logo_musai_symbol.png';
    function getPerspectiveValue()
    {
      try
      {
        return (aiPerspective && aiPerspective.checked) ? 'true' : 'false';
      }
      catch (_)
      {
        return 'false';
      }
    }
    /**
     * Cognitive entanglement — decide red/blue duality or unified violet
     * Returns a pair { user: 'red'|'blue'|'violet', ai: 'red'|'blue'|'violet' }
     */
    function resolveEntangledBubbleColors(perspectiveOn, lastUserChoice)
    {
      try
      {
        if (perspectiveOn)
        {
          return { user: 'violet', ai: 'violet' };
        }
        var userColor = lastUserChoice || (Math.random() > 0.5 ? 'red' : 'blue');
        var aiColor = userColor === 'red' ? 'blue' : 'red';
        return { user: userColor, ai: aiColor };
      }
      catch (_)
      {
        return { user: 'violet', ai: 'violet' };
      }
    }
    function buildMusaiChatUrl(baseUrl, extraParams)
    {
      try
      {
        var url = new URL(baseUrl, window.location.href);
        var params = url.searchParams;
        if (extraParams && typeof extraParams === 'object')
        {
          Object.keys(extraParams).forEach(function(k)
          {
            var v = extraParams[k];
            if (v !== undefined && v !== null && v !== '')
            {
              params.set(k, String(v));
            }
          });
        }
        params.set('perspective', getPerspectiveValue());
        url.search = params.toString();
        return url.toString();
      }
      catch (_)
      {
        var parts = [];
        try
        {
          if (extraParams && extraParams.url)
          {
            parts.push('url=' + encodeURIComponent(extraParams.url));
          }
        }
        catch (__) { /* no-op */ }
        parts.push('perspective=' + getPerspectiveValue());
        return baseUrl + (parts.length ? ('?' + parts.join('&')) : '');
      }
    }
    function createHideButton()
    {
      try
      {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ai-hide';
        btn.setAttribute('aria-label', 'Hide AI output');
        btn.title = 'Hide';
        btn.textContent = '×';
        btn.addEventListener('click', function(ev)
        {
          try
          {
            ev.preventDefault();
            ev.stopPropagation();
            if (aiSection.classList.contains('collapsed'))
            {
              return;
            }
            try { rootHtml.classList.add('ai-chat-output-collapsed'); } catch (_) { /* no-op */ }
          }
          catch (_) { /* no-op */ }
        });
        return btn;
      }
      catch (_) { return null; }
    }
    function expandAI()
    {
      try
      {
        aiSection.classList.remove('collapsed');
        rootHtml.classList.remove('ai-chat-collapsed');
        // Also clear the output-only collapsed state
        try { rootHtml.classList.remove('ai-chat-output-collapsed'); } catch (_) { /* no-op */ }
        try { localStorage.setItem(collapseStorageKey, '0'); } catch (_) { /* no-op */ }
        if (aiToggle)
        {
          aiToggle.setAttribute('aria-label', 'Collapse AI assistant');
          aiToggle.title = 'Collapse';
          aiToggle.textContent = '▾';
        }
      }
      catch (_) { /* no-op */ }
    }
    var rootHtml = document.documentElement;
    var collapseStorageKey = 'musai_ai_chat_collapsed';
    var chatBusy = false;
    var internalNavInProgress = false;

    /** UX: autosize input */
    (function autoSizeAITextarea()
    {
      try
      {
        if (!aiInput) { return; }
        var maxHeight = 140;
        var adjust = function()
        {
          try
          {
            aiInput.style.height = 'auto';
            var h = Math.min(aiInput.scrollHeight || 0, maxHeight);
            aiInput.style.height = (h > 0 ? h : 40) + 'px';
          }
          catch (_) { /* no-op */ }
        };
        aiInput.addEventListener('input', adjust);
        adjust();
      }
      catch (_) { /* no-op */ }
    })();

    /** Start expanded on results pages */
    try
    {
      aiSection.classList.remove('collapsed');
      rootHtml.classList.remove('ai-chat-collapsed');
      if (aiToggle)
      {
        aiToggle.setAttribute('aria-label', 'Collapse AI assistant');
        aiToggle.title = 'Collapse';
        aiToggle.textContent = '▾';
      }
      try { localStorage.setItem(collapseStorageKey, '0'); } catch (_) { /* no-op */ }
    }
    catch (_) { /* no-op */ }

    /** Collapse/expand */
    aiToggle && aiToggle.addEventListener('click', function(ev)
    {
      ev.preventDefault();
      ev.stopPropagation();
      var willCollapse = !aiSection.classList.contains('collapsed');
      aiSection.classList.toggle('collapsed', willCollapse);
      rootHtml.classList.toggle('ai-chat-collapsed', willCollapse);
      // Any explicit toggle clears the output-only collapsed header state
      try { rootHtml.classList.remove('ai-chat-output-collapsed'); } catch (_) { /* no-op */ }
      try { localStorage.setItem(collapseStorageKey, willCollapse ? '1' : '0'); } catch (_) { /* no-op */ }
      if (aiToggle)
      {
        aiToggle.setAttribute('aria-label', willCollapse ? 'Expand AI assistant' : 'Collapse AI assistant');
        aiToggle.title = willCollapse ? 'Expand' : 'Collapse';
        aiToggle.textContent = willCollapse ? '▸' : '▾';
      }
    });

    /** Outside interaction collapses the output bubble to header-only (not the whole bar) */
    (function attachOutsideCollapse()
    {
      try
      {
        var handler = function(e)
        {
          try
          {
            if (aiSection && (e.target === aiSection || (e.target.closest && e.target.closest('#ai_chat'))))
            {
              return;
            }
            var outputVisible = aiOut && !aiOut.hidden && aiOut.innerHTML.trim() !== '';
            if (!outputVisible)
            {
              return;
            }
            try { rootHtml.classList.add('ai-chat-output-collapsed'); } catch (_) { /* no-op */ }
          }
          catch (_) { /* no-op */ }
        };
        var types = ['pointerdown', 'touchstart', 'mousedown', 'click'];
        for (var i = 0; i < types.length; i++)
        {
          document.addEventListener(types[i], handler, true);
        }
      }
      catch (_) { /* no-op */ }
    })();

    /** Expose busy state */
    try
    {
      window.musaiAI = window.musaiAI || {};
      window.musaiAI.isBusy = function()
      {
        return !!chatBusy;
      };
      window.musaiAI.markInternalNav = function()
      {
        internalNavInProgress = true;
        setTimeout(function() { internalNavInProgress = false; }, 3000);
      };
      window.musaiAI.buildChatUrl = function(baseUrl, extraParams)
      {
        return buildMusaiChatUrl(baseUrl, extraParams || {});
      };
    }
    catch (_) { /* no-op */ }

    /** Back-to-top visibility and behavior */
    (function attachBackToTop()
    {
      try
      {
        if (!aiBackTop) { return; }
        aiBackTop.addEventListener('click', function(e)
        {
          e.preventDefault();
          // Always scroll the outer page to the very top (keep any overlay as-is)
          try
          {
            var se = document.scrollingElement || document.documentElement || document.body;
            if (se && typeof se.scrollTo === 'function')
            {
              se.scrollTo({ top: 0, behavior: 'smooth' });
            }
            else
            {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
          catch (_)
          {
            try { window.scrollTo(0, 0); } catch (__) { /* no-op */ }
          }
          // Hard fallbacks for stubborn mobile browsers
          try { document.documentElement && (document.documentElement.scrollTop = 0); } catch (_) { /* no-op */ }
          try { document.body && (document.body.scrollTop = 0); } catch (_) { /* no-op */ }
        });

        var lastY = window.scrollY || window.pageYOffset || 0;
        var ticking = false;
        var threshold = 120;
        var show = function() { aiBackTop.hidden = false; };
        var hide = function() { aiBackTop.hidden = true; };
        hide();
        window.addEventListener('scroll', function()
        {
          var currentY = window.scrollY || window.pageYOffset || 0;
          if (ticking) { return; }
          ticking = true;
          window.requestAnimationFrame(function()
          {
            var isScrollingDown = currentY > lastY;
            if (currentY < threshold) { hide(); }
            else if (isScrollingDown) { show(); }
            else { hide(); }
            lastY = currentY;
            ticking = false;
          });
        }, { passive: true });
      }
      catch (_) { /* no-op */ }
    })();

    /** Error toast */
    function showAiErrorToast(message)
    {
      try
      {
        if (!aiSection) { return; }
        var existing = aiSection.querySelector('.ai-error-toast');
        if (existing && existing.parentNode) { existing.parentNode.removeChild(existing); }
        var toast = document.createElement('div');
        toast.className = 'ai-error-toast mystical-glow';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.style.cssText = 'position:absolute;right:12px;bottom:12px;max-width:74%;background:rgba(64,38,94,.95);color:#ffffff;padding:10px 12px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.35);display:flex;align-items:center;gap:10px;z-index:1000;';
        var label = document.createElement('span');
        label.textContent = message || 'An error occurred.';
        label.style.cssText = 'color:#ffffff;';
        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'ai-toast-close';
        close.setAttribute('aria-label', 'Dismiss');
        close.textContent = '×';
        close.style.cssText = 'background:transparent;color:#ffffff;border:none;font-size:18px;cursor:pointer;line-height:1;padding:0;margin-left:auto;';
        close.addEventListener('click', function(ev)
        {
          ev.preventDefault();
          if (toast && toast.parentNode) { toast.parentNode.removeChild(toast); }
        });
        toast.appendChild(label);
        toast.appendChild(close);
        aiSection.appendChild(toast);
      }
      catch (_) { /* no-op */ }
    }

    /** Mode-aware UX */
    (function wireModeUX()
    {
      try
      {
        if (!aiMode || !aiInput || !aiSend) { return; }
        var apply = function()
        {
          var mode = (aiMode.value || 'chat');
          if (mode === 'search')
          {
            aiInput.placeholder = 'Search for...';
            aiInput.enterKeyHint = 'search';
            aiInput.setAttribute('inputmode', 'search');
            aiSend.setAttribute('aria-label', 'Search');
            aiSend.title = 'Search';
          }
          else
          {
            aiInput.placeholder = 'Ask Musai...';
            aiInput.enterKeyHint = 'send';
            aiInput.setAttribute('inputmode', 'text');
            aiSend.setAttribute('aria-label', 'Send');
            aiSend.title = 'Send';
          }
        };
        aiMode.addEventListener('change', apply);
        apply();
      }
      catch (_) { /* no-op */ }
    })();

    /** Enter submits, Shift+Enter newline */
    aiInput && aiInput.addEventListener('keydown', function(ev)
    {
      if (ev.isComposing || ev.keyCode === 229) { return; }
      var isEnter = (ev.key === 'Enter' || ev.keyCode === 13);
      if (isEnter && !ev.shiftKey)
      {
        ev.preventDefault();
        ev.stopPropagation();
        if (aiForm && typeof aiForm.requestSubmit === 'function')
        {
          aiForm.requestSubmit();
        }
        else if (aiForm)
        {
          aiForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    });

    /** Send button triggers submit */
    aiSend && aiSend.addEventListener('click', function(ev)
    {
      ev.preventDefault();
      ev.stopPropagation();
      if (aiForm && typeof aiForm.requestSubmit === 'function')
      {
        aiForm.requestSubmit();
      }
      else if (aiForm)
      {
        aiForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });

    /** Collect visible results context */
    function collectTopResultsContext(limit)
    {
      var maxItems = typeof limit === 'number' ? limit : 5;
      var resultArticles = Array.prototype.slice.call(document.querySelectorAll('#urls article.result'));
      var top = resultArticles.slice(0, maxItems);
      var items = top.map(function(article)
      {
        var anchor = article.querySelector('h3 a');
        var title = (anchor && anchor.textContent ? anchor.textContent : '').trim();
        var url = (anchor && anchor.href ? anchor.href : '').trim();
        var snippetEl = article.querySelector('p.content');
        var snippetRaw = snippetEl ? (snippetEl.innerText || snippetEl.textContent || '') : '';
        var snippet = snippetRaw.replace(/\s+/g, ' ').trim();
        var maxTitleLen = 140;
        var maxSnippetLen = 220;
        var titleShort = title.length > maxTitleLen ? (title.slice(0, maxTitleLen - 1) + '…') : title;
        var snippetShort = snippet.length > maxSnippetLen ? (snippet.slice(0, maxSnippetLen - 1) + '…') : snippet;
        return { title: titleShort, url: url, snippet: snippetShort };
      }).filter(function(x)
      {
        return x.title || x.url || x.snippet;
      });
      return items;
    }

    function sanitizeForContext(value)
    {
      try
      {
        var s = String(value || '');
        s = s.replace(/\s+/g, ' ').trim();
        var unicodeStrip = null;
        try { unicodeStrip = new RegExp("[^\\p{L}\\p{N}\\s\\.,;:\\-\\(\\)\\!\\?\\'\\\"]", "gu"); } catch (_) { unicodeStrip = null; }
        if (unicodeStrip)
        {
          s = s.replace(unicodeStrip, ' ');
        }
        else
        {
          s = s.replace(/[^A-Za-z0-9\s\.,;:\-\(\)\!\?'\"]/g, ' ');
        }
        s = s.replace(/\s{2,}/g, ' ').trim();
        return s;
      }
      catch (_) { return (value || '').toString(); }
    }

    /** Determine if a POV thought has meaningful cognitive content */
    function isMeaningfulThought(value)
    {
      try
      {
        var s = (value == null ? '' : String(value)).trim();
        if (!s) { return false; }
        // Treat common sentinel values as non-meaningful
        if (/^(unknown|n\/a|none|null|undefined)$/i.test(s)) { return false; }
        // Reject strings that are just punctuation/dashes
        if (/^[-–—_.,:;!?'"\s]+$/.test(s)) { return false; }
        return true;
      }
      catch (_)
      {
        return false;
      }
    }

    /** Normalize a POV thought to either a cleaned string or empty when not meaningful */
    function normalizeThought(value)
    {
      try
      {
        var s = (value == null ? '' : String(value)).replace(/\s+/g, ' ').trim();
        return isMeaningfulThought(s) ? s : '';
      }
      catch (_)
      {
        return '';
      }
    }

    /** Submit handler */
    var typingEl = null;
    aiForm && aiForm.addEventListener('submit', function(ev)
    {
      (async function()
      {
        ev.preventDefault();
        ev.stopPropagation();
        var mode = (aiMode && aiMode.value) || 'chat';
        // Ensure any collapsed states are cleared when engaging
        try { rootHtml.classList.remove('ai-chat-output-collapsed'); } catch (_) { /* no-op */ }
        if (aiSection.classList.contains('collapsed'))
        {
          aiSection.classList.remove('collapsed');
          rootHtml.classList.remove('ai-chat-collapsed');
          try { rootHtml.classList.remove('ai-chat-output-collapsed'); } catch (_) { /* no-op */ }
          try { localStorage.setItem(collapseStorageKey, '0'); } catch (_) { /* no-op */ }
          if (aiToggle)
          {
            aiToggle.setAttribute('aria-label', 'Collapse AI assistant');
            aiToggle.title = 'Collapse';
            aiToggle.textContent = '▾';
          }
        }
        var userPrompt = (aiInput && aiInput.value ? aiInput.value.trim() : '');
        if (!userPrompt)
        {
          return;
        }

        if (mode === 'search')
        {
          try
          {
            var hasScheme = function(value) { return /^(?:[a-z][a-z0-9+.-]*):\/\//i.test(value); };
            var looksLikeUrl = function(value)
            {
              if (!value || /\s/.test(value)) { return false; }
              if (hasScheme(value)) { return true; }
              if (/^www\./i.test(value)) { return true; }
              if (/^(?:localhost)(?::\d+)?(?:[\/?#].*)?$/i.test(value)) { return true; }
              if (/^(?:\d{1,3})(?:\.\d{1,3}){3}(?::\d+)?(?:[\/?#].*)?$/i.test(value)) { return true; }
              return /^[^\s]+\.[a-z]{2,}(?:[\/?#].*)?$/i.test(value);
            };
            var normalizeUrl = function(value)
            {
              if (!value) { return value; }
              if (hasScheme(value)) { return value; }
              if (/^www\./i.test(value)) { return 'https://' + value; }
              if (/^(?:localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:[\/?#].*)?$/i.test(value)) { return 'http://' + value; }
              return 'https://' + value;
            };
            if (looksLikeUrl(userPrompt))
            {
              var finalUrl = normalizeUrl(userPrompt);
              try { window.musaiAI && typeof window.musaiAI.markInternalNav === 'function' && window.musaiAI.markInternalNav(); } catch (_) {}
              if (window.musaiOverlayAPI && typeof window.musaiOverlayAPI.open === 'function')
              {
                window.musaiOverlayAPI.open(finalUrl, 'ai-mode-search-url');
              }
              else
              {
                try { window.open(finalUrl, '_blank', 'noopener'); } catch (_) {}
              }
              return;
            }
            var ds = aiSection && aiSection.dataset ? aiSection.dataset : {};
            var categories = (ds.categories || '').split(',').filter(Boolean).join(',');
            var base = '/search';
            var url = base + '?q=' + encodeURIComponent(userPrompt) + (categories ? ('&categories=' + encodeURIComponent(categories)) : '');
            try { window.location.href = url; } catch (_) {}
            return;
          }
          catch (_) { return; }
        }

        if (aiInput) { aiInput.disabled = true; }
        if (aiSend) { aiSend.disabled = true; }
        if (aiStatus) { aiStatus.textContent = ''; }
        if (aiOut) { aiOut.hidden = true; }
        chatBusy = true;

        try
        {
          // Decide the entangled color pairing for this message
          var perspectiveOn = (getPerspectiveValue() === 'true');
          var entangled = resolveEntangledBubbleColors(perspectiveOn, null);
          // Reflect chosen AI color on typing indicator (created below)
          if (!typingEl)
          {
            typingEl = document.createElement('div');
            typingEl.className = 'ai-typing-bubble mystical-glow';
            typingEl.setAttribute('role', 'status');
            typingEl.setAttribute('aria-live', 'polite');
            typingEl.innerHTML = (
              '<span class="ai-typing-icon" aria-hidden="true"><img src="' + aiLogo + '" alt=""></span>' +
              '<span class="ai-typing-label">Musai is thinking</span>' +
              '<span style="display:inline-flex;align-items:center;gap:4px;margin-left:6px;">' +
              '  <span class="ai-typing-dot mystical-dots" style="animation-delay:0ms"></span>' +
              '  <span class="ai-typing-dot mystical-dots" style="animation-delay:200ms"></span>' +
              '  <span class="ai-typing-dot mystical-dots" style="animation-delay:400ms"></span>' +
              '</span>'
            );
          }
          try
          {
            typingEl.classList.remove('red', 'blue', 'violet');
            typingEl.classList.add(entangled.ai);
            typingEl.dataset.userBubbleColor = entangled.user;
            typingEl.dataset.aiBubbleColor = entangled.ai;
          }
          catch (_) { /* no-op */ }
          if (typingEl.parentNode !== aiForm && aiForm)
          {
            try { aiForm.insertBefore(typingEl, aiInput); } catch (_) { /* no-op */ }
          }
          if (aiOut)
          {
            aiOut.hidden = true;
            aiOut.innerHTML = '';
          }
        }
        catch (_) { /* no-op */ }

        var storageKey = 'musai_session_id';
        var sessionId = null;
        try
        {
          sessionId = localStorage.getItem(storageKey);
          if (!sessionId)
          {
            sessionId = 'web-' + Date.now() + '-' + Math.random().toString(36).slice(2);
            localStorage.setItem(storageKey, sessionId);
          }
        }
        catch (_) { sessionId = 'web-' + Date.now(); }

        var ds2 = aiSection && aiSection.dataset ? aiSection.dataset : {};
        var contextResults = collectTopResultsContext(5);

        var overlayContextBlock = '';
        try
        {
          if (window.musaiOverlayAPI && typeof window.musaiOverlayAPI.isOpen === 'function' && window.musaiOverlayAPI.isOpen())
          {
            if (typeof window.musaiOverlayAPI.contextBlock === 'function')
            {
              overlayContextBlock = window.musaiOverlayAPI.contextBlock({ maxChars: 2000 }) || '';
            }
            try
            {
              if (!overlayContextBlock)
              {
                var lk = (window.musaiOverlayAPI && typeof window.musaiOverlayAPI.lastKnownUrl === 'function') ? (window.musaiOverlayAPI.lastKnownUrl() || '') : '';
                overlayContextBlock = '[Current Context:\nUnable to view this page content.\nURL: ' + (lk || '') + '\n]';
              }
            }
            catch (_) { /* no-op */ }
          }
        }
        catch (_) { /* no-op */ }

        var resultsBlock = '';
        try
        {
          if (contextResults && contextResults.length)
          {
            var lines = contextResults.map(function(r, idx)
            {
              var title = sanitizeForContext(r.title || r.url || 'Untitled');
              var snippet = sanitizeForContext(r.snippet || '');
              var url = (r.url || '').trim();
              return (idx + 1) + ') ' + title + (url ? (' — ' + url) : '') + (snippet ? ('\n   ' + snippet) : '');
            }).join('\n');
            resultsBlock = overlayContextBlock ? ('[Previous User Search Results Context:\n' + lines + '\n]') : ('[User Search Results Context:\n' + lines + '\n]');
          }
        }
        catch (_) { /* no-op */ }

        var combinedQuery = userPrompt;
        if (resultsBlock && overlayContextBlock)
        {
          combinedQuery = resultsBlock + '\n\n' + overlayContextBlock + '\n\n' + userPrompt;
        }
        else if (overlayContextBlock)
        {
          combinedQuery = overlayContextBlock + '\n\n' + userPrompt;
        }
        else if (resultsBlock)
        {
          combinedQuery = resultsBlock + '\n\n' + userPrompt;
        }

        function inferUrlFromPrompt(prompt)
        {
          try
          {
            var raw = (prompt || '').trim();
            if (!raw) { return ''; }
            try
            {
              var u1 = new URL(raw);
              return u1.href;
            }
            catch (_)
            {
              if (/^www\.[^\s]+/i.test(raw) || /[^\s]+\.[a-z]{2,}(?:[\/?#]|$)/i.test(raw))
              {
                try { var u2 = new URL('https://' + raw); return u2.href; } catch (__) { /* no-op */ }
              }
            }
          }
          catch (_) { /* no-op */ }
          return '';
        }

        var overlayUrl = '';
        var overlayState = { isOpen: false, initialUrl: '', lastKnownUrl: '', loadCount: 0, navigatedAway: false };
        try
        {
          var open = (window.musaiOverlayAPI && typeof window.musaiOverlayAPI.isOpen === 'function' && window.musaiOverlayAPI.isOpen());
          if (open)
          {
            try { overlayUrl = (window.musaiOverlayAPI.lastKnownUrl && window.musaiOverlayAPI.lastKnownUrl()) || (window.musaiOverlayAPI.currentUrl && window.musaiOverlayAPI.currentUrl()) || ''; } catch (__) { /* no-op */ }
            try { overlayState = (window.musaiOverlayAPI.state && window.musaiOverlayAPI.state()) || overlayState; } catch (___) { /* no-op */ }
          }
          else
          {
            overlayUrl = inferUrlFromPrompt(userPrompt) || '';
          }
        }
        catch (_) { /* no-op */ }

        var effectiveQuery = combinedQuery;
        try
        {
          if (overlayState && overlayState.isOpen && overlayState.navigatedAway)
          {
            effectiveQuery = combinedQuery + '\n\n[ The user has navigated away from the search so we do not know their current page ]';
          }
        }
        catch (_) { /* no-op */ }

        var payload = {
          sessionId: sessionId,
          query: effectiveQuery,
          action: 'webhookChat',
          url: overlayUrl,
          meta: JSON.stringify({ search: {
            q: ds2.q || '',
            selected_categories: (ds2.categories || '').split(',').filter(Boolean),
            pageno: parseInt(ds2.pageno || '1', 10),
            time_range: ds2.timeRange || '',
            language: ds2.language || '',
            safesearch: ds2.safesearch || ''
          }, contextResults: contextResults, overlay: overlayState })
        };

        var povParam = getPerspectiveValue();
        try { payload.perspective = povParam; } catch (_) { /* no-op */ }

        try
        {
          var lastKnownForParam = '';
          try { lastKnownForParam = (overlayState && overlayState.lastKnownUrl) || overlayUrl || ''; } catch (_) { /* no-op */ }
          var webhookBase = 'https://n8n.codemusic.ca/webhook/chat/message';
          var webhookUrl = buildMusaiChatUrl(
            webhookBase,
            lastKnownForParam ? { url: lastKnownForParam } : {}
          );
          var res = await fetch(webhookUrl,
          {
            method: 'POST',
            headers: Object.assign(
              { 'Content-Type': 'application/json' },
              (window.musaiN8N && typeof window.musaiN8N.getAuthHeader === 'function')
                ? window.musaiN8N.getAuthHeader()
                : { 'Authorization': 'Basic c2l0ZXVzZXI6Y29kZW11c2Fp' }
            ),
            body: JSON.stringify(payload),
            credentials: 'omit',
            cache: 'no-store'
          });
          if (!res.ok)
          {
            throw new Error('HTTP ' + res.status);
          }
          var data = await res.json();
          var record = Array.isArray(data) ? (data[0] || {}) : (data || {});
          var responseText = record.response || '';
          var pov = Array.isArray(record.pov) ? record.pov : [];

          if (aiOut) { aiOut.innerHTML = ''; }
          try { if (typingEl && typingEl.parentNode) { typingEl.parentNode.removeChild(typingEl); } } catch (_) { /* no-op */ }
          typingEl = null;

          var main = document.createElement('div');
          main.className = 'ai-main-bubble';
          try
          {
            main.classList.add(entangled.ai);
            main.dataset.userBubbleColor = entangled.user;
            main.dataset.aiBubbleColor = entangled.ai;
          }
          catch (_) { /* no-op */ }

          var logicalThought = '';
          var creativeThought = '';
          var perspectiveThought = '';
          for (var i = 0; i < pov.length; i++)
          {
            var p = pov[i] || {};
            var t = (p && (p.type || p.name) || '').toString().toLowerCase();
            var thoughtStr = (typeof p.thought === 'string') ? normalizeThought(p.thought) : '';
            if (!logicalThought && (t === 'logical' || /logic/.test(t)) && thoughtStr) { logicalThought = thoughtStr; }
            if (!creativeThought && (t === 'creative' || /creativ/.test(t)) && thoughtStr) { creativeThought = thoughtStr; }
            if (!perspectiveThought && (t === 'perspective' || /perspective|perspec/.test(t)) && thoughtStr) { perspectiveThought = thoughtStr; }
          }

          if (logicalThought || creativeThought || perspectiveThought)
          {
            var toggles = document.createElement('div');
            toggles.className = 'ai-pov-toggle-group';

            var redBtn = document.createElement('button');
            redBtn.type = 'button';
            redBtn.className = 'ai-pov-toggle red';
            redBtn.textContent = 'Logical';
            if (!logicalThought) redBtn.disabled = true;

            var blueBtn = document.createElement('button');
            blueBtn.type = 'button';
            blueBtn.className = 'ai-pov-toggle blue';
            blueBtn.textContent = 'Creative';
            if (!creativeThought) blueBtn.disabled = true;

            var violetBtn = document.createElement('button');
            violetBtn.type = 'button';
            violetBtn.className = 'ai-pov-toggle violet';
            violetBtn.textContent = 'Perspective';
            if (!perspectiveThought) violetBtn.disabled = true;

            var redPanel = document.createElement('div');
            redPanel.className = 'ai-pov-panel red';
            redPanel.textContent = logicalThought || '';
            redPanel.hidden = true;

            var bluePanel = document.createElement('div');
            bluePanel.className = 'ai-pov-panel blue';
            bluePanel.textContent = creativeThought || '';
            bluePanel.hidden = true;

            var violetPanel = document.createElement('div');
            violetPanel.className = 'ai-pov-panel violet';
            violetPanel.textContent = perspectiveThought || '';
            violetPanel.hidden = true;

            function setActive(which)
            {
              var isRed = which === 'red';
              var isBlue = which === 'blue';
              var isViolet = which === 'violet';
              main.hidden = !!which;
              redPanel.hidden = !isRed;
              bluePanel.hidden = !isBlue;
              violetPanel.hidden = !isViolet;
              redBtn.classList.toggle('active', isRed);
              blueBtn.classList.toggle('active', isBlue);
              violetBtn.classList.toggle('active', isViolet);
            }

            redBtn.addEventListener('click', function()
            {
              if (aiSection.classList.contains('collapsed')) { expandAI(); }
              try { if (rootHtml.classList.contains('ai-chat-output-collapsed')) { rootHtml.classList.remove('ai-chat-output-collapsed'); } } catch (_) { /* no-op */ }
              if (redBtn.disabled) { return; }
              setActive(!redBtn.classList.contains('active') ? 'red' : null);
            });
            blueBtn.addEventListener('click', function()
            {
              if (aiSection.classList.contains('collapsed')) { expandAI(); }
              try { if (rootHtml.classList.contains('ai-chat-output-collapsed')) { rootHtml.classList.remove('ai-chat-output-collapsed'); } } catch (_) { /* no-op */ }
              if (blueBtn.disabled) { return; }
              setActive(!blueBtn.classList.contains('active') ? 'blue' : null);
            });
            violetBtn.addEventListener('click', function()
            {
              if (aiSection.classList.contains('collapsed')) { expandAI(); }
              try { if (rootHtml.classList.contains('ai-chat-output-collapsed')) { rootHtml.classList.remove('ai-chat-output-collapsed'); } } catch (_) { /* no-op */ }
              if (violetBtn.disabled) { return; }
              setActive(!violetBtn.classList.contains('active') ? 'violet' : null);
            });

            if (aiOut)
            {
              aiOut.appendChild(toggles);
              toggles.appendChild(redBtn);
              toggles.appendChild(blueBtn);
              toggles.appendChild(violetBtn);
              main.textContent = perspectiveThought ? perspectiveThought : (responseText || (Object.keys(record).length ? JSON.stringify(record, null, 2) : ''));
              aiOut.appendChild(main);
              aiOut.appendChild(redPanel);
              aiOut.appendChild(bluePanel);
              aiOut.appendChild(violetPanel);
              // Add hide control (X) to collapse output-only
              (function(){ try { var hideBtn = createHideButton(); if (hideBtn) { aiOut.appendChild(hideBtn); } } catch (_) { /* no-op */ } })();
            }
            setActive(null);
          }
          else
          {
            if (aiOut) { aiOut.appendChild(main); }
            // Add hide control (X) for the simple output case
            (function(){ try { if (aiOut) { var hideBtn2 = createHideButton(); if (hideBtn2) { aiOut.appendChild(hideBtn2); } } } catch (_) { /* no-op */ } })();
          }
          if (aiOut) { aiOut.hidden = false; }
        }
        catch (err)
        {
          try { if (typingEl && typingEl.parentNode) { typingEl.parentNode.removeChild(typingEl); } } catch (_) { /* no-op */ }
          typingEl = null;
          showAiErrorToast('Error contacting AI service.');
          if (aiOut) { aiOut.hidden = true; }
        }
        finally
        {
          if (aiStatus) { aiStatus.textContent = ''; }
          if (aiInput) { aiInput.disabled = false; }
          if (aiSend) { aiSend.disabled = false; }
          chatBusy = false;
        }
      })();
    });

    /** Guard navigation while busy */
    window.addEventListener('beforeunload', function(e)
    {
      if (chatBusy && !internalNavInProgress)
      {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    /** Intercept clicks while busy */
    document.addEventListener('click', function(e)
    {
      if (!chatBusy) { return; }
      var anchor = e.target && (e.target.closest ? e.target.closest('a[href]') : null);
      if (!anchor) { return; }
      try
      {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) { return; }
        var ignoreUi = (
          anchor.classList.contains('media-loader') ||
          anchor.classList.contains('btn-collapse') ||
          anchor.hasAttribute('data-target') ||
          anchor.hasAttribute('data-toggle')
        );
        if (ignoreUi) { return; }
        var href = anchor.getAttribute('href') || '';
        if (!href || href === '#') { return; }
        if (href.charAt(0) === '#') { return; }
        var dest;
        try { dest = new URL(href, window.location.href); } catch (_) { dest = null; }
        if (dest && dest.origin === window.location.origin)
        {
          internalNavInProgress = true;
          return;
        }
        var isMedia = /\.(png|jpe?g|gif|webp|svg|bmp|ico|pdf|mp3|wav|ogg|flac|mp4|m4v|webm|mov)([#?].*)?$/i.test(href);
        e.preventDefault();
        e.stopPropagation();
        var promptMsg = 'Musai is thinking. What would you like to do with this link?';
        var openMusai = window.confirm(promptMsg + '\n\nOK = Open in Musai overlay\nCancel = More options');
        if (openMusai)
        {
          try { window.musaiOverlayAPI && window.musaiOverlayAPI.open(href, (anchor.id || '')); } catch (_) {}
          return;
        }
        if (isMedia)
        {
          var openNewTab = window.confirm('Open in a new tab instead?\n\nOK = New tab\nCancel = Cancel');
          if (openNewTab) { try { window.open(href, '_blank', 'noopener'); } catch (_) {} }
          return;
        }
        var leave = window.confirm('Leave this page and open the link here?\n\nOK = Leave site\nCancel = Cancel');
        if (leave) { try { window.location.href = href; } catch (_) {} }
        return;
      }
      catch (_) { /* no-op */ }
    }, true);

    /** Intercept form submits while busy */
    document.addEventListener('submit', function(e)
    {
      if (!chatBusy) { return; }
      try
      {
        var form = e.target;
        if (form && form.action)
        {
          var dest = new URL(form.action, window.location.href);
          if (dest.origin === window.location.origin)
          {
            internalNavInProgress = true;
            return;
          }
        }
      }
      catch (_) { /* no-op */ }
      var ok = window.confirm('Musai is thinking. Submitting will cancel the response. Continue?');
      if (!ok)
      {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    /** Mark wired */
    try { aiSection.dataset.wired = '1'; } catch (_) { /* no-op */ }
  }
  catch (_) { /* no-op */ }
})();


