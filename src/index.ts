import { Hono } from 'hono';
import { logger } from 'hono/logger';

// import custom '/scores' route
import scores from './routes/scores';

// initialize the app
const app = new Hono();

// hono config / setup
app.use('*', logger());

// register scores route
app.route('/scores', scores);

// default root
app.get('/', (c) => c.json({ message: 'hello world' }));

// TODO: Implement onError, and NotFound
app.notFound((c) => c.json({ message: 'Not Found', ok: false }, 404));

// export the app directly for serverless execution
export default app;
