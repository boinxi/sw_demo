import express, {Application, Request, Response} from 'express';
import dotenv from 'dotenv';
import {AnalyticsDataLoader} from "./analyticsDataLoader";
import {logger} from "./logger";
import {loggerMiddleware} from "./middlewares/loggerMiddleware";

dotenv.config();

const dataLoader = new AnalyticsDataLoader();

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(loggerMiddleware);

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to My Analytics Server! 🚀');
});

app.get('/num_sessions/:site_url', (req: Request, res: Response) => {
    const site_url = req.params.site_url;
    if (!dataLoader.sessionsBySite.has(site_url)) {
        res.send({site_url, num_sessions: 0});
        return;
    }
    res.send({
        site_url,
        num_sessions: dataLoader.sessionsBySite.get(site_url)!.length
    });
});

app.get('/median_session_len/:site_url', (req: Request, res: Response) => {
    const site_url = req.params.site_url;
    if (!dataLoader.sessionsBySite.has(site_url)) {
        res.status(404).send({site_url, message: "No sessions found for this site"});
        return;
    }
    const sessionsForSite = dataLoader.sessionsBySite.get(site_url)!;
    const lengths = sessionsForSite.map(session => session.length);
    lengths.sort((a, b) => a - b);
    const medianIndex = Math.floor(lengths.length / 2);

    // If the array has an odd length, return the middle element. if even, return the average of the two middle elements
    const ans = lengths.length % 2 !== 0 ? lengths[medianIndex] : (lengths[medianIndex - 1] + lengths[medianIndex]) / 2;

    res.send({site_url, median: ans});
});

app.get('/num_unique_visited_sites/:visitor_id', (req: Request, res: Response) => {
    const visitor_id = req.params.visitor_id;
    const ans = dataLoader.visitorUniqueSites.get(visitor_id)?.size || 0;
    res.send({visitor_id, num_unique_visited_sites: ans});
});

dataLoader.init().then(() => {
    app.listen(port, () => {
        logger.info(`Server is Fire at http://localhost:${port}`);
    });
}).catch((err) => {
    logger.error("Error initializing data loader", err);
    process.exit(1);
});

