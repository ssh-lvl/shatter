const leaderboardsData = {
    tetris: [
      
    ],
    subway: [
      
    ],
    tanuki: [
      
    ],
    slope: [
      { name: 'ssh-lvl', score: 78 }
    ],
    kitchengun: [
      
    ],
    galaga: [
      
    ],
    dragonvsbricks: [
      
    ],
    connect3: [
      { name: 'ssh-lvl', score: 193600 }
    ]

};

function renderLeaderboard(game) {
  const leaderboardContainer = document.getElementById(`${game}-scores`);
  leaderboardContainer.innerHTML = '';
  
  const players = leaderboardsData[game];
  
  if (players.length === 0) {
    leaderboardContainer.innerHTML += '<p class="no-scores">No scores recorded. You could be the first!</p>';
    return;
  }

  players.sort((a, b) => b.score - a.score);

  players.forEach((player, index) => {
    if (player.score !== 0) {
      const leaderboardItem = document.createElement('div');
      leaderboardItem.classList.add('leaderboard-item');

      if (index === 0) {
        leaderboardItem.classList.add('leaderboard-item-first');
      } else if (index === 1) {
        leaderboardItem.classList.add('leaderboard-item-second');
      } else if (index === 2) {
        leaderboardItem.classList.add('leaderboard-item-third');
      }

      const formattedScore = player.score.toLocaleString();

      leaderboardItem.innerHTML = `<span>${index + 1}. ${player.name}</span><span>${formattedScore}</span>`;
      leaderboardContainer.appendChild(leaderboardItem);
    }
  });
}

// Initialize leaderboards
document.addEventListener('DOMContentLoaded', () => {
  const loggedInUser = localStorage.getItem('loggedInUser');
  if (!loggedInUser) {
    window.location.href = 'index.html';
  }

    renderLeaderboard(game);
});
