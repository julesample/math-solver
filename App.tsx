import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageCropModal from './components/ImageCropModal';
import MarkdownRenderer from './components/MarkdownRenderer';
import { LoadingSpinner, ErrorIcon, UploadIcon, PencilIcon } from './components/icons';
import { solveMathProblemFromImage, solveMathProblemFromText } from './services/geminiService';
import { AppState } from './types';


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.IDLE);
    const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
    const [imageToCrop, setImageToCrop] = useState<{file: File, url: string} | null>(null);
    const [uploadedImage, setUploadedImage] = useState<{url: string} | null>(null);
    const [textProblem, setTextProblem] = useState<string>('');
    const [submittedText, setSubmittedText] = useState<string | null>(null);
    const [solution, setSolution] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImageSelect = useCallback((file: File) => {
        // Revoke previous URL if it exists to prevent memory leaks
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop.url);
        }
        setImageToCrop({ file, url: URL.createObjectURL(file) });
        setAppState(AppState.CROPPING);
    }, [imageToCrop]);

    const handleCropConfirm = useCallback(async (base64: string, mimeType: string) => {
        // Create a blob from the base64 data to create an object URL for display
        const blob = await (await fetch(`data:${mimeType};base64,${base64}`)).blob();
        setUploadedImage({ url: URL.createObjectURL(blob) });
        
        setSubmittedText(null);
        setAppState(AppState.ANALYZING);
        setError(null);
        setSolution(null);
        setImageToCrop(null); // Clear the cropper state

        try {
            const result = await solveMathProblemFromImage(base64, mimeType);
            if (result.startsWith('Error:')) {
                throw new Error(result.replace('Error: ', ''));
            }
            setSolution(result);
            setAppState(AppState.SUCCESS);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
            setAppState(AppState.ERROR);
        }
    }, []);

    const handleTextSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!textProblem.trim()) return;
        
        setSubmittedText(textProblem);
        setUploadedImage(null);
        setAppState(AppState.ANALYZING);
        setError(null);
        setSolution(null);
        
        try {
            const result = await solveMathProblemFromText(textProblem);
            if (result.startsWith('Error:')) {
                throw new Error(result.replace('Error: ', ''));
            }
            setSolution(result);
            setAppState(AppState.SUCCESS);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
            setAppState(AppState.ERROR);
        }
    }, [textProblem]);

    const handleReset = () => {
        setAppState(AppState.IDLE);
        setUploadedImage(null);
        setImageToCrop(null);
        setSolution(null);
        setError(null);
        setTextProblem('');
        setSubmittedText(null);
        if (uploadedImage) {
            URL.revokeObjectURL(uploadedImage.url);
        }
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop.url);
        }
    };
    
    const renderIdleContent = () => {
        const activeBtnClasses = "bg-indigo-600 text-white";
        const inactiveBtnClasses = "text-gray-400 hover:bg-gray-700 hover:text-gray-200";

        return (
            <div className="w-full flex flex-col items-center gap-6">
                 {/* Segmented Control */}
                <div className="flex p-1 bg-gray-800 rounded-lg border border-gray-700">
                    <button onClick={() => setInputMode('upload')} className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${inputMode === 'upload' ? activeBtnClasses : inactiveBtnClasses}`}>
                        <UploadIcon className="w-5 h-5"/>
                        Upload Image
                    </button>
                    <button onClick={() => setInputMode('text')} className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${inputMode === 'text' ? activeBtnClasses : inactiveBtnClasses}`}>
                        <PencilIcon className="w-5 h-5" />
                        Type Problem
                    </button>
                </div>

                {inputMode === 'upload' ? (
                     <ImageUploader onImageSelect={handleImageSelect} disabled={appState !== AppState.IDLE} />
                ) : (
                    <form onSubmit={handleTextSubmit} className="w-full max-w-lg mx-auto flex flex-col gap-4">
                        <textarea
                            value={textProblem}
                            onChange={(e) => setTextProblem(e.target.value)}
                            placeholder="e.g., Solve for x in 2x + 5 = 15, or what is the integral of sin(x)?"
                            className="w-full h-40 p-4 bg-gray-800 border-2 border-gray-600 rounded-lg resize-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:outline-none transition-colors"
                            disabled={appState === AppState.ANALYZING}
                            aria-label="Math problem input"
                        />
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                            disabled={appState === AppState.ANALYZING || !textProblem.trim()}
                        >
                            Solve Problem
                        </button>
                    </form>
                )}
            </div>
        );
    }
    
    const renderResultContent = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full">
            {/* Left Side: Problem and Status */}
            <div className="flex flex-col space-y-4">
                {uploadedImage ? (
                    <img 
                        src={uploadedImage.url} 
                        alt="Uploaded math problem" 
                        className="max-w-full h-auto rounded-lg shadow-lg border-2 border-gray-700"
                    />
                ) : (
                    <div className="w-full bg-gray-800 p-6 rounded-lg shadow-inner">
                        <h3 className="text-lg font-semibold text-gray-300 mb-3">Your Problem:</h3>
                        <p className="text-gray-200 whitespace-pre-wrap font-mono">{submittedText}</p>
                    </div>
                )}

                {appState === AppState.ANALYZING && (
                    <div className="flex items-center text-lg text-indigo-300">
                        <LoadingSpinner className="h-6 w-6 mr-3 text-indigo-300" />
                        Analyzing problem...
                    </div>
                )}
                {appState === AppState.ERROR && error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center space-x-3 w-full">
                        <ErrorIcon className="h-6 w-6"/>
                        <div>
                            <p className="font-bold">Analysis Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side: Solution */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner min-h-[300px]">
                {appState === AppState.ANALYZING && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="w-16 h-2 bg-gray-700 rounded-full mb-4 animate-pulse"></div>
                        <div className="w-full h-2 bg-gray-700 rounded-full mb-2 animate-pulse" style={{ animationDelay: '100ms' }}></div>
                        <div className="w-10/12 h-2 bg-gray-700 rounded-full mb-2 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-full h-2 bg-gray-700 rounded-full mb-2 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        <div className="w-8/12 h-2 bg-gray-700 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                    </div>
                )}
                {appState === AppState.SUCCESS && solution && (
                     <MarkdownRenderer content={solution} />
                )}
                 {appState === AppState.ERROR && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p>The solution could not be generated.</p>
                        <p>Please try again or check the error message.</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 md:p-8">
            <header className="w-full max-w-6xl mx-auto text-center mb-8">
                 <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Math Solver Vision
                </h1>
                <p className="mt-2 text-lg text-gray-400">Upload an image or type a math problem to get a step-by-step solution.</p>
            </header>

            <main className="w-full max-w-6xl mx-auto flex-grow flex flex-col items-center justify-center">
                {appState === AppState.IDLE ? renderIdleContent() : renderResultContent()}
                
                {appState === AppState.CROPPING && imageToCrop && (
                    <ImageCropModal 
                        imageUrl={imageToCrop.url}
                        onConfirm={handleCropConfirm}
                        onCancel={handleReset}
                    />
                )}
            </main>

            <footer className="w-full max-w-6xl mx-auto text-center mt-8 px-4">
                 {(appState === AppState.SUCCESS || appState === AppState.ERROR) && (
                    <button
                        onClick={handleReset}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                       Solve Another Problem
                    </button>
                )}
                <div className="mt-8 text-gray-400 max-w-3xl mx-auto">
                    <details className="group">
                        <summary className="cursor-pointer list-none text-center font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                            <span className="group-open:hidden">About this App</span>
                            <span className="hidden group-open:inline">Hide Details</span>
                        </summary>
                        <div className="mt-4 text-left text-sm space-y-3 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                            <p><strong>Math Solver Vision</strong> is an AI-powered tool designed to make mathematics more accessible. Simply upload an image of a handwritten or printed math problem, or type it out directly, and our app will provide a detailed, step-by-step solution.</p>
                            <p>This application is built with modern web technologies including:</p>
                            <ul className="list-disc list-inside pl-4">
                                <li><strong>React</strong> for a dynamic user interface.</li>
                                <li><strong>Tailwind CSS</strong> for responsive and beautiful styling.</li>
                                <li><strong>Google's Gemini API</strong> as the core intelligence, analyzing images and text to understand and solve complex math problems.</li>
                            </ul>
                            <p>Whether you're a student trying to understand a difficult concept, a teacher preparing materials, or just someone curious, Math Solver Vision is here to help you break down problems and learn along the way.</p>
                        </div>
                    </details>
                </div>
                <p className="text-gray-600 text-sm mt-8">&copy; 2025 Math Solver Vision. Powered by Gemini. <a href='https://julesample.vercel.app/' className='text-indigo-400 hover:text-indigo-300 transition-colors' target='_blank'>Julesample</a></p>
            </footer>
        </div>
    );
};

export default App;