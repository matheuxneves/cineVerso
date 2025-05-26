require('dotenv').config();

// Importa o framework Express para criar o servidor web e o módulo `path` para lidar com caminhos de arquivos.
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');


// Inicializa a aplicação Express e define a porta onde o servidor irá rodar. Se existir uma variável de ambiente PORT (como em servidores na nuvem), usa ela; caso contrário, usa a porta 3000.
const app = express();
const PORT = process.env.PORT || 3000;

// Define a chave da API e a URL base da API do The Movie Database (TMDB), que serão usadas para fazer requisições de filmes.
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Mapeia alguns gêneros de filmes para seus respectivos IDs usados na API do TMDB.
const generos = {
  acao: 28,
  comedia: 35,
  ficcao: 878,
  drama: 18,
  terror: 27,
  romance: 10749,
  documentario: 99
};

// Configura o Express para servir arquivos estáticos (HTML, CSS, JS, imagens) da pasta "public". Isso permite que o navegador acesse diretamente esses arquivos.
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  '/chat',
  createProxyMiddleware({
    target: 'http://127.0.0.1:5000', 
    changeOrigin: true,
  })
);


// Função auxiliar `buscarDetalhesFilme` que, dado o ID de um filme, faz uma requisição para pegar detalhes extras como a duração ("runtime").
async function buscarDetalhesFilme(id) {
  const url = `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=pt-BR`;
  const resposta = await fetch(url);
  return await resposta.json();
}

// Cria o endpoint "/api/filmes", que recebe um parâmetro de gênero pela URL (query string). Ele busca os filmes mais populares do gênero informado, seleciona os 10 melhores, garante que os filmes tenham informações completas e responde com um JSON.
app.get('/api/filmes', async (req, res) => {
  const generoNome = req.query.genero;

  // Verifica se o gênero fornecido é válido.
  if (!generos[generoNome]) {
    return res.status(400).json({ erro: 'Gênero inválido.' });
  }

  // Constrói a URL para buscar filmes do gênero na API do TMDB.
  const generoId = generos[generoNome];
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${generoId}&language=pt-BR&sort_by=popularity.desc&page=1`;
  const resposta = await fetch(url);
  const dados = await resposta.json();
  const filmes = dados.results;

  let resultados = [];
  let filmesValidos = 0;
  let index = 0;

  // Itera sobre os filmes até encontrar 10 que tenham todas as informações necessárias.
  while (filmesValidos < 10 && index < filmes.length) {
    const filme = filmes[index];
    const detalhes = await buscarDetalhesFilme(filme.id);

    if (
      filme.title &&
      filme.release_date &&
      filme.overview &&
      typeof filme.vote_average === 'number' &&
      detalhes.runtime
    ) {
      resultados.push({
        titulo: filme.title,
        duracao: detalhes.runtime,
        dataLancamento: filme.release_date,
        sinopse: filme.overview,
        avaliacao: filme.vote_average.toFixed(1),
        poster: `https://image.tmdb.org/t/p/w200${filme.poster_path}`,
        linkAssistir: `https://www.google.com/search?q=onde+assistir+${encodeURIComponent(filme.title)}`
      });
      filmesValidos++;
    }

    index++;
  }

  // Envia o array de filmes válidos como resposta da API em formato JSON.
  res.json(resultados);
});

app.get('/api/questions', (req, res) => {
  const questions = require('./public/data/perguntas.json');
  res.json(questions);
});

// Inicializa o servidor, que começa a escutar na porta definida. Quando o servidor estiver rodando, exibe uma mensagem no console.

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});