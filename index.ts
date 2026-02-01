import 'reflect-metadata';
import { config } from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import { AppDataSource } from './src/db/data-source';
import apiRoutes from './src/api';

config();

const app = express();
const port = process.env.PORT ?? 9000;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// API routes (mounted at /api)
app.use('/api', apiRoutes);

// Initialize TypeORM and start server
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection established');
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });