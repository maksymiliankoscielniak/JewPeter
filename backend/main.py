from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from model import StockModel
import yfinance as yf
import requests

app = FastAPI(title="JewPeter API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to JewPeter Stock Forecaster API"}

@app.get("/api/stock/{ticker}")
async def get_stock_forecast(ticker: str, days: int = Query(7, ge=1, le=180)):
    try:
        model = StockModel(ticker)
        data = model.fetch_data()
        if data is None or data.empty:
            raise HTTPException(status_code=404, detail="Ticker not found")
        
        forecast = model.forecast(days=days)
        
        # Get basic info
        stock = yf.Ticker(ticker)
        info = stock.info
        
        return {
            "ticker": ticker,
            "name": info.get("longName", ticker),
            "current_price": info.get("currentPrice") or data['Close'].iloc[-1],
            "currency": info.get("currency", "USD"),
            "forecast": forecast
        }
    except Exception as e:
        print(f"Error forecasting {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
async def search_ticker(q: str):
    if not q:
        return []
    
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={q}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers)
        data = response.json()
        
        results = []
        for quote in data.get('quotes', []):
            if quote.get('symbol'):
                results.append({
                    "symbol": quote['symbol'],
                    "name": quote.get('longname') or quote.get('shortname') or quote['symbol'],
                    "type": quote.get('quoteType', 'Unknown')
                })
        return results[:5] # Return top 5 matches
    except Exception as e:
        print(f"Search error: {e}")
        return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
