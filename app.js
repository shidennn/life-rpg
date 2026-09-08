const defaultState = {
  name: 'Maya', xp: 0, level: 1, streak: 0,
  stats: { strength: 2, intelligence: 3, creativity: 2, vitality: 2 },
  quests: [
    { id: 1, title: 'Move your body for 20 minutes', category: 'daily', xp: 20, stats: ['strength', 'vitality'], completed: false },
    { id: 2, title: 'Read or learn something new', category: 'daily', xp: 15, stats: ['intelligence'], completed: false },
    { id: 3, title: 'Practise your instrument', category: 'short', xp: 30, stats: ['creativity'], completed: false },
    { id: 4, title: 'Plan a weekend adventure', category: 'short', xp: 25, stats: ['creativity', 'vitality'], completed: false },
    { id: 5, title: 'Finish a personal project', category: 'long', xp: 100, stats: ['intelligence', 'creativity'], completed: false }
  ]
};

const statInfo = {
  strength: { label: 'Strength', symbol: '↗' }, intelligence: { label: 'Intelligence', symbol: '⌁' },
  creativity: { label: 'Creativity', symbol: '✦' }, vitality: { label: 'Vitality', symbol: '◒' }
};
const categoryLabels = { daily: 'Daily quest', short: 'Short term quest', long: 'Long term quest' };
let state = loadState();
let activeFilter = 'all';

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));

function loadState() {
  try { return JSON.parse(localStorage.getItem('life-rpg-state')) || structuredClone(defaultState); }
  catch { return structuredClone(defaultState); }
}
function saveState() {
  localStorage.setItem('life-rpg-state', JSON.stringify(state));
  $('#saveStatus').textContent = 'Saved just now';
  setTimeout(() => { $('#saveStatus').textContent = 'Saved locally'; }, 1600);
}
function xpGoal() { return state.level * 100; }
function render() {
  $('#characterName').textContent = state.name;
  $('#topbarName').textContent = state.name;
  $('#heroName').textContent = state.name;
  $('#levelLabel').textContent = state.level;
  $('#topbarLevel').textContent = state.level;
  $('#overviewLevel').textContent = state.level;
  $('#xpLabel').textContent = state.xp;
  $('#xpGoal').textContent = xpGoal();
  $('#overviewXp').textContent = state.xp;
  $('#overviewXpGoal').textContent = xpGoal();
  $('#xpFill').style.width = `${Math.min((state.xp / xpGoal()) * 100, 100)}%`;
  $('#overviewXpFill').style.width = `${Math.min((state.xp / xpGoal()) * 100, 100)}%`;
  $('#nextLevelText').textContent = `${Math.max(xpGoal() - state.xp, 0)} XP until level ${state.level + 1}`;
  $('#overviewNext').textContent = `${Math.max(xpGoal() - state.xp, 0)} XP until level ${state.level + 1}`;
  $('#streakLabel').textContent = state.streak;
  $('#overviewStreak').textContent = state.streak;
  renderStats(); renderQuests(); renderCounts();
}
function renderStats() {
  $('#statsList').innerHTML = Object.entries(state.stats).map(([key, value]) => `<div class="stat-row"><span class="stat-symbol ${key}">${statInfo[key].symbol}</span><div><div class="stat-name">${statInfo[key].label}</div><div class="stat-bar"><span style="width:${Math.min(value * 10, 100)}%"></span></div></div><span class="stat-value">${String(value).padStart(2, '0')}</span></div>`).join('');
}
function renderQuests() {
  const quests = state.quests.filter((quest) => activeFilter === 'all' || quest.category === activeFilter);
  $('#questList').innerHTML = quests.map((quest) => `<article class="quest-card ${quest.completed ? 'completed' : ''}"><button class="quest-check" data-complete="${quest.id}" aria-label="${quest.completed ? 'Mark incomplete' : 'Complete'} quest">✓</button><div><div class="quest-category">${categoryLabels[quest.category]}</div><h3 class="quest-title">${escapeHtml(quest.title)}</h3><div class="quest-rewards"><span class="reward-tag xp">+${quest.xp} XP</span>${quest.stats.map((stat) => `<span class="reward-tag">+1 ${statInfo[stat].label}</span>`).join('')}</div></div><div class="quest-actions"><button class="delete-quest" data-delete="${quest.id}" aria-label="Delete quest">×</button></div></article>`).join('');
  $('#emptyState').hidden = quests.length > 0;
}
function renderCounts() {
  $('#allCount').textContent = state.quests.length;
  ['daily', 'short', 'long'].forEach((category) => { $(`#${category}Count`).textContent = state.quests.filter((quest) => quest.category === category).length; });
}
function completeQuest(id) {
  const quest = state.quests.find((item) => item.id === id);
  if (!quest) return;
  quest.completed = !quest.completed;
  const amount = quest.completed ? 1 : -1;
  state.xp += amount * quest.xp;
  quest.stats.forEach((stat) => { state.stats[stat] = Math.max(1, state.stats[stat] + amount); });
  if (quest.completed) state.streak += 1; else state.streak = Math.max(0, state.streak - 1);
  while (state.xp >= xpGoal()) { state.xp -= xpGoal(); state.level += 1; }
  while (state.level > 1 && state.xp < 0) { state.level -= 1; state.xp += xpGoal(); }
  saveState(); render();
  $('#insightText').textContent = quest.completed ? 'Nice. One deliberate action added to your character sheet.' : 'Quest reopened. Your next small action is still waiting.';
}
function openQuestDialog() {
  const dialog = $('#questDialog');
  $('#statCheckboxes').innerHTML = Object.entries(statInfo).map(([key, info]) => `<label class="stat-checkbox"><input type="checkbox" name="stat" value="${key}" /><span>${info.label}</span></label>`).join('');
  dialog.showModal();
}
$('#questList').addEventListener('click', (event) => { const complete = event.target.closest('[data-complete]'); const remove = event.target.closest('[data-delete]'); if (complete) completeQuest(Number(complete.dataset.complete)); if (remove) { state.quests = state.quests.filter((quest) => quest.id !== Number(remove.dataset.delete)); saveState(); render(); } });
$('.quest-tabs').addEventListener('click', (event) => { const tab = event.target.closest('.quest-tab'); if (!tab) return; activeFilter = tab.dataset.filter; document.querySelectorAll('.quest-tab').forEach((item) => item.classList.toggle('active', item === tab)); renderQuests(); });
$('#addQuestButton').addEventListener('click', openQuestDialog);
$('#questForm').addEventListener('submit', (event) => { event.preventDefault(); const stats = [...document.querySelectorAll('input[name="stat"]:checked')].map((input) => input.value); state.quests.unshift({ id: Date.now(), title: $('#questNameInput').value.trim(), category: $('#questCategoryInput').value, xp: Number($('#questXpInput').value), stats: stats.length ? stats : ['vitality'], completed: false }); saveState(); render(); $('#questDialog').close(); event.target.reset(); });
$('#nameButton').addEventListener('click', () => { const name = prompt('What should your character be called?', state.name); if (name && name.trim()) { state.name = name.trim().slice(0, 20); saveState(); render(); } });
$('#topbarCharacter').addEventListener('click', () => $('#nameButton').click());
$('#resetButton').addEventListener('click', () => { if (confirm('Reset your character and quest progress?')) { state = structuredClone(defaultState); saveState(); render(); } });
render();
