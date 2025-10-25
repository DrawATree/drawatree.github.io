document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const QUESTIONS_URL = '/questions.json';
    const STORAGE_KEY = 'gf_answers';
    const INDEX_KEY = 'gf_q_index';

    let questions = [];
    let currentIndex = parseInt(localStorage.getItem(INDEX_KEY), 10);
    if (Number.isNaN(currentIndex)) currentIndex = 0;

    function getStoredAnswers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveAnswer(questionId, choiceId) {
        const answers = getStoredAnswers();
        answers[questionId] = choiceId;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    }

    function saveIndex(idx) {
        currentIndex = idx;
        localStorage.setItem(INDEX_KEY, String(idx));
    }

    function renderQuestion(q, idx) {
        const answers = getStoredAnswers();
        const selected = answers[q.id] || null;

        const choicesHtml = q.choices
            .map(c => {
                const active = selected === c.id ? 'btn-primary text-white' : 'btn-ghost';
                return `
					<button data-choice="${c.id}" class="choice btn ${active} w-full text-left normal-case">
						${escapeHtml(c.text)}
					</button>
				`;
            })
            .join('');

        const progress = `${idx + 1} / ${questions.length}`;

        app.innerHTML = `
			<div class="max-w-2xl w-full">
				<div class="card bg-base-100 shadow-md p-6">
					<div class="mb-4 flex justify-between items-start">
						<h2 class="text-xl font-semibold">Question ${idx + 1}</h2>
						<div class="text-sm text-muted">${escapeHtml(progress)}</div>
					</div>
					<div class="mb-6">
						<div class="text-lg mb-3">${escapeHtml(q.question)}</div>
						<div class="grid gap-2">${choicesHtml}</div>
					</div>
					<div class="flex justify-between mt-6">
                        <button id="resetBtn" class="btn btn-outline">Recommencer</button>
                        <button id="nextBtn" class="btn btn-primary">${idx === questions.length - 1 ? 'Terminer' : 'Prochain'}</button>
					</div>
				</div>
			</div>
		`;

        // Attach handlers
        app.querySelectorAll('.choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceId = e.currentTarget.getAttribute('data-choice');
                saveAnswer(q.id, choiceId);
                // re-render to update active state
                renderQuestion(q, idx);
            });
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            if (idx === questions.length - 1) {
                renderSummary();
            } else {
                gotoQuestion(idx + 1);
            }
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEY);
            gotoQuestion(0);
        });
    }

    function gotoQuestion(idx) {
        if (idx < 0) idx = 0;
        if (idx >= questions.length) idx = questions.length - 1;
        saveIndex(idx);
        renderQuestion(questions[idx], idx);
    }

    function renderSummary() {
        const answers = getStoredAnswers();

        const letterCounts = {};
        Object.values(answers).forEach(choiceId => {
            if (!choiceId || choiceId === '-') return;

            const letter = String(choiceId).slice(-1);

            if (!/^[a-d]$/.test(letter)) return;
            letterCounts[letter] = (letterCounts[letter] || 0) + 1;
        });
        const mostSelectedLetter = Object.keys(letterCounts).length === 0
            ? "N'êtes-vous pas supposé répondre aux questions..?"
            : Object.entries(letterCounts).reduce((best, cur) => cur[1] > best[1] ? cur : best)[0].toUpperCase();

        app.innerHTML = `
            <div class="max-w-2xl w-full">
                <div class="card bg-base-100 shadow-md p-6">
                    <h2 class="text-xl font-semibold mb-4">Résultat</h2>
                    <div class="space-y-2">Vous correspondez majoritairement au profil <b>${mostSelectedLetter}</b></div>
                    <div class="mt-6 flex justify-end">
                            <button id="clearBtn" class="btn btn-primary">Recommencer</button>
                    </div>
                </div>
            </div>
		`;

        document.getElementById('clearBtn').addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEY);
            gotoQuestion(0);
        });
    }

    function escapeHtml(str) {
        if (typeof str !== 'string') return '' + str;
        return str.replace(/[&<>"']/g, function (m) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" })[m];
        });
    }

    function init() {
        fetch(QUESTIONS_URL)
            .then(r => {
                if (!r.ok) throw new Error('Failed to load questions.json');
                return r.json();
            })
            .then(data => {
                questions = data;
                if (!Array.isArray(questions) || questions.length === 0) {
                    app.innerHTML = '<div class="text-center">No questions available.</div>';
                    return;
                }
                if (currentIndex < 0 || currentIndex >= questions.length) currentIndex = 0;
                renderQuestion(questions[currentIndex], currentIndex);
            })
            .catch(err => {
                app.innerHTML = `<div class="text-red-600">Error loading questions: ${escapeHtml(err.message)}</div>`;
                console.error(err);
            });
    }

    init();
});

let a;