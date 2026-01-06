import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import services
import { CsvService } from './services/csv-service';
import { isSupabaseEnabled } from './config/supabase';

// CSV Routes (fallback)
import { createPortfolioRoutes } from './routes/portfolios';
import { createCashAccountRoutes } from './routes/cash-accounts';
import { createTransactionRoutes } from './routes/transactions';
import { createSnapshotRoutes } from './routes/snapshots';
import { createDashboardRoutes } from './routes/dashboard';
import { createMasterRoutes } from './routes/master';
import { createAssetAnalyticsRoutes } from './routes/asset-analytics';

// Supabase Routes
import {
    createSupabasePortfolioRoutes,
    createSupabaseCashAccountRoutes,
    createSupabaseTransactionRoutes,
    createSupabaseSnapshotRoutes,
    createSupabaseDashboardRoutes,
    createSupabaseMasterRoutes,
} from './routes/supabase';

const app: Express = express();
const PORT = process.env.PORT || 3001;
const DATA_PATH = process.env.DATA_PATH || './data';
const USE_SUPABASE = isSupabaseEnabled();

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

// Routes - Use Supabase if configured, otherwise fall back to CSV
if (USE_SUPABASE) {
    console.log('📦 Using Supabase for data storage');
    app.use('/api/portfolios', createSupabasePortfolioRoutes());
    app.use('/api/cash-accounts', createSupabaseCashAccountRoutes());
    app.use('/api/transactions', createSupabaseTransactionRoutes());
    app.use('/api/snapshots', createSupabaseSnapshotRoutes());
    app.use('/api/dashboard', createSupabaseDashboardRoutes());
    app.use('/api/master', createSupabaseMasterRoutes());
} else {
    console.log('📁 Using CSV files for data storage');
    const csvService = new CsvService(DATA_PATH);
    app.use('/api/portfolios', createPortfolioRoutes(csvService));
    app.use('/api/cash-accounts', createCashAccountRoutes(csvService));
    app.use('/api/transactions', createTransactionRoutes(csvService));
    app.use('/api/snapshots', createSnapshotRoutes(csvService));
    app.use('/api/dashboard', createDashboardRoutes(csvService));
    app.use('/api/master', createMasterRoutes(csvService));
    app.use('/api/asset-analytics', createAssetAnalyticsRoutes(csvService));
}

// Root route
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Portfolio Management API',
        storage: USE_SUPABASE ? 'supabase' : 'csv',
        endpoints: ['/api/portfolios', '/api/transactions', '/api/snapshots', '/api/dashboard', '/api/asset-analytics', '/health']
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Portfolio Management API is running',
        storage: USE_SUPABASE ? 'supabase' : 'csv',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Storage: ${USE_SUPABASE ? 'Supabase' : 'CSV files'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
