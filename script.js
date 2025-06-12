
const alertForm = document.getElementById('alertForm');
const alertsList = document.getElementById('alertsList');

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
      if (coinGeckoMap[lowerSymbol]) {
        const id = coinGeckoMap[lowerSymbol];
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
        const data = await response.json();
        const price = data[id]?.usd;
        updatePrice(index, price, alert, lowerSymbol);
      } else {
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${alert.symbol.toUpperCase()}`);
        const data = await response.json();
        const price = data.quoteResponse.result[0]?.regularMarketPrice;
        updatePrice(index, price, alert, lowerSymbol);
      }
    } catch (err) {
      console.error("Error fetching price:", err);
      document.getElementById(`live-${index}`).innerText = `Error fetching`;
    }
  }
}

function updatePrice(index, price, alert, symbol) {
  if (price) {
    document.getElementById(`live-${index}`).innerText = `Current: $${price}`;
    if (price >= alert.price) {
      alertUser(symbol.toUpperCase(), price, alert.price);
    }
  } else {
    document.getElementById(`live-${index}`).innerText = `Symbol Not Found`;
  }
}

function alertUser(symbol, livePrice, targetPrice) {
  alert(`${symbol} has reached $${livePrice} (Target: $${targetPrice})`);
}

loadAlerts();
setInterval(checkPrices, 30000);
