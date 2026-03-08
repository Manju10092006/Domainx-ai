// Floating Chatbot Widgets JavaScript

// ========== Robot Chatbot (First Bot) ==========
const robotWidget = document.getElementById('robot-chatbot-widget');
const robotToggle = document.getElementById('robot-toggle');

// Robot chatbot layers for parallax effect
const robotLayers = [
    {
        id: "robot-hair",
        initialOffset: { x: 0, y: -18 },
        maxOffset: 4,
        reverse: true
    },
    {
        id: "robot-head",
        initialOffset: { x: 0, y: 4 },
        maxOffset: 4
    },
    {
        id: "robot-face",
        initialOffset: { x: 0, y: 7 },
        maxOffset: 8
    },
    {
        id: "robot-expression",
        initialOffset: { x: 0, y: 7 },
        maxOffset: 12
    }
].map((layer) => ({
    ...layer,
    element: document.getElementById(layer.id)
}));

const robotContainer = document.getElementById('robot-chatbot-container');
let robotContainerRect = robotContainer ? robotContainer.getBoundingClientRect() : null;
let robotMaxDistance = robotContainer ? Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 2 : 0;
let robotMouseX = window.innerWidth / 2;
let robotMouseY = window.innerHeight / 2;

// Initialize robot layers
if (robotContainer) {
    robotLayers.forEach((layer) => {
        if (layer.element) {
            const { x, y } = layer.initialOffset;
            layer.element.style.setProperty("--offset-x", `${x}px`);
            layer.element.style.setProperty("--offset-y", `${y}px`);
        }
    });
}

// Robot parallax update
function updateRobotParallax() {
    if (!robotContainer || robotLayers.length === 0) return;
    
    const centerX = robotContainerRect.left + robotContainerRect.width / 2;
    const centerY = robotContainerRect.top + robotContainerRect.height / 2;
    
    const dx = robotMouseX - centerX;
    const dy = robotMouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    const influence = Math.min(distance / robotMaxDistance, 1);
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    robotLayers.forEach((layer) => {
        if (layer.element) {
            const { x: initialX, y: initialY } = layer.initialOffset;
            const factor = layer.reverse ? -1 : 1;
            const offsetX = dirX * layer.maxOffset * influence * factor;
            const offsetY = dirY * layer.maxOffset * influence * factor;
            
            layer.element.style.setProperty("--offset-x", `${initialX + offsetX}px`);
            layer.element.style.setProperty("--offset-y", `${initialY + offsetY}px`);
        }
    });
}

// Robot animation loop
function robotAnimate() {
    updateRobotParallax();
    requestAnimationFrame(robotAnimate);
}

// Mouse tracking for robot
document.addEventListener("mousemove", (e) => {
    robotMouseX = e.clientX;
    robotMouseY = e.clientY;
});

window.addEventListener("resize", () => {
    if (robotContainer) {
        robotContainerRect = robotContainer.getBoundingClientRect();
        robotMaxDistance = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 2;
    }
});

// Start robot animation
if (robotContainer) {
    robotAnimate();
}

// Robot blink functionality
const robotBlinkConfig = {
    minInterval: 5000,
    maxInterval: 10000,
    closeSpeed: 100,
    closedDuration: 150,
    openSpeed: 150
};

const robotLeftEye = document.getElementById("robot-eye-l");
const robotRightEye = document.getElementById("robot-eye-r");

