# Importações das bibliotecas necessárias:
# - Flask: framework para criação da API web.
# - request, jsonify: para lidar com requisições e respostas em JSON.
# - send_from_directory: não utilizado diretamente aqui, mas serve para servir arquivos estáticos.
# - CORS: para permitir requisições de outros domínios (ex: frontend separado).
# - requests: para realizar chamadas HTTP à API externa (TMDb).
# - random: para sortear filmes aleatórios.
# - sentence_transformers: para interpretar o gênero desejado pelo usuário com NLP.
# Para instalar dotenv no PC da faculdade: pip3 install python-dotenv


from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import random
from sentence_transformers import SentenceTransformer, util
import os
from dotenv import load_dotenv
load_dotenv()

# Criação da aplicação Flask e ativação do CORS.
app = Flask(__name__)
CORS(app)

# Chave de API para acessar o The Movie Database (TMDb).
API_KEY = os.getenv('API_KEY')

# Carregamento do modelo pré-treinado usado para comparar semântica entre textos.
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

# Dicionário com os gêneros e suas descrições, que servem de base para identificar o gênero com base na mensagem do usuário.
GENRES_DESCRIPTION = {
    "ação": "ação, aventura, adrenalina, luta, perseguição, explosões",
    "aventura": "aventura, jornada, exploração, viagem épica, mundo novo",
    "animação": "animação, desenho animado, infantil, cartoon, animado",
    "comédia": "comédia, engraçado, humor, rir, divertido",
    "crime": "crime, investigação, policial, criminoso, detetive, máfia",
    "documentário": "documentário, realidade, fatos reais, educativo, informativo",
    "drama": "drama, emoção, sentimentos, vida real, intenso, tocante",
    "família": "família, infantil, crianças, todos os públicos, leve",
    "fantasia": "fantasia, mágico, mundos imaginários, fadas, magos, dragões",
    "história": "história, eventos reais, passado, biografia, antigo",
    "terror": "terror, horror, assustador, medo, susto, sobrenatural",
    "musical": "musical, música, dança, cantando, espetáculo",
    "mistério": "mistério, enigma, investigação, segredo, suspense leve",
    "romance": "romance, amor, apaixonado, casal, relacionamento",
    "ficção científica": "ficção científica, sci-fi, tecnologia, espaço, futuro, alienígenas",
    "cinema tv": "televisão, tv, série especial, filme de tv",
    "thriller": "thriller, suspense, tensão, conspiração, psicológico, reviravolta",
    "guerra": "guerra, batalha, soldados, militar, exército, combate",
    "faroeste": "faroeste, velho oeste, cowboys, pistoleiros, bang bang"
}

# Armazena o estado da conversa por usuário, permitindo conversas simultâneas com memória temporária.
user_sessions = {}

# Rota principal da API, que recebe mensagens via POST e responde com base no estado atual da conversa.
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user = data.get("user", "default")
    msg = data.get("message", "").strip().lower()
    session = user_sessions.get(user, {"step": "greet"})

    # Etapa inicial: saúda o usuário e pergunta qual tipo de filme ele quer ver.
    if session["step"] == "greet":
        session["step"] = "ask_genre"
        user_sessions[user] = session
        return jsonify({"reply": "Oi! Qual tipo de filme você está procurando?"})

    # Etapa em que o usuário informa o gênero e o sistema tenta identificá-lo semanticamente.
    elif session["step"] == "ask_genre":
        genre = detectar_genero(msg)
        if not genre:
            return jsonify({"reply": "Hmm... não entendi o gênero. Pode tentar com outras palavras?"})

        session["genre"] = genre
        session["step"] = "recommend"
        user_sessions[user] = session

        genres_map = get_genre_map()
        genre_id = genres_map.get(genre)
        if not genre_id:
            return jsonify({"reply": f"Gênero '{genre}' não encontrado na base de dados."})

        movies = get_movies_by_genre(genre_id)
        session["last_recommendations"] = movies
        user_sessions[user] = session

        texto = format_movies(movies)
        return jsonify({"reply": f"Beleza! Encontrei alguns filmes de *{genre}*:<br><br>{texto}<br><br>Quer mais sugestões? (sim/não)"})

    # Etapa de recomendação: se o usuário quiser mais sugestões, retorna novos filmes; senão, finaliza.
    elif session["step"] == "recommend":
        if "sim" in msg:
            genre = session["genre"]
            genres_map = get_genre_map()
            genre_id = genres_map.get(genre)
            movies = get_movies_by_genre(genre_id)
            session["last_recommendations"] = movies
            user_sessions[user] = session
            texto = format_movies(movies)
            return jsonify({"reply": f"Aqui vão mais filmes de *{genre}*:<br><br>{texto}<br><br>Quer mais sugestões?"})
        else:
            session["step"] = "done"
            user_sessions[user] = session
            return jsonify({"reply": "Ok! Espero que goste dos filmes :)"})
        

    # Etapa finalizada: reinicia a conversa do zero caso o usuário envie outra mensagem depois.
    elif session["step"] == "done":
        session = {"step": "ask_genre"}
        user_sessions[user] = session
        return jsonify({"reply": "Oi de novo! Qual tipo de filme você quer agora?"})
        


    return jsonify({"reply": "Desculpe, não entendi. Pode repetir?"})

# Função que identifica o gênero mais provável com base no texto do usuário, usando embeddings e similaridade de cosseno.
def detectar_genero(texto):
    entrada = model.encode(texto, convert_to_tensor=True)
    melhor_score = -1
    melhor_genero = None
    for genero, descricao in GENRES_DESCRIPTION.items():
        desc_emb = model.encode(descricao, convert_to_tensor=True)
        score = util.cos_sim(entrada, desc_emb).item()
        if score > melhor_score:
            melhor_score = score
            melhor_genero = genero
    return melhor_genero

# Função que busca o mapeamento de gêneros e seus respectivos IDs na API da TMDb.
def get_genre_map():
    url = f"https://api.themoviedb.org/3/genre/movie/list?api_key={API_KEY}&language=pt-BR"
    response = requests.get(url).json()
    return {g['name'].lower(): g['id'] for g in response['genres']}

# Função que busca filmes aleatórios de um dado gênero utilizando o ID do gênero.
def get_movies_by_genre(genre_id):
    url = f"https://api.themoviedb.org/3/discover/movie?api_key={API_KEY}&language=pt-BR&with_genres={genre_id}"
    response = requests.get(url).json()
    movies = response.get("results", [])
    return random.sample(movies, min(3, len(movies)))

# Função que formata a lista de filmes para apresentação em HTML com título, pôster, sinopse e link de onde assistir.
def format_movies(movies):
    output = []
    for m in movies:
        titulo = f" {m['title']}"
        sinopse = m.get('overview', 'Sem descrição.')
        poster_path = m.get('poster_path')
        poster_url = f"https://image.tmdb.org/t/p/w200{poster_path}" if poster_path else None
        watch_url = f"https://www.themoviedb.org/movie/{m['id']}/watch?locale=BR"

        bloco = f"<strong>{titulo}</strong><br>"
        if poster_url:
            bloco += f"<img src='{poster_url}' style='width:100px'><br>"
        bloco += f"{sinopse}<br>"
        bloco += f" <a href='{watch_url}' target='_blank'>Onde assistir</a><br>"
        output.append(bloco)
    return "<br><br>".join(output)

# Inicialização da aplicação Flask, rodando em todas as interfaces, na porta 5000 e em modo debug.
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)