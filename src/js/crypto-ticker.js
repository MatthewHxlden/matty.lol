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
            `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
            { cache: 'no-cache' }
        );
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        console.log("Crypto data fetched:", data);
        return data;
    } catch (error) {
        console.error("Crypto ticker fetch error:", error);
        return null;
    }
}

function formatPrice(price) {
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 1000) return `$${price.toFixed(2)}`;
    return `$${(price / 1000).toFixed(1)}K`;
}

function createTickerItem(symbol, price, change) {
    const changeDir = change >= 0 ? "▲" : "▼";
    const changeClass = change >= 0 ? "positive" : "negative";
    
    return `
        <div class="ticker-item">
            <span class="ticker-symbol">${symbol}</span>
            <span class="ticker-price">${formatPrice(price)}</span>
            <span class="ticker-change ${changeClass}">${changeDir} ${Math.abs(change).toFixed(2)}%</span>
        </div>
    `;
}

function createTickerContent(prices) {
    if (!prices) {
        console.warn("No prices available");
        return `<div class="ticker-item"><span style="color: #FF5500; font-size: 18px;">● LOADING PRICES...</span></div>`;
    }

    let html = '';
    CRYPTOS.forEach(crypto => {
        try {
            const data = prices[crypto.id];
            if (data && data.usd) {
                html += createTickerItem(crypto.symbol, data.usd, data.usd_24h_change);
            }
        } catch (e) {
            console.error(`Error processing ${crypto.id}:`, e);
        }
    });

    return html || `<div class="ticker-item"><span style="color: #FF5500; font-size: 18px;">● NO DATA AVAILABLE</span></div>`;
}

function updateStatusBar() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const dateStr = now.toLocaleDateString();
    
    const statusBar = document.getElementById("status-bar");
    if (statusBar) {
        statusBar.innerHTML = `
            <span>matty.lol [ Terminal 24/7 Live Ticker ]</span>
            <span>${timeStr} | ${dateStr}</span>
        `;
    }
}

async function initTicker() {
    console.log("Initializing ticker...");
    
    // Create status bar
    const statusBar = document.createElement("div");
    statusBar.id = "status-bar";
    document.body.insertBefore(statusBar, document.body.firstChild);
    updateStatusBar();
    setInterval(updateStatusBar, 1000);

    // Create ticker container with wrapper for overflow
    const tickerWrapper = document.createElement("div");
    tickerWrapper.id = "crypto-ticker";
    
    const tickerContent = document.createElement("div");
    tickerContent.id = "crypto-ticker-content";
    
    tickerWrapper.appendChild(tickerContent);
    document.body.appendChild(tickerWrapper);

    // Initial fetch with retry logic
    async function updateTicker() {
        console.log("Fetching crypto prices...");
        const prices = await fetchCryptoPrices();
        
        if (prices) {
            const content = createTickerContent(prices);
            // Repeat content 3x for smooth scrolling loop
            tickerContent.innerHTML = content + content + content;
            console.log("Ticker updated successfully");
        } else {
            tickerContent.innerHTML = `<div class="ticker-item"><span style="color: #FF5500; font-size: 18px;">● API UNAVAILABLE - RETRYING...</span></div>`;
        }
    }

    // Initial fetch
    await updateTicker();

    // Refresh prices every 30 seconds
    setInterval(updateTicker, 30000);
    
    // Also retry on fetch error immediately once
    setTimeout(updateTicker, 5000);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTicker);
} else {
    initTicker();
}

