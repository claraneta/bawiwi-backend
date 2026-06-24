import axios from 'axios';

const smsClient = axios.create({
  baseURL: 'https://smsapiph.onrender.com/api/v1',
  headers: {
    'x-api-key': process.env.SMS_API_KEY || '',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export default smsClient;
