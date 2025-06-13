
const alertForm = document.getElementById('alertForm');
const alertsList = document.getElementById('alertsList');
const testSoundBtn = document.getElementById('testSound');
const clearAlertsBtn = document.getElementById('clearAlerts');

const coinGeckoMap = {
  btc: "bitcoin",
  eth: "ethereum",
  doge: "dogecoin",
  ltc: "litecoin",
  sol: "solana",
  ada: "cardano",
  xrp: "ripple",
  shib: "shiba-inu"
};

let soundBase64 = localStorage.getItem('alertSound') || null;
let triggeredAlerts = JSON.parse(localStorage.getItem('triggeredAlerts') || "[]");
let currentAudio = null;

document.getElementById('audioFile').addEventListener('change', function() {
  const file = this.files[0];
  const reader = new FileReader();
  reader.onloadend = function() {
    soundBase64 = reader.result;
    localStorage.setItem('alertSound', soundBase64);
  }
  reader.readAsDataURL(file);
});

testSoundBtn.addEventListener('click', () => {
  if (soundBase64) {
    playSound();
  } else {
    alert("No sound uploaded yet.");
  }
});

clearAlertsBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to clear all alerts?")) {
    localStorage.removeItem('alerts');
    localStorage.removeItem('triggeredAlerts');
    triggeredAlerts = [];
    loadAlerts();
  }
});

function loadAlerts() {
  alertsList.innerHTML = "";
  const alerts = JSON.parse(localStorage.getItem('alerts') || "[]");
  alerts.forEach((alert, index) => {
    const div = document.createElement('div');
    div.className = 'alert-item';
    div.id = `alert-${index}`;
    div.innerHTML = `
      <div class="alert-info">
        <span>${alert.symbol.toUpperCase()} @ $${alert.price}</span>
        <span id="live-${index}">Current: (loading)</span>
      </div>
      <button class="disable-btn" onclick="removeAlert(${index})">Disable</button>
    `;
    alertsList.appendChild(div);
  });
}

function removeAlert(index) {
  const alerts = JSON.parse(localStorage.getItem('alerts') || "[]");
  alerts.splice(index, 1);
  localStorage.setItem('alerts', JSON.stringify(alerts));
  loadAlerts();
}

alertForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const symbol = document.getElementById('symbol').value.trim().toLowerCase();
  const price = parseFloat(document.getElementById('targetPrice').value.trim());
  const alerts = JSON.parse(localStorage.getItem('alerts') || "[]");
  alerts.push({ symbol, price });
  localStorage.setItem('alerts', JSON.stringify(alerts));
  loadAlerts();
  alertForm.reset();
});

async function checkPrices() {
  const alerts = JSON.parse(localStorage.getItem('alerts') || "[]");
  for (let index in alerts) {
    let alert = alerts[index];
    try {
      const lowerSymbol = alert.symbol.toLowerCase();
      const uniqueKey = `${lowerSymbol}_${alert.price}`;
      if (coinGeckoMap[lowerSymbol]) {
        const id = coinGeckoMap[lowerSymbol];
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
        const data = await response.json();
        const price = data[id]?.usd;
        updatePrice(index, price, alert, lowerSymbol, uniqueKey);
      } else {
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${alert.symbol.toUpperCase()}`);
        const data = await response.json();
        const price = data.quoteResponse.result[0]?.regularMarketPrice;
        updatePrice(index, price, alert, lowerSymbol, uniqueKey);
      }
    } catch (err) {
      console.error("Error fetching price:", err);
      document.getElementById(`live-${index}`).innerText = `Error fetching`;
    }
  }
}

function updatePrice(index, price, alert, symbol, uniqueKey) {
  if (price) {
    document.getElementById(`live-${index}`).innerText = `Current: $${price}`;
    if (price >= alert.price && !triggeredAlerts.includes(uniqueKey)) {
      triggeredAlerts.push(uniqueKey);
      localStorage.setItem('triggeredAlerts', JSON.stringify(triggeredAlerts));
      alertUser(symbol.toUpperCase(), price, alert.price);
    }
  } else {
    document.getElementById(`live-${index}`).innerText = `Symbol Not Found`;
  }
}

function alertUser(symbol, livePrice, targetPrice) {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "20%";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.backgroundColor = "#222";
  popup.style.color = "#fff";
  popup.style.padding = "20px";
  popup.style.border = "2px solid #f33";
  popup.style.zIndex = 9999;
  popup.innerHTML = `${symbol} has reached $${livePrice} (Target: $${targetPrice})<br><br>`;
  const stopBtn = document.createElement("button");
  stopBtn.innerText = "Dismiss Sound";
  stopBtn.onclick = () => {
    if (currentAudio) currentAudio.pause();
    popup.remove();
  };
  popup.appendChild(stopBtn);
  document.body.appendChild(popup);
  playSound();
}

function playSound() {
  if (soundBase64) {
    if (currentAudio) currentAudio.pause();
    currentAudio = new Audio(soundBase64);
    currentAudio.play();
  }
}

loadAlerts();
setInterval(checkPrices, 30000);
