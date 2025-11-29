'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Lightbulb, AlertTriangle, TrendingUp, Package, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestions = [
  { icon: TrendingUp, text: 'Analyze inventory trends', prompt: 'Analyze the current inventory trends and identify any patterns' },
  { icon: Package, text: 'Find low stock items', prompt: 'Show me all products that are below minimum stock levels' },
  { icon: AlertTriangle, text: 'Predict supply issues', prompt: 'Predict potential supply chain disruptions for next month' },
  { icon: Zap, text: 'Optimize warehouse', prompt: 'Suggest optimizations for warehouse space utilization' },
];

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I\'m your AI Copilot for warehouse management. I can help you analyze inventory, predict demand, optimize operations, and answer questions about your warehouse data. How can I assist you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        'inventory': 'Based on my analysis of your inventory data:\n\n📊 **Current Status:**\n- Total SKUs: 12,847\n- Low stock items: 23 (require attention)\n- Overstock items: 8\n\n📈 **Trends:**\n- Electronics category showing 15% increase in demand\n- Q4 seasonal items need restocking\n\n💡 **Recommendations:**\n1. Reorder Industrial Sensor A1 within 5 days\n2. Consider promotions for overstock items\n3. Prepare for holiday season demand spike',
        'low stock': 'I found **23 products** below minimum stock levels:\n\n🔴 **Critical (0-25% stock):**\n- Safety Gloves XL (0 units) - Main DC\n- Steel Bracket Type B (85/100 units) - North Hub\n\n🟡 **Warning (25-50% stock):**\n- Pneumatic Valve V5 (120/150 units)\n- Cable Assembly C12 (180/300 units)\n\n📋 **Recommended Actions:**\n1. Urgent reorder for Safety Gloves XL\n2. Schedule restocking for 5 other items this week',
        'supply': 'Based on geopolitical analysis and supplier data:\n\n⚠️ **Potential Disruptions:**\n\n1. **Asian Electronics Supply** (Medium Risk)\n   - Shipping delays expected: 2-3 weeks\n   - Affected products: Sensors, Controllers\n\n2. **European Steel** (Low Risk)\n   - Minor price fluctuations expected\n   - Consider bulk ordering\n\n✅ **Mitigation Strategies:**\n- Diversify suppliers for critical components\n- Increase safety stock by 15%\n- Negotiate expedited shipping options',
        'optimize': '🏭 **Warehouse Optimization Analysis:**\n\n**Current Utilization:** 78.3%\n\n📍 **Space Recommendations:**\n1. Zone A: Consolidate slow-moving items (-12% space)\n2. Zone B: Expand for high-turnover products (+8% space)\n3. Zone C: Implement vertical storage (+20% capacity)\n\n🚀 **Efficiency Gains:**\n- Estimated pick time reduction: 18%\n- Travel distance optimization: 25%\n- Projected cost savings: $45,000/year\n\nWould you like a detailed implementation plan?',
      };

      let response = 'I\'d be happy to help with that! Based on your warehouse data, I can provide detailed analysis. Could you please specify what aspect you\'d like me to focus on?\n\nI can help with:\n- Inventory analysis and forecasting\n- Supply chain risk assessment\n- Warehouse optimization\n- Order fulfillment optimization';
      
      for (const [key, value] of Object.entries(responses)) {
        if (messageText.toLowerCase().includes(key)) { response = value; break; }
      }

      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bot className="h-7 w-7 text-cyan-400" />
          AI Copilot
        </h1>
        <p className="text-gray-400 mt-1">Intelligent assistant for warehouse operations</p>
      </div>

      {/* Quick Suggestions */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => handleSend(s.prompt)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg text-sm text-gray-300 whitespace-nowrap">
              <s.icon className="h-4 w-4 text-cyan-400" /> {s.text}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0"><Bot className="h-5 w-5 text-cyan-400" /></div>}
            <div className={`max-w-[70%] rounded-xl p-4 ${m.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-gray-100'}`}>
              <div className="whitespace-pre-wrap text-sm">{m.content}</div>
              <div className={`text-xs mt-2 ${m.role === 'user' ? 'text-cyan-200' : 'text-gray-500'}`}>{m.timestamp.toLocaleTimeString()}</div>
            </div>
            {m.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0"><User className="h-5 w-5 text-gray-400" /></div>}
          </div>
        ))}
        {isTyping && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center"><Bot className="h-5 w-5 text-cyan-400" /></div><div className="bg-slate-800 rounded-xl p-4"><div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} /></div></div></div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask me anything about your warehouse..." className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
          <button onClick={() => handleSend()} disabled={!input.trim()} className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg"><Send className="h-5 w-5" /></button>
        </div>
      </div>
    </div>
  );
}
