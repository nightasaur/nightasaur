document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const input = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');

  chatBox.innerText = 'Nightasaur AI 已就緒，請輸入訊息。\n';

  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    chatBox.innerText += `\n你: ${text}`;
    input.value = '';

    chrome.runtime.sendMessage(
      { type: 'POPUP_AI_REQUEST', payload: text },
      (response) => {
        if (chrome.runtime.lastError) {
          chatBox.innerText += `\n[錯誤]: ${chrome.runtime.lastError.message}`;
          return;
        }
        if (response && response.success) {
          chatBox.innerText += `\n靈靈: ${response.data}`;
        } else {
          chatBox.innerText += `\n[錯誤]: ${response ? response.error : '無回應'}`;
        }
      }
    );
  });
});
