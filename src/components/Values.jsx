import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { valuesData as fallbackValues } from '../data/schoolData';

const Values = () => {
  const [values, setValues] = useState([]);

  useEffect(() => {
    const fetchValues = async () => {
      try {
        const valuesRef = collection(db, 'values');
        const querySnapshot = await getDocs(valuesRef);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id });
        });

        if (list.length === 0) {
          setValues(fallbackValues);
        } else {
          // Sort by id order: gold, silver, bronze or as they were originally structured (bronze, silver, gold)
          const order = { bronze: 1, silver: 2, gold: 3 };
          list.sort((a, b) => (order[a.id] || 99) - (order[b.id] || 99));
          setValues(list);
        }
      } catch (error) {
        console.error("Error fetching values from Firestore:", error);
        setValues(fallbackValues);
      }
    };

    fetchValues();
  }, []);

  return (
    <section className="section values-section">
      <div className="container">
        <h3 className="section-title" style={{ display: 'block', textAlign: 'center', marginBottom: '3.5rem' }}>
          قيمنا المدرسية العليا
        </h3>
        
        <div className="values-grid">
          {values.map((val) => (
            <div className={`value-card ${val.grade || 'value-gold'}`} key={val.id}>
              <div className="value-badge">
                <i className={`fas ${val.icon}`}></i>
              </div>
              <h4 className="value-title">{val.title}</h4>
              <p className="value-description">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Values;
