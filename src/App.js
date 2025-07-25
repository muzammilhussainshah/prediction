import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Clock, BarChart3 } from 'lucide-react';

const TradingAnalyzer = () => {
  const [inputData, setInputData] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analyzer');
  const [pnlInput, setPnlInput] = useState('');
  const [pnlResults, setPnlResults] = useState(null);

  const parseData = (data) => {
    const lines = data.trim().split('\n');
    const trades = [];
    
    // Check if the data is in tabular format with headers
    const isTabularFormat = lines[0].includes('Period') && 
                           lines[0].includes('Time') && 
                           lines[0].includes('Closing Price');
    
    if (isTabularFormat) {
      // Skip the header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Split by tabs or multiple spaces
        const parts = line.split(/\t+|\s{2,}/);
        
        if (parts.length >= 5) {
          const period = parts[0];
          const timeInfo = parts[1];
          const price = parts[2].replace('$', '');
          const change = parts[3];
          const volume = parts[4];
          
          // Extract day and date from time info (e.g., "Sun, 11/17, 19:00")
          const timeMatch = timeInfo.match(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s*(\d{1,2}\/\d{1,2}),\s*(\d{1,2}:\d{2})/);
          
          if (timeMatch) {
            const [, day, date, time] = timeMatch;
            
            trades.push({
              period: parseInt(period),
              day,
              date,
              time,
              price: parseFloat(price),
              change: parseFloat(change.replace(/[\$\+]/g, '')),
              volume: parseFloat(volume.replace(/,/g, ''))
            });
          }
        }
      }
    } else {
      // Original format parsing
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Extract data using regex
        const match = line.match(/(\d+)(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s*(\d{1,2}\/\d{1,2}),\s*(\d{1,2}:\d{2})\*\*\$(\d+\.?\d*)\$?([\+\-]\$?\d+\.?\d*)\*\*(\d+(?:,\d+)*\.?\d*)/);
        
        if (match) {
          const [, period, day, date, time, price, change, volume] = match;
          trades.push({
            period: parseInt(period),
            day,
            date,
            time,
            price: parseFloat(price),
            change: parseFloat(change.replace(/[\$\+]/g, '')),
            volume: parseFloat(volume.replace(/,/g, ''))
          });
        }
      }
    }
    
    return trades;
  };

  const analyzeData = () => {
    setLoading(true);
    
    try {
      const trades = parseData(inputData);
      
      if (trades.length === 0) {
        alert('No valid data found. Please check your input format.');
        setLoading(false);
        return;
      }

      // Find best entry and exit points
      let bestBuyPoint = null;
      let bestSellPoint = null;
      let maxProfit = -Infinity;
      
      // Analyze all possible buy-sell combinations
      for (let i = 0; i < trades.length - 1; i++) {
        for (let j = i + 1; j < trades.length; j++) {
          const buyTrade = trades[i];
          const sellTrade = trades[j];
          const profit = sellTrade.price - buyTrade.price;
          
          if (profit > maxProfit) {
            maxProfit = profit;
            bestBuyPoint = buyTrade;
            bestSellPoint = sellTrade;
          }
        }
      }

      // Day-wise analysis
      const dayAnalysis = {};
      const timeAnalysis = {};
      
      trades.forEach(trade => {
        // Day analysis
        if (!dayAnalysis[trade.day]) {
          dayAnalysis[trade.day] = { total: 0, count: 0, avgPrice: 0, trades: [] };
        }
        dayAnalysis[trade.day].total += trade.price;
        dayAnalysis[trade.day].count += 1;
        dayAnalysis[trade.day].avgPrice = dayAnalysis[trade.day].total / dayAnalysis[trade.day].count;
        dayAnalysis[trade.day].trades.push(trade);
        
        // Time analysis
        if (!timeAnalysis[trade.time]) {
          timeAnalysis[trade.time] = { total: 0, count: 0, avgPrice: 0, trades: [] };
        }
        timeAnalysis[trade.time].total += trade.price;
        timeAnalysis[trade.time].count += 1;
        timeAnalysis[trade.time].avgPrice = timeAnalysis[trade.time].total / timeAnalysis[trade.time].count;
        timeAnalysis[trade.time].trades.push(trade);
      });

      // Find best days and times
      const bestBuyDay = Object.keys(dayAnalysis).reduce((a, b) => 
        dayAnalysis[a].avgPrice < dayAnalysis[b].avgPrice ? a : b
      );
      
      const bestSellDay = Object.keys(dayAnalysis).reduce((a, b) => 
        dayAnalysis[a].avgPrice > dayAnalysis[b].avgPrice ? a : b
      );

      const bestBuyTime = Object.keys(timeAnalysis).reduce((a, b) => 
        timeAnalysis[a].avgPrice < timeAnalysis[b].avgPrice ? a : b
      );
      
      const bestSellTime = Object.keys(timeAnalysis).reduce((a, b) => 
        timeAnalysis[a].avgPrice > timeAnalysis[b].avgPrice ? a : b
      );

      setAnalysis({
        totalTrades: trades.length,
        bestBuyPoint,
        bestSellPoint,
        maxProfit,
        bestBuyDay,
        bestSellDay,
        bestBuyTime,
        bestSellTime,
        dayAnalysis,
        timeAnalysis,
        allTrades: trades
      });
      
    } catch (error) {
      alert('Error analyzing data. Please check your input format.');
      console.error(error);
    }
    
    setLoading(false);
  };

  const calculatePnL = () => {
    let lines = pnlInput.trim().split('\n').filter(Boolean);
    // Remove header if present
    if (lines[0].toLowerCase().includes('period') && lines[0].toLowerCase().includes('closing price')) {
      lines = lines.slice(1);
    }
    const trades = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      let parts = line.split(/\t+|\s{2,}/);
      if (parts.length >= 5) {
        const period = parts[0];
        const timeInfo = parts[1];
        const price = parts[2].replace('$', '');
        
        const timeMatch = timeInfo.match(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s*(\d{1,2}\/\d{1,2}),\s*(\d{1,2}:\d{2})/);
        if (timeMatch) {
          const [, day, date, time] = timeMatch;
          trades.push({
            period: parseInt(period),
            day,
            date,
            time,
            price: parseFloat(price)
          });
        }
      }
    }

    if (trades.length < 2) {
      alert('Please enter at least two trades to calculate PnL');
      return;
    }

    const results = [];
    let netPnL = 0;
    let maxProfit = { value: -Infinity, entry: null, exit: null };
    let maxLoss = { value: Infinity, entry: null, exit: null };
    let profitableTrades = 0;
    let lossTrades = 0;
    let totalProfitValue = 0;
    let totalLossValue = 0;

    for (let i = 0; i < trades.length - 1; i += 2) {
      const entry = trades[i];
      const exit = trades[i + 1];
      if (!entry || !exit) continue;

      const pnl = exit.price - entry.price;
      netPnL += pnl;

      if (pnl > 0) {
        profitableTrades++;
        totalProfitValue += pnl;
      }
      if (pnl < 0) {
        lossTrades++;
        totalLossValue += Math.abs(pnl);
      }

      if (pnl > maxProfit.value) {
        maxProfit = { value: pnl, entry, exit };
      }
      if (pnl < maxLoss.value) {
        maxLoss = { value: pnl, entry, exit };
      }

      results.push({ entry, exit, pnl });
    }

    const totalTrades = results.length;
    const winRate = totalTrades > 0 ? ((profitableTrades / totalTrades) * 100).toFixed(2) : 0;

    setPnlResults({ 
      results, 
      netPnL, 
      maxProfit, 
      maxLoss,
      profitableTrades,
      lossTrades,
      winRate,
      totalProfitValue,
      totalLossValue
    });
  };

  const sampleData = `Period	Time	Closing Price	Change	Volume
1	Sun, 11/17, 19:00	$233.40	+$0.00	314,937.689
2	Sun, 11/17, 20:00	$233.96	+$0.56	190,728.773
3	Sun, 11/17, 21:00	$233.48	$-0.48	209,209.63
4	Sun, 11/17, 22:00	$233.86	+$0.38	190,428.269
5	Sun, 11/17, 23:00	$232.74	$-1.12	158,095.099
6	Mon, 11/18, 00:00	$235.40	+$2.66	174,984.659`;

  const samplePnlData = `Period\tTime\tClosing Price\tChange\tVolume
1\tSun, 11/17, 19:00\t$233.40\t+$0.00\t314,937.689
2\tSun, 11/17, 20:00\t$233.96\t+$0.56\t190,728.773
3\tSun, 11/17, 21:00\t$233.48\t$-0.48\t209,209.63
4\tSun, 11/17, 22:00\t$233.86\t+$0.38\t190,428.269`;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '2.5em',
            color: '#2c3e50',
            margin: '0 0 10px 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            <BarChart3 style={{ verticalAlign: 'middle', marginRight: '10px' }} />
            Trading Strategy Analyzer
          </h1>
          <p style={{ color: '#7f8c8d', fontSize: '1.1em', margin: 0 }}>
            Find the best entry and exit points for maximum profit
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', marginBottom: '30px', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('analyzer')}
            style={{
              flex: 1,
              padding: '15px',
              fontSize: '1.1em',
              fontWeight: 'bold',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'analyzer' ? 'linear-gradient(135deg, #74b9ff, #0984e3)' : '#e9ecef',
              color: activeTab === 'analyzer' ? 'white' : '#2c3e50',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            📊 Paste Your Trading Data
          </button>
          <button
            onClick={() => setActiveTab('pnl')}
            style={{
              flex: 1,
              padding: '15px',
              fontSize: '1.1em',
              fontWeight: 'bold',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'pnl' ? 'linear-gradient(135deg, #fd79a8, #e84393)' : '#e9ecef',
              color: activeTab === 'pnl' ? 'white' : '#2c3e50',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            📊 Calculate PnL from Data
          </button>
        </div>

        {/* Content */}
        {activeTab === 'analyzer' ? (
          <>
            {/* Input Section */}
            <div style={{
              background: 'linear-gradient(135deg, #74b9ff, #0984e3)',
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '30px',
              color: 'white'
            }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3em' }}>
                📊 Paste Your Trading Data
              </h3>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  const paste = (e.clipboardData || window.clipboardData).getData('text');
                  setInputData(paste);
                }}
                placeholder={`Paste your data here in this format:\n\nPeriod	Time	Closing Price	Change	Volume\n1	Sun, 11/17, 19:00	$233.40	+$0.00	314,937.689\n2	Sun, 11/17, 20:00	$233.96	+$0.56	190,728.773\n3	Sun, 11/17, 21:00	$233.48	$-0.48	209,209.63\n4	Sun, 11/17, 22:00	$233.86	+$0.38	190,428.269\n5	Sun, 11/17, 23:00	$232.74	$-1.12	158,095.099\n6	Mon, 11/18, 00:00	$235.40	+$2.66	174,984.659\n\nJust copy your data and paste it here!`}
                style={{
                  width: '100%',
                  height: '140px',
                  padding: '15px',
                  borderRadius: '10px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  outline: 'none',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#2c3e50'
                }}
              />
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontSize: '12px'
              }}>
                💡 <strong>Tip:</strong> Copy your trading data and paste it directly in the text area above. 
                The app will automatically analyze and find the best entry/exit points!
              </div>
              <button
                onClick={analyzeData}
                disabled={loading || !inputData.trim()}
                style={{
                  marginTop: '15px',
                  marginRight: '10px',
                  padding: '12px 30px',
                  background: loading ? '#95a5a6' : 'linear-gradient(135deg, #00b894, #00a085)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  transform: loading ? 'none' : 'scale(1)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                  }
                }}
              >
                {loading ? '🔄 Analyzing...' : '🚀 Analyze Data'}
              </button>
              
              <button
                onClick={() => setInputData(`Period	Time	Closing Price	Change	Volume
1	Sun, 11/17, 19:00	$233.40	+$0.00	314,937.689
2	Sun, 11/17, 20:00	$233.96	+$0.56	190,728.773
3	Sun, 11/17, 21:00	$233.48	$-0.48	209,209.63
4	Sun, 11/17, 22:00	$233.86	+$0.38	190,428.269
5	Sun, 11/17, 23:00	$232.74	$-1.12	158,095.099
6	Mon, 11/18, 00:00	$235.40	+$2.66	174,984.659
7	Mon, 11/18, 01:00	$234.85	$-0.55	152,686.214
8	Mon, 11/18, 02:00	$235.42	+$0.57	174,935.147
9	Mon, 11/18, 03:00	$234.74	$-0.68	197,104.863
10	Mon, 11/18, 04:00	$237.47	+$2.73	239,350.042`)}
                style={{
                  marginTop: '15px',
                  padding: '12px 30px',
                  background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                }}
              >
                📝 Load Sample Data
              </button>
            </div>

            {/* Results */}
            {analysis && (
              <div>
                {/* Key Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #fd79a8, #e84393)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    textAlign: 'center',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>�� Maximum Profit</h4>
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                      ${analysis.maxProfit.toFixed(2)}
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    textAlign: 'center',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>📊 Total Trades</h4>
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                      {analysis.totalTrades}
                    </div>
                  </div>
                </div>

                {/* Best Entry/Exit Points */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  {/* Best Buy Point */}
                  <div style={{
                    background: 'linear-gradient(135deg, #00b894, #00a085)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center' }}>
                      <TrendingUp style={{ marginRight: '10px' }} />
                      🟢 Best Entry Point
                    </h3>
                    {analysis.bestBuyPoint && (
                      <div>
                        <p style={{ margin: '5px 0', fontSize: '1.1em' }}>
                          <Calendar style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                          <strong>{analysis.bestBuyPoint.day}, {analysis.bestBuyPoint.date}</strong>
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '1.1em' }}>
                          <Clock style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                          <strong>{analysis.bestBuyPoint.time}</strong>
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '1.2em', fontWeight: 'bold' }}>
                          <DollarSign style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                          ${analysis.bestBuyPoint.price.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Best Sell Point */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fd79a8, #e84393)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center' }}>
                      <TrendingDown style={{ marginRight: '10px' }} />
                      🔴 Best Exit Point
                    </h3>
                    {analysis.bestSellPoint && (
                      <div>
                        <p style={{ margin: '5px 0', fontSize: '1.1em' }}>
                          <Calendar style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                          <strong>{analysis.bestSellPoint.day}, {analysis.bestSellPoint.date}</strong>
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '1.1em' }}>
                          <Clock style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                          <strong>{analysis.bestSellPoint.time}</strong>
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '1.2em', fontWeight: 'bold' }}>
                          <DollarSign style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                          ${analysis.bestSellPoint.price.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Day & Time Analysis */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  {/* Best Days */}
                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    border: '2px solid #e9ecef'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📅 Best Days</h3>
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ color: '#00b894', fontWeight: 'bold' }}>Best Buy Day:</span>
                      <div style={{ fontSize: '1.2em', color: '#2c3e50', fontWeight: 'bold' }}>
                        {analysis.bestBuyDay} (Avg: ${analysis.dayAnalysis[analysis.bestBuyDay]?.avgPrice.toFixed(2)})
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#e84393', fontWeight: 'bold' }}>Best Sell Day:</span>
                      <div style={{ fontSize: '1.2em', color: '#2c3e50', fontWeight: 'bold' }}>
                        {analysis.bestSellDay} (Avg: ${analysis.dayAnalysis[analysis.bestSellDay]?.avgPrice.toFixed(2)})
                      </div>
                    </div>
                  </div>

                  {/* Best Times */}
                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    border: '2px solid #e9ecef'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>⏰ Best Times</h3>
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ color: '#00b894', fontWeight: 'bold' }}>Best Buy Time:</span>
                      <div style={{ fontSize: '1.2em', color: '#2c3e50', fontWeight: 'bold' }}>
                        {analysis.bestBuyTime} (Avg: ${analysis.timeAnalysis[analysis.bestBuyTime]?.avgPrice.toFixed(2)})
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#e84393', fontWeight: 'bold' }}>Best Sell Time:</span>
                      <div style={{ fontSize: '1.2em', color: '#2c3e50', fontWeight: 'bold' }}>
                        {analysis.bestSellTime} (Avg: ${analysis.timeAnalysis[analysis.bestSellTime]?.avgPrice.toFixed(2)})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategy Recommendation */}
                <div style={{
                  background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                  padding: '25px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }}>
                  <h2 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🎯 Strategy Recommendation</h2>
                  <div style={{ fontSize: '1.1em', color: '#2c3e50', lineHeight: '1.6' }}>
                    <p style={{ margin: '10px 0' }}>
                      <strong>💡 Entry Strategy:</strong> Buy on {analysis.bestBuyDay} at {analysis.bestBuyTime}
                    </p>
                    <p style={{ margin: '10px 0' }}>
                      <strong>💡 Exit Strategy:</strong> Sell on {analysis.bestSellDay} at {analysis.bestSellTime}
                    </p>
                    <p style={{ margin: '10px 0', fontSize: '1.2em', fontWeight: 'bold', color: '#e84393' }}>
                      Maximum Potential Profit: ${analysis.maxProfit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            {/* PnL Calculator Input */}
            <div style={{
              background: 'linear-gradient(135deg, #fd79a8, #e84393)',
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '30px'
            }}>
              <textarea
                value={pnlInput}
                onChange={(e) => setPnlInput(e.target.value)}
                placeholder={`Paste your data here (with or without header):\n\nPeriod\tTime\tClosing Price\tChange\tVolume\n1\tSun, 11/17, 19:00\t$233.40\t+$0.00\t314,937.689\n2\tSun, 11/17, 20:00\t$233.96\t+$0.56\t190,728.773`}
                style={{
                  width: '100%',
                  height: '150px',
                  padding: '15px',
                  marginBottom: '15px',
                  borderRadius: '10px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: 'white',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={calculatePnL}
                  style={{
                    padding: '12px 30px',
                    background: 'linear-gradient(135deg, #00b894, #00a085)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Calculate
                </button>
                <button
                  onClick={() => setPnlInput(samplePnlData)}
                  style={{
                    padding: '12px 30px',
                    background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  📝 Sample Data
                </button>
              </div>
            </div>

            {/* PnL Results */}
            {pnlResults && (
              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>PnL Analysis</h3>
                
                {/* Results Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Entry Date/Time</th>
                      <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>Entry Price</th>
                      <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Exit Date/Time</th>
                      <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>Exit Price</th>
                      <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pnlResults.results.map((result, index) => (
                      <tr key={index}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {result.entry.day}, {result.entry.date} {result.entry.time}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          ${result.entry.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {result.exit.day}, {result.exit.date} {result.exit.time}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          ${result.exit.price.toFixed(2)}
                        </td>
                        <td style={{
                          padding: '12px',
                          border: '1px solid #dee2e6',
                          textAlign: 'right',
                          color: result.pnl >= 0 ? '#00b894' : '#e84393',
                          fontWeight: 'bold'
                        }}>
                          {result.pnl >= 0 ? '+' : ''}{result.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '10px',
                  marginTop: '20px'
                }}>
                  {/* Trading Statistics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '20px',
                    padding: '15px',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#00b894', marginBottom: '5px' }}>
                        <strong>Profitable Trades: ✅</strong>
                      </div>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                        {pnlResults.profitableTrades} trades
                      </div>
                      <div style={{ color: '#00b894', fontSize: '1.1em', marginTop: '5px' }}>
                        +${pnlResults.totalProfitValue.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#e84393', marginBottom: '5px' }}>
                        <strong>Loss Trades: ❌</strong>
                      </div>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                        {pnlResults.lossTrades} trades
                      </div>
                      <div style={{ color: '#e84393', fontSize: '1.1em', marginTop: '5px' }}>
                        -${pnlResults.totalLossValue.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#6c5ce7', marginBottom: '5px' }}>
                        <strong>Win Rate:</strong>
                      </div>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                        {pnlResults.winRate}%
                      </div>
                      <div style={{ color: '#6c5ce7', fontSize: '1.1em', marginTop: '5px' }}>
                        ({pnlResults.profitableTrades}/{pnlResults.profitableTrades + pnlResults.lossTrades})
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '1.1em',
                    marginBottom: '10px',
                    color: pnlResults.netPnL >= 0 ? '#00b894' : '#e84393'
                  }}>
                    <strong>Net PnL:</strong> {pnlResults.netPnL >= 0 ? '+' : ''}{pnlResults.netPnL.toFixed(2)}
                  </div>

                  {pnlResults.maxProfit.value > -Infinity && (
                    <div style={{ color: '#00b894', marginBottom: '10px' }}>
                      <strong>Maximum Profit:</strong> +{pnlResults.maxProfit.value.toFixed(2)}
                      <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                        Entry: {pnlResults.maxProfit.entry.day}, {pnlResults.maxProfit.entry.date} {pnlResults.maxProfit.entry.time}
                        <br />
                        Exit: {pnlResults.maxProfit.exit.day}, {pnlResults.maxProfit.exit.date} {pnlResults.maxProfit.exit.time}
                      </div>
                    </div>
                  )}

                  {pnlResults.maxLoss.value < Infinity && (
                    <div style={{ color: '#e84393' }}>
                      <strong>Maximum Loss:</strong> {pnlResults.maxLoss.value.toFixed(2)}
                      <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                        Entry: {pnlResults.maxLoss.entry.day}, {pnlResults.maxLoss.entry.date} {pnlResults.maxLoss.entry.time}
                        <br />
                        Exit: {pnlResults.maxLoss.exit.day}, {pnlResults.maxLoss.exit.date} {pnlResults.maxLoss.exit.time}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingAnalyzer;