// Debug script to check DOM elements
document.addEventListener('DOMContentLoaded', () => {
    console.clear();
    console.log('==== DEBUG SCRIPT LOADED ====');
    
    // Set debug mode flag to prevent script.js from adding conflicting handlers
    window.IN_DEBUG_MODE = true;
    console.log('Debug mode flag set');
    
    // Check terminal elements
    const terminalContent = document.getElementById('terminalContent');
    const terminalInput = document.getElementById('terminalInput');
    
    console.log('Terminal content found:', !!terminalContent);
    console.log('Terminal input found:', !!terminalInput);
    
    // Placeholder for API key - should be set by the user
    const apiKey = 'YOUR_OPENAI_API_KEY';
    window.OPENAI_API_KEY = '';
    
    // Add a message to the terminal
    if (terminalContent) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.textContent = 'Debug script loaded. Please set your OpenAI API key with /apikey command.';
        terminalContent.appendChild(messageDiv);
    }
    
    // Create debug control panel
    const debugPanel = document.createElement('div');
    debugPanel.style.position = 'fixed';
    debugPanel.style.top = '10px';
    debugPanel.style.right = '10px';
    debugPanel.style.background = '#333';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.color = 'white';
    debugPanel.style.zIndex = '1000';
    debugPanel.style.fontFamily = 'Arial, sans-serif';
    debugPanel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    debugPanel.innerHTML = '<h3 style="margin-top:0">Debug Controls</h3>';
    document.body.appendChild(debugPanel);
    
    // Add API key button
    const apiButton = document.createElement('button');
    apiButton.textContent = 'Set API Key';
    apiButton.style.display = 'block';
    apiButton.style.margin = '5px 0';
    apiButton.style.padding = '5px 10px';
    apiButton.addEventListener('click', () => {
        if (window.OPENAI_API_KEY) {
            alert('API key already set: ' + window.OPENAI_API_KEY.substring(0, 10) + '...');
        } else {
            const key = prompt('Enter your OpenAI API key:');
            if (key) {
                window.OPENAI_API_KEY = key;
                alert('API key set successfully!');
            }
        }
    });
    debugPanel.appendChild(apiButton);
    
    // Add test message button
    const testButton = document.createElement('button');
    testButton.textContent = 'Send Test Message';
    testButton.style.display = 'block';
    testButton.style.margin = '5px 0';
    testButton.style.padding = '5px 10px';
    testButton.addEventListener('click', () => {
        if (terminalContent) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message system';
            messageDiv.textContent = 'Test message from debug panel: ' + new Date().toLocaleTimeString();
            terminalContent.appendChild(messageDiv);
            terminalContent.scrollTop = terminalContent.scrollHeight;
        } else {
            alert('Terminal content element not found!');
        }
    });
    debugPanel.appendChild(testButton);
    
    // Override the terminal input with a direct event handler
    if (terminalInput) {
        // Forcefully add direct event handler
        terminalInput.addEventListener('keydown', function(e) {
            console.log('Direct keydown event:', e.key);
            
            if (e.key === 'Enter') {
                const inputValue = terminalInput.value.trim();
                console.log('Direct Enter pressed, input value:', inputValue);
                
                if (inputValue) {
                    // Add user message to terminal
                    if (terminalContent) {
                        const userDiv = document.createElement('div');
                        userDiv.className = 'message user';
                        userDiv.textContent = inputValue;
                        terminalContent.appendChild(userDiv);
                    }
                    
                    // Process the command or query
                    if (inputValue.startsWith('/')) {
                        // It's a command
                        if (inputValue.startsWith('/apikey ')) {
                            const key = inputValue.substring(8).trim();
                            if (key.length > 10) {
                                window.OPENAI_API_KEY = key;
                                
                                // Add response to terminal
                                if (terminalContent) {
                                    const responseDiv = document.createElement('div');
                                    responseDiv.className = 'message system';
                                    responseDiv.textContent = 'API key set successfully!';
                                    terminalContent.appendChild(responseDiv);
                                }
                            }
                        } else if (inputValue === '/clear') {
                            if (terminalContent) {
                                terminalContent.innerHTML = '';
                            }
                        } else if (inputValue === '/help') {
                            // Display help message
                            if (terminalContent) {
                                const helpDiv = document.createElement('div');
                                helpDiv.className = 'message system';
                                helpDiv.innerHTML = `
                                Available commands:<br>
                                /apikey YOUR_API_KEY - Set your OpenAI API key<br>
                                /clear - Clear the terminal<br>
                                /help - Show this help message
                                `;
                                terminalContent.appendChild(helpDiv);
                            }
                        }
                    } else {
                        // It's a regular query - show a processing response
                        if (terminalContent) {
                            const responseDiv = document.createElement('div');
                            responseDiv.className = 'message response';
                            responseDiv.textContent = 'Your query "' + inputValue + '" is being processed...';
                            terminalContent.appendChild(responseDiv);
                        }
                    }
                    
                    // Clear the input field
                    terminalInput.value = '';
                    
                    // Scroll to bottom
                    if (terminalContent) {
                        terminalContent.scrollTop = terminalContent.scrollHeight;
                    }
                }
                
                // Prevent the default action
                e.preventDefault();
            }
        }, true); // Use capture phase to ensure our handler runs first
        
        console.log('Direct event handler added to terminal input');
    }
}); 