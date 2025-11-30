'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, AlertTriangle, TrendingUp, Package, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestions = [
  { icon: TrendingUp, text: 'Analyze inventory trends', prompt: 'Analyze the current inventory trends and identify any patterns' },
  { icon: Package, text: 'Show low stock items', prompt: 'Show me all products that are below minimum stock levels' },
  { icon: AlertTriangle, text: 'Predict supply issues', prompt: 'Predict potential supply chain disruptions for next month' },
  { icon: Zap, text: 'Optimize warehouse', prompt: 'Suggest optimization strategies for warehouse space utilization' },
];

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I\'m your AI Copilot for warehouse management. I can help you analyze inventory, predict demand, optimize operations, and answer questions about your warehouse data. How can I assist you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        'inventory': 'Based on my analysis of your inventory data:\n\n📊 **Current Status:**\n- Total warehouses: 4\n- Active products: 12\n- Low stock items: 3 (requires attention!)\n\n⚠️ **Critical Insights:**\n- Warehouse WH-001 capacity at 85%\n- Organic Almonds stock critically low (20 units)\n- Premium Steel Containers inventory decreasing 15%/week\n\n💡 **Recommendations:**\n1. Reorder Organic Almonds immediately\n2. Allocate 200 sq ft additional space in WH-002\n3. Review procurement schedule for Electronics category',
        'low stock': '🔴 **Low Stock Alert Report**\n\nI found **3 products** below minimum stock levels:\n\n1. **Organic Almonds** (P-002)\n   - Current: 20 units\n   - Minimum: 50 units\n   - Status: **CRITICAL**\n   - Action: Order 100 units immediately\n\n2. **Premium Steel Containers** (P-003)\n   - Current: 45 units\n   - Minimum: 75 units\n   - Status: **WARNING**\n   - Action: Schedule reorder within 3 days\n\n3. **Industrial Cleaning Agents** (P-007)\n   - Current: 12 units\n   - Minimum: 25 units\n   - Status: **WARNING**\n   - Action: Monitor and reorder if needed\n\n📈 **Total Value at Risk:** $12,345\n✅ **Automated POs:** 2 pending approval',
        'supply': '🌐 **Supply Chain Forecast - Next 30 Days**\n\nBased on historical data and current trends:\n\n**HIGH RISK:**\n- Electronics category (China delays)\n- Organic products (seasonal availability)\n- Shipping delays expected: 2-3 days\n\n**MEDIUM RISK:**\n- Steel materials (price volatility)\n- Zone A capacity reaching limit\n\n**LOW RISK:**\n- General warehouse supplies\n- Local supplier products\n\n💡 **Proactive Recommendations:**\n1. Buffer stock: +15% for Electronics\n2. Alternative suppliers: Evaluate 2-3 options\n3. Pre-order organic items before season peak\n\n📊 **Confidence:** 87% (based on 18 months data)',
        'optimize': '🎯 **Warehouse Optimization Strategy**\n\n**Current Utilization:**\n- Zone A (WH-001): 85% (⚠️ High)\n- Zone B (WH-002): 60% (✅ Optimal)\n- Zone C (WH-003): 40% (💡 Underutilized)\n\n**Recommendations:**\n\n1. **Immediate Actions:**\n   - Move 100 units from Zone A → Zone C\n   - Consolidate slow-moving items\n   - Implement vertical racking (+20% capacity)\n\n2. **Short-term (30 days):**\n   - ABC analysis reorganization\n   - Optimize picking routes (-15% time)\n   - Cross-docking for high-turnover SKUs\n\n3. **Long-term (90 days):**\n   - Automation feasibility study\n   - WMS integration with AI routing\n   - Digital twin implementation\n\n💰 **Expected Savings:** $25K/year\n⏱️ **Efficiency Gain:** +22%'
      };

      let responseContent = 'I\'m ready to help with your warehouse operations! You can ask me about:';
      for (const [key, value] of Object.entries(responses)) {
        if (messageText.toLowerCase().includes(key)) {
          responseContent = value;
          break;
        }
      }

      const response: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseContent, timestamp: new Date() };
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="h-7 w-7 text-cyan-500" />
          AI Copilot
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Intelligent assistant for warehouse management - Powered by GPT-4
        </p>
      </div>

      {/* Suggestions (only show when empty) */}
      {messages.length === 1 && (
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 font-medium">Try asking about:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(suggestion.prompt)}
                className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-all text-left group"
              >
                <suggestion.icon className="h-5 w-5 text-cyan-600 mt-0.5 group-hover:text-cyan-700" />
                <div>
                  <div className="font-medium text-slate-900 group-hover:text-cyan-700">{suggestion.text}</div>
                  <div className="text-xs text-slate-500 mt-1">{suggestion.prompt}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-cyan-500' : 'bg-slate-700'
              }`}>
                {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
              </div>
              <div>
                <div className={`rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white text-slate-900 border border-slate-200'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
                <div className="text-xs text-slate-500 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[70%]">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div className="bg-white rounded-lg px-4 py-3 border border-slate-200">
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(input)}
            placeholder="Ask about warehouses, inventory, orders..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
