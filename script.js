// Helper: return the array of matches regardless of response shape
function getArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.matches)) return data.matches;
    return [];
}

function showMessage(containerId, msg, className) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<p class="${className || 'info'}">${msg}</p>`;
}

// Fetch and render current matches into #crntmatches
async function fetchCurrentMatches() {
    const containerId = 'crntmatches';
    showMessage(containerId, 'Loading current matches…', 'loading');
    try {
        const response = await fetch('https://api.cricapi.com/v1/currentMatches?apikey=26bf2555-42d0-42c7-9bc4-485a3fd68790&offset=0');
        const data = await response.json();
        const matches = getArray(data);
        if (matches.length === 0) return showMessage(containerId, 'No current matches found.', 'empty');
        renderMatches(matches, containerId);
    } catch (error) {
        showMessage(containerId, 'Error fetching current matches', 'error');
        console.error(error);
    }
}

// Fetch and render all matches into #matches
async function fetchMatches() {
    const containerId = 'matches';
    showMessage(containerId, 'Loading matches…', 'loading');
    try {
        const response = await fetch('https://api.cricapi.com/v1/matches?apikey=26bf2555-42d0-42c7-9bc4-485a3fd68790&offset=0');
        const data = await response.json();
        const matches = getArray(data);
        if (matches.length === 0) return showMessage(containerId, 'No matches found.', 'empty');
        renderMatches(matches, containerId);
    } catch (error) {
        showMessage(containerId, 'Error fetching matches', 'error');
        console.error(error);
    }
}

// Render an array of matches to a container
function renderMatches(matches, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    matches.forEach(m => {
        const team1 = m['team-1'] || m.team1 || m.teamA || 'Team 1';
        const team2 = m['team-2'] || m.team2 || m.teamB || 'Team 2';
        const title = m.name || m.title || `${team1} vs ${team2}`;
        const status = m.status || (m.matchStarted ? 'Live' : 'Scheduled') || '';
        const id = m.id || m.unique_id || m.match_id || '';
        const score = (m.score && typeof m.score === 'string') ? m.score : (m.score || '');

        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <h3>${title}</h3>
            <p><strong>${team1}</strong> vs <strong>${team2}</strong></p>
            <p>${status}</p>
            <p>${score}</p>
            <button class="details-btn" data-id="${id}">View details</button>
        `;
        container.appendChild(card);
    });
}

// Fetch and render details for a match id
async function fetchMatchDetails(id) {
    const container = document.getElementById('match-details');
    if (!container) return;
    container.classList.remove('hidden');
    container.innerHTML = '<p>Loading details…</p>';
    try {
        const response = await fetch(`https://api.cricapi.com/v1/match_info?apikey=26bf2555-42d0-42c7-9bc4-485a3fd68790&id=${id}`);
        const data = await response.json();
        renderMatchDetails(data, container);
    } catch (error) {
        container.innerHTML = '<p class="error">Error loading details</p>';
        console.error(error);
    }
}

function renderMatchDetails(data, container) {
    const match = data.match || data.data || data;
    const title = match.name || match.title || `${match['team-1']} vs ${match['team-2']}` || 'Match details';
    const status = match.status || (match.matchStarted ? 'Live' : 'Scheduled') || '';
    const toss = match.toss || match.toss_winner || '';
    const scores = match.score || match.scores || match.innings || [];

    let scoresHtml = '';
    if (Array.isArray(scores)) {
        scoresHtml = scores.map(s => {
            const t = s.title || s.inning || '';
            const sc = s.score || s.runs || JSON.stringify(s);
            return `<div class="innings"><h4>${t}</h4><p>${sc}</p></div>`;
        }).join('');
    } else if (typeof scores === 'object') {
        scoresHtml = `<pre>${JSON.stringify(scores, null, 2)}</pre>`;
    } else {
        scoresHtml = `<p>${scores}</p>`;
    }

    container.innerHTML = `
        <button id="close-details">Close</button>
        <h2>${title}</h2>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Toss:</strong> ${toss}</p>
        <div class="scores">${scoresHtml}</div>
        <details>
            <summary>Raw response</summary>
            <pre>${JSON.stringify(match, null, 2)}</pre>
        </details>
    `;
}

// Delegated click handlers for details and close
document.addEventListener('click', (e) => {
    if (e.target.matches('.details-btn')) {
        const id = e.target.dataset.id;
        if (!id) return alert('No ID available for this match.');
        fetchMatchDetails(id);
    }
    if (e.target && e.target.id === 'close-details') {
        const c = document.getElementById('match-details');
        c.classList.add('hidden');
    }
});

// Wire buttons after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const btnCurrent = document.getElementById('btn-current');
    const btnAll = document.getElementById('btn-all');
    if (btnCurrent) btnCurrent.addEventListener('click', fetchCurrentMatches);
    if (btnAll) btnAll.addEventListener('click', fetchMatches);

    // Optionally load current matches automatically on page load
    fetchCurrentMatches();
});
