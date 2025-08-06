import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully,
  // but for this context, throwing an error is fine.
  // The UI will catch this and display an error message.
  throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

const systemInstruction = `You are an expert math tutor AI. Your goal is to provide a clear, easy-to-understand, step-by-step solution to the user's math problem.

**CRITICAL Formatting Rules:**
1.  **Use Markdown:** Structure your entire response using Markdown.
2.  **Headings:** Use '##' for main sections like "Problem", "Step-by-Step Solution", and "Final Answer". Each heading MUST start on a new line.
3.  **Lists:** Use numbered lists for steps. Each list item (e.g., '1.', '2.') MUST start on a new line.
4.  **KaTeX for Math:** ALL mathematical notation, variables, and expressions MUST be enclosed in KaTeX delimiters.
    *   For **inline** math (like a variable in a sentence), use single dollar signs: \`$x^2 + 5$\`.
    *   For **display/block** math (like a standalone equation), use double dollar signs: \`$$\\frac{a}{b} = c$$\`.
5.  **Clarity:** Bold key terms using \`**term**\`. Explain each step simply and clearly.

**Example Structure:**

## Problem
The problem is to solve the equation: $$3x + 5 = 14$$.

## Step-by-Step Solution
1.  Our goal is to isolate the variable **$x$**.
2.  First, we subtract **$5$** from both sides of the equation.
    $$3x + 5 - 5 = 14 - 5$$
    $$3x = 9$$
3.  Next, we divide both sides by **$3$**.
    $$\\frac{3x}{3} = \\frac{9}{3}$$
    $$x = 3$$

## Final Answer
The final answer is:
$$\\boxed{x = 3}$$
`;


export const solveMathProblemFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Image,
            },
        };

        const textPart = {
            text: "Solve the math problem shown in this image.",
        };
        
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [textPart, imagePart] },
            config: {
                systemInstruction: systemInstruction,
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        if (error instanceof Error) {
            return `Error: ${error.message}`;
        }
        return "An unknown error occurred while analyzing the image.";
    }
};

export const solveMathProblemFromText = async (problem: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: problem,
            config: {
                systemInstruction: systemInstruction,
                // Optimize for speed for text-based queries
                thinkingConfig: { thinkingBudget: 0 }
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error solving text problem with Gemini:", error);
        if (error instanceof Error) {
            return `Error: ${error.message}`;
        }
        return "An unknown error occurred while solving the problem.";
    }
};