function robotBlink() {
    if (!robotLeftEye || !robotRightEye) return;
    
    const leftBox = robotLeftEye.getBBox();
    const rightBox = robotRightEye.getBBox();
    const leftCenterY = leftBox.y + leftBox.height / 2;
    const rightCenterY = rightBox.y + rightBox.height / 2;
    
    robotLeftEye.style.transformOrigin = `${leftBox.x + leftBox.width / 2}px ${leftCenterY}px`;
    robotRightEye.style.transformOrigin = `${rightBox.x + rightBox.width / 2}px ${rightCenterY}px`;
    
    robotLeftEye.style.transition = `transform ${robotBlinkConfig.closeSpeed}ms ease-out`;
    robotRightEye.style.transition = `transform ${robotBlinkConfig.closeSpeed}ms ease-out`;
    robotLeftEye.style.transform = "scaleY(0.1)";
    robotRightEye.style.transform = "scaleY(0.1)";
    
    setTimeout(() => {
        robotLeftEye.style.transition = `transform ${robotBlinkConfig.openSpeed}ms ease-out`;
        robotRightEye.style.transition = `transform ${robotBlinkConfig.openSpeed}ms ease-out`;
        robotLeftEye.style.transform = "scaleY(1)";
        robotRightEye.style.transform = "scaleY(1)";
    }, robotBlinkConfig.closeSpeed + robotBlinkConfig.closedDuration);
}

function robotBlinkAnimate() {
    const randomDelay = Math.random() * (robotBlinkConfig.maxInterval - robotBlinkConfig.minInterval) + robotBlinkConfig.minInterval;
    setTimeout(() => {
        robotBlink();
        robotBlinkAnimate();
    }, randomDelay);
}

if (robotLeftEye && robotRightEye) {
    robotBlinkAnimate();
}

// Robot toggle functionality - opens AI assistant panel
if (robotToggle) {
    robotToggle.addEventListener('click', () => {
        if (aiPanel) {
            aiPanel.classList.toggle('active');
            if (aiPanel.classList.contains('active') && aiMessageInput) {
                setTimeout(() => aiMessageInput.focus(), 100);
            }
        }
    });
}


// ========== AI Chatbot (Panel only, opened by robot) ==========
const aiWidget = document.getElementById('ai-chatbot-widget');
const aiPanel = document.getElementById('ai-panel');
const aiClose = document.getElementById('ai-close');
const aiChatContainer = document.getElementById('aiChatContainer');
const aiMessageInput = document.getElementById('aiMessageInput');
const aiSendButton = document.getElementById('aiSendButton');
const aiTypingIndicator = document.getElementById('aiTypingIndicator');

// Puter.js AI — Chat configuration
const CHAT_API_BASE = 'http://localhost:5000';
const CHAT_SYSTEM_PROMPT =
    'You are a helpful job and company assistant. Answer questions about best companies for tech domains, company culture, salaries, interview processes, job roles, required skills, and career paths. Keep answers concise and friendly. If a question is unrelated to jobs or companies, politely redirect the user.';

const chatConversationContext = [];
let chatIsSending = false;

function getChatUserId() {
    const LS_KEY = 'career_assistant_user_id';
    let id = localStorage.getItem(LS_KEY);
    if (!id) {
        id = (window.crypto && typeof window.crypto.randomUUID === 'function')
            ? window.crypto.randomUUID()
            : 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        localStorage.setItem(LS_KEY, id);
    }
    return id;
}

// AI Chat functionality
function createAIMessageElement(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${isUser ? 'U' : 'AI'}</div>
        <div class="message-bubble">${content}</div>
    `;
    
    return messageDiv;
}

function addAIMessage(content, isUser = false) {
    if (!aiChatContainer) return;
    const messageElement = createAIMessageElement(content, isUser);
    aiChatContainer.appendChild(messageElement);
    aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
}

function showAITypingIndicator() {
    if (aiTypingIndicator) {
        aiTypingIndicator.classList.add('active');
        if (aiChatContainer) {
            aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
        }
    }
}

function hideAITypingIndicator() {
    if (aiTypingIndicator) {
        aiTypingIndicator.classList.remove('active');
    }
}

// Real AI response via Puter.js
async function askPuterAI(userMessage) {
    const messages = [
        { role: 'system', content: CHAT_SYSTEM_PROMPT }
    ];

    // Add last 5 conversation turns for context
    const last5 = chatConversationContext.slice(-5);
    for (const turn of last5) {
        messages.push({ role: 'user', content: turn.user });
        messages.push({ role: 'assistant', content: turn.bot });
    }

    messages.push({ role: 'user', content: userMessage });

    // Use Puter.js AI (loaded via script tag)
    if (typeof puter === 'undefined' || !puter.ai || !puter.ai.chat) {
        throw new Error('Puter.js not loaded');
    }

    const response = await puter.ai.chat(messages);

    if (typeof response === 'string') return response;
    if (response && typeof response.message === 'string') return response.message;
    if (response && response.message && typeof response.message.content === 'string') return response.message.content;
    if (response && Array.isArray(response.message?.content)) {
        return response.message.content.map(c => c.text || '').join('');
    }
    return String(response || '');
}

// Save conversation to backend
async function saveChatToBackend(userId, message, reply) {
    try {
        await fetch(`${CHAT_API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, message, reply })
        });
    } catch (e) {
        console.warn('[chatbot] Failed to save to backend:', e?.message);
    }
}

