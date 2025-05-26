// Gera um ID único para a sessão do usuário ao carregar a página
const userId = `usuario-${Date.now()}`;

async function sendMsg() {
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");
  const message = input.value;
  if (!message) return;

  chat.innerHTML += `<div class="msg user">Você: ${message}</div>`;
  input.value = "";

  try {
    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: userId, message })
    });

    const data = await res.json();
    chat.innerHTML += `<div class="msg bot">${data.reply}</div>`;
    chat.scrollTop = chat.scrollHeight;
  } catch (err) {
    chat.innerHTML += `<div class="msg bot">❌ Erro: não foi possível conectar ao servidor.</div>`;
  }
}

document.getElementById("input").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault(); 
    sendMsg();
  }
});
