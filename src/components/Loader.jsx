import React, { useState, useEffect } from 'react';

const Loader = () => {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setHidden(true);
    }, 80);
    const removeTimer = setTimeout(() => {
      setRemoved(true);
    }, 380);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (removed) return null;

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
