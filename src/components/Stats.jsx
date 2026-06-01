import React, { useState, useEffect } from 'react';
import { statsData } from '../data/schoolData';

const StatNumber = ({ target }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(target, 10);
    if (isNaN(end) || end <= 0) return;
    
    // Choose step speed based on size of target to look natural
    const duration = 1500; // 1.5s total animation
    const frames = 60; // total ticks
    const step = Math.ceil(end / frames);
    const tickTime = duration / frames;

    let timer = setInterval(() => {
      start += step;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, tickTime);

    return () => clearInterval(timer);
  }, [target]);

  return <>{count}</>;
};

const Stats = () => {
  return (
    <section className="stats">
      <div className="stats-container">
        {statsData.map((stat) => (
          <div className="stat-item" key={stat.id}>
            <div className="stat-icon">
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div className="stat-number">
              <StatNumber target={stat.target} />
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
