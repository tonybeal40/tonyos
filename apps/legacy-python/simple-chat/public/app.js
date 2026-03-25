const msg = document.getElementById("msg");
const out = document.getElementById("out");
const send = document.getElementById("send");

send.addEventListener("click", async () => {
  const message = msg.value.trim();
  if (!message) {
    out.textContent = "Please enter a message.";
    return;
  }

  out.textContent = "Thinking...";
  send.disabled = true;

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await r.json();
    
    if (!r.ok) {
      out.textContent = "Error: " + JSON.stringify(data, null, 2);
      return;
    }

    out.textContent = data.text;
  } catch (e) {
    out.textContent = "Error: " + e.message;
  } finally {
    send.disabled = false;
  }
});

msg.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    send.click();
  }
});
