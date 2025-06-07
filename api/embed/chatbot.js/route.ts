/**
 * Chatbot Embed Script API Route
 * 
 * This route serves the JavaScript file that gets embedded on websites
 * for the HTML & CSS plugin integration.
 */
import { NextRequest, NextResponse } from "next/server";

// GET /api/embed/chatbot.js - Serve the chatbot embed script
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
      // Chatbot Widget Script
      (function() {
        // Configuration
        let config = {};
        let widget = null;
        let iframe = null;
        let isOpen = false;
        let baseUrl = '${process.env.NEXT_PUBLIC_APP_URL || ''}';
        
        // If no base URL is set, try to determine it from the script src
        if (!baseUrl) {
          const scripts = document.getElementsByTagName('script');
          for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src || '';
            if (src.includes('/api/embed/chatbot.js')) {
              baseUrl = src.split('/api/embed/chatbot.js')[0];
              break;
            }
          }
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
          
          // Create the iframe
          iframe = document.createElement('iframe');
          iframe.style.width = '100%';
          iframe.style.height = 'calc(100% - 50px)';
          iframe.style.border = 'none';
          
          // Set the iframe source
          const iframeSrc = \`\${baseUrl}/embed/chat?agentId=\${config.agentId}&userId=\${config.userId}\`;
          iframe.src = iframeSrc;
          
          // Add iframe to container
          container.appendChild(iframe);
          
          // Add container to widget
          widget.appendChild(container);
          
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
            const container = createIframe();
            
            // Animate opening
            setTimeout(() => {
              container.style.opacity = '1';
              container.style.transform = 'translateY(0)';
            }, 10);
            
            isOpen = true;
          }
        }
        
        // Close the widget
        function closeWidget() {
          if (isOpen) {
            const container = document.getElementById('chatbot-iframe-container');
            
            // Animate closing
            container.style.opacity = '0';
            container.style.transform = 'translateY(10px)';
            
            // Remove after animation
            setTimeout(() => {
              container.remove();
            }, 300);
            
            isOpen = false;
          }
        }
        
        // Send a message to the chatbot
        function sendMessage(message) {
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'CHATBOT_MESSAGE',
              message
            }, '*');
          }
        }
        
        // Expose the API
        window.chatbot = function(method, ...args) {
          switch (method) {
            case 'init':
              init(args[0]);
              break;
            case 'open':
              openWidget();
              break;
            case 'close':
              closeWidget();
              break;
            case 'toggle':
              toggleWidget();
              break;
            case 'sendMessage':
              sendMessage(args[0]);
              break;
          }
        };
        
        // Auto-initialize from script tag data attributes
        document.addEventListener('DOMContentLoaded', function() {
          // Find the script tag
          const scripts = document.getElementsByTagName('script');
          let scriptTag = null;
          
          for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src || '';
            if (src.includes('/api/embed/chatbot.js')) {
              scriptTag = scripts[i];
              break;
            }
          }
          
          if (scriptTag) {
            // Get configuration from data attributes
            const config = {
              agentId: scriptTag.getAttribute('data-agent-id') || '',
              userId: scriptTag.getAttribute('data-user-id') || '',
              primaryColor: scriptTag.getAttribute('data-accent-color') || '#3B82FF',
              backgroundColor: scriptTag.getAttribute('data-background-color') || '#F3F4F6',
              position: scriptTag.getAttribute('data-position') || 'bottom-right',
              title: scriptTag.getAttribute('data-title') || 'Chat with us',
              welcomeMessage: scriptTag.getAttribute('data-welcome-message') || 'Hello! How can I help you today?',
              autoOpen: scriptTag.getAttribute('data-auto-open') === 'true',
              showOnMobile: scriptTag.getAttribute('data-show-on-mobile') !== 'false'
            };
            
            // Initialize with the config
            init(config);
          }
        });
      })();
    `;
    
    return new NextResponse(scriptContent, { headers });
  } catch (error) {
    console.error('Error serving chatbot embed script:', error);
    return new NextResponse('console.error("Failed to load chatbot widget");', {
      status: 500,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}
