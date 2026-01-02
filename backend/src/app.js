import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { healthHandler } from './controllers/authController.js';
import tenantUserRoutes from './routes/tenantUserRoutes.js';
import taskStatusRoutes from './routes/taskStatusRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config({ path: '../.env' });

const app = express();

app.use(helmet());

// CORS configuration - allow both Docker network and localhost
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://frontend:3000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', healthHandler);
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/tenants/:tenantId/users', tenantUserRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/tasks', taskStatusRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;