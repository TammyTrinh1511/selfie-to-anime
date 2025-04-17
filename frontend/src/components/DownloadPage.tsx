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
          const animeUrl = new URLSearchParams(window.location.search).get('image');
          if (animeUrl) {
            const link = document.createElement('a');
            link.href = animeUrl;
            link.download = 'anime.jpg';
            link.click();
          }
        }
      });
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">Please complete the form to download your Anime</h1>
      <div id="hubspotForm" />
    </div>
  );
};

export default DownloadPage;
