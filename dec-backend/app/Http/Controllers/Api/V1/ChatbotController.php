<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    private $apiKey;
    private $apiUrl = 'https://models.inference.ai.azure.com/chat/completions';

    public function __construct()
    {
        $this->apiKey = env('GITHUB_AI_TOKEN');
    }

    /**
     * Send a message to the AI chatbot and get a response
     */
    public function sendMessage(Request $request)
    {
        // Suppress any PHP warnings/notices that might corrupt JSON output
        ob_start();
        
        $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array'
        ]);

        $userMessage = $request->input('message');
        $history = $request->input('history', []);

        // Check if API key is configured
        if (empty($this->apiKey)) {
            ob_end_clean(); // Clear any buffered output
            return response()->json([
                'success' => false,
                'message' => "I'm sorry, the AI service is not configured. Please contact support.",
                'error' => 'API key not configured'
            ], 500);
        }

        try {
            // Build the system prompt with clinic context
            $systemPrompt = $this->buildSystemPrompt();

            // Build messages array for OpenAI format
            $messages = $this->buildMessages($systemPrompt, $history, $userMessage);

            // Call GitHub Models API (OpenAI GPT-4o)
            $response = $this->callOpenAI($messages);

            ob_end_clean(); // Clear any buffered output before returning JSON
            return response()->json([
                'success' => true,
                'message' => $response
            ]);

        } catch (\Exception $e) {
            Log::error('Chatbot error: ' . $e->getMessage());
            
            ob_end_clean(); // Clear any buffered output before returning JSON
            return response()->json([
                'success' => false,
                'message' => "I'm having trouble connecting right now. Please try again in a moment, or you can reach us at (02) 8123-4567.",
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Build the system prompt with clinic context
     */
    private function buildSystemPrompt(): string
    {
        // Fetch current products and services for accurate pricing
        $products = Product::select('name', 'category', 'price', 'stock')
            ->where('stock', '>', 0)
            ->take(20)
            ->get();

        $services = Service::select('name', 'description', 'price')
            ->take(10)
            ->get();

        $productInfo = $products->map(function ($p) {
            return "- {$p->name} ({$p->category}): ₱" . number_format($p->price, 2);
        })->join("\n");

        $serviceInfo = $services->map(function ($s) {
            return "- {$s->name}: ₱" . number_format($s->price, 2) . " - {$s->description}";
        })->join("\n");

        return <<<PROMPT
You are the AI assistant for Doctor EC Optical Clinic, a professional optical and eye care clinic in the Philippines.

## CRITICAL RESTRICTION - READ THIS FIRST
You are ONLY allowed to answer questions related to:
- Doctor EC Optical Clinic (location, hours, contact info)
- Eye care and vision health
- Optical products (glasses, frames, sunglasses, contact lenses)
- Optical services (eye exams, consultations, fittings)
- Appointments and reservations at our clinic
- General eyewear recommendations

For ANY question that is NOT related to optical care, eyewear, eye health, or our clinic, you MUST respond with:
"I'm sorry, but I can only assist with questions related to Doctor EC Optical Clinic, our eyewear products, eye care services, and appointments. 👓 Is there anything about our optical services I can help you with?"

DO NOT answer questions about:
- Politics, news, current events
- General knowledge, trivia, or facts unrelated to eye care
- Other businesses or services
- Programming, technology (unless about eyewear)
- Entertainment, sports, celebrities
- Food, recipes, travel
- Any topic unrelated to optical/eye care

## Your Role
- Be friendly, helpful, and professional
- Assist customers with inquiries about services, products, appointments, and general eye care
- Provide accurate pricing information when available
- Guide customers to book appointments when appropriate
- Keep responses concise but informative (2-4 sentences max unless listing items)
- When discussing SERVICES, mention they can view all services on our Services page
- When discussing PRODUCTS, mention they can browse our Products page

## Clinic Information

**Name:** Doctor EC Optical Clinic
**Address:** 123 Vision Street, Clarity City, Philippines
**Phone:** (02) 8123-4567
**Mobile:** 0917-123-4567
**Email:** hello@doctorecoptical.com

**Operating Hours:**
- Monday to Saturday: 9:00 AM - 6:00 PM
- Sunday: Closed

## Services Offered
{$serviceInfo}

If no services are listed above, mention these standard services:
- Eye Checkup: ₱500
- Contact Lens Fitting: ₱800
- Expert Consultation: ₱300
- Glasses Repair: Price varies
- Pediatric Eye Care: ₱600

## Products Available
{$productInfo}

If no products are listed above, mention we have a wide selection of:
- Prescription Glasses (from ₱800)
- Sunglasses (from ₱1,200)
- Contact Lenses (from ₱500)
- Reading Glasses (from ₱400)

## Guidelines
1. Always be polite and welcoming
2. If asked about appointment booking, tell them they can book directly here in this chat by clicking the "Book Now" button that will appear, or they can visit the Appointments page on the website
3. For product recommendations, suggest visiting the Products page for the full catalog
4. For service inquiries, suggest visiting the Services page to learn more
5. If you don't know something specific, offer to connect them with staff via phone
6. Use "₱" for Philippine Peso prices
7. Add relevant emojis sparingly to keep responses friendly (👓 📅 ✨)
8. Never make up prices - if unsure, say "prices may vary" and suggest contacting the clinic
9. For medical advice, always recommend consulting with an optometrist in person
10. REMEMBER: Politely decline any question not related to optical/eye care
PROMPT;
    }

    /**
     * Build messages array for OpenAI API format
     */
    private function buildMessages(string $systemPrompt, array $history, string $userMessage): array
    {
        $messages = [];

        // Add system message
        $messages[] = [
            'role' => 'system',
            'content' => $systemPrompt
        ];

        // Add conversation history (last 10 messages to keep context manageable)
        $recentHistory = array_slice($history, -10);
        foreach ($recentHistory as $msg) {
            $role = $msg['sender'] === 'user' ? 'user' : 'assistant';
            $messages[] = [
                'role' => $role,
                'content' => $msg['text']
            ];
        }

        // Add current user message
        $messages[] = [
            'role' => 'user',
            'content' => $userMessage
        ];

        return $messages;
    }

    /**
     * Call the OpenAI API via GitHub Models
     */
    private function callOpenAI(array $messages): string
    {
        Log::info('Chatbot: Calling API at ' . $this->apiUrl . ' with model gpt-4o');
        Log::info('Chatbot: Token starts with: ' . substr($this->apiKey, 0, 10) . '...');

        $response = Http::timeout(30)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])
            ->post($this->apiUrl, [
                'model' => 'gpt-4o',
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 500,
                'top_p' => 0.95,
            ]);

        if (!$response->successful()) {
            $body = $response->body();
            $status = $response->status();
            Log::error("OpenAI API error (HTTP $status): $body");

            // Provide specific error messages based on status code
            if ($status === 401) {
                throw new \Exception('API authentication failed (401). Your GITHUB_AI_TOKEN is invalid, expired, or does not have GitHub Models access. Please generate a new token at github.com/settings/tokens with Models permission.');
            } elseif ($status === 404) {
                throw new \Exception('Model not found (404). The requested model may not be available on GitHub Models.');
            } elseif ($status === 429) {
                throw new \Exception('Rate limit exceeded (429). Please wait a moment and try again.');
            }

            throw new \Exception("Failed to get AI response: HTTP $status - $body");
        }

        $data = $response->json();

        // Extract the text from the response
        if (isset($data['choices'][0]['message']['content'])) {
            return $data['choices'][0]['message']['content'];
        }

        Log::error('Unexpected API response format: ' . json_encode($data));
        throw new \Exception('Unexpected API response format');
    }
}
