import PrimeCategory from '../models/PrimeCategory.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';

export const generateSerialNumber = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let serialLetters = '';
  const letterCount = Math.floor(Math.random() * 2) + 2;
  for (let i = 0; i < letterCount; i++) {
    serialLetters += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  let serialNumbers = '';
  const numberCount = Math.floor(Math.random() * 3) + 4;
  for (let i = 0; i < numberCount; i++) {
    serialNumbers += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return serialLetters + serialNumbers;
};

export const generateUniqueSerialNumber = async (maxAttempts = 20) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const serialNumber = generateSerialNumber();

    const [primeExists, categoryExists, subcategoryExists] = await Promise.all([
      PrimeCategory.findOne({ serialNumber }),
      Category.findOne({ serialNumber }),
      Subcategory.findOne({ serialNumber })
    ]);

    if (!primeExists && !categoryExists && !subcategoryExists) {
      return serialNumber;
    }

    attempts++;
  }

  throw new Error('Unable to generate unique serial number after maximum attempts');
};

export const validateSerialNumber = (serialNumber) => {
  if (serialNumber === undefined || serialNumber === null) return false;
  const value = String(serialNumber).trim().toUpperCase();
  const regex = /^[A-Z]{2,3}[0-9]{4,6}$/;
  return regex.test(value);
};

export const isSerialNumberUnique = async (serialNumber, excludeId = null, modelType = null) => {
  const value = String(serialNumber).trim().toUpperCase();

  const queries = [];

  const primeQuery = { serialNumber: value };
  if (modelType === 'prime' && excludeId) {
    primeQuery._id = { $ne: excludeId };
  }
  queries.push(PrimeCategory.findOne(primeQuery));

  const categoryQuery = { serialNumber: value };
  if (modelType === 'category' && excludeId) {
    categoryQuery._id = { $ne: excludeId };
  }
  queries.push(Category.findOne(categoryQuery));

  const subcategoryQuery = { serialNumber: value };
  if (modelType === 'subcategory' && excludeId) {
    subcategoryQuery._id = { $ne: excludeId };
  }
  queries.push(Subcategory.findOne(subcategoryQuery));

  const results = await Promise.all(queries);
  return !results.some(result => result !== null);
};