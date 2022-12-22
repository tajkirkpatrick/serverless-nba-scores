import { type Context } from 'hono';
import type { CustomHandler, Environment } from 'hono/dist/types';
import * as cheerio from 'cheerio';

const MONTH = new Date(Date.now()).getMonth();
const DAY = new Date(Date.now()).getDate() - 1;
const YEAR = new Date(Date.now()).getUTCFullYear();

// what page we scraping?
const BASE_URL = 'https://www.basketball-reference.com/boxscores/';

export const getScores: CustomHandler = async (
    ctx: Context<string, Partial<Environment>>
) => {
    // retrieve user inputs
    let { year, month, day } = ctx.req.param();

    if (!year) {
        year = YEAR.toString();
    }

    if (!month) {
        month = (MONTH + 1).toString();
    }

    if (!day) {
        day = DAY.toString();
    }

    const SEARCH_URL = `${BASE_URL}?month=${month}&day=${day}&year=${year}`;
    console.log('URL ', SEARCH_URL);

    // go get the raw html from website
    const html = await fetch(SEARCH_URL, { method: 'GET' }).then(
        async (response) => await response.text()
    );

    // use cheerio to parse and traverse the html
    const $ = cheerio.load(html);

    // init the return value to be json-ified
    const results: any[] = [];

    //  for every element that has the class selector '.game_summary'
    $('.game_summary').each((_idx, element) => {
        // grab each element, and nest into the CHILDREN of the .teams element (containing winner and loser elements, this should resolve to a tbody element)
        const game = $(element).find('.teams').children();

        // init return value vars
        let winningTeam: string | undefined;
        let winningTeam_Score: string | undefined;
        let losingTeam: string | undefined;
        let losingTeam_Score: string | undefined;

        // for every row (tr) in tbody; go into the winner or loser elements (by class selector) and return the first and second table values (team name + team score) - <td /> elements
        game.each((_, tr) => {
            losingTeam = $(tr).children('.loser').children().eq(0).text(); // from table row <tr /> get the first child with class loser, then get .loser's FIRST child's text
            losingTeam_Score = $(tr).children('.loser').children().eq(1).text(); // get .loser's SECOND child's text
            winningTeam = $(tr).children('.winner').children().eq(0).text();
            winningTeam_Score = $(tr)
                .children('.winner')
                .children()
                .eq(1)
                .text();
        });

        // push the prettily scraped data onto the return object
        results.push(
            Object.assign({
                game_num: _idx + 1,
                winner: { team: winningTeam, score: winningTeam_Score },
                loser: { team: losingTeam, score: losingTeam_Score },
            })
        );
    });

    // return response object
    return ctx.json(
        {
            date: new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            ).toDateString(),
            results,
        },
        200
    );
};
