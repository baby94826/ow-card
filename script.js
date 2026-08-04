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

// 初始化英雄下拉選單
function initHeroDropdown() {
    const heroSelect = document.getElementById('heroSelect');
    if (!heroSelect) return;
    
    // 清空現有選項並設定預設值
    heroSelect.innerHTML = '<option value="all">全英雄總計</option>';
    
    // 依中文字母排序英雄
    const sortedHeroes = Object.entries(heroTranslations).sort((a, b) => a[1].localeCompare(b[1], 'zh-Hant'));
    
    sortedHeroes.forEach(([key, chineseName]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = chineseName;
        heroSelect.appendChild(option);
    });
}

// 頁面載入時初始化選單
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
    statusMsg.innerText = '⏳ 正在查詢生涯數據中...';
    statusMsg.style.color = '#ff9000';
    searchBtn.disabled = true;

    try {
        // 1. 抓取玩家概要資訊
        const summaryRes = await fetch(`https://overfast-api.tekrop.fr/players/${formattedTag}/summary`);
        if (!summaryRes.ok) throw new Error('找不到該玩家，請確認 ID 是否正確或個人檔案已公開。');
        const summaryData = await summaryRes.json();

        // 2. 抓取完整統計數據 (含各模式與英雄明細)
        const statsRes = await fetch(`https://overfast-api.tekrop.fr/players/${formattedTag}/stats/complete`);
        const statsData = statsRes.ok ? await statsRes.json() : null;

        document.getElementById('cardPlayerName').innerText = summaryData.username || rawInput;
        document.getElementById('cardTitle').innerText = summaryData.title ? `稱號: ${summaryData.title}` : '公開個人檔案玩家';

        if (statsData) {
            parseAndDisplayStats(statsData, mode, selectedHero);
            statusMsg.innerText = '✅ 數據載入成功！';
            statusMsg.style.color = '#84c000';
        } else {
            statusMsg.innerText = '⚠️ 該玩家數據未公開或無此模式紀錄';
            statusMsg.style.color = '#ff9000';
        }

    } catch (error) {
        statusMsg.innerText = `❌ ${error.message}`;
        statusMsg.style.color = '#ff4d4d';
    } finally {
        searchBtn.disabled = false;
    }
}

// 解析與顯示特定模式/英雄的統計數據
function parseAndDisplayStats(statsData, mode, selectedHero) {
    // 依模式取得資料區域 (quickplay / competitive / all)
    let modeData = null;
    if (mode === 'all') {
        // 整合 quickplay 與 competitive 資料
        modeData = mergeModesData(statsData.quickplay, statsData.competitive);
    } else {
        modeData = statsData[mode];
    }

    if (!modeData || !modeData.heroes) {
        document.getElementById('cardWinRate').innerText = '無紀錄';
        document.getElementById('cardKDA').innerText = '0.0';
        document.getElementById('cardTotalWins').innerText = '0';
        return;
    }

    if (selectedHero === 'all') {
        // 展示常用英雄排名 TOP 2
        const heroesArray = Object.entries(modeData.heroes).map(([key, value]) => {
            const timePlayed = getStatValue(value, 'time_played') || 0;
            const gamesWon = getStatValue(value, 'games_won') || 0;
            const gamesPlayed = getStatValue(value, 'games_played') || 0;
            const winrate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
            return {
                key,
                name: getHeroChineseName(key),
                timePlayed,
                gamesWon,
                winrate
            };
        }).sort((a, b) => b.timePlayed - a.timePlayed);

        // 計算整體總勝場與平均勝率
        const totalWins = heroesArray.reduce((acc, h) => acc + h.gamesWon, 0);
        document.getElementById('cardTotalWins').innerText = totalWins;
        
        if (heroesArray.length > 0) {
            const h1 = heroesArray[0];
            document.getElementById('hero1Name').innerText = h1.name;
            document.getElementById('hero1Time').innerText = `勝場: ${h1.gamesWon} 次 | 時間: ${formatTime(h1.timePlayed)}`;
            document.getElementById('hero1WR').innerText = `${h1.winrate}%`;
        }

        if (heroesArray.length > 1) {
            const h2 = heroesArray[1];
            document.getElementById('hero2Name').innerText = h2.name;
            document.getElementById('hero2Time').innerText = `勝場: ${h2.gamesWon} 次 | 時間: ${formatTime(h2.timePlayed)}`;
            document.getElementById('hero2WR').innerText = `${h2.winrate}%`;
        }
    } else {
        // 顯示指定單一英雄數據
        const heroData = modeData.heroes[selectedHero];
        if (heroData) {
            const timePlayed = getStatValue(heroData, 'time_played') || 0;
            const gamesWon = getStatValue(heroData, 'games_won') || 0;
            const gamesPlayed = getStatValue(heroData, 'games_played') || 0;
            const winrate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

            document.getElementById('cardTotalWins').innerText = gamesWon;
            document.getElementById('cardWinRate').innerText = `${winrate}%`;
            
            document.getElementById('hero1Name').innerText = getHeroChineseName(selectedHero);
            document.getElementById('hero1Time').innerText = `總遊玩時間: ${formatTime(timePlayed)}`;
            document.getElementById('hero1WR').innerText = `勝率 ${winrate}%`;
            
            document.getElementById('hero2Name').innerText = '單一英雄模式';
            document.getElementById('hero2Time').innerText = `共計勝場 ${gamesWon} 場`;
            document.getElementById('hero2WR').innerText = '-';
        } else {
            document.getElementById('hero1Name').innerText = getHeroChineseName(selectedHero);
            document.getElementById('hero1Time').innerText = '此模式無遊玩紀錄';
            document.getElementById('hero1WR').innerText = '-';
        }
    }
}

// 輔助工具：從 OverFast 複雜的數值陣列中取出目標值
function getStatValue(heroObj, statName) {
    if (!heroObj) return 0;
    // 如果是直接數值
    if (typeof heroObj[statName] === 'number') return heroObj[statName];
    // 如果存在於 general / game 統計分類中
    if (heroObj.general && heroObj.general[statName]) return heroObj.general[statName];
    if (heroObj.game && heroObj.game[statName]) return heroObj.game[statName];
    return 0;
}

// 合併快速與競技資料
function mergeModesData(qp, comp) {
    const merged = { heroes: {} };
    [qp, comp].forEach(mode => {
        if (!mode || !mode.heroes) return;
        Object.entries(mode.heroes).forEach(([heroKey, data]) => {
            if (!merged.heroes[heroKey]) {
                merged.heroes[heroKey] = JSON.parse(JSON.stringify(data));
            } else {
                // 時間與勝場累加
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
