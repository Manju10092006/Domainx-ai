(function () {
  const WIDGET_ROOT_ID = 'career-assistant-widget';
  const LS_USER_ID_KEY = 'career_assistant_user_id';
  const API_BASE = 'http://localhost:5000';

  const SYSTEM_PROMPT =
    'You are a helpful job and company assistant. Answer questions about best companies for tech domains, company culture, salaries, interview processes, job roles, required skills, and career paths. Keep answers concise and friendly. If a question is unrelated to jobs or companies, politely redirect the user.';

  const conversationContext = [];

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  }

  function getUserId() {
    let id = localStorage.getItem(LS_USER_ID_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(LS_USER_ID_KEY, id);
    }
    return id;
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
      }
    }
    if (children) {
      for (const child of children) node.appendChild(child);
    }
    return node;
  }

  function scrollToBottom(messagesEl) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function formatTime(dateLike) {
    const d = dateLike ? new Date(dateLike) : new Date();
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addBubble(messagesEl, role, text, createdAt) {
    const bubble = el('div', { class: `ca-bubble ${role === 'user' ? 'ca-user' : 'ca-bot'}` }, [
      el('div', { text: text })
    ]);
    const metaText = createdAt ? formatTime(createdAt) : '';
    if (metaText) {
      bubble.appendChild(el('div', { class: 'ca-meta', text: metaText }));
    }
    messagesEl.appendChild(bubble);
    scrollToBottom(messagesEl);
    return bubble;
  }

  function addTyping(messagesEl) {
    const wrap = el('div', { class: 'ca-bubble ca-bot' }, [
      el('div', { class: 'ca-typing' }, [
        el('div', { text: 'Typing' }),
        el('div', { class: 'ca-dots' }, [el('span'), el('span'), el('span')])
      ])
    ]);
    messagesEl.appendChild(wrap);
    scrollToBottom(messagesEl);
    return wrap;
  }

  async function fetchHistory(userId) {
    const r = await fetch(`${API_BASE}/api/history/${encodeURIComponent(userId)}`);
    if (!r.ok) throw new Error('history_failed');
    const data = await r.json();
    return Array.isArray(data.messages) ? data.messages : [];
  }

  async function saveToBackend(userId, message, reply) {
    try {
      await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message, reply })
      });
    } catch (e) {
      console.warn('[career-assistant] Failed to save to backend:', e?.message);
    }
  }

  async function askPuter(userMessage) {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    const last5 = conversationContext.slice(-5);
    for (const turn of last5) {
      messages.push({ role: 'user', content: turn.user });
      messages.push({ role: 'assistant', content: turn.bot });
    }

    messages.push({ role: 'user', content: userMessage });

    const response = await puter.ai.chat(messages);

    if (typeof response === 'string') return response;
    if (response && typeof response.message === 'string') return response.message;
    if (response && response.message && typeof response.message.content === 'string') return response.message.content;
    if (response && Array.isArray(response.message?.content)) {
      return response.message.content.map(c => c.text || '').join('');
    }
    return String(response || '');
  }

  function buildWidget() {
    if (document.getElementById(WIDGET_ROOT_ID)) return;

    const root = el('div', { id: WIDGET_ROOT_ID });
    const panel = el('div', { class: 'ca-panel', 'aria-hidden': 'true' });
    const messagesEl = el('div', { class: 'ca-messages' });
    const suggestionsEl = el('div', { class: 'ca-suggestions ca-hidden' });

    const chips = [
      'Best companies for frontend developers?',
      'What skills do I need for data science?',
      'How is work culture at Google?',
      'Top AI companies to apply to in 2025?'
    ];

    const inputEl = el('input', {
      class: 'ca-text',
      type: 'text',
      placeholder: 'Ask about companies, roles, salaries…'
    });

    function showSuggestions(show) {
      suggestionsEl.classList.toggle('ca-hidden', !show);
    }

    for (const chipText of chips) {
      suggestionsEl.appendChild(
        el('button', {
          class: 'ca-chip',
          type: 'button',
          text: chipText,
          onclick: () => {
            inputEl.value = chipText;
            inputEl.focus();
            doSend();
          }
        })
      );
    }

    const btnClear = el('button', { class: 'ca-btn ca-danger', type: 'button', text: 'Clear' });
    const btnClose = el('button', { class: 'ca-btn', type: 'button', text: 'Close' });

    const header = el('div', { class: 'ca-header' }, [
      el('div', { class: 'ca-title', text: 'Career Assistant 🤖' }),
      el('div', { class: 'ca-header-actions' }, [btnClear, btnClose])
    ]);

    const btnSend = el('button', { class: 'ca-send', type: 'button', text: 'Send' });
    const inputWrap = el('div', { class: 'ca-input' }, [inputEl, btnSend]);

    panel.appendChild(header);
    panel.appendChild(messagesEl);
    panel.appendChild(suggestionsEl);
    panel.appendChild(inputWrap);

    const fab = el('button', {
      class: 'ca-fab',
      type: 'button',
      'aria-label': 'Open Career Assistant',
      text: '💼'
    });

    root.appendChild(panel);
    root.appendChild(fab);
    document.body.appendChild(root);

    const userId = getUserId();
    let isOpen = false;
    let isLoadingHistory = false;
    let isSending = false;

    function setOpen(open) {
      isOpen = open;
      panel.classList.toggle('ca-open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) {
        inputEl.focus();
        loadHistory();
      }
    }

    async function loadHistory() {
      if (isLoadingHistory) return;
      isLoadingHistory = true;
      messagesEl.innerHTML = '';
      showSuggestions(false);
      conversationContext.length = 0;

      try {
        const history = await fetchHistory(userId);
        const last10 = history.slice(-10);

        if (last10.length === 0) {
          showSuggestions(true);
          return;
        }

        for (const row of last10) {
          if (row.user_message) addBubble(messagesEl, 'user', String(row.user_message), row.created_at);
          if (row.bot_response) addBubble(messagesEl, 'bot', String(row.bot_response), row.created_at);
          if (row.user_message && row.bot_response) {
            conversationContext.push({ user: String(row.user_message), bot: String(row.bot_response) });
          }
        }
        scrollToBottom(messagesEl);
      } catch (e) {
        messagesEl.innerHTML = '';
        addBubble(messagesEl, 'bot', 'Something went wrong, please try again.');
      } finally {
        isLoadingHistory = false;
      }
    }

    async function doSend() {
      const text = inputEl.value.trim();
      if (!text || isSending) return;
      isSending = true;

      showSuggestions(false);
      inputEl.value = '';
      inputEl.disabled = true;
      btnSend.disabled = true;

      addBubble(messagesEl, 'user', text, new Date().toISOString());
      const typingEl = addTyping(messagesEl);

      try {
        const reply = await askPuter(text);
        const replyText = reply && reply.trim() ? reply.trim() : 'Something went wrong, please try again.';

        typingEl.remove();
        addBubble(messagesEl, 'bot', replyText, new Date().toISOString());

        conversationContext.push({ user: text, bot: replyText });
        if (conversationContext.length > 10) conversationContext.shift();

        await saveToBackend(userId, text, replyText);
      } catch (e) {
        typingEl.remove();
        addBubble(messagesEl, 'bot', 'Something went wrong, please try again.');
      } finally {
        isSending = false;
        inputEl.disabled = false;
        btnSend.disabled = false;
        inputEl.focus();
      }
    }

    fab.addEventListener('click', () => setOpen(!isOpen));
    btnClose.addEventListener('click', () => setOpen(false));
    btnClear.addEventListener('click', () => {
      messagesEl.innerHTML = '';
      conversationContext.length = 0;
      showSuggestions(true);
      inputEl.focus();
    });
    btnSend.addEventListener('click', doSend);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
