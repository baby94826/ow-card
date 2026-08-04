function downloadCard() {
    const cardElement = document.getElementById('myCard');
    
    // 渲染卡片為 PNG 圖片
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
