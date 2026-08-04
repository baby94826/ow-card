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
    
    statusMsg.innerText = '⏳ 正在向《鬥陣特攻》伺服器查詢數據中...';
    statusMsg.style.color = '#ff9000';
    searchBtn.disabled = true;

    try {
        const response = await fetch(`https://overfast-api.tekrop.fr/players/${formattedTag}/summary`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('找不到該玩家，請確認 ID 是否正確或玩家檔案是否設為不公開。');
            } else {
                throw new Error('伺服器連線失敗，請稍後再試。');
            }
        }

        const data = await response.json();

        // 1. 更新玩家基本資訊
        document.getElementById('cardPlayerName').innerText = data.username || rawInput;
        document.getElementById('cardTitle').innerText = data.title ? `稱號: ${data.title}` : '公開個人檔案玩家';

        // 2. 更新讚賞與等級數據
        if (data.endorsement) {
            document.getElementById('cardKDA').innerText = `Lv. ${data.endorsement.level}`;
            document.getElementById('cardTotalWins').innerText = data.competitive?.pc?.season ? `S${data.competitive.pc.season}` : '一般';
            document.getElementById('cardWinRate').innerText = '公開';
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

// 下載卡片為 PNG 圖片
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
