import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { WarehouseService } from '@/lib/services/WarehouseService';
import { ProductService } from '@/lib/services/ProductService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const warehouseService = new WarehouseService();
const productService = new ProductService();

export async function POST(request: NextRequest) {
  try {
    const { message, tenantId } = await request.json();

    if (!message || !tenantId) {
      return NextResponse.json(
        { error: 'Message and tenantId are required' },
        { status: 400 }
      );
    }

    // Get context from database
    const warehouses = await warehouseService.listWarehouses(tenantId);
    const products = await productService.listProducts(tenantId);

    // Build context for AI
    const context = `
You are a WMS AI assistant. Current warehouse data:
- Warehouses: ${warehouses.length}
- Products: ${products.length}
- Low stock items: ${products.filter((p: any) => p.quantity < (p.minStock || 100)).length}

User query: ${message}
    `;

    // Call OpenAI
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
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'AI processing failed' },
      { status: 500 }
    );
  }
}
