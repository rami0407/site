import React, { useState, useEffect } from 'react';

const Loader = () => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
    }, 1200); // 1.2s load simulation
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`loader-wrapper ${hidden ? 'hidden' : ''}`} id="loader">
      <div className="loader-content">
        <img 
          src="https://lh3.googleusercontent.com/pw/AP1GczOmuSnGS9OmfsVRo3-FedvNpsjYbgAZCMWlFYtMsFf4wX3F9upApscvMLiVa6MS2DQe7mNGNQO6zUyfSSMD4pmPpTOG5TFEZiZcE2jXzNrJjv7-4D9xh-H9HBsHtVYIU6nEesjXL_QvHFgZSVcvkU7jzA=w500-h500-s-no-gm?authuser=0" 
          alt="شعار المدرسة" 
          className="loader-logo"
        />
        <div className="loader-spinner"></div>
      </div>
    </div>
  );
};

export default Loader;
