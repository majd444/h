/**
 * Enhanced Chatbot Embed Script API Route
 * 
 * This route serves the JavaScript file that gets embedded on websites
 * for the HTML & CSS plugin integration with API usage tracking.
 */
import { NextRequest, NextResponse } from "next/server";

// GET /api/embed/enhanced-chatbot.js - Serve the enhanced chatbot embed script
export async function GET(req: NextRequest) {
  try {
    // Set the correct content type for JavaScript
    const headers = {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    };
    
    // Get the origin for CORS
    const origin = req.headers.get('origin');
    
    // In a production environment, we would check if the origin is allowed
    // based on the plugin configuration, but for now we'll allow any origin
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Methods'] = 'GET';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      headers['Access-Control-Max-Age'] = '86400'; // 24 hours
    }
    
    // The embed script content
    const scriptContent = `
      // Enhanced Chatbot Widget Script
      (function() {
        // Configuration
        let config = {};
        let widget = null;
        let iframe = null;
        let isOpen = false;
        let baseUrl = '${process.env.NEXT_PUBLIC_APP_URL || ''}';
        let visitorId = '';
        let messageCount = 0;
        
        // If no base URL is set, try to determine it from the script src
        if (!baseUrl) {
          const scripts = document.getElementsByTagName('script');
          for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src || '';
            if (src.includes('/api/embed/enhanced-chatbot.js')) {
              baseUrl = src.split('/api/embed/enhanced-chatbot.js')[0];
              break;
            }
          }
        }
        
        // Generate a unique visitor ID
        function generateVisitorId() {
          return 'v_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
        
        // Initialize the chatbot
        function init(options) {
          config = {
            agentId: options.agentId,
            userId: options.userId,
            primaryColor: options.primaryColor || '#0084ff',
            position: options.position || 'bottom-right',
            title: options.title || 'Chat with us',
            autoOpen: options.autoOpen || false,
            showOnMobile: options.showOnMobile !== false
          };
          
          // Generate a unique visitor ID for tracking
          visitorId = generateVisitorId();
          
          // Check if we should show on mobile
          if (!config.showOnMobile && window.innerWidth < 768) {
            return;
          }
          
          // Create the widget
          createWidget();
          
          // Auto-open if configured
          if (config.autoOpen) {
            setTimeout(openWidget, 1000);
          }
          
          // Track initialization
          trackEvent('init');
        }
        
        // Create the widget elements
        function createWidget() {
          // Create the widget container
          widget = document.createElement('div');
          widget.id = 'chatbot-widget-container';
          widget.style.position = 'fixed';
          widget.style.zIndex = '999999';
          
          // Position the widget
          switch (config.position) {
            case 'bottom-right':
              widget.style.right = '20px';
              widget.style.bottom = '20px';
              break;
            case 'bottom-left':
              widget.style.left = '20px';
              widget.style.bottom = '20px';
              break;
            case 'top-right':
              widget.style.right = '20px';
              widget.style.top = '20px';
              break;
            case 'top-left':
              widget.style.left = '20px';
              widget.style.top = '20px';
              break;
          }
          
          // Create the button
          const button = document.createElement('div');
          button.id = 'chatbot-widget-button';
          button.style.width = '60px';
          button.style.height = '60px';
          button.style.borderRadius = '50%';
          button.style.backgroundColor = config.primaryColor;
          button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
          button.style.cursor = 'pointer';
          button.style.display = 'flex';
          button.style.alignItems = 'center';
          button.style.justifyContent = 'center';
          button.style.transition = 'all 0.3s ease';
          
          // Add chat icon to button
          button.innerHTML = \`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
            </svg>
          \`;
          
          // Add hover effect
          button.onmouseover = function() {
            this.style.transform = 'scale(1.1)';
          };
          button.onmouseout = function() {
            this.style.transform = 'scale(1)';
          };
          
          // Add click handler
          button.onclick = toggleWidget;
          
          // Add button to widget
          widget.appendChild(button);
          
          // Add widget to the page
          document.body.appendChild(widget);
        }
        
        // Create the iframe for the chatbot
        function createIframe() {
          // Create iframe container
          const container = document.createElement('div');
          container.id = 'chatbot-iframe-container';
          container.style.position = 'absolute';
          container.style.width = '350px';
          container.style.height = '500px';
          container.style.backgroundColor = '#fff';
          container.style.borderRadius = '10px';
          container.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
          container.style.overflow = 'hidden';
          container.style.transition = 'all 0.3s ease';
          
          // Position the container based on the widget position
          switch (config.position) {
            case 'bottom-right':
              container.style.bottom = '80px';
              container.style.right = '0';
              break;
            case 'bottom-left':
              container.style.bottom = '80px';
              container.style.left = '0';
              break;
            case 'top-right':
              container.style.top = '80px';
              container.style.right = '0';
              break;
            case 'top-left':
              container.style.top = '80px';
              container.style.left = '0';
              break;
          }
          
          // Create iframe header
          const header = document.createElement('div');
          header.style.padding = '15px';
          header.style.backgroundColor = config.primaryColor;
          header.style.color = '#fff';
          header.style.fontFamily = 'Arial, sans-serif';
          header.style.fontWeight = 'bold';
          header.style.display = 'flex';
          header.style.justifyContent = 'space-between';
          header.style.alignItems = 'center';
          
          // Add title to header
          const title = document.createElement('div');
          title.textContent = config.title;
          header.appendChild(title);
          
          // Add close button to header
          const closeButton = document.createElement('div');
          closeButton.innerHTML = '&times;';
          closeButton.style.cursor = 'pointer';
          closeButton.style.fontSize = '20px';
          closeButton.onclick = closeWidget;
          header.appendChild(closeButton);
          
          // Add header to container
          container.appendChild(header);
          
          // Create iframe
          iframe = document.createElement('iframe');
          iframe.id = 'chatbot-iframe';
          iframe.style.width = '100%';
          iframe.style.height = 'calc(100% - 50px)'; // Subtract header height
          iframe.style.border = 'none';
          iframe.src = \`\${baseUrl}/embed/chat?agentId=\${config.agentId}&userId=\${config.userId}&visitorId=\${visitorId}\`;
          
          // Add iframe to container
          container.appendChild(iframe);
          
          // Add container to widget
          widget.appendChild(container);
          
          // Set up message passing between iframe and parent
          window.addEventListener('message', function(event) {
            // Only accept messages from our iframe
            if (iframe && event.source === iframe.contentWindow) {
              if (event.data.type === 'CHATBOT_READY') {
                // Iframe is ready
                console.log('Chatbot iframe is ready');
              } else if (event.data.type === 'CHATBOT_MESSAGE_SENT') {
                // Message was sent from the iframe
                messageCount++;
                trackEvent('message_sent', { count: messageCount });
              }
            }
          });
          
          return container;
        }
        
        // Toggle the widget open/closed
        function toggleWidget() {
          if (isOpen) {
            closeWidget();
          } else {
            openWidget();
          }
        }
        
        // Open the widget
        function openWidget() {
          if (!isOpen) {
            // Create the iframe if it doesn't exist
            if (!document.getElementById('chatbot-iframe-container')) {
              createIframe();
            }
            
            // Show the iframe container
            const container = document.getElementById('chatbot-iframe-container');
            if (container) {
              container.style.display = 'block';
              isOpen = true;
              
              // Track widget open
              trackEvent('open');
            }
          }
        }
        
        // Close the widget
        function closeWidget() {
          if (isOpen) {
            // Hide the iframe container
            const container = document.getElementById('chatbot-iframe-container');
            if (container) {
              container.style.display = 'none';
              isOpen = false;
              
              // Track widget close
              trackEvent('close');
            }
          }
        }
        
        // Send a message to the chatbot
        function sendMessage(message) {
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'CHATBOT_MESSAGE',
              message
            }, '*');
            
            // Track message sent
            messageCount++;
            trackEvent('message_sent', { count: messageCount });
          }
        }
        
        // Track events for analytics
        function trackEvent(eventName, data = {}) {
          try {
            // Don't track events if no agent ID is set
            if (!config.agentId) return;
            
            // Add basic data
            const eventData = {
              ...data,
              agentId: config.agentId,
              userId: config.userId,
              visitorId: visitorId,
              url: window.location.href,
              referrer: document.referrer,
              timestamp: new Date().toISOString()
            };
            
            // Send the event to the tracking endpoint
            fetch(\`\${baseUrl}/api/embed/track\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                event: eventName,
                data: eventData
              }),
              // Use keepalive to ensure the request completes even if the page is unloaded
              keepalive: true
            }).catch(err => console.error('Error tracking event:', err));
          } catch (error) {
            console.error('Error in trackEvent:', error);
          }
        }
        
        // Expose public methods
        window.ChatbotWidget = {
          init,
          open: openWidget,
          close: closeWidget,
          toggle: toggleWidget,
          sendMessage
        };
        
        // Initialize if the script was loaded with data attributes
        const script = document.currentScript || (function() {
          const scripts = document.getElementsByTagName('script');
          return scripts[scripts.length - 1];
        })();
        
        if (script) {
          const agentId = script.getAttribute('data-agent-id');
          if (agentId) {
            init({
              agentId,
              userId: script.getAttribute('data-user-id') || generateVisitorId(),
              primaryColor: script.getAttribute('data-primary-color'),
              position: script.getAttribute('data-position'),
              title: script.getAttribute('data-title'),
              autoOpen: script.getAttribute('data-auto-open') === 'true',
              showOnMobile: script.getAttribute('data-show-on-mobile') !== 'false'
            });
          }
        }
      })();
    `;
    
    return new NextResponse(scriptContent, { headers });
  } catch (error) {
    console.error('Error serving chatbot embed script:', error);
    return new NextResponse('console.error("Error loading chatbot widget");', {
      status: 500,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}
