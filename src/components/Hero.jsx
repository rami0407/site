import React from 'react';

const Hero = () => {
  const scrollToSection = (id) => {
    const targetElement = document.getElementById(id);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 75,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <div className="hero-logo-container">
          <img 
            src="https://lh3.googleusercontent.com/pw/AP1GczOmuSnGS9OmfsVRo3-FedvNpsjYbgAZCMWlFYtMsFf4wX3F9upApscvMLiVa6MS2DQe7mNGNQO6zUyfSSMD4pmPpTOG5TFEZiZcE2jXzNrJjv7-4D9xh-H9HBsHtVYIU6nEesjXL_QvHFgZSVcvkU7jzA=w500-h500-s-no-gm?authuser=0" 
            alt="شعار المدرسة" 
            className="hero-logo"
          />
        </div>
        <h1>أهلاً وسهلاً في مدرسة مشيرفة الابتدائية</h1>
        <p>معاً، نبني جيلاً واعداً ومستقبلاً مشرقاً ✨</p>
        <div class="hero-buttons">
          <button onClick={() => scrollToSection('initiatives')} className="btn btn-primary">
            <i className="fas fa-rocket"></i>
            تعرف على مبادراتنا
          </button>
          <button onClick={() => scrollToSection('contact')} className="btn btn-outline">
            <i className="fas fa-paper-plane"></i>
            تواصل معنا
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
