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
    { id: "venetian", symbol: "VVV", name: "Venice" },
    { id: "diem", symbol: "DIEM", name: "Diem" },
];

async function fetchCryptoPrices() {
    try {
        const ids = CRYPTOS.map(c => c.id).join(",");
        const url = `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        console.log("Fetching from:", url);
        
        const response = await fetch(url, { 
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        console.log("✓ API Response received:", data);
        return data;
    } catch (error) {
        console.error("❌ Crypto ticker fetch error:", error);
        return null;
    }
}

function formatPrice(price) {
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return `${(price / 1000).toFixed(1)}K`;
}

function createTickerItem(symbol, price, change) {
    const isPositive = change >= 0;
    const ledColor = isPositive ? '#00ff00' : '#ff0000';
    const arrow = isPositive ? '▲' : '▼';
    const changeClass = isPositive ? 'positive' : 'negative';
    const rgbColor = isPositive ? '0, 255, 0' : '255, 0, 0';
    
    return `
        <div class="ticker-item">
            <div class="led-indicator" style="background-color: ${ledColor}; box-shadow: 0 0 12px ${ledColor}, 0 0 20px rgba(${rgbColor}, 0.6);"></div>
            <div class="ticker-symbol">${symbol}</div>
            <div class="ticker-price">$${formatPrice(price)}</div>
            <div class="ticker-change ${changeClass}">${arrow} ${Math.abs(change).toFixed(2)}%</div>
        </div>
    `;
}

function createTickerContent(prices) {
    if (!prices || Object.keys(prices).length === 0) {
        console.warn("No prices available", prices);
        return `<div class="ticker-item"><span style="font-size: 13px;">● LOADING...</span></div>`;
    }

    let html = '';
    let count = 0;
    
    CRYPTOS.forEach(crypto => {
        try {
            const data = prices[crypto.id];
            if (data && data.usd !== undefined && data.usd_24h_change !== undefined) {
                html += createTickerItem(crypto.symbol, data.usd, data.usd_24h_change);
                count++;
                console.log(`✓ ${crypto.symbol}: $${data.usd} (${data.usd_24h_change}%)`);
            } else {
                console.warn(`✗ Missing data for ${crypto.id}:`, data);
            }
        } catch (e) {
            console.error(`Error processing ${crypto.id}:`, e);
        }
    });

    if (count === 0) {
        console.error("No valid crypto data found in response");
        return `<div class="ticker-item"><span style="font-size: 13px;">● NO DATA</span></div>`;
    }

    console.log(`Successfully loaded ${count} cryptos`);
    return html;
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
    
    // Check if already initialized (prevent duplicates)
    if (document.getElementById("status-bar")) {
        console.log("Ticker already initialized, skipping...");
        return;
    }
    
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
            tickerContent.innerHTML = `<div class="ticker-item"><span style="color: #FF6666; font-size: 13px;">● API UNAVAILABLE - RETRYING...</span></div>`;
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

