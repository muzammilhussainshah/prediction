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
          
          // Extract day and date from time info (e.g., "Sun, 11/17/23, 19:00")
          const timeMatchWithYear = timeInfo.match(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s*(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2})/);
          const timeMatchWithoutYear = timeInfo.match(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s*(\d{1,2}\/\d{1,2}),\s*(\d{1,2}:\d{2})/);
          
          const timeMatch = timeMatchWithYear || timeMatchWithoutYear;
          
          if (timeMatch) {
            const [, day, date, time] = timeMatch;
            
            // Convert date format if it has two-digit year
            let formattedDate = date;
            if (timeMatchWithYear) {
              // If date has YY format, convert to YYYY
              const [month, dayOfMonth, year] = date.split('/');
              formattedDate = `${month}/${dayOfMonth}/20${year}`;
            } else {
              // If no year, add current year
              formattedDate = date + "/23";
            }
            
            trades.push({
              period: parseInt(period),
              day,
              date: formattedDate,
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
        const matchWithYear = line.match(/(\d+)(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s*(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2})\*\*\$(\d+\.?\d*)\$?([\+\-]\$?\d+\.?\d*)\*\*(\d+(?:,\d+)*\.?\d*)/);
        const matchWithoutYear = line.match(/(\d+)(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s*(\d{1,2}\/\d{1,2}),\s*(\d{1,2}:\d{2})\*\*\$(\d+\.?\d*)\$?([\+\-]\$?\d+\.?\d*)\*\*(\d+(?:,\d+)*\.?\d*)/);
        
        const match = matchWithYear || matchWithoutYear;
        
        if (match) {
          const [, period, day, date, time, price, change, volume] = match;
          
          // Convert date format if it has two-digit year
          let formattedDate = date;
          if (matchWithYear) {
            // If date has YY format, convert to YYYY
            const [month, dayOfMonth, year] = date.split('/');
            formattedDate = `${month}/${dayOfMonth}/20${year}`;
          } else {
            // If no year, add current year
            formattedDate = date + "/23";
          }
          
          trades.push({
            period: parseInt(period),
            day,
            date: formattedDate,
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
        
        // Extract day and date from time info (e.g., "Sun, 11/17/23, 19:00")
        const timeMatchWithYear = timeInfo.match(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s*(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2})/);
        const timeMatchWithoutYear = timeInfo.match(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s*(\d{1,2}\/\d{1,2}),\s*(\d{1,2}:\d{2})/);
        
        const timeMatch = timeMatchWithYear || timeMatchWithoutYear;
        
        if (timeMatch) {
          const [, day, date, time] = timeMatch;
          
          // Convert date format if it has two-digit year
          let formattedDate = date;
          if (timeMatchWithYear) {
            // If date has YY format, convert to YYYY
            const [month, dayOfMonth, year] = date.split('/');
            formattedDate = `${month}/${dayOfMonth}/20${year}`;
          } else {
            // If no year, add current year
            formattedDate = date + "/23";
          }
          
          trades.push({
            period: parseInt(period),
            day,
            date: formattedDate,
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
    
    // For strategy analysis
    const profitableTradeDetails = [];
    const dayStats = {};
    const timeStats = {};

    for (let i = 0; i < trades.length - 1; i += 2) {
      const entry = trades[i];
      const exit = trades[i + 1];
      if (!entry || !exit) continue;

      const pnl = exit.price - entry.price;
      netPnL += pnl;

      // Track profitable trade details for strategy analysis
      if (pnl > 0) {
        profitableTrades++;
        totalProfitValue += pnl;
        profitableTradeDetails.push({ entry, exit, pnl });
        
        // Track day statistics
        dayStats[entry.day] = dayStats[entry.day] || { entries: 0, profitable: 0 };
        dayStats[entry.day].entries++;
        dayStats[entry.day].profitable++;
        
        // Track time statistics
        timeStats[entry.time] = timeStats[entry.time] || { entries: 0, profitable: 0 };
        timeStats[entry.time].entries++;
        timeStats[entry.time].profitable++;
      }
      if (pnl < 0) {
        lossTrades++;
        totalLossValue += Math.abs(pnl);
        
        // Track unsuccessful entries
        dayStats[entry.day] = dayStats[entry.day] || { entries: 0, profitable: 0 };
        dayStats[entry.day].entries++;
        
        timeStats[entry.time] = timeStats[entry.time] || { entries: 0, profitable: 0 };
        timeStats[entry.time].entries++;
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

    // Calculate strategy recommendations if win rate > 60%
    let strategyRecommendation = null;
    if (winRate > 60) {
      // Find best entry day
      const bestEntryDay = Object.entries(dayStats)
        .map(([day, stats]) => ({
          day,
          successRate: (stats.profitable / stats.entries) * 100
        }))
        .sort((a, b) => b.successRate - a.successRate)[0];

      // Find best entry time
      const bestEntryTime = Object.entries(timeStats)
        .map(([time, stats]) => ({
          time,
          successRate: (stats.profitable / stats.entries) * 100
        }))
        .sort((a, b) => b.successRate - a.successRate)[0];

      // Calculate average holding period for profitable trades
      const avgHoldingPeriod = profitableTradeDetails.reduce((acc, trade) => {
        const entryPeriod = trade.entry.period;
        const exitPeriod = trade.exit.period;
        return acc + (exitPeriod - entryPeriod);
      }, 0) / profitableTradeDetails.length;

      strategyRecommendation = {
        bestEntryDay,
        bestEntryTime,
        avgHoldingPeriod: Math.round(avgHoldingPeriod),
        sampleTrade: profitableTradeDetails.sort((a, b) => b.pnl - a.pnl)[0] // Most profitable trade as example
      };
    }

    // For market pattern analysis
    const patternAnalysis = {
      dayWise: {},
      timeWise: {},
      dateWise: {},
      periodPatterns: {}
    };

    // Initialize pattern tracking
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      
      // Day analysis
      if (!patternAnalysis.dayWise[trade.day]) {
        patternAnalysis.dayWise[trade.day] = {
          total: 0,
          profitable: 0,
          totalValue: 0,
          profitableValue: 0
        };
      }
      
      // Time analysis
      if (!patternAnalysis.timeWise[trade.time]) {
        patternAnalysis.timeWise[trade.time] = {
          total: 0,
          profitable: 0,
          totalValue: 0,
          profitableValue: 0
        };
      }
      
      // Date analysis (e.g., "11/17")
      if (!patternAnalysis.dateWise[trade.date]) {
        patternAnalysis.dateWise[trade.date] = {
          total: 0,
          profitable: 0,
          totalValue: 0,
          profitableValue: 0
        };
      }
    }

    // Analyze patterns in pairs
    for (let i = 0; i < trades.length - 1; i += 2) {
      const entry = trades[i];
      const exit = trades[i + 1];
      if (!entry || !exit) continue;

      const pnl = exit.price - entry.price;
      const isProfit = pnl > 0;

      // Update day statistics
      patternAnalysis.dayWise[entry.day].total++;
      patternAnalysis.dayWise[entry.day].totalValue += Math.abs(pnl);
      if (isProfit) {
        patternAnalysis.dayWise[entry.day].profitable++;
        patternAnalysis.dayWise[entry.day].profitableValue += pnl;
      }

      // Update time statistics
      patternAnalysis.timeWise[entry.time].total++;
      patternAnalysis.timeWise[entry.time].totalValue += Math.abs(pnl);
      if (isProfit) {
        patternAnalysis.timeWise[entry.time].profitable++;
        patternAnalysis.timeWise[entry.time].profitableValue += pnl;
      }

      // Update date statistics
      patternAnalysis.dateWise[entry.date].total++;
      patternAnalysis.dateWise[entry.date].totalValue += Math.abs(pnl);
      if (isProfit) {
        patternAnalysis.dateWise[entry.date].profitable++;
        patternAnalysis.dateWise[entry.date].profitableValue += pnl;
      }

      // Track period patterns (e.g., how many periods between entry and exit)
      const periodDiff = exit.period - entry.period;
      if (!patternAnalysis.periodPatterns[periodDiff]) {
        patternAnalysis.periodPatterns[periodDiff] = {
          total: 0,
          profitable: 0,
          totalValue: 0,
          profitableValue: 0
        };
      }
      patternAnalysis.periodPatterns[periodDiff].total++;
      patternAnalysis.periodPatterns[periodDiff].totalValue += Math.abs(pnl);
      if (isProfit) {
        patternAnalysis.periodPatterns[periodDiff].profitable++;
        patternAnalysis.periodPatterns[periodDiff].profitableValue += pnl;
      }
    }

    // Find high-probability patterns (>60% win rate)
    const highProbabilityPatterns = {
      days: Object.entries(patternAnalysis.dayWise)
        .map(([day, stats]) => ({
          day,
          winRate: (stats.profitable / stats.total) * 100,
          avgProfit: stats.profitable > 0 ? stats.profitableValue / stats.profitable : 0,
          totalTrades: stats.total
        }))
        .filter(pattern => pattern.winRate > 60 && pattern.totalTrades >= 3)
        .sort((a, b) => b.winRate - a.winRate),

      times: Object.entries(patternAnalysis.timeWise)
        .map(([time, stats]) => ({
          time,
          winRate: (stats.profitable / stats.total) * 100,
          avgProfit: stats.profitable > 0 ? stats.profitableValue / stats.profitable : 0,
          totalTrades: stats.total
        }))
        .filter(pattern => pattern.winRate > 60 && pattern.totalTrades >= 3)
        .sort((a, b) => b.winRate - a.winRate),

      periods: Object.entries(patternAnalysis.periodPatterns)
        .map(([period, stats]) => ({
          period: parseInt(period),
          winRate: (stats.profitable / stats.total) * 100,
          avgProfit: stats.profitable > 0 ? stats.profitableValue / stats.profitable : 0,
          totalTrades: stats.total
        }))
        .filter(pattern => pattern.winRate > 60 && pattern.totalTrades >= 3)
        .sort((a, b) => b.winRate - a.winRate)
    };

    // Deep analysis for entry/exit opportunities
    const entryExitAnalysis = {
      byDay: {},
      byTime: {},
      byDayAndTime: {}
    };

    // Initialize analysis objects
    trades.forEach(trade => {
      if (!entryExitAnalysis.byDay[trade.day]) {
        entryExitAnalysis.byDay[trade.day] = {
          entries: { count: 0, prices: [], successCount: 0 },
          exits: { count: 0, prices: [], successCount: 0 }
        };
      }
      if (!entryExitAnalysis.byTime[trade.time]) {
        entryExitAnalysis.byTime[trade.time] = {
          entries: { count: 0, prices: [], successCount: 0 },
          exits: { count: 0, prices: [], successCount: 0 }
        };
      }
      const dayTimeKey = `${trade.day}-${trade.time}`;
      if (!entryExitAnalysis.byDayAndTime[dayTimeKey]) {
        entryExitAnalysis.byDayAndTime[dayTimeKey] = {
          entries: { count: 0, prices: [], successCount: 0 },
          exits: { count: 0, prices: [], successCount: 0 }
        };
      }
    });

    // Analyze entry/exit patterns
    for (let i = 0; i < trades.length - 1; i += 2) {
      const entry = trades[i];
      const exit = trades[i + 1];
      if (!entry || !exit) continue;

      const pnl = exit.price - entry.price;
      const isProfit = pnl > 0;

      // Entry analysis
      entryExitAnalysis.byDay[entry.day].entries.count++;
      entryExitAnalysis.byDay[entry.day].entries.prices.push(entry.price);
      if (isProfit) entryExitAnalysis.byDay[entry.day].entries.successCount++;

      entryExitAnalysis.byTime[entry.time].entries.count++;
      entryExitAnalysis.byTime[entry.time].entries.prices.push(entry.price);
      if (isProfit) entryExitAnalysis.byTime[entry.time].entries.successCount++;

      const entryDayTimeKey = `${entry.day}-${entry.time}`;
      entryExitAnalysis.byDayAndTime[entryDayTimeKey].entries.count++;
      entryExitAnalysis.byDayAndTime[entryDayTimeKey].entries.prices.push(entry.price);
      if (isProfit) entryExitAnalysis.byDayAndTime[entryDayTimeKey].entries.successCount++;

      // Exit analysis
      entryExitAnalysis.byDay[exit.day].exits.count++;
      entryExitAnalysis.byDay[exit.day].exits.prices.push(exit.price);
      if (isProfit) entryExitAnalysis.byDay[exit.day].exits.successCount++;

      entryExitAnalysis.byTime[exit.time].exits.count++;
      entryExitAnalysis.byTime[exit.time].exits.prices.push(exit.price);
      if (isProfit) entryExitAnalysis.byTime[exit.time].exits.successCount++;

      const exitDayTimeKey = `${exit.day}-${exit.time}`;
      entryExitAnalysis.byDayAndTime[exitDayTimeKey].exits.count++;
      entryExitAnalysis.byDayAndTime[exitDayTimeKey].exits.prices.push(exit.price);
      if (isProfit) entryExitAnalysis.byDayAndTime[exitDayTimeKey].exits.successCount++;
    }

    // Find best opportunities (>60% win rate)
    const bestOpportunities = {
      entries: [],
      exits: []
    };

    // Analyze day-time combinations
    Object.entries(entryExitAnalysis.byDayAndTime).forEach(([dayTime, data]) => {
      const [day, time] = dayTime.split('-');
      
      // Entry analysis
      if (data.entries.count >= 3) {  // Minimum 3 trades for statistical significance
        const entryWinRate = (data.entries.successCount / data.entries.count) * 100;
        const avgEntryPrice = data.entries.prices.reduce((a, b) => a + b, 0) / data.entries.prices.length;
        
        if (entryWinRate > 60) {
          bestOpportunities.entries.push({
            day,
            time,
            winRate: entryWinRate,
            avgPrice: avgEntryPrice,
            tradeCount: data.entries.count
          });
        }
      }

      // Exit analysis
      if (data.exits.count >= 3) {
        const exitWinRate = (data.exits.successCount / data.exits.count) * 100;
        const avgExitPrice = data.exits.prices.reduce((a, b) => a + b, 0) / data.exits.prices.length;
        
        if (exitWinRate > 60) {
          bestOpportunities.exits.push({
            day,
            time,
            winRate: exitWinRate,
            avgPrice: avgExitPrice,
            tradeCount: data.exits.count
          });
        }
      }
    });

    // Sort by win rate
    bestOpportunities.entries.sort((a, b) => b.winRate - a.winRate);
    bestOpportunities.exits.sort((a, b) => b.winRate - a.winRate);

    setPnlResults({ 
      results, 
      netPnL, 
      maxProfit, 
      maxLoss,
      profitableTrades,
      lossTrades,
      winRate,
      totalProfitValue,
      totalLossValue,
      strategyRecommendation,
      highProbabilityPatterns,
      bestOpportunities
    });
  };

  const sampleData = `Period	Time	Closing Price	Change	Volume
110	Fri, 12/06/23, 00:00	$233.07	$-3.33	288,801.622
134	Sat, 12/07/23, 00:00	$239.70	+$0.78	121,374.04
278	Fri, 12/13/23, 00:00	$227.24	$-4.17	327,873.152
302	Sat, 12/14/23, 00:00	$223.28	+$1.17	68,710.402
446	Fri, 12/20/23, 00:00	$191.88	$-2.85	770,640.759
470	Sat, 12/21/23, 00:00	$191.63	+$1.05	189,089.641`;

  const samplePnlData = `Period\tTime\tClosing Price\tChange\tVolume
1\tSun, 11/17/23, 19:00\t$233.40\t+$0.00\t314,937.689
2\tSun, 11/17/23, 20:00\t$233.96\t+$0.56\t190,728.773
3\tSun, 11/17/23, 21:00\t$233.48\t$-0.48\t209,209.63
4\tSun, 11/17/23, 22:00\t$233.86\t+$0.38\t190,428.269`;

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
                placeholder={`Paste your data here in this format:\n\nPeriod	Time	Closing Price	Change	Volume
1	Sun, 11/17/23, 19:00	$233.40	+$0.00	314,937.689
2	Sun, 11/17/23, 20:00	$233.96	+$0.56	190,728.773
3	Sun, 11/17/23, 21:00	$233.48	$-0.48	209,209.63
4	Sun, 11/17/23, 22:00	$233.86	+$0.38	190,428.269
5	Sun, 11/17/23, 23:00	$232.74	$-1.12	158,095.099
6	Mon, 11/18/23, 00:00	$235.40	+$2.66	174,984.659\n\nJust copy your data and paste it here!`}
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
1	Sun, 11/17/23, 19:00	$233.40	+$0.00	314,937.689
2	Sun, 11/17/23, 20:00	$233.96	+$0.56	190,728.773
3	Sun, 11/17/23, 21:00	$233.48	$-0.48	209,209.63
4	Sun, 11/17/23, 22:00	$233.86	+$0.38	190,428.269
5	Sun, 11/17/23, 23:00	$232.74	$-1.12	158,095.099
6	Mon, 11/18/23, 00:00	$235.40	+$2.66	174,984.659
7	Mon, 11/18/23, 01:00	$234.85	$-0.55	152,686.214
8	Mon, 11/18/23, 02:00	$235.42	+$0.57	174,935.147
9	Mon, 11/18/23, 03:00	$234.74	$-0.68	197,104.863
10	Mon, 11/18/23, 04:00	$237.47	+$2.73	239,350.042`)}
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
                placeholder={`Paste your data here (with or without header):\n\nPeriod\tTime\tClosing Price\tChange\tVolume
1\tSun, 11/17/23, 19:00\t$233.40\t+$0.00\t314,937.689
2\tSun, 11/17/23, 20:00\t$233.96\t+$0.56\t190,728.773
3\tSun, 11/17/23, 21:00\t$233.48\t$-0.48\t209,209.63
4\tSun, 11/17/23, 22:00\t$233.86\t+$0.38\t190,428.269`}
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

                   {/* Strategy Recommendation for High Win Rate */}
                   {pnlResults.strategyRecommendation && (
                     <div style={{
                       marginTop: '20px',
                       padding: '20px',
                       background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
                       borderRadius: '10px',
                       color: 'white'
                     }}>
                       <h3 style={{ 
                         marginBottom: '15px',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '10px'
                       }}>
                         🎯 High-Rate Strategy ({pnlResults.winRate}%)
                       </h3>
                       
                       <div style={{
                         background: 'rgba(255,255,255,0.1)',
                         padding: '15px',
                         borderRadius: '8px',
                         marginBottom: '15px'
                       }}>
                         <p style={{ marginBottom: '10px' }}>
                           <strong>Best Entry Day:</strong> {pnlResults.strategyRecommendation.bestEntryDay.day}
                           <span style={{ 
                             marginLeft: '10px',
                             background: '#00b894',
                             padding: '2px 8px',
                             borderRadius: '12px',
                             fontSize: '0.9em'
                           }}>
                             {pnlResults.strategyRecommendation.bestEntryDay.successRate.toFixed(1)}% success
                           </span>
                         </p>
                         <p style={{ marginBottom: '10px' }}>
                           <strong>Best Entry Time:</strong> {pnlResults.strategyRecommendation.bestEntryTime.time}
                           <span style={{ 
                             marginLeft: '10px',
                             background: '#00b894',
                             padding: '2px 8px',
                             borderRadius: '12px',
                             fontSize: '0.9em'
                           }}>
                             {pnlResults.strategyRecommendation.bestEntryTime.successRate.toFixed(1)}% success
                           </span>
                         </p>
                         <p>
                           <strong>Average Holding Period:</strong> {pnlResults.strategyRecommendation.avgHoldingPeriod} periods
                         </p>
                       </div>

                       <div style={{
                         background: 'rgba(255,255,255,0.1)',
                         padding: '15px',
                         borderRadius: '8px'
                       }}>
                         <p style={{ marginBottom: '10px', color: '#ffeaa7' }}>
                           <strong>💡 Recommended Strategy:</strong>
                         </p>
                         <ol style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                           <li>Enter trades on {pnlResults.strategyRecommendation.bestEntryDay.day} around {pnlResults.strategyRecommendation.bestEntryTime.time}</li>
                           <li>Hold position for approximately {pnlResults.strategyRecommendation.avgHoldingPeriod} periods</li>
                           <li>Use strict stop-loss to maintain high win rate</li>
                         </ol>
                         
                         <div style={{ 
                           marginTop: '15px',
                           padding: '10px',
                           background: 'rgba(255,255,255,0.05)',
                           borderRadius: '6px',
                           fontSize: '0.9em'
                         }}>
                           <p style={{ color: '#ffeaa7' }}>
                             <strong>Sample Successful Trade:</strong>
                           </p>
                           <p>
                             Entry: {pnlResults.strategyRecommendation.sampleTrade.entry.day}, {pnlResults.strategyRecommendation.sampleTrade.entry.date} at {pnlResults.strategyRecommendation.sampleTrade.entry.time} (${pnlResults.strategyRecommendation.sampleTrade.entry.price.toFixed(2)})
                           </p>
                           <p>
                             Exit: {pnlResults.strategyRecommendation.sampleTrade.exit.day}, {pnlResults.strategyRecommendation.sampleTrade.exit.date} at {pnlResults.strategyRecommendation.sampleTrade.exit.time} (${pnlResults.strategyRecommendation.sampleTrade.exit.price.toFixed(2)})
                           </p>
                           <p style={{ color: '#00b894', marginTop: '5px' }}>
                             Profit: +${pnlResults.strategyRecommendation.sampleTrade.pnl.toFixed(2)}
                           </p>
                         </div>
                       </div>
                     </div>
                   )}

                    {/* Market Pattern Insights */}
                    {pnlResults.highProbabilityPatterns && (
                      <div style={{
                        marginTop: '20px',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                        borderRadius: '10px',
                        color: 'white'
                      }}>
                        <h3 style={{ 
                          marginBottom: '20px',
                          fontSize: '1.4em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          📊 Market Pattern Insights
                        </h3>

                        {/* High-Probability Days */}
                        {pnlResults.highProbabilityPatterns.days.length > 0 && (
                          <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '15px'
                          }}>
                            <h4 style={{ marginBottom: '10px', color: '#ffeaa7' }}>
                              🗓️ High-Probability Trading Days
                            </h4>
                            {pnlResults.highProbabilityPatterns.days.map((pattern, index) => (
                              <div key={index} style={{
                                marginBottom: '10px',
                                padding: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '6px'
                              }}>
                                <strong>{pattern.day}:</strong>
                                <span style={{
                                  marginLeft: '10px',
                                  color: '#00b894'
                                }}>
                                  {pattern.winRate.toFixed(1)}% win rate
                                </span>
                                <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                                  (Avg. Profit: ${pattern.avgProfit.toFixed(2)}, {pattern.totalTrades} trades)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* High-Probability Times */}
                        {pnlResults.highProbabilityPatterns.times.length > 0 && (
                          <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '15px'
                          }}>
                            <h4 style={{ marginBottom: '10px', color: '#ffeaa7' }}>
                              ⏰ High-Probability Trading Times
                            </h4>
                            {pnlResults.highProbabilityPatterns.times.map((pattern, index) => (
                              <div key={index} style={{
                                marginBottom: '10px',
                                padding: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '6px'
                              }}>
                                <strong>{pattern.time}:</strong>
                                <span style={{
                                  marginLeft: '10px',
                                  color: '#00b894'
                                }}>
                                  {pattern.winRate.toFixed(1)}% win rate
                                </span>
                                <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                                  (Avg. Profit: ${pattern.avgProfit.toFixed(2)}, {pattern.totalTrades} trades)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Optimal Trading Periods */}
                        {pnlResults.highProbabilityPatterns.periods.length > 0 && (
                          <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '15px'
                          }}>
                            <h4 style={{ marginBottom: '10px', color: '#ffeaa7' }}>
                              ⌛ Optimal Holding Periods
                            </h4>
                            {pnlResults.highProbabilityPatterns.periods.map((pattern, index) => (
                              <div key={index} style={{
                                marginBottom: '10px',
                                padding: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '6px'
                              }}>
                                <strong>{pattern.period} periods:</strong>
                                <span style={{
                                  marginLeft: '10px',
                                  color: '#00b894'
                                }}>
                                  {pattern.winRate.toFixed(1)}% win rate
                                </span>
                                <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                                  (Avg. Profit: ${pattern.avgProfit.toFixed(2)}, {pattern.totalTrades} trades)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Written Analysis */}
                        <div style={{
                          marginTop: '20px',
                          padding: '15px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          lineHeight: '1.6'
                        }}>
                          <h4 style={{ marginBottom: '10px', color: '#ffeaa7' }}>
                            📝 Pattern Analysis Summary
                          </h4>
                          <div style={{ fontSize: '0.95em' }}>
                            {pnlResults.highProbabilityPatterns.days.length > 0 && (
                              <p style={{ marginBottom: '10px' }}>
                                <strong>Best Trading Days:</strong> {pnlResults.highProbabilityPatterns.days.map(p => 
                                  `${p.day} (${p.winRate.toFixed(1)}%)`).join(', ')}
                              </p>
                            )}
                            {pnlResults.highProbabilityPatterns.times.length > 0 && (
                              <p style={{ marginBottom: '10px' }}>
                                <strong>Best Trading Times:</strong> {pnlResults.highProbabilityPatterns.times.map(p => 
                                  `${p.time} (${p.winRate.toFixed(1)}%)`).join(', ')}
                              </p>
                            )}
                            {pnlResults.highProbabilityPatterns.periods.length > 0 && (
                              <p style={{ marginBottom: '10px' }}>
                                <strong>Best Holding Periods:</strong> {pnlResults.highProbabilityPatterns.periods.map(p => 
                                  `${p.period} periods (${p.winRate.toFixed(1)}%)`).join(', ')}
                              </p>
                            )}
                            <p style={{ marginTop: '15px', color: '#ffeaa7' }}>
                              💡 <strong>Key Insight:</strong> The most consistent profits appear when trading 
                              {pnlResults.highProbabilityPatterns.days.length > 0 ? ` on ${pnlResults.highProbabilityPatterns.days[0].day}` : ''}
                              {pnlResults.highProbabilityPatterns.times.length > 0 ? ` around ${pnlResults.highProbabilityPatterns.times[0].time}` : ''}
                              {pnlResults.highProbabilityPatterns.periods.length > 0 ? ` with ${pnlResults.highProbabilityPatterns.periods[0].period}-period holds` : ''}.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Best Trading Opportunities Analysis */}
                    {pnlResults.bestOpportunities && (
                      <div style={{
                        marginTop: '20px',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                        borderRadius: '10px',
                        color: 'white'
                      }}>
                        <h3 style={{ 
                          marginBottom: '20px',
                          fontSize: '1.4em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          🎯 High-Probability Trading Opportunities
                        </h3>

                        {/* Best Entry Opportunities */}
                        {pnlResults.bestOpportunities.entries.length > 0 && (
                          <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '15px'
                          }}>
                            <h4 style={{ marginBottom: '10px', color: '#ffeaa7' }}>
                              📈 Best Buying Opportunities
                            </h4>
                            <div style={{ marginBottom: '15px' }}>
                              <strong>Top Recommendation:</strong>
                              <p style={{ marginTop: '5px', color: '#00b894' }}>
                                Consider buying on {pnlResults.bestOpportunities.entries[0].day} around {pnlResults.bestOpportunities.entries[0].time}
                                <span style={{ 
                                  marginLeft: '10px',
                                  background: '#00b894',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.9em',
                                  color: 'white'
                                }}>
                                  {pnlResults.bestOpportunities.entries[0].winRate.toFixed(1)}% success rate
                                </span>
                              </p>
                              <p style={{ fontSize: '0.9em', marginTop: '5px', color: '#dfe6e9' }}>
                                Based on {pnlResults.bestOpportunities.entries[0].tradeCount} trades
                                with average entry price: ${pnlResults.bestOpportunities.entries[0].avgPrice.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Best Exit Opportunities */}
                        {pnlResults.bestOpportunities.exits.length > 0 && (
                          <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '15px'
                          }}>
                            <h4 style={{ marginBottom: '10px', color: '#ffeaa7' }}>
                              📉 Best Selling Opportunities
                            </h4>
                            <div style={{ marginBottom: '15px' }}>
                              <strong>Top Recommendation:</strong>
                              <p style={{ marginTop: '5px', color: '#00b894' }}>
                                Consider selling on {pnlResults.bestOpportunities.exits[0].day} around {pnlResults.bestOpportunities.exits[0].time}
                                <span style={{ 
                                  marginLeft: '10px',
                                  background: '#00b894',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.9em',
                                  color: 'white'
                                }}>
                                  {pnlResults.bestOpportunities.exits[0].winRate.toFixed(1)}% success rate
                                </span>
                              </p>
                              <p style={{ fontSize: '0.9em', marginTop: '5px', color: '#dfe6e9' }}>
                                Based on {pnlResults.bestOpportunities.exits[0].tradeCount} trades
                                with average exit price: ${pnlResults.bestOpportunities.exits[0].avgPrice.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Detailed Analysis */}
                        <div style={{
                          marginTop: '20px',
                          padding: '15px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          lineHeight: '1.6'
                        }}>
                          <h4 style={{ marginBottom: '10px', color: '#ffeaa7' }}>
                            📊 Detailed Pattern Analysis
                          </h4>
                          <p style={{ marginBottom: '10px' }}>
                            <strong>Entry Pattern:</strong> Historical data shows that trades opened on
                            {pnlResults.bestOpportunities.entries.length > 0 ? 
                              ` ${pnlResults.bestOpportunities.entries[0].day} around ${pnlResults.bestOpportunities.entries[0].time}` : 
                              ' specific days'} have the highest success rate.
                          </p>
                          <p style={{ marginBottom: '10px' }}>
                            <strong>Exit Pattern:</strong> The most profitable exits occur on
                            {pnlResults.bestOpportunities.exits.length > 0 ? 
                              ` ${pnlResults.bestOpportunities.exits[0].day} around ${pnlResults.bestOpportunities.exits[0].time}` : 
                              ' specific days'}.
                          </p>
                          <p style={{ marginTop: '15px', color: '#ffeaa7' }}>
                            💡 <strong>Key Insight:</strong> The analysis is based on patterns with more than 60% win rate
                            and at least 3 trades for statistical significance.
                          </p>
                        </div>
                      </div>
                    )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingAnalyzer;