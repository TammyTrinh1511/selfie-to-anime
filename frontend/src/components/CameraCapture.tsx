import React, { useRef } from "react";
import Webcam from "react-webcam";

type Props = {
  onCapture?: (imageBase64: string) => void;
};

export default function CameraCapture({ onCapture }: Props) {
  const webcamRef = useRef<Webcam>(null);

  const capture = () => {
    console.log("Capture button clicked");
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (onCapture && imageSrc) {
        onCapture(imageSrc);
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full h-full object-cover"
        videoConstraints={{
          facingMode: "user",
          width: 640,
          height: 480,
        }}
      />
      <button
        onClick={capture}
        className="absolute bottom-4  w-16 h-16  left-1/2 -translate-x-1/2 bg-[#333] bg-opacity-20 border  rounded-full p-3 hover:bg-opacity-40 transition"
      >
          <img src="/camera.png" alt="Camera icon"     className="block mx-auto" // thêm 'block' và 'mx-auto'
          />
      </button>
    </div>
  );
}
