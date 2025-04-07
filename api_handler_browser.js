// API Handler for BetCLI (Browser Version)
// This module processes user queries using the OpenAI API and the enhanced system prompt
// It then executes the generated API calls to the Overtime Markets API

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

// Main function to process user queries
async function processNaturalLanguageQuery(query, conversationHistory = [], apiKey) {
  if (!apiKey) {
    return {
      error: true,
      message: "Please set your OpenAI API key first with: /apikey YOUR_API_KEY"
    };
  }

  try {
    // Get structured API calls from OpenAI
    const openaiResponse = await getStructuredApiCalls(query, conversationHistory, apiKey);
    
    if (openaiResponse.error) {
      return openaiResponse;
    }

    // Execute the API calls
    const apiResults = await executeApiCalls(openaiResponse.api_calls);
    
    // Return the formatted response and data
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
  // Validate API key
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return {
      error: true,
      message: "Invalid API key. Please set a valid OpenAI API key with: /apikey YOUR_API_KEY"
    };
  }

  // In browser, we need to load the system prompt from an included script or fetch it
  const systemPrompt = window.SYSTEM_PROMPT || await fetchSystemPrompt();
  
  if (!systemPrompt) {
    return {
      error: true,
      message: "System prompt not found. Please include system_prompt.txt or set window.SYSTEM_PROMPT."
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

    // Call OpenAI API with minimal parameters
    const requestParams = {
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 800
    };
    
    console.log('OpenAI API request:', JSON.stringify(requestParams, null, 2));
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestParams,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Try to parse the response as JSON
    const responseText = response.data.choices[0].message.content;
    console.log('Raw OpenAI response:', responseText);
    
    let parsedResponse;
    
    try {
      // Try to extract JSON if it's wrapped in backticks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        parsedResponse = JSON.parse(jsonMatch[1]);
      } else {
        // If no code block is found, try parsing the whole response
        parsedResponse = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      
      // Create a fallback response object rather than returning an error
      parsedResponse = {
        intent: 'unknown',
        parameters: {},
        api_calls: [],
        human_response: responseText
      };
    }
    
    return {
      intent: parsedResponse.intent || 'unknown',
      parameters: parsedResponse.parameters || {},
      api_calls: parsedResponse.api_calls || [],
      human_response: parsedResponse.human_response || responseText
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // Enhanced error handling with more details
    let errorMsg = error.message || 'Unknown error';
    
    // Extract more detailed error information if available
    if (error.response && error.response.data) {
      console.error('API response error details:', error.response.data);
      
      if (error.response.data.error) {
        errorMsg = `OpenAI API Error: ${error.response.data.error.message || error.response.data.error}`;
      }
    }
    
    // Handle specific OpenAI API errors
    if (error.response && error.response.status === 401) {
      return {
        error: true,
        message: "OpenAI API Key error: Your API key may be invalid or expired. Please set a valid API key with: /apikey YOUR_API_KEY"
      };
    }
    
    return {
      error: true,
      message: `Error processing your query with AI: ${errorMsg}`
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
      // Use window.API_BASE_URL to ensure we're accessing the global variable
      const baseUrl = window.API_BASE_URL || 'https://overtimemarketsv2.xyz';
      const url = `${baseUrl}${endpoint}`;
      
      // Convert any leagueId parameter to leagueID (uppercase ID)
      if (params && params.leagueId !== undefined) {
        params.leagueID = params.leagueId;
        delete params.leagueId;
      }
      
      // Remove any sportId parameters as we only use leagueID now
      if (params && params.sportId !== undefined) {
        console.log(`Removing sportId=${params.sportId} parameter from API call`);
        delete params.sportId;
      }
      
      // Log the exact URL being called for debugging
      const fullUrl = `${url}${params ? 
        '?' + Object.entries(params)
          .map(([key, value]) => `${key}=${value}`)
          .join('&') : ''}`;
          
      console.log(`Making API call to: ${fullUrl}`);
      
      // Special handling for EPL data (now using leagueID=11)
      const isEPLRequest = 
        endpoint.includes('/markets') && 
        params && 
        params.leagueID === 11;
      
      if (isEPLRequest) {
        console.log('EPL request detected - using leagueID=11');
      }
      
      // Special handling for live-markets endpoint
      const isLiveMarketsEndpoint = endpoint.includes('/live-markets');
      
      if (method.toUpperCase() === 'GET') {
        response = await axios.get(url, { params });
        
        // Log response info for debugging
        console.log(`API response status: ${response.status}`);
        console.log(`API response data length: ${response.data ? (Array.isArray(response.data) ? response.data.length : 'Object') : 'Empty'}`);
        
        // Special handling for EPL data
        if (isEPLRequest) {
          console.log('EPL response received:');
          console.log('- Type:', typeof response.data);
          console.log('- Is array:', Array.isArray(response.data));
          console.log('- Length:', Array.isArray(response.data) ? response.data.length : 'N/A');
          
          // If empty array for EPL, provide a useful message
          if (Array.isArray(response.data) && response.data.length === 0) {
            console.log('EPL response is empty array, creating error message');
            
            // Create a proper error message for better user experience
            response.data = {
              message: "No EPL markets are currently available. This could be due to the league being out of season or no active matches scheduled.",
              isEmpty: true,
              sport: "Soccer",
              league: "EPL",
              query_type: "epl_odds"
            };
          } 
          // If non-empty EPL data, structure it properly
          else if (response.data && response.data.Soccer && response.data.Soccer["12"]) {
            console.log('EPL data found in Soccer.12, structuring for better formatting');
            
            // Structure is likely in the format {Soccer: {"12": [matches]}}
            // Keep as is since this is the expected format
          }
          // If EPL data is in a different format, try to structure it
          else if (Array.isArray(response.data) && response.data.length > 0) {
            console.log('EPL data found in array format, structuring for better formatting');
            
            // Structure as Soccer/EPL for better formatting
            response.data = {
              Soccer: {
                "11": response.data
              },
              _query_info: {
                sport: "Soccer",
                league: "EPL",
                leagueID: 11
              }
            };
          }
        }
        
        // If this is a live-markets call, log more details about the response
        if (isLiveMarketsEndpoint) {
          console.log('Live markets response structure:', 
            typeof response.data, 
            Array.isArray(response.data) ? `Array with ${response.data.length} items` : 
              (response.data === null ? 'null' : 
                (Object.keys(response.data).length > 0 ? `Object with keys: ${Object.keys(response.data).join(', ')}` : 'Empty object'))
          );
          
          // If empty array, check if there are actually no live markets
          if (Array.isArray(response.data) && response.data.length === 0) {
            console.log('No live markets found in the response');
          }
        }
      } else if (method.toUpperCase() === 'POST') {
        response = await axios.post(url, params);
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }
      
      console.log(`API call successful. Status: ${response.status}`);
      
      // Add transformed data for live markets if needed
      let processedData = response.data;
      
      // For live-markets endpoint, ensure we format the data correctly for display
      if (isLiveMarketsEndpoint) {
        // If the data is an empty array, transform it into a more informative response
        if (Array.isArray(processedData) && processedData.length === 0) {
          processedData = {
            message: "No live markets are currently available on this network",
            isEmpty: true,
            networkId: endpoint.match(/\/networks\/(\d+)/)?.[1] || "unknown"
          };
        }
        
        // If the data is an array with items, add some metadata
        if (Array.isArray(processedData) && processedData.length > 0) {
          // Transform into a more detailed structure
          processedData = {
            liveMarkets: processedData,
            count: processedData.length,
            networkId: endpoint.match(/\/networks\/(\d+)/)?.[1] || "unknown"
          };
        }
      }
      
      results.push({
        endpoint,
        success: true,
        data: processedData,
        params, // Include params for debug output
        fullUrl // Include the full URL used
      });
    } catch (error) {
      console.error(`Error executing API call to ${endpoint}:`, error);
      
      // More detailed error information
      let errorDetails = {
        message: error.message,
        status: error.response ? error.response.status : null,
      };
      
      if (error.response) {
        // Log any error response data
        console.error('API error response data:', error.response.data);
        errorDetails.data = error.response.data;
      }
      
      // Construct the full URL for debugging
      const fullUrl = `${baseUrl}${endpoint}${params ? 
        '?' + Object.entries(params)
          .map(([key, value]) => `${key}=${value}`)
          .join('&') : ''}`;
      
      results.push({
        endpoint,
        success: false,
        error: error.message,
        status: error.response ? error.response.status : null,
        params, // Include params for debug output
        errorDetails,
        fullUrl
      });
    }
  }
  
  return results;
}

// Fetch system prompt if not included directly in the page
async function fetchSystemPrompt() {
  try {
    const response = await fetch('system_prompt.txt');
    if (!response.ok) {
      throw new Error(`Failed to load system prompt: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading system prompt:', error);
    return null;
  }
}

// Make the functions available in the browser environment
window.apiHandler = {
  processNaturalLanguageQuery,
  apiCache
}; 