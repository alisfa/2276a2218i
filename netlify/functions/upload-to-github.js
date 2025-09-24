// Use native fetch in Netlify Functions (Node.js 18+)
// No need for node-fetch dependency

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        const { path, content, message } = JSON.parse(event.body);
        
        // Validate required parameters
        if (!path || !content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required parameters' })
            };
        }
        
        // Get GitHub credentials from environment variables
        const githubToken = process.env.GITHUB_TOKEN;
        const githubUsername = process.env.GITHUB_USERNAME;
        const githubRepo = process.env.GITHUB_REPO;
        
        if (!githubToken || !githubUsername || !githubRepo) {
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    message: 'GitHub configuration not complete',
                    missing: {
                        token: !githubToken,
                        username: !githubUsername,
                        repo: !githubRepo
                    }
                })
            };
        }
        
        // GitHub API endpoint
        const url = `https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/${path}`;
        
        // Make request to GitHub API using native fetch
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Netlify-GitHub-Uploader'
            },
            body: JSON.stringify({
                message: message || `Upload ${path} via Netlify`,
                content: content
            })
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ 
                    message: responseData.message || 'GitHub API error',
                    details: responseData
                })
            };
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: 'File uploaded successfully',
                data: responseData,
                url: `https://${githubUsername}.github.io/${githubRepo}/${path}`
            })
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message 
            })
        };
    }
};
