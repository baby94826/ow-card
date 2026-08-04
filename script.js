// 《鬥陣特攻 2》台灣官方繁體中文字典 (無重複精簡版)
const heroTranslations = {
    // === 重裝 (Tanks) ===
    "dva": "D.Va",
    "doomfist": "毀滅拳王",
    "junkerqueen": "垃圾鎮女王",
    "mauga": "莫加",
    "orisa": "歐瑞莎",
    "ramattra": "拉瑪塔",
    "reinhardt": "萊因哈特",
    "roadhog": "攔路豬",
    "sigma": "席格馬",
    "winston": "溫斯頓",
    "wreckingball": "火爆鋼球",
    "zarya": "札莉雅",
    "hazard": "災害",

    // === 傷害 (Damage) ===
    "ashe": "艾西",
    "bastion": "壁壘機兵",
    "cassidy": "卡西迪",
    "mccree": "卡西迪",
    "echo": "迴音",
    "genji": "源氏",
    "hanzo": "半藏",
    "junkrat": "炸彈鼠",
    "mei": "小美",
    "pharah": "法拉",
    "reaper": "死神",
    "sojourn": "索潔恩",
    "soldier76": "士兵76",
    "sombra": "駭影",
    "symmetra": "辛梅塔",
    "torbjorn": "托比昂",
    "tracer": "閃光",
    "venture": "無畏",
    "widowmaker": "奪命女",

    // === 輔助 (Support) ===
    "ana": "安娜",
    "baptiste": "巴帝斯特",
    "brigitte": "碧姬",
    "illari": "伊拉里",
    "juno": "朱諾",
    "kiriko": "霧子",
    "lifeweaver": "織命",
    "lucio": "路西歐",
    "mercy": "慈悲",
    "moira": "莫伊拉",
    "zenyatta": "禪亞塔"
};

// 輔助函式：將字串清理後自動對照中文
function getHeroChineseName(englishKey, fallbackName) {
    if (!englishKey) return fallbackName || '未知英雄';
    
    // 自動去除連字號、空格、符號並轉小寫 (例如 "Soldier: 76" -> "soldier76")
    const cleanKey = englishKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    return heroTranslations[cleanKey] || fallbackName || englishKey;
}

async function fetchPlayerData() {
    const rawInput = document.getElementById('battleTagInput').value.trim();
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
        if (!summaryRes.ok) {
            throw new Error('找不到該玩家，請確認 ID 是否正確或遊戲內檔案是否設為公開。');
        }
        const summaryData = await summaryRes.json();

        // 2. 抓取詳細英雄數據
        const statsRes = await fetch(`https://overfast-api.tekrop.fr/players/${formattedTag}/stats/summary`);
        const statsData = statsRes.ok ? await statsRes.json() : null;

        // 更新基本資訊
        document.getElementById('cardPlayerName').innerText = summaryData.username || rawInput;
        document.getElementById('cardTitle').innerText = summaryData.title ? `稱號: ${summaryData.title}` : '公開個人檔案玩家';

        // 更新核心數據
        if (statsData && statsData.general) {
            const gen = statsData.general;
            document.getElementById('cardWinRate').innerText = gen.winrate ? `${gen.winrate}%` : '公開';
            document.getElementById('cardKDA').innerText = gen.kda ? gen.kda.toFixed(1) : '0.0';
            document.getElementById('cardTotalWins').innerText = gen.games_won || 0;
        } else if (summaryData.endorsement) {
            document.getElementById('cardKDA').innerText = `Lv. ${summaryData.endorsement.level}`;
            document.getElementById('cardWinRate').innerText = '公開';
            document.getElementById('cardTotalWins').innerText = '-';
        }

        // 更新英雄數據
        if (statsData && statsData.heroes && Object.keys(statsData.heroes).length > 0) {
            const heroesArray = Object.entries(statsData.heroes).map(([key, value]) => ({
                key: key,
                name: getHeroChineseName(key, value.name),
                timePlayed: value.time_played || 0,
                winrate: value.winrate || 0
            })).sort((a, b) => b.timePlayed - a.timePlayed);

            if (heroesArray.length > 0) {
                const h1 = heroesArray[0];
                document.getElementById('hero1Tag').innerText = h1.name.substring(0, 2);
                document.getElementById('hero1Name').innerText = h1.name;
                document.getElementById('hero1Time').innerText = `使用時間: ${formatTime(h1.timePlayed)}`;
                document.getElementById('hero1WR').innerText = `${h1.winrate}%`;
            }

            if (heroesArray.length > 1) {
                const h2 = heroesArray[1];
                document.getElementById('hero2Tag').innerText = h2.name.substring(0, 2);
                document.getElementById('hero2Name').innerText = h2.name;
                document.getElementById('hero2Time').innerText = `使用時間: ${formatTime(h2.timePlayed)}`;
                document.getElementById('hero2WR').innerText = `${h2.winrate}%`;
            }
        } else {
            document.getElementById('hero1Name').innerText = '隱私未公開';
            document.getElementById('hero1Time').innerText = '請於遊戲中開放生涯數據';
            document.getElementById('hero1WR').innerText = '-';
            
            document.getElementById('hero2Name').innerText = '隱私未公開';
            document.getElementById('hero2Time').innerText = '請於遊戲中開放生涯數據';
            document.getElementById('hero2WR').innerText = '-';
        }

        statusMsg.innerText = '✅ 數據載入成功！';
        statusMsg.style.color = '#84c000';

    } catch (error) {
        statusMsg.innerText = `❌ ${error.message}`;
        statusMsg.style.color = '#ff4d4d';
    } finally {
        searchBtn.disabled = false;
    }
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
        backgroundColor: '#0f1015',
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Overwatch2_Stats_Card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}
