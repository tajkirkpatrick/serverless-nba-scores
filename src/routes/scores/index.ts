import { Hono } from 'hono';
import { getScores } from '../../libs';

const scores = new Hono();

// within this group, /scores is already prepended to each entry
// '/' => '/scores/'
scores.get('/', getScores);
// '/:year/:month/:day' => '/scores/2022/12/01'
scores.get('/:year/:month/:day', getScores);

export default scores;
