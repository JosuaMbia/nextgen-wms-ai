import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-test',
});

export async function POST(request: NextRequest) {
  try {
    const { message, tenantId } = await request.json();

    if (!message || !tenantId) {
      return NextResponse.json(
        { error: 'Message and tenantId are required' },
        { status: 400 }
      );
    }

    // Mock warehouse data (will be replaced with real database queries)
    const mockContext = {
      warehouses: 4,
      products: 12,
      lowStockItems: 3
    };

    // Build context for AI
    const context = `
You are a WMS AI assistant. Current warehouse data:
- Warehouses: ${mockContext.warehouses}
- Products: ${mockContext.products}
- Low stock items: ${mockContext.lowStockItems}

User query: ${message}
    `;

    // Call OpenAI only if API key is configured
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-test') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an intelligent WMS assistant. Provide concise, actionable responses.'
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return NextResponse.json({
        success: true,
        message: completion.choices[0].message.content
      });
    } else {
      // Fallback response when API key is not configured
      return NextResponse.json({
        success: true,
        message: `I've received your query: "${message}". OpenAI API key not configured yet. Currently tracking ${mockContext.warehouses} warehouses, ${mockContext.products} products, with ${mockContext.lowStockItems} items below minimum stock levels. Please configure OPENAI_API_KEY environment variable for full AI responses.`
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'AI processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
