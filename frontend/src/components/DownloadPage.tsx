import { useEffect } from 'react';

const DownloadPage = () => {
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
          const base64Image = localStorage.getItem('anime_image');
          if (base64Image) {
            const link = document.createElement('a');
            link.href = base64Image;
            link.download = 'anime.jpg';
            link.click();
          }
        }
      });
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-full max-w-[1200px] p-4 sm:p-6 md:p-8">
      <h1 className="text-xl sm:text-xl md:text-3xl font-bold mb-6 text-center">
        Please complete the form to download your Anime
      </h1>
      <div id="hubspotForm" className="w-full" />
    </div>
  </div>
  );
};

export default DownloadPage;
