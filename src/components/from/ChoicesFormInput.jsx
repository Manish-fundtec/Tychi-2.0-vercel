"use client";
import React, { useEffect, useRef } from 'react';
import Choices from 'choices.js';

const ChoicesFormInput = ({ name, value, onChange, children }) => {
  const selectRef = useRef(null);
  const choicesInstance = useRef(null);

  useEffect(() => {
    if (selectRef.current && !choicesInstance.current) {
      choicesInstance.current = new Choices(selectRef.current, {
        searchEnabled: false,
        shouldSort: false,
        itemSelectText: '',
      });

      // 👇 Register a manual event to simulate React onChange
      selectRef.current.addEventListener('change', (e) => {
        const syntheticEvent = {
          target: {
            name,
            value: e.target.value,
          },
        };
        onChange(syntheticEvent);
      });
    }

    return () => {
      if (choicesInstance.current) {
        choicesInstance.current.destroy();
        choicesInstance.current = null;
      }
    };
  }, []);

  return (
    <select
      ref={selectRef}
      name={name}
      defaultValue={value}
      className="form-select"
    >
      {children}
    </select>
  );
};

export default ChoicesFormInput;
