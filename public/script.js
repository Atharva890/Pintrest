async function takeScreenshot() {
            try {
                const button = document.querySelector('.screenshot-btn');
                const originalText = button.textContent;
                
                // Update button state
                button.textContent = 'Taking Screenshot...';
                button.disabled = true;
                
                // Update the API URL construction
                const apiUrl = process.env.NODE_ENV === 'production' 
                    ? 'https://your-render-url.com/screenshot'
                    : `${window.location.origin}/screenshot`;
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        url: window.location.href
                    })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'pinterest-infographic-screenshot.png';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    // Success feedback
                    button.textContent = 'Screenshot Downloaded!';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 2000);
                } else {
                    throw new Error('Screenshot failed');
                }
            } catch (error) {
                console.error('Error taking screenshot:', error);
                const button = document.querySelector('.screenshot-btn');
                button.textContent = 'Error - Try Again';
                button.disabled = false;
                setTimeout(() => {
                    button.textContent = 'Take Screenshot';
                }, 2000);
            }
        }