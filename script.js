async function fetchPlayerData() {
    const rawInput = document.getElementById('battleTagInput').value.trim();
    const statusMsg = document.getElementById('statusMessage');
    const searchBtn = document.getElementById('searchBtn');

    if (!rawInput) {
        statusMsg.innerText = '⚠️ 請輸入正確的 BattleTag (例如: Player#1234)';
        statusMsg.style.color = '#ff4d4d';
        return;
    }

    // 將 BattleTag 中的 '#' 替換為 '-' 以符合 API 格式
    const formattedTag = rawInput.replace('#', '-');
    
    statusMsg.innerText = '⏳ 正在查詢英雄與生涯數據中...';
    statusMsg.style.color = '#ff9000';
    searchBtn.disabled = true;

    try {
        // 1. 抓取基本資料 (Summary)
        const summaryRes = await fetch(`https://overfast-api.tekrop.fr/players/${formattedTag}/summary`);
        if (!summaryRes.ok) {
            if (summaryRes.status === 404) {
                throw new Error('找不到該玩家，請確認 ID 是否正確或遊戲內檔案是否設為公開。');
            } else {
                throw new Error('伺服器連線失敗，請稍後再試。');
            }
        }
        const summaryData = await summaryRes.json();

        // 2. 抓取詳細英雄與生涯數據 (Stats Summary)
        const statsRes = await fetch(`https://overfast-api.tekrop.fr/players/${formattedTag}/stats/summary`);
        const statsData = statsRes.ok ? await statsRes.json() : null;

        // --- 更新玩家基本資訊 ---
        document.getElementById('cardPlayerName').innerText = summaryData.username || rawInput;
        document.getElementById('cardTitle').innerText = summaryData.title ? `稱號: ${summaryData.title}` : '公開個人檔案玩家';

        // --- 更新核心數據 (KDA / 勝率 / 勝場) ---
        if (statsData && statsData.general) {
            const gen = statsData.general;
            document.getElementById('cardWinRate').innerText = `${gen.winrate || 0}%`;
            document.getElementById('cardKDA').innerText = gen.kda ? gen.kda.toFixed(1) : '0.0';
            document.getElementById('cardTotalWins').innerText = gen.games_won || 0;
        } else if (summaryData.endorsement) {
            document.getElementById('cardKDA').innerText = `Lv. ${summaryData.endorsement.level}`;
            document.getElementById('cardWinRate').innerText = '公開';
            document.getElementById('cardTotalWins').innerText = '-';
        }

        // --- 更新常用前兩名英雄數據 ---
        if (statsData && statsData.heroes) {
            // 將英雄物件轉為陣列並按使用時間排序
            const heroesArray = Object.entries(statsData.heroes).map(([key, value]) => ({
                key: key,
                name: value.name || key,
                timePlayed: value.time_played || 0,
                winrate: value.winrate || 0
            })).sort((a, b) => b.timePlayed - a.timePlayed);

            // 更新第一常用英雄
            if (heroesArray.length > 0) {
                const h1 = heroesArray[0];
                document.getElementById('hero1Tag').innerText = h1.name.substring(0, 2).toUpperCase();
                document.getElementById('hero1Name').innerText = h1.name;
                document.getElementById('hero1Time').innerText = `使用時間: ${formatTime(h1.timePlayed)}`;
                document.getElementById('hero1WR').innerText = `${h1.winrate}%`;
            }

            // 更新第二常用英雄
            if (heroesArray.length > 1) {
                const h2 = heroesArray[1];
                document.getElementById('hero2Tag').innerText = h2.name.substring(0, 2).toUpperCase();
                document.getElementById('hero2Name').innerText = h2.name;
                document.getElementById('hero2Time').innerText = `使用時間: ${formatTime(h2.timePlayed)}`;
                document.getElementById('hero2WR').innerText = `${h2.winrate}%`;
            }
        }

        statusMsg.innerText = '✅ 英雄與生涯數據載入成功！';
        statusMsg.style.color = '#84c000';

    } catch (error) {
        statusMsg.innerText = `❌ ${error.message}`;
        statusMsg.style.color = '#ff4d4d';
    } finally {
        searchBtn.disabled = false;
    }
}

// 輔助函式：將秒數格式化為小時或分鐘
function formatTime(seconds) {
    if (!seconds) return '0分鐘';
    const hours = Math.floor(seconds / 3600);
    if (hours > 0) {
        return `${hours} 小時`;
    }
    const minutes = Math.floor(seconds / 60);
    return `${minutes} 分鐘`;
}

// 下載卡片功能
function downloadCard() {
    const cardElement = document.getElementById('myCard');
    
    html2canvas(cardElement, {
        backgroundColor: '#0f1015',
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Overwatch2_Stats_Card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}
