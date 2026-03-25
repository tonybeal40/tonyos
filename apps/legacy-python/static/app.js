const chatForm = document.getElementById("chat-form");
const chatMessage = document.getElementById("chat-message");
const chatLog = document.getElementById("chat-log");
const sendBtn = document.getElementById("send-btn");
const modeBtns = document.querySelectorAll(".mode-btn");
const currentModeLabel = document.getElementById("current-mode-label");
const promptChips = document.querySelectorAll(".prompt-chip");
const moodBtns = document.querySelectorAll(".mood-btn");
const moodLabel = document.getElementById("mood-label");
const truthModeCheckbox = document.getElementById("truth-mode");
const clearChatBtn = document.getElementById("clear-chat-btn");
const personaSelect = document.getElementById("persona-select");
const modelSelect = document.getElementById("model-select");

let currentMode = "normal";
let currentMood = "neutral";
let currentPersona = "default";
let currentProvider = "openai";
let currentModel = "gpt-4o";

if (modelSelect) {
  modelSelect.addEventListener("change", () => {
    currentModel = modelSelect.value;
  });
}

const moodDescriptions = {
  neutral: "Mood: Neutral - crisp, balanced responses.",
  happy: "Mood: Happy - upbeat, confident, encouraging.",
  sad: "Mood: Sad - calm, empathetic, supportive.",
  mad: "Mood: Mad - blunt, no excuses, still helpful."
};

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    if (currentMode === "normal") {
      currentModeLabel.textContent = "Deep mode, for slower but stronger thinking.";
    } else {
      currentModeLabel.textContent = "Fast mode, for quick answers and rapid testing.";
    }
  });
});

moodBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    moodBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMood = btn.dataset.mood;
    if (moodLabel) {
      moodLabel.textContent = moodDescriptions[currentMood] || moodDescriptions.neutral;
    }
  });
});

promptChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chatMessage.value = chip.dataset.prompt;
    chatMessage.focus();
  });
});

function formatMessage(text) {
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^(\d+)\.\s/gm, '<span class="list-num">$1.</span> ')
    .replace(/^[-•]\s/gm, '<span class="list-bullet">•</span> ');
  
  return formatted.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('');
}

function appendMessage(role, text, showCopy = false) {
  const div = document.createElement("div");
  div.className = "message " + role;
  
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  
  if (role === "assistant") {
    bubble.innerHTML = formatMessage(text);
    
    if (showCopy) {
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.innerHTML = "Copy";
      copyBtn.title = "Copy to clipboard";
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(text);
        copyBtn.innerHTML = "Copied!";
        setTimeout(() => { copyBtn.innerHTML = "Copy"; }, 1500);
      };
      bubble.appendChild(copyBtn);
    }
  } else {
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      const p = document.createElement("p");
      p.textContent = line;
      bubble.appendChild(p);
    });
  }
  
  div.appendChild(bubble);
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

function showTypingIndicator() {
  const div = document.createElement("div");
  div.className = "message assistant typing-indicator";
  div.id = "typing-indicator";
  div.innerHTML = `
    <div class="bubble typing-bubble">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-text">TonyOS is thinking...</span>
    </div>
  `;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) indicator.remove();
}

if (clearChatBtn) {
  clearChatBtn.addEventListener("click", () => {
    chatLog.innerHTML = `
      <div class="message assistant">
        <div class="bubble">
          <p>Chat cleared. Ready for a fresh start.</p>
          <p>What do you want to work on?</p>
        </div>
      </div>
    `;
  });
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatMessage.value.trim();
  if (!message) return;

  appendMessage("user", message);
  chatMessage.value = "";
  sendBtn.disabled = true;
  sendBtn.textContent = "...";

  const truthMode = truthModeCheckbox ? truthModeCheckbox.checked : false;
  currentPersona = personaSelect ? personaSelect.value : "default";
  
  showTypingIndicator();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message, 
        mode: currentMode,
        mood: currentMood,
        truth: truthMode,
        persona: currentPersona,
        provider: currentProvider,
        model: currentModel
      }),
    });

    hideTypingIndicator();

    const data = await res.json();
    if (data.reply) {
      appendMessage("assistant", data.reply, true);
      
      // Sync chat to Google Sheets
      if (window.SheetsSync) {
        window.SheetsSync.sync('Chat', {
          role: 'user',
          content: message.substring(0, 2000),
          mood: currentMood
        });
        window.SheetsSync.sync('Chat', {
          role: 'assistant', 
          content: data.reply.substring(0, 2000),
          mood: currentMood
        });
      }
    } else if (data.error) {
      appendMessage("assistant", "Error: " + data.error);
    }
  } catch (err) {
    hideTypingIndicator();
    appendMessage("assistant", "Connection error. Check the server.");
  }

  sendBtn.disabled = false;
  sendBtn.textContent = "Send";
  chatMessage.focus();
});

chatMessage.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

chatMessage.addEventListener("input", () => {
  chatMessage.style.height = "auto";
  chatMessage.style.height = Math.min(chatMessage.scrollHeight, 150) + "px";
});
