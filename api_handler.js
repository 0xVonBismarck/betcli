// API Handler for BetCLI
// This module processes user queries using the OpenAI API and the enhanced system prompt
// It then executes the generated API calls to the Overtime Markets API

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Import constants from main script
const API_BASE_URL = 'https://overtimemarketsv2.xyz';
const DEFAULT_NETWORK_ID = 10; // Optimism

// Read the system prompt
function getSystemPrompt() {
  try {
    return fs.readFileSync(path.join(__dirname, 'system_prompt.txt'), 'utf8');
  } catch (error) {
    console.error('Error loading system prompt:', error);
    return null;
  }
}

// Main function to process user queries
async function processNaturalLanguageQuery(query, conversationHistory = [], apiKey) {
  if (!apiKey) {
    return {
      error: true,
      message: "Please set your OpenAI API key first with: /apikey YOUR_API_KEY"
    };
  }

  try {
    // Step 1: Get structured API calls from OpenAI
    const openaiResponse = await getStructuredApiCalls(query, conversationHistory, apiKey);
    
    if (openaiResponse.error) {
      return openaiResponse;
    }

    // Step 2: Execute the API calls
    const apiResults = await executeApiCalls(openaiResponse.api_calls);
    
    // Step 3: Return the formatted response and data
    return {
      message: openaiResponse.human_response,
      intent: openaiResponse.intent,
      parameters: openaiResponse.parameters,
      data: apiResults,
      raw_response: openaiResponse
    };
  } catch (error) {
    console.error('Error processing query:', error);
    return {
      error: true,
      message: `Error processing your query: ${error.message}`
    };
  }
}

// Get structured API calls from OpenAI
async function getStructuredApiCalls(query, conversationHistory, apiKey) {
  const systemPrompt = getSystemPrompt();
  
  if (!systemPrompt) {
    return {
      error: true,
      message: "System prompt not found. Please check the system_prompt.txt file."
    };
  }

  try {
    // Build the messages array
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history if it exists
    if (conversationHistory && conversationHistory.length > 0) {
      // Only add the last 10 messages to avoid token limit issues
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);
    }

    // Add the current query
    messages.push({ role: 'user', content: query });

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', // Updated to newer GPT-4o mini model
        messages: messages,
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Parse the JSON response
    const responseData = response.data.choices[0].message.content;
    const parsedResponse = JSON.parse(responseData);

    return {
      intent: parsedResponse.intent || 'unknown',
      parameters: parsedResponse.parameters || {},
      api_calls: parsedResponse.api_calls || [],
      human_response: parsedResponse.human_response || "Sorry, I couldn't process that query."
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // Handle specific OpenAI API errors
    if (error.response && error.response.status === 401) {
      return {
        error: true,
        message: "OpenAI API Key error: Your API key may be invalid or expired. Please set a valid API key with: /apikey YOUR_API_KEY"
      };
    }
    
    return {
      error: true,
      message: `Error processing your query with AI: ${error.message}`
    };
  }
}

// Execute the API calls
async function executeApiCalls(apiCalls) {
  if (!apiCalls || !Array.isArray(apiCalls) || apiCalls.length === 0) {
    return [];
  }

  const results = [];
  
  for (const call of apiCalls) {
    let { endpoint, method, params } = call;
    
    // Ensure endpoint starts with /overtime-v2
    if (!endpoint.startsWith('/overtime-v2')) {
      endpoint = '/overtime-v2' + endpoint;
    }
    
    try {
      let response;
      const url = `${API_BASE_URL}${endpoint}`;
      
      if (method.toUpperCase() === 'GET') {
        response = await axios.get(url, { params });
      } else if (method.toUpperCase() === 'POST') {
        response = await axios.post(url, params);
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }
      
      results.push({
        endpoint,
        success: true,
        data: response.data,
        params // Include params for debug output
      });
    } catch (error) {
      console.error(`Error executing API call to ${endpoint}:`, error);
      
      results.push({
        endpoint,
        success: false,
        error: error.message,
        status: error.response ? error.response.status : null,
        params // Include params for debug output
      });
    }
  }
  
  return results;
}

// Cache for API responses
const apiCache = {
  cache: new Map(),
  
  // Get cached response
  get: function(key) {
    const cachedItem = this.cache.get(key);
    
    // Check if cache exists and is still valid
    if (cachedItem && Date.now() < cachedItem.expiresAt) {
      return cachedItem.data;
    }
    
    return null;
  },
  
  // Set cache with TTL in seconds
  set: function(key, data, ttlSeconds = 300) { // 5 minutes default
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  },
  
  // Clear cache
  clear: function() {
    this.cache.clear();
  }
};

module.exports = {
  processNaturalLanguageQuery,
  apiCache
}; 