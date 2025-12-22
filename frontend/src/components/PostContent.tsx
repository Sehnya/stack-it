import { useMemo } from 'react'
import { CodeBlock } from './CodeBlock'

interface PostContentProps {
  html: string
}

// Parse HTML and render with IDE-styled code blocks
export const PostContent = ({ html }: PostContentProps) => {
  const parts = useMemo(() => {
    // Split content by code blocks (pre tags)
    const segments: Array<{ type: 'html' | 'code'; content: string; language?: string }> = []
    
    // Match <pre><code class="language-xxx">...</code></pre> patterns
    const codeBlockRegex = /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/gi
    
    let lastIndex = 0
    let match
    
    while ((match = codeBlockRegex.exec(html)) !== null) {
      // Add HTML before this code block
      if (match.index > lastIndex) {
        const htmlContent = html.slice(lastIndex, match.index)
        if (htmlContent.trim()) {
          segments.push({ type: 'html', content: htmlContent })
        }
      }
      
      // Add the code block
      const language = match[1] || 'text'
      // Decode HTML entities in code
      const code = decodeHtmlEntities(match[2])
      segments.push({ type: 'code', content: code, language })
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining HTML after last code block
    if (lastIndex < html.length) {
      const htmlContent = html.slice(lastIndex)
      if (htmlContent.trim()) {
        segments.push({ type: 'html', content: htmlContent })
      }
    }
    
    return segments
  }, [html])

  return (
    <div className="post-content">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={index}
              code={part.content}
              language={part.language || 'text'}
              showLineNumbers={true}
            />
          )
        }
        
        return (
          <div
            key={index}
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: part.content }}
          />
        )
      })}
    </div>
  )
}

// Helper to decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
  }
  
  let decoded = text
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char)
  }
  
  // Also handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  
  return decoded
}

export default PostContent
