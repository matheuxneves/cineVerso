// Função assíncrona "carregarTabela" que recebe um gênero de filme e o ID de uma tabela HTML. Ela busca os filmes do gênero na API e preenche a tabela com os dados recebidos.
async function carregarTabela(genero, tabelaId) {
  try {
    // Faz uma requisição para o endpoint da API com o gênero especificado.
    const resposta = await fetch(`/api/filmes?genero=${genero}`);
    const filmes = await resposta.json();

    // Seleciona o corpo da tabela pelo ID fornecido e limpa qualquer conteúdo anterior.
    const corpoTabela = document.getElementById(tabelaId);
    corpoTabela.innerHTML = '';

    // Para cada filme recebido, cria uma nova linha na tabela com as informações do filme.
    filmes.forEach(filme => {
      const linha = document.createElement('tr');
      linha.innerHTML = `
        <td><img src="${filme.poster}" alt="Pôster de ${filme.titulo}" style="width: 80px; border-radius: 6px;"></td>
        <td><a href="${filme.linkAssistir}" target="_blank">${filme.titulo}</a></td>
        <td>${filme.duracao} min</td>
        <td>${filme.dataLancamento}</td>
        <td>${filme.sinopse}</td>
        <td>${filme.avaliacao}</td>
      `;
      corpoTabela.appendChild(linha);
    });
  } catch (erro) {
    // Em caso de erro na requisição ou no processamento, exibe uma mensagem no console.
    console.error('Erro ao carregar tabela:', erro);
  }
}

// Aguarda o carregamento completo da página (DOM pronto) para executar o carregamento das tabelas. Carrega uma tabela diferente para cada gênero de filme, chamando "carregarTabela" para cada um.
document.addEventListener('DOMContentLoaded', () => {
  carregarTabela('acao', 'tabela-acao');
  carregarTabela('comedia', 'tabela-comedia');
  carregarTabela('ficcao', 'tabela-ficcao');
  carregarTabela('drama', 'tabela-drama');
  carregarTabela('terror', 'tabela-terror');
  carregarTabela('romance', 'tabela-romance');
  carregarTabela('documentario', 'tabela-documentario');
});

