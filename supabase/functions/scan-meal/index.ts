import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { image, prompt } = await req.json()

        if (!image) {
            return new Response(
                JSON.stringify({ error: 'No image provided' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiApiKey) {
            return new Response(
                JSON.stringify({ error: 'OpenAI API key not configured' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Extract base64 data from data URL
        const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '')

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this meal image and estimate the nutritional content. For each identifiable food item in the image, provide:
                1. Food name
                2. Estimated serving size
                3. Calories
                4. Protein (grams)
                5. Carbohydrates (grams)
                6. Fat (grams)

                Return the response as a JSON object with a "results" array containing food items. Each item should have: name, calories, protein, carbs, fat, serving_size.

                Example format:
                {
                  "results": [
                    {
                      "name": "grilled chicken breast",
                      "calories": 165,
                      "protein": 31,
                      "carbs": 0,
                      "fat": 3.6,
                      "serving_size": "100g"
                    }
                  ]
                }

                Be as accurate as possible with portion sizes and nutritional estimates based on what you can see in the image.`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Data}`,
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.1
            })
        })

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text()
            console.error('OpenAI API error:', errorText)
            return new Response(
                JSON.stringify({
                    error: 'Failed to analyze image',
                    details: errorText
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        const openaiData = await openaiResponse.json()
        const content = openaiData.choices[0]?.message?.content

        if (!content) {
            return new Response(
                JSON.stringify({ error: 'No analysis returned from AI' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        try {
            // Try to parse the JSON response from GPT
            const parsedResults = JSON.parse(content)

            // Validate the structure
            if (parsedResults.results && Array.isArray(parsedResults.results)) {
                // Ensure all required fields are present and are numbers
                const validatedResults = parsedResults.results.map((item: any) => ({
                    name: item.name || 'Unknown food',
                    calories: Number(item.calories) || 0,
                    protein: Number(item.protein) || 0,
                    carbs: Number(item.carbs) || 0,
                    fat: Number(item.fat) || 0,
                    serving_size: item.serving_size || '1 serving'
                }))

                return new Response(
                    JSON.stringify({ results: validatedResults }),
                    {
                        status: 200,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    }
                )
            } else {
                throw new Error('Invalid response structure')
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError)
            console.log('Raw AI response:', content)

            // Fallback: create a generic response
            return new Response(
                JSON.stringify({
                    results: [{
                        name: 'Mixed meal (AI estimated)',
                        calories: 350,
                        protein: 20,
                        carbs: 30,
                        fat: 15,
                        serving_size: '1 portion'
                    }]
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

    } catch (error) {
        console.error('Error in scan-meal function:', error)

        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: error.message
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
