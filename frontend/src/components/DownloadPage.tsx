import { useEffect, useState } from 'react';

const DownloadPage = () => {
  const [canDownload, setCanDownload] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const imageUrl = searchParams.get('image_url');
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

  // const handleDownload = () => {
  //   const imageUrl = localStorage.getItem('download_url'); 
  //   if (!imageUrl) return;

  //   const parts = imageUrl.split('/');
  //   const name = parts[parts.length - 1];
  //   if (!name) {
  //     console.warn("⚠️ fileName is null!");
  //     return;
  //   }

  //   const isiOS = /iP(ad|hone)/.test(navigator.userAgent);
  //   const url = `${import.meta.env.VITE_API_BASE_URL}/api/download-caricature?file=${encodeURIComponent(name)}`;

  //   if (isiOS) {
  //     window.open(url, '_blank'); // iOS không hỗ trợ a.download
  //   } else {
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = '';
  //     a.style.display = 'none';
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //   }
  // };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl, { credentials: 'include' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = imageUrl.split('/').pop() || 'anime.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-full max-w-[1200px] p-4 sm:p-6 md:p-8">
      <h1 className="text-xl sm:text-xl md:text-3xl font-bold mb-6 text-center">
          {canDownload
            ? ''
            : 'Please complete the form to download your Anime'}
      </h1>
      <div id="hubspotForm" className="w-full" />
      {canDownload && (
        <button
          onClick={handleDownload}
          className="mt-6 px-6 py-3 bg-[#FF7A59] hover:bg-[#e85e3f] text-white font-semibold rounded-[15px] leading-[14px]
          min-w-[220px] max-w-[300px] mx-auto text-center block">
          Download Your Anime Picture
        </button>
      )}
    </div>
  </div>
  );
};

export default DownloadPage;
