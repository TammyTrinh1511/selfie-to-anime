import { useEffect, useState } from 'react';

const DownloadPage = () => {
  const [isSubmit, setIsSubit] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const imageUrl = searchParams.get('image_url');
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
        onFormSubmit: (htmlForm: HTMLFormElement) => {
          console.log('Form submitted:', htmlForm);
          const hidden = htmlForm.querySelector(
            'input[name="anime_image_url"]'
          ) as HTMLInputElement | null
          console.log("Hidden input:", hidden);
          if (hidden) {
            hidden.value = imageUrl || ''
          } else {
            console.warn('Không tìm thấy input[name="anime_image_url"]')
          }
        },
        onFormSubmitted: () => {
          console.log('Form submitted successfully');
          setIsSubit(true);
        }
      });
    };
    document.body.appendChild(script);
  }, []);

  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-full max-w-[1200px] p-4 sm:p-6 md:p-8">
      {!isSubmit && (
        <h1 className="text-xl sm:text-xl md:text-3xl font-bold mb-6 text-center">
          'Please complete the form to download your Anime'
      </h1>
      )}
      
      <div id="hubspotForm" className="w-full" />

    </div>
  </div>
  );
};

export default DownloadPage;
