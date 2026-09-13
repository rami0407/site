import React, { useState, useEffect } from 'react';

const Loader = () => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
    }, 150); // Fast smooth transition (was 1200ms delay)
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`loader-wrapper ${hidden ? 'hidden' : ''}`} id="loader">
      <div className="loader-content">
        <img 
          src={`${import.meta.env.BASE_URL}school_logo.png`} 
          alt="شعار مدرسة مشيرفة" 
          className="loader-logo"
          onError={(e) => { e.currentTarget.src = `${import.meta.env.BASE_URL}icon-512.png`; }}
        />
        <div className="loader-spinner"></div>
      </div>
    </div>
  );
};

export default Loader;
