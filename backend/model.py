import yfinance as yf
import pandas as pd
import numpy as np
import xgboost as xgb
import pandas_ta as ta
from sklearn.model_selection import train_test_split
from datetime import datetime, timedelta

class StockModel:
    def __init__(self, ticker):
        self.ticker = ticker
        self.model = None
        self.data = None
        self.feature_columns = []

    def fetch_data(self, period="2y"):
        stock = yf.Ticker(self.ticker)
        # Fetch a bit more data for better indicator calculation
        df = stock.history(period="5y")
        if df.empty:
            return None
        self.data = df
        return df

    def prepare_features(self, df=None):
        if df is None:
            df = self.data.copy()
        
        # Add technical indicators using pandas_ta
        df.ta.rsi(append=True)
        df.ta.sma(length=20, append=True)
        df.ta.sma(length=50, append=True)
        df.ta.macd(append=True)
        df.ta.bbands(append=True)
        
        # Lagged features
        for i in range(1, 6):
            df[f'lag_{i}'] = df['Close'].shift(i)
        
        # Time features
        df['day_of_week'] = df.index.dayofweek
        df['day_of_month'] = df.index.day
        
        # Target: Next day Close
        df['Target'] = df['Close'].shift(-1)
        
        return df

    def train(self):
        df = self.prepare_features()
        df.dropna(inplace=True)
        
        if len(df) < 50:
            return False
            
        self.feature_columns = [col for col in df.columns if col not in ['Target', 'Dividends', 'Stock Splits']]
        
        X = df[self.feature_columns]
        y = df['Target']
        
        # Split data - use last 100 days for validation
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=min(100, int(len(X)*0.2)), shuffle=False)
        
        self.model = xgb.XGBRegressor(
            n_estimators=500,
            learning_rate=0.05,
            max_depth=4,
            subsample=0.8,
            colsample_bytree=0.8,
            n_jobs=-1,
            early_stopping_rounds=30
        )
        
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        return True

    def forecast(self, days=7):
        if self.model is None:
            self.train()
            
        # Get historical predictions for plotting
        df_full = self.prepare_features()
        df_plot = df_full.dropna().tail(120).copy() # Show last 4 months
        
        X_hist = df_plot[self.feature_columns]
        y_pred_hist = self.model.predict(X_hist)
        
        results = []
        for i in range(len(df_plot)):
            results.append({
                "date": df_plot.index[i].strftime('%Y-%m-%d'),
                "actual": float(df_plot['Close'].iloc[i]),
                "predicted": float(y_pred_hist[i])
            })
            
        # Future forecasting
        # We'll use a mix of the model's momentum and the recent trend
        last_price = float(df_full['Close'].iloc[-1])
        
        # Use model to predict the next day
        last_features = df_full[self.feature_columns].iloc[-1:]
        next_day_pred = float(self.model.predict(last_features)[0])
        
        # Calculate recent volatility and trend
        recent_changes = df_full['Close'].pct_change().tail(30).mean()
        volatility = df_full['Close'].pct_change().tail(30).std()
        
        # Smoothing factor for long-term forecasting
        current_pred = next_day_pred
        
        for i in range(1, days + 1):
            future_date = (df_full.index[-1] + timedelta(days=i)).strftime('%Y-%m-%d')
            
            # Simple simulation: blend model's initial signal with recent average momentum
            # The further we go, the more we revert to the average recent change
            decay = max(0, 1 - (i / days))
            step_change = (current_pred - last_price) * decay + (last_price * recent_changes) * (1 - decay)
            
            current_pred = last_price + step_change
            last_price = current_pred
            
            results.append({
                "date": future_date,
                "actual": None,
                "predicted": float(current_pred)
            })
            
        return results
