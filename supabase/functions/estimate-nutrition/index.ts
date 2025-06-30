
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foodQuery } = await req.json();

    if (!foodQuery) {
      return new Response(JSON.stringify({ error: 'Food query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Estimating nutrition for:', foodQuery);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert. Given a food item or meal description, provide accurate nutrition estimates. Always respond with ONLY a valid JSON array containing 1-3 variations of the food item with different serving sizes. Each object should have exactly these fields:
            - name: string (descriptive name)
            - calories: number
            - protein: number (grams)
            - carbs: number (grams) 
            - fat: number (grams)
            - serving_size: string (e.g., "100g", "1 cup", "1 medium")
            
            Example response format:
            [
              {
                "name": "Banana - medium",
                "calories": 105,
                "protein": 1.3,
                "carbs": 27,
                "fat": 0.4,
                "serving_size": "1 medium (118g)"
              }
            ]`
          },
          {
            role: 'user',
            content: `Estimate nutrition for: ${foodQuery}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const nutritionText = data.choices[0].message.content.trim();
    
    console.log('OpenAI response:', nutritionText);

    // Parse the JSON response
    let nutritionData;
    try {
      nutritionData = JSON.parse(nutritionText);
    } catch (parseError) {
      console.error('Failed to parse nutrition data:', parseError);
      // Fallback response
      nutritionData = [{
        name: `${foodQuery} (estimated)`,
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 3,
        serving_size: "100g"
      }];
    }

    // Ensure it's an array
    if (!Array.isArray(nutritionData)) {
      nutritionData = [nutritionData];
    }

    return new Response(JSON.stringify({ results: nutritionData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in estimate-nutrition function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to estimate nutrition',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
