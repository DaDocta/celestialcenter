// src/utils/userService.js
import fetchData from './fetchData';

export const createUser = async (name, email, password) => {
  const data = await fetchData('https://celestialcenter-835108787508.us-south1.run.app/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  return data;
};

export const loginUser = async (email, password) => {
  const data = await fetchData('https://celestialcenter-835108787508.us-south1.run.app/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return data;
};
