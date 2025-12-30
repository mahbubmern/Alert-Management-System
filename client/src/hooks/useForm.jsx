import { useState } from "react";

// create useForm Hook
export const useForm = (initialState) => {
  //state init

  const [input, setInput] = useState(initialState);

  // handle Input Change

  const handleInputChange = (e) => {
    setInput((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
      
    }));
  };
  // form Reset
  const formReset = () => {
    setInput(initialState);
  };

  return { input, setInput, handleInputChange, formReset };
};
