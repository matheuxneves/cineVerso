// Função para mostrar a seção correta com base no menu
function showSection(id) {
  const sections = document.querySelectorAll("section"); // Seleciona TODAS as sections, mesmo fora do <main>
  sections.forEach(section => section.classList.remove("active"));

  const selected = document.getElementById(id);
  if (selected) {
    selected.classList.add("active");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const apiKey = '41b60bb6b2c8e16b78683498a80e20ea';
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-BR&page=1`;

  try {
    const resposta = await fetch(url);
    const dados = await resposta.json();
    const filmes = dados.results.filter(f => f.backdrop_path);

    // Pega até 10 filmes aleatórios com imagem
    const selecionados = filmes.sort(() => 0.5 - Math.random()).slice(0, 10);

    const slidesContainer = document.getElementById("carrossel-slides");
    slidesContainer.style.width = `${selecionados.length * 100}%`; // Largura dinâmica

    selecionados.forEach(filme => {
      const slide = document.createElement("div");
      slide.className = "slide";
      slide.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w1280${filme.backdrop_path}" alt="${filme.title}">
      `;
      slidesContainer.appendChild(slide);
    });

    // Deslocamento automático do carrossel
    let index = 0;
    setInterval(() => {
      index = (index + 1) % selecionados.length;
      slidesContainer.style.transform = `translateX(-${index * (100 / selecionados.length)}%)`;
    }, 3000);
  } catch (erro) {
    console.error("Erro ao carregar imagens:", erro);
  }
});