// Load chat history from backend
async function loadChatHistory() {
    try {
        const userId = getChatUserId();
        const r = await fetch(`${CHAT_API_BASE}/api/chat/history/${encodeURIComponent(userId)}`);
        if (!r.ok) return;
        const data = await r.json();
        const messages = Array.isArray(data.messages) ? data.messages : [];
        const last10 = messages.slice(-10);

        if (last10.length === 0) return;

        for (const row of last10) {
            if (row.user_message) addAIMessage(String(row.user_message), true);
            if (row.bot_response) addAIMessage(String(row.bot_response), false);
            if (row.user_message && row.bot_response) {
                chatConversationContext.push({ user: String(row.user_message), bot: String(row.bot_response) });
            }
        }
    } catch (e) {
        console.warn('[chatbot] Failed to load history:', e?.message);
    }
}

async function handleAISendMessage() {
    if (!aiMessageInput || chatIsSending) return;
    const message = aiMessageInput.value.trim();
    if (!message) return;

    chatIsSending = true;
    addAIMessage(message, true);
    aiMessageInput.value = '';
    aiMessageInput.disabled = true;
    if (aiSendButton) aiSendButton.disabled = true;

    showAITypingIndicator();

    try {
        const replyText = await askPuterAI(message);
        const reply = (replyText && replyText.trim()) ? replyText.trim() : 'Something went wrong, please try again.';

        hideAITypingIndicator();
        addAIMessage(reply);

        chatConversationContext.push({ user: message, bot: reply });
        if (chatConversationContext.length > 10) chatConversationContext.shift();

        // Save to backend asynchronously
        const userId = getChatUserId();
        saveChatToBackend(userId, message, reply);
    } catch (e) {
        hideAITypingIndicator();
        addAIMessage('Something went wrong, please try again.');
        console.error('[chatbot] AI error:', e?.message);
    } finally {
        chatIsSending = false;
        aiMessageInput.disabled = false;
        if (aiSendButton) aiSendButton.disabled = false;
        aiMessageInput.focus();
    }
}

// AI close functionality
if (aiClose) {
    aiClose.addEventListener('click', () => {
        aiPanel.classList.remove('active');
    });
}

// AI send message handlers
if (aiSendButton) {
    aiSendButton.addEventListener('click', handleAISendMessage);
}

if (aiMessageInput) {
    aiMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAISendMessage();
        }
    });
}

// Initialize AI chatbot with welcome message + load history
setTimeout(() => {
    if (aiChatContainer) {
        addAIMessage("Hello! I'm your AI Career Assistant powered by Puter.js. Ask me about companies, salaries, roles, or career paths!");
        loadChatHistory();
    }
}, 500);

// Close panels when clicking outside
document.addEventListener('click', (e) => {
    if (aiPanel && aiPanel.classList.contains('active')) {
        if (!aiWidget.contains(e.target) && !robotWidget.contains(e.target) && !aiPanel.contains(e.target)) {
            aiPanel.classList.remove('active');
        }
    }
});

