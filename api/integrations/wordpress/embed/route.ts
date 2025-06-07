import { NextRequest, NextResponse } from "next/server";

// This endpoint generates the embedding code for WordPress sites
// It provides a JavaScript snippet that can be added to a WordPress site

export async function GET(req: NextRequest) {
  try {
    // Get the agent ID and other parameters from the query string
    const url = new URL(req.url);
    const agentId = url.searchParams.get("agentId");
    const location = url.searchParams.get("location") || "bottom-right";
    const apiKey = url.searchParams.get("apiKey");
    
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
    }
    
    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }
    
    // Create the embedding script
    // This would contain the JavaScript code to embed the chatbot in a WordPress site
    const embedCode = `
<!-- AI Chatbot Widget -->
<script>
(function() {
  // Configuration
  const config = {
    agentId: "${agentId}",
    apiKey: "${apiKey}",
    position: "${location}",
    baseUrl: "${url.origin}"
  };
  
  // Create container
  const container = document.createElement('div');
  container.id = 'ai-chatbot-container';
  container.style.position = 'fixed';
  
  // Position the container based on the location parameter
  switch(config.position) {
    case 'bottom-right':
      container.style.right = '20px';
      container.style.bottom = '20px';
      break;
    case 'bottom-left':
      container.style.left = '20px';
      container.style.bottom = '20px';
      break;
    case 'top-right':
      container.style.right = '20px';
      container.style.top = '20px';
      break;
    case 'top-left':
      container.style.left = '20px';
      container.style.top = '20px';
      break;
    default:
      container.style.right = '20px';
      container.style.bottom = '20px';
  }
  
  // Create button
  const button = document.createElement('button');
  button.id = 'ai-chatbot-button';
  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  button.style.width = '60px';
  button.style.height = '60px';
  button.style.borderRadius = '50%';
  button.style.background = '#3B82F6';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  
  // Create iframe for the chat interface
  const iframe = document.createElement('iframe');
  iframe.id = 'ai-chatbot-iframe';
  iframe.style.display = 'none';
  iframe.style.border = 'none';
  iframe.style.width = '400px';
  iframe.style.height = '600px';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
  iframe.style.background = 'white';
  iframe.style.marginBottom = '20px';
  iframe.src = \`\${config.baseUrl}/chat?agentId=\${config.agentId}&embedded=true&apiKey=\${config.apiKey}\`;
  
  // Add event listener to toggle the chat interface
  button.addEventListener('click', function() {
    if (iframe.style.display === 'none') {
      iframe.style.display = 'block';
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    } else {
      iframe.style.display = 'none';
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    }
  });
  
  // Append elements to the container
  container.appendChild(iframe);
  container.appendChild(button);
  
  // Append the container to the body
  document.body.appendChild(container);
})();
</script>
<!-- End AI Chatbot Widget -->
    `;
    
    // Return the embedding code
    return NextResponse.json({ 
      embedCode: embedCode,
      instructions: "Add this code to your WordPress site's footer using a plugin like 'Insert Headers and Footers' or by editing your theme's footer.php file."
    });
  } catch (error) {
    console.error("Error generating WordPress embed code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
