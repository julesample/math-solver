import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';

interface ImageCropModalProps {
    imageUrl: string;
    onConfirm: (croppedImageBase64: string, mimeType: string) => void;
    onCancel: () => void;
}

// Function to create a cropped image canvas
function getCroppedImg(
    image: HTMLImageElement,
    crop: PixelCrop,
    fileType: string
): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return Promise.reject(new Error('Could not get canvas context.'));
    }

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve) => {
        resolve(canvas.toDataURL(fileType));
    });
}


const ImageCropModal: React.FC<ImageCropModalProps> = ({ imageUrl, onConfirm, onCancel }) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        // Pre-select a 50% centered crop area
        setCrop(centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 50,
            },
            1, // aspect ratio 1:1, can be adjusted
            width,
            height,
          ),
          width,
          height,
        ));
    }

    const handleConfirmCrop = async () => {
        if (completedCrop && imgRef.current) {
            setIsProcessing(true);
            try {
                // Assuming original file type is jpeg, can be improved to get from file
                const croppedImageBase64 = await getCroppedImg(imgRef.current, completedCrop, 'image/jpeg');
                onConfirm(croppedImageBase64.split(',')[1], 'image/jpeg');
            } catch (error) {
                console.error("Error cropping image:", error);
                // Optionally handle error in UI
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl text-white border border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-center">Crop Image</h2>
                <p className="text-center text-gray-400 mb-6">Drag and resize the box to select the math problem.</p>
                <div className="flex justify-center bg-gray-900 p-4 rounded-lg">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={undefined} // Free crop
                    >
                        <img
                            ref={imgRef}
                            src={imageUrl}
                            alt="Crop preview"
                            style={{ maxHeight: '60vh' }}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmCrop}
                        disabled={!completedCrop || isProcessing}
                        className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Crop & Solve'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;
