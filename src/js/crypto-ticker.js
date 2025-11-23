/**
 * CRYPTO-TICKER.JS
 * -----------------------------------------------------------------------
 * Fetches real-time crypto prices from CoinGecko API (free, no auth needed)
 * Displays scrolling ticker at bottom of page with BTC, ETH, SOL prices
 */

const COINGECKO_API = "https://api.coingecko.com/api/v3";

const CRYPTOS = [
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
    { id: "ethereum", symbol: "ETH", name: "Ethereum" },
    { id: "solana", symbol: "SOL", name: "Solana" },
    { id: "cardano", symbol: "ADA", name: "Cardano" },
];

async function fetchCryptoPrices() {
    try {
        const ids = CRYPTOS.map(c => c.id).join(",");
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (!response.ok) throw new Error("Failed to fetch crypto prices");
        
        return await response.json();
    } catch (error) {
        console.error("Crypto ticker error:", error);
        return null;
    }
}

function formatPrice(price) {
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 1000) return `$${price.toFixed(2)}`;
    return `$${(price / 1000).toFixed(1)}K`;
}

function createTickerContent(prices) {
    if (!prices) {
        return `<span style="color: #FF5500;">● NO DATA</span>`;
    }

    const items = CRYPTOS
        .map(crypto => {
            const data = prices[crypto.id];
            if (!data) return null;

            const price = data.usd;
            const change = data.usd_24h_change;
            const changeDir = change >= 0 ? "▲" : "▼";
            const changeClass = change >= 0 ? "positive" : "negative";

            return `
                <div class="ticker-item">
                    <span class="ticker-symbol">${crypto.symbol}</span>
                    <span class="ticker-price">${formatPrice(price)}</span>
                    <span class="ticker-change ${changeClass}">${changeDir} ${Math.abs(change).toFixed(2)}%</span>
                </div>
            `;
        })
        .filter(item => item !== null)
        .join("");

    return items;
}

function updateStatusBar() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const dateStr = now.toLocaleDateString();
    
    const statusBar = document.getElementById("status-bar");
    if (statusBar) {
        statusBar.innerHTML = `
            <span>matty.lol [ Chart: Terminal 24/7 ] ${timeStr}</span>
            <span>${dateStr}</span>
        `;
    }
}

async function initTicker() {
    // Create status bar
    const statusBar = document.createElement("div");
    statusBar.id = "status-bar";
    document.body.insertBefore(statusBar, document.body.firstChild);
    updateStatusBar();
    setInterval(updateStatusBar, 1000);

    // Create ticker
    const ticker = document.createElement("div");
    ticker.id = "crypto-ticker";
    
    const tickerContent = document.createElement("div");
    tickerContent.id = "crypto-ticker-content";
    
    ticker.appendChild(tickerContent);
    document.body.appendChild(ticker);

    // Initial fetch
    const prices = await fetchCryptoPrices();
    tickerContent.innerHTML = createTickerContent(prices);

    // Duplicate content for seamless loop
    const clone = tickerContent.cloneNode(true);
    ticker.appendChild(clone);

    // Refresh prices every 30 seconds
    setInterval(async () => {
        const newPrices = await fetchCryptoPrices();
        const content = createTickerContent(newPrices);
        
        document.querySelectorAll("#crypto-ticker-content").forEach(el => {
            el.innerHTML = content;
        });
    }, 30000);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTicker);
} else {
    initTicker();
}
