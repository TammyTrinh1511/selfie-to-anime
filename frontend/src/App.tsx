import { useState } from "react";
import CameraCapture from "./components/CameraCapture";
import { QRCodeSVG } from "qrcode.react";
import { useMediaQuery } from "react-responsive";

export default function App() {
  const [activeTab, setActiveTab] = useState<"camera" | "results">("camera");
  const [_, setCapturedImage] = useState<string | null>(null);
  const [animeImageUrl, setAnimeImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

    // Hàm chuyển đổi base64 thành Blob
    const base64ToBlob = (
      base64: string,
      contentType: string = "image/jpeg",
      sliceSize: number = 512
    ): Blob => {
      const byteCharacters = atob(base64);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      return new Blob(byteArrays, { type: contentType });
    };
  
    const handleCapture = async (imageBase64: string) => {
      console.log("Captured image:", imageBase64); 
      setCapturedImage(imageBase64);
      setActiveTab("results");
      setLoading(true);
      try {
        const base64Data = imageBase64.split(",")[1];
        const blob = base64ToBlob(base64Data, "image/jpeg");        
        const formData = new FormData();
        formData.append("file", blob, "capture.jpg");  
        const response = await fetch("http://localhost:8000/generate-caricature", {
          method: "POST",
          body: formData,
        });
        const imageBlob = await response.blob();

        // Tạo URL từ blob và cập nhật state để hiển thị ảnh:
        const imageUrl = URL.createObjectURL(imageBlob);
        setAnimeImageUrl(imageUrl);

      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setLoading(false);
      }
    };
 

  return (
    <div
      className="min-h-screen flex justify-center bg-white overflow-x-hidden"
      style={{
        backgroundImage: "url(/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-[1200px] mx-auto text-center px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-black">
          Anime Yourself in Seconds
        </h1>

        <div className="w-full max-w-md mx-auto mb-6">
          <div className="flex space-x-2 md:space-x-12 items-center justify-center">
            {["camera", "results"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "camera" | "results")}
                className={`py-2 rounded-[28px] px-4 sm:px-6 md:px-[40px] lg:px-[120px] font-medium border transition ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-[#1A3360] to-[#024DA1] text-white"
                    : "bg-white border-black text-black"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "camera" ? (
          <div className="bg-black w-full rounded-lg relative overflow-hidden h-[300px] md:h-[675px]">
            <CameraCapture onCapture={handleCapture} />
          </div>
        ) : (
          <div className="relative flex flex-col md:flex-row gap-6 items-center md:items-start">

          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-70 z-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-t-4 border-b-4 border-white rounded-full animate-spin"></div>
              <p className="text-white text-lg font-semibold mt-4">
                Generating your Anime...
              </p>
              <p className="text-white mt-2">
                Please wait 15-30 seconds
              </p>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="flex flex-col items-center md:items-end-safe ">
              <p className="text-[#F05A28] font-semibold text-base md:text-lg lg:text-[38px]">
                Ready to Wow?
              </p>
              <p className="text-black text-base md:text-lg mb-2 lg:text-[38px]">
                Download Your Anime Edition!
              </p>
              <div className="bg-white border border-gray-300 rounded-md w-[120px] h-[150px] md:w-[360px] md:h-[360px] flex items-center justify-center">
                {animeImageUrl ? (
                  <QRCodeSVG value={animeImageUrl} size={isMobile ? 120 : 360} />
                ) : loading ? (
                  <p className="text-xs text-gray-400 animate-pulse">
                    Generating...
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">QR code here</p>
                )}
              </div>
            </div>
            <div className="bg-black rounded-xl w-[200px] h-[250px] md:w-[600px] md:h-[600px] flex items-center justify-center overflow-hidden">
              {loading ? (
                <p className="text-white animate-pulse text-xs md:text-sm">
                  Generating your Anime...
                </p>
              ) : animeImageUrl ? (
                <img
                  src={animeImageUrl}
                  alt="Anime"
                  className="object-contain h-full"
                />
              ) : (
                <p className="text-white text-xs md:text-sm">
                  Your Anime will appear here
                </p>
              )}
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
