import { useEffect, useState } from 'react';

const DownloadPage = () => {
  const [canDownload, setCanDownload] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//js.hsforms.net/forms/embed/v2.js';
    script.async = true;
    script.onload = () => {
      // Tạo form Hubspot sau khi script tải xong
      (window as any).hbspt.forms.create({
        portalId: '44721798',
        formId: '447c955b-aa87-48f7-acea-29243de211cd',
        region: 'na1',
        target: '#hubspotForm',
        onFormSubmitted: () => {
          // Khi submit form → tự động tải ảnh
          setCanDownload(true);
        }
      });
    };
    document.body.appendChild(script);
  }, []);

  const handleDownload = () => {
    const base64Image = localStorage.getItem("anime_image");
    if (base64Image) {
      const link = document.createElement("a");
      link.href = base64Image;
      link.download = "anime.jpg";
      link.click();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-full max-w-[1200px] p-4 sm:p-6 md:p-8">
      <h1 className="text-xl sm:text-xl md:text-3xl font-bold mb-6 text-center">
        Please complete the form to download your Anime
      </h1>
      <div id="hubspotForm" className="w-full" />
      {canDownload && (
        <button
          onClick={handleDownload}
          className="mt-6 px-6 py-3 bg-[#1A3360] hover:bg-[#024DA1] text-white font-semibold rounded-md"
        >
          Download Anime
        </button>
      )}
    </div>
  </div>
  );
};

export default DownloadPage;
