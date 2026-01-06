import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CsvService } from './services/csv-service';
import { createPortfolioRoutes } from './routes/portfolios';
import { createCashAccountRoutes } from './routes/cash-accounts';
import { createTransactionRoutes } from './routes/transactions';
import { createSnapshotRoutes } from './routes/snapshots';
import { createDashboardRoutes } from './routes/dashboard';
import { createMasterRoutes } from './routes/master';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;
const DATA_PATH = process.env.DATA_PATH || './data';

// CORS Configuration - Allow all origins for now (can restrict later)
const allowedOrigins = [
    'https://manage-portfolio-fe.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin) || process.env.CORS_ORIGIN === '*') {
            callback(null, true);
        } else {
            // In production, allow the specific origin from env
            if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
                callback(null, true);
            } else {
                // For debugging, allow all for now
                console.log(`CORS: Allowing origin ${origin}`);
                callback(null, true);
            }
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize CSV Service
const csvService = new CsvService(DATA_PATH);

// Routes
app.use('/api/portfolios', createPortfolioRoutes(csvService));
app.use('/api/cash-accounts', createCashAccountRoutes(csvService));
app.use('/api/transactions', createTransactionRoutes(csvService));
app.use('/api/snapshots', createSnapshotRoutes(csvService));
app.use('/api/dashboard', createDashboardRoutes(csvService));
app.use('/api/master', createMasterRoutes(csvService));

// Root route
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Portfolio Management API',
        endpoints: ['/api/portfolios', '/api/transactions', '/api/snapshots', '/api/dashboard', '/health']
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Portfolio Management API is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Data path: ${DATA_PATH}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
