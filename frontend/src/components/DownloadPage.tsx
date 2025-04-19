import { useEffect, useState } from 'react';

const DownloadPage = () => {
  const [canDownload, setCanDownload] = useState(false);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//js.hsforms.net/forms/embed/v2.js';
    script.async = true;
    script.onload = () => {
      (window as any).hbspt.forms.create({
        portalId: '44721798',
        formId: '447c955b-aa87-48f7-acea-29243de211cd',
        region: 'na1',
        target: '#hubspotForm',
        onFormSubmitted: () => {
          setCanDownload(true);
        },
      });
    };
    document.body.appendChild(script);
  }, []);

  const handleDownload = () => {
    const imageUrl = localStorage.getItem('download_url'); // 👈 key chứa link ảnh từ JSON response
    if (!imageUrl) return;

    const parts = imageUrl.split('/');
    const name = parts[parts.length - 1];
    if (!name) {
      console.warn("⚠️ fileName is null!");
      return;
    }
  
    const isiOS = /iP(ad|hone)/.test(navigator.userAgent);
    const url = `${import.meta.env.VITE_API_BASE_URL}/api/download-caricature?file=${encodeURIComponent(name)}`;
  
    if (isiOS) {
      console.log("📱 iOS detected → mở tab mới");
      window.open(url, '_blank'); // iOS không hỗ trợ a.download
    } else {
      console.log("💻 Non-iOS → dùng thẻ <a> để download");
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
          type="button"

            onClick={handleDownload}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Download your Anime
          </button>
        )}
      </div>
    </div>
  );
};

export default DownloadPage;
