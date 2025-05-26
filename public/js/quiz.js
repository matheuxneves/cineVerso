let questions = [];
let currentQuestionIndex = 0;
let score = 0;

// Pega os elementos do HTML
const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const nextButton = document.getElementById('next');
const resultEl = document.getElementById('result');
const retryButton = document.getElementById('retry');

// Carrega as perguntas da API
async function loadQuestions() {
  const res = await fetch('http://localhost:3000/api/questions');
  const data = await res.json();
  // Embaralha e pega as 5 primeiras perguntas
  questions = data.results.sort(() => Math.random() - 0.5).slice(0, 5);
  showQuestion();
}


// Mostra a pergunta atual
function showQuestion() {
  resetState();

  const q = questions[currentQuestionIndex];
  questionEl.innerHTML = decodeHtml(q.question);

  const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
  answers.forEach(answer => {
    const btn = document.createElement('button');
    btn.innerHTML = decodeHtml(answer);
    btn.classList.add('answer-btn');
    btn.addEventListener('click', () => selectAnswer(btn, decodeHtml(q.correct_answer)));
    answersEl.appendChild(btn);
  });
}

function resetState() {
  nextButton.disabled = true;
  answersEl.innerHTML = '';
}

// Verifica se a resposta escolhida está certa ou errada
function selectAnswer(selectedBtn, correct) {
  const buttons = answersEl.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.innerHTML === correct) {
      btn.classList.add('correct');
    } else {
      btn.classList.add('wrong');
    }
  });

  if (selectedBtn.innerHTML === correct) {
    score++;
  }
  nextButton.disabled = false;
}

// Passa para a próxima pergunta ou mostra o resultado
nextButton.addEventListener('click', () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
});

// Recarrega as questões 
retryButton.addEventListener('click', () => {
  score = 0;
  currentQuestionIndex = 0;
  resultEl.style.display = 'none';
  document.getElementById('quiz-box').style.display = 'block';
  loadQuestions(); 
});

// Mostra a qunatidade de perguntas que o usuário acertou
function showResult() {
  document.getElementById('quiz-box').style.display = 'none';
  resultEl.style.display = 'block';
  resultEl.querySelector('h2').innerHTML = `Você acertou ${score} de ${questions.length} perguntas!`;
}



function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

loadQuestions();
