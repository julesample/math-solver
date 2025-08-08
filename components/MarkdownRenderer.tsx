import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    // This pre-processing step adds resilience against the AI occasionally
    // forgetting to add newlines before headings or list items.
    const preprocessedContent = content
        // Ensure headings are on new lines
        .replace(/(\S)(##\s)/g, '$1\n$2')
        // Ensure list items are on new lines
        .replace(/(\S)(\d+\.\s)/g, '$1\n$2')
        .replace(/(\S)(\*\s|\-\s)/g, '$1\n$2');

    return (
        <ReactMarkdown
            children={preprocessedContent}
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            className="prose prose-invert prose-lg max-w-none text-gray-300"
            components={{
                // Customize rendering for better styling with Tailwind
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3 border-b border-gray-600 pb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="ml-4" {...props} />,
                p: ({node, ...props}) => <p className="mb-4" {...props} />,
                code({node, inline, className, children, ...props}) {
                    // This component handles both inline and block code.
                    // For math, KaTeX handles its own code blocks.
                    // This is for general code snippets.
                    return !inline ? (
                      <pre className="bg-gray-800 p-4 rounded-md my-4 overflow-x-auto">
                        <code className="font-mono text-sm text-yellow-300" {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="bg-gray-700 text-pink-400 rounded px-1.5 py-1" {...props}>
                        {children}
                      </code>
                    )
                  }
            }}
        />
    );
};

export default MarkdownRenderer;