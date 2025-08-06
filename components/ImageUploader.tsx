
import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, disabled }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback((file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            onImageSelect(file);
        } else {
            alert("Please upload a valid image file (PNG, JPG, etc.).");
        }
    }, [onImageSelect]);

    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [disabled, handleFile]);

    const uploaderClasses = `flex justify-center items-center w-full h-64 px-6 transition bg-gray-800 border-2 border-dashed rounded-lg appearance-none cursor-pointer hover:border-indigo-400 focus:outline-none ${isDragging ? 'border-indigo-400' : 'border-gray-600'}`;

    return (
        <div className="w-full max-w-lg mx-auto">
            <label
                htmlFor="file-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={uploaderClasses}
            >
                <span className="flex flex-col items-center space-y-2">
                    <UploadIcon />
                    <span className="font-medium text-gray-400">
                        Drop an image of a math problem, or{' '}
                        <span className="text-indigo-400 underline">browse</span>
                    </span>
                </span>
                <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={disabled}
                    capture="environment"
                />
            </label>
        </div>
    );
};

export default ImageUploader;