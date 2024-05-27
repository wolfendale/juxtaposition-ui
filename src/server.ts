import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { default as RedisStore } from 'connect-redis';
import logger from '@/logger';
import * as database from '@/database';
import { redisClient } from '@/redisCache';
import juxt_web from '@/services/juxt-web';
import type { Request, Response } from 'express';
import config from '../config.json';

process.title = 'Pretendo - Juxt-Web';

const { http: { port } } = config;
const app = express();

app.set('etag', false);
app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/webfiles');
app.set('trust proxy', 2);
app.get('/ip', (request, response) => response.send(request.ip));

// Create router
logger.info('Setting up Middleware');
app.use(morgan('dev'));
app.enable('trust proxy');
app.use(express.json());

app.use(express.urlencoded({
	extended: true,
	limit: '1mb',
}));

app.use(cookieParser());

app.use(session({
	store: new RedisStore({ client: redisClient }),
	secret: config.aes_key,
	resave: false,
	saveUninitialized: false
}));

// import the servers into one
app.use(juxt_web);

// 404 handler
logger.info('Creating 404 status handler');
app.use((req, res) => {
	logger.warn(req.protocol + '://' + req.get('host') + req.originalUrl);
	res.render(req.directory + '/error.ejs', {
		code: 404,
		message: 'Page not found',
		cdnURL: config.CDN_domain,
		lang: req.lang,
		pid: req.pid
	});
});

// non-404 error handler
logger.info('Creating non-404 status handler');
app.use((error: any, request: Request, response: Response) => {
	const status = error.status || 500;

	response.status(status);

	response.json({
		app: 'api',
		status,
		error: error.message
	});
});

// Starts the server
async function main(): Promise<void> {
	// Starts the server
	logger.info('Starting server');

	await database.connect();
	logger.success('Database connected');
	await redisClient.connect();

	app.listen(port, () => {
		logger.success(`Server started on port ${port}`);
	});
}

main().catch(console.error);