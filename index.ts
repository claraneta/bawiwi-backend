const express = require('express');
import { NextFunction, Request, Response } from 'express';

console.log('Starting server...');

const app = express();
const port = 9000;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Controller function
const getHello = (req: Request, res: Response) => {
  res.json({ message: 'Hello, World!' });
};

// Route
app.get('/api/hello', getHello);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});