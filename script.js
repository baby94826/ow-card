// 《鬥陣特攻 2》台灣官方繁體中文字典
const heroTranslations = {
    "dva": "D.Va", "doomfist": "毀滅拳王", "junker-queen": "垃圾鎮女王", "mauga": "莫加",
    "orisa": "歐瑞莎", "ramattra": "拉瑪塔", "reinhardt": "萊因哈特", "roadhog": "攔路豬",
    "sigma": "席格馬", "winston": "溫斯頓", "wrecking-ball": "火爆鋼球", "zarya": "札莉雅", "hazard": "災害",
    "ashe": "艾西", "bastion": "壁壘機兵", "cassidy": "卡西迪", "echo": "迴音",
    "genji": "源氏", "hanzo": "半藏", "junkrat": "炸彈鼠", "mei": "小美",
    "pharah": "法拉", "reaper": "死神", "sojourn": "索潔恩", "soldier-76": "士兵76",
    "sombra": "駭影", "symmetra": "辛梅塔", "torbjorn": "托比昂", "tracer": "閃光",
    "venture": "無畏", "widowmaker": "奪命女", "ana": "安娜", "baptiste": "巴帝斯特",
    "brigitte": "碧姬", "illari": "伊拉里", "juno": "朱諾", "kiriko": "霧子",
    "lifeweaver": "織命", "lucio": "路西歐", "mercy": "慈悲", "moira": "莫伊拉", "zenyatta": "禪亞塔"
};

// 輔助函式：動態取得英雄頭像 URL
function getHeroAvatarUrl(englishKey) {
    if (!englishKey) return '';
    const rawKey = englishKey.toLowerCase().trim();
    return `https://overfast-api.tekrop.fr/static/heroes/${rawKey}/icon.png`;
}

