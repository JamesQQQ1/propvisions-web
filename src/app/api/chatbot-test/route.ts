// Test endpoint to verify chatbot frontend works
// Use this to test without n8n: Change ChatBox to POST to /api/chatbot-test

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[chatbot-test] Test endpoint called');

  const body = await request.json();
  console.log('[chatbot-test] Request body:', body);

  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return mock response matching your n8n format
  const mockResponse = [
    {
      message: "Impact of Changing Guide Price to £350,000\n\nNew purchase price: £350,000\nIncrease of £50,000 from original price\n\nNew SDLT: £13,416.67\nIncrease of £1,916.67\n\nNew all-in cost: £486,488.87\nIncrease of £51,916.67\n\nNew gross yield on cost: 4.55%\nDecrease of 0.54 percentage points\n\nNew net yield on cost: 3.41%\nDecrease of 0.4 percentage points\n\nDSCR month 1 remains at 1.2\nNo change in debt service coverage ratio\n\nThe increase in guide price results in higher upfront costs and a reduction in both gross and net yield percentages.\n\nWhat else would you like to consider?",
      run_id: "57ecba68-acd9-4587-b8c1-4db2594e4ce9",
      property_id: body.property_id
    }
  ];

  console.log('[chatbot-test] Returning mock response');
  return NextResponse.json(mockResponse);
}
