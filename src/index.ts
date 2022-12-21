import { Context, Hono } from "hono";
import { logger } from "hono/logger";
import type { CustomHandler, Environment } from "hono/dist/types";
import * as cheerio from "cheerio";

const MONTH = "12";
const DAY = "19";
const YEAR = "2022";

// what page we scraping?
const BASE_URL = "https://www.basketball-reference.com/boxscores/";
const SEARCH_URL = `${BASE_URL}?month=${MONTH}&day=${DAY}&year=${YEAR}`;

// initialize the app
const app = new Hono();

// hono setup
app.use("*", logger());

// business logic in a pretty name definition
const getScores: CustomHandler = async (
  ctx: Context<string, Partial<Environment>>
) => {
  // go get the raw html from website
  const html = await fetch(SEARCH_URL, { method: "GET" }).then(
    async (response) => await response.text()
  );

  // use cheerio to parse and traverse the html
  const $ = cheerio.load(html);

  // init the return value to be json-ified
  const results: any[] = [];

  //  for every element that has the class selector '.game_summary'
  $(".game_summary").each((_idx, element) => {
    // grab each element, and nest into the CHILDREN of the .teams element (containing winner and loser elements, this should resolve to a tbody element)
    const game = $(element).find(".teams").children();

    // init return value vars
    let winningTeam: string | undefined;
    let winningTeam_Score: string | undefined;
    let losingTeam: string | undefined;
    let losingTeam_Score: string | undefined;

    // for every row (tr) in tbody; go into the winner or loser elements (by class selector) and return the first and second table values (team name + team score) - <td /> elements
    game.each((_, tr) => {
      losingTeam = $(tr).children(".loser").children().eq(0).text(); // from table row <tr /> get the first child with class loser, then get .loser's FIRST child's text
      losingTeam_Score = $(tr).children(".loser").children().eq(1).text(); // get .loser's SECOND child's text
      winningTeam = $(tr).children(".winner").children().eq(0).text();
      winningTeam_Score = $(tr).children(".winner").children().eq(1).text();
    });

    // push the prettily scraped data onto the return object
    results.push(
      Object.assign({
        id: _idx + 1,
        winner: { team: winningTeam, score: winningTeam_Score },
        loser: { team: losingTeam, score: losingTeam_Score },
      })
    );
  });

  // return response object
  return ctx.json(results, 200);
};

app.get("/", getScores);

export default app;