// 初始化英雄下拉選單
function initHeroDropdown() {
    const heroSelect = document.getElementById('heroSelect');
    if (!heroSelect) return;
    
    heroSelect.innerHTML = '<option value="all">全英雄總計</option>';
    const sortedHeroes = Object.entries(heroTranslations).sort((a, b) => a[1].localeCompare(b[1], 'zh-Hant'));
    
    sortedHeroes.forEach(([key, chineseName]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = chineseName;
        heroSelect.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', initHeroDropdown);

function getHeroChineseName(englishKey) {
    if (!englishKey) return '未知英雄';
    const rawKey = englishKey.toLowerCase().trim();
    if (heroTranslations[rawKey]) return heroTranslations[rawKey];
    const cleanKey = rawKey.replace(/[^a-z0-9]/g, '');
    if (heroTranslations[cleanKey]) return heroTranslations[cleanKey];
    return englishKey;
}

async function fetchPlayerData() {
    const rawInput = document.getElementById('battleTagInput').value.trim();
    const mode = document.getElementById('gamemodeSelect').value;
    const selectedHero = document.getElementById('heroSelect').value;
    const statusMsg = document.getElementById('statusMessage');
    const searchBtn = document.getElementById('searchBtn');

    if (!rawInput) {
        statusMsg.innerText = '⚠️ 請輸入正確的 BattleTag (例如: Player#1234)';
        statusMsg.style.color = '#ff4d4d';
        return;
    }

    const formattedTag = rawInput.replace('#', '-');
    statusMsg.innerText = '⏳ 正在查詢生涯數據（首次查詢可能需 5~10 秒）...';
    statusMsg.style.color = '#ff9000';
    searchBtn.disabled = true;

    try {
        // 1. 查詢玩家摘要
        const summaryRes = await fetch(`https://overfast-api.tekrop.fr/players/${formattedTag}/summary`);
        
        if (!summaryRes.ok) {
            if (summaryRes.status === 404) {
                throw new Error('找不到該玩家！請檢查 BattleTag 大小寫是否完全正確。');
            } else {
                throw new Error(`伺服器回應異常 (HTTP ${summaryRes.status})，請稍後再試。`);
            }
        }
        
        const summaryData = await summaryRes.json();

        // 檢查 API 回傳的隱私權狀態
        if (summaryData.privacy === 'private') {
            throw new Error('API 偵測到你的個人檔案目前仍為「私密」，請確認遊戲內已改為「公開」。');
        }

        document.getElementById('cardPlayerName').innerText = summaryData.username || rawInput;
        document.getElementById('cardTitle').innerText = summaryData.title ? `稱號: ${summaryData.title}` : '公開個人檔案玩家';

        // 2. 嘗試抓取完整數據
        let statsData = null;
        try {
            const statsRes = await fetch(`https://overfast-api.tekrop.fr/players/${formattedTag}/stats/complete`);
            if (statsRes.ok) {
                statsData = await statsRes.json();
            } else {
                console.warn(`/stats/complete 請求失敗 (HTTP ${statsRes.status})，嘗試使用簡易數據`);
            }
        } catch (e) {
            console.warn('完整數據抓取逾時:', e);
        }

        // 3. 若完整數據抓取失敗，嘗試備援 API (/stats/summary)
        if (!statsData) {
            const summaryStatsRes = await fetch(`https://overfast-api.tekrop.fr/players/${formattedTag}/stats/summary`);
            if (summaryStatsRes.ok) {
                statsData = await summaryStatsRes.json();
            }
        }

        if (statsData) {
            parseAndDisplayStats(statsData, mode, selectedHero);
            statusMsg.innerText = '✅ 數據載入成功！';
            statusMsg.style.color = '#84c000';
        } else {
            statusMsg.innerText = '⚠️ API 爬蟲逾時中，請再點擊一次「查詢數據」按鈕重試！';
            statusMsg.style.color = '#ff9000';
        }

    } catch (error) {
        statusMsg.innerText = `❌ ${error.message}`;
        statusMsg.style.color = '#ff4d4d';
    } finally {
        searchBtn.disabled = false;
    }
}

function parseAndDisplayStats(statsData, mode, selectedHero) {
    let modeData = null;

    if (mode === 'all') {
        modeData = mergeModesData(statsData.quickplay, statsData.competitive);
    } else {
        modeData = statsData[mode];
    }

    // 若無英雄數據時的友善提示
    if (!modeData || !modeData.heroes || Object.keys(modeData.heroes).length === 0) {
        document.getElementById('cardWinRate').innerText = '0%';
        document.getElementById('cardKDA').innerText = '0.0';
        document.getElementById('cardTotalWins').innerText = '0';
        document.getElementById('hero1Name').innerText = '無遊玩紀錄';
        document.getElementById('hero1Time').innerText = '該模式下尚無戰績';
        document.getElementById('hero1WR').innerText = '-';
        document.getElementById('hero2Name').innerText = '無遊玩紀錄';
        document.getElementById('hero2Time').innerText = '該模式下尚無戰績';
        document.getElementById('hero2WR').innerText = '-';
        return;
    }

    if (selectedHero === 'all') {
        const heroesArray = Object.entries(modeData.heroes).map(([key, value]) => {
            const timePlayed = getStatValue(value, 'time_played') || 0;
            const gamesWon = getStatValue(value, 'games_won') || 0;
            const gamesPlayed = getStatValue(value, 'games_played') || 0;
            const elims = getStatValue(value, 'eliminations') || 0;
            const deaths = getStatValue(value, 'deaths') || 1;
            const winrate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
            return {
                key,
                name: getHeroChineseName(key),
                timePlayed,
                gamesWon,
                winrate,
                kda: (elims / deaths).toFixed(1)
            };
        }).sort((a, b) => b.timePlayed - a.timePlayed);

        const totalWins = heroesArray.reduce((acc, h) => acc + h.gamesWon, 0);
        const avgWinRate = heroesArray.length > 0 ? Math.round(heroesArray.reduce((acc, h) => acc + h.winrate, 0) / heroesArray.length) : 0;
        const avgKDA = heroesArray.length > 0 ? (heroesArray.reduce((acc, h) => acc + parseFloat(h.kda), 0) / heroesArray.length).toFixed(1) : '0.0';

        document.getElementById('cardTotalWins').innerText = totalWins;
        document.getElementById('cardWinRate').innerText = `${avgWinRate}%`;
        document.getElementById('cardKDA').innerText = avgKDA;

        if (heroesArray.length > 0) {
            const h1 = heroesArray[0];
            document.getElementById('hero1Avatar').src = getHeroAvatarUrl(h1.key);
            document.getElementById('hero1Name').innerText = h1.name;
            document.getElementById('hero1Time').innerText = `勝場: ${h1.gamesWon} 次 | 時間: ${formatTime(h1.timePlayed)}`;
            document.getElementById('hero1WR').innerText = `${h1.winrate}%`;
        }

        if (heroesArray.length > 1) {
            const h2 = heroesArray[1];
            document.getElementById('hero2Avatar').src = getHeroAvatarUrl(h2.key);
            document.getElementById('hero2Name').innerText = h2.name;
            document.getElementById('hero2Time').innerText = `勝場: ${h2.gamesWon} 次 | 時間: ${formatTime(h2.timePlayed)}`;
            document.getElementById('hero2WR').innerText = `${h2.winrate}%`;
        }
    } else {
        const heroData = modeData.heroes[selectedHero];
        const cName = getHeroChineseName(selectedHero);
        if (heroData) {
            const timePlayed = getStatValue(heroData, 'time_played') || 0;
            const gamesWon = getStatValue(heroData, 'games_won') || 0;
            const gamesPlayed = getStatValue(heroData, 'games_played') || 0;
            const elims = getStatValue(heroData, 'eliminations') || 0;
            const deaths = getStatValue(heroData, 'deaths') || 1;
            const winrate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
            const kda = (elims / deaths).toFixed(1);

            document.getElementById('cardTotalWins').innerText = gamesWon;
            document.getElementById('cardWinRate').innerText = `${winrate}%`;
            document.getElementById('cardKDA').innerText = kda;

            document.getElementById('hero1Avatar').src = getHeroAvatarUrl(selectedHero);
            document.getElementById('hero1Name').innerText = cName;
            document.getElementById('hero1Time').innerText = `總遊玩時間: ${formatTime(timePlayed)}`;
            document.getElementById('hero1WR').innerText = `${winrate}%`;

            document.getElementById('hero2Avatar').src = getHeroAvatarUrl(selectedHero);
            document.getElementById('hero2Name').innerText = `${cName} (詳細細節)`;
            document.getElementById('hero2Time').innerText = `累積擊殺: ${elims} 次`;
            document.getElementById('hero2WR').innerText = '-';
        } else {
            document.getElementById('cardTotalWins').innerText = '0';
            document.getElementById('cardWinRate').innerText = '0%';
            document.getElementById('cardKDA').innerText = '0.0';
            document.getElementById('hero1Avatar').src = getHeroAvatarUrl(selectedHero);
            document.getElementById('hero1Name').innerText = cName;
            document.getElementById('hero1Time').innerText = '此模式下尚無遊玩紀錄';
            document.getElementById('hero1WR').innerText = '-';
        }
    }
}

function getStatValue(heroObj, statName) {
    if (!heroObj) return 0;
    if (typeof heroObj[statName] === 'number') return heroObj[statName];
    if (heroObj.general && heroObj.general[statName]) return heroObj.general[statName];
    if (heroObj.game && heroObj.game[statName]) return heroObj.game[statName];
    return 0;
}

function mergeModesData(qp, comp) {
    const merged = { heroes: {} };
    [qp, comp].forEach(mode => {
        if (!mode || !mode.heroes) return;
        Object.entries(mode.heroes).forEach(([heroKey, data]) => {
            if (!merged.heroes[heroKey]) {
                merged.heroes[heroKey] = JSON.parse(JSON.stringify(data));
            } else {
                const t1 = getStatValue(merged.heroes[heroKey], 'time_played');
                const t2 = getStatValue(data, 'time_played');
                const w1 = getStatValue(merged.heroes[heroKey], 'games_won');
                const w2 = getStatValue(data, 'games_won');
                
                merged.heroes[heroKey].time_played = t1 + t2;
                merged.heroes[heroKey].games_won = w1 + w2;
            }
        });
    });
    return merged;
}

function formatTime(seconds) {
    if (!seconds) return '0分鐘';
    const hours = Math.floor(seconds / 3600);
    if (hours > 0) return `${hours} 小時`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} 分鐘`;
}

function downloadCard() {
    const cardElement = document.getElementById('myCard');
    html2canvas(cardElement, {
        backgroundColor: '#0d1117',
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Overwatch2_Stats_Card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}
