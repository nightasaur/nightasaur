const BACKEND_URL = 'http://localhost:3002';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'POPUP_AI_REQUEST') {
    callAI(message.payload)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const allowedOrigins = ["http://localhost:5173", "https://nightasaur.com"];
  if (!allowedOrigins.includes(sender.origin)) return;

  if (message.type === "AI_REQUEST") {
    callAI(message.payload)
      .then(async (aiResponse) => {
        try {
          await fetch(`${BACKEND_URL}/api/spirits/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage: message.payload, aiMessage: aiResponse })
          });
        } catch (dbErr) {
          console.error("記憶寫入失敗:", dbErr);
        }
        sendResponse({ success: true, data: aiResponse });
      })
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function callAI(userText) {
  const res = await fetch(`${BACKEND_URL}/api/ollama`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: userText })
  });

  if (!res.ok) throw new Error('HTTP error: ' + res.status);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'AI 回應失敗');
  return data.response;
}
