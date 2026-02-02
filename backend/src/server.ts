import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import services
import { isSupabaseEnabled } from './config/supabase';

// Supabase Routes
import {
    createSupabasePortfolioRoutes,
    createSupabaseCashAccountRoutes,
    createSupabaseTransactionRoutes,
    createSupabaseSnapshotRoutes,
    createSupabaseDashboardRoutes,
    createSupabaseMasterRoutes,
    createSupabaseAssetAnalyticsRoutes,
} from './routes/supabase';

const app: Express = express();
const PORT = process.env.PORT || 3001;
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

// Routes - Use Supabase routes (they now support CSV fallback internally)
if (USE_SUPABASE) {
    console.log('📦 Using Supabase for data storage');
} else {
    console.warn('⚠️ Supabase is not enabled. Using CSV fallback storage.');
}

app.use('/api/portfolios', createSupabasePortfolioRoutes());
app.use('/api/cash-accounts', createSupabaseCashAccountRoutes());
app.use('/api/transactions', createSupabaseTransactionRoutes());
app.use('/api/snapshots', createSupabaseSnapshotRoutes());
app.use('/api/dashboard', createSupabaseDashboardRoutes());
app.use('/api/master', createSupabaseMasterRoutes());
app.use('/api/asset-analytics', createSupabaseAssetAnalyticsRoutes());

// Root route
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Portfolio Management API',
        storage: 'supabase',
        endpoints: ['/api/portfolios', '/api/transactions', '/api/snapshots', '/api/dashboard', '/api/asset-analytics', '/health']
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Portfolio Management API is running',
        storage: 'supabase',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Storage: Supabase`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Keep-alive mechanism for Render
    // Ping both Backend and Frontend to prevent sleep
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
    const FRONTEND_URL = 'https://portfolio-fe-v1.onrender.com/';

    if (RENDER_EXTERNAL_URL) {
        console.log(`⏰ Setting up keep-alive for Backend: ${RENDER_EXTERNAL_URL}`);
        console.log(`⏰ Setting up keep-alive for Frontend: ${FRONTEND_URL}`);

        const pingUrl = async (url: string, name: string) => {
            try {
                // Use built-in fetch (Node 18+)
                const response = await fetch(url);
                console.log(`💓 Keep-alive ping to ${name} (${url}): Status ${response.status}`);
            } catch (error: any) {
                console.error(`💓 Keep-alive ping failed to ${name} (${url}):`, error.message);
            }
        };

        const pingKeepAlive = async () => {
            // Ping Backend Health
            await pingUrl(`${RENDER_EXTERNAL_URL}/health`, 'Backend');
            // Ping Frontend Hash (or minimal page) to keep it awake
            await pingUrl(FRONTEND_URL, 'Frontend');
        };

        // Ping immediately on start
        pingKeepAlive();

        // Ping every 10 minutes (Render sleeps after 15 mins)
        // 14 minutes might be too close if there's drift
        const INTERVAL_MS = 10 * 60 * 1000;
        setInterval(pingKeepAlive, INTERVAL_MS);
    }
});

export default app;
