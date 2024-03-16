import express, {Express, Request, Response, Application} from 'express';
import dotenv from 'dotenv';
import PageView from './pageView'
import {data, getSessionData, loadDataFromCSV, session, userToSiteToViews, visitorUniqueSites} from './algo';

dotenv.config();

const results: PageView[] = [];

const app: Application = express();
const port = process.env.PORT || 8000;

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to Express & TypeScript Server');
});
app.get('/map', (req: Request, res: Response) => {
    res.send(userToSiteToViews.get('visitor_7062'));
});
app.get('/views/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    res.send(data.get('visitor_7062'));
});

app.get('/unique/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    console.log("unique sites for visitor", id, visitorUniqueSites.get(id));
    res.send(visitorUniqueSites.get(id));
});

app.get('/session', (req: Request, res: Response) => {
    const ans: session[] = getSessionData();
    // ans.forEach((entry) => {
    //     if (entry.start != entry.end) {
    //         console.log("visitor", entry.visitor_id, "site", entry.site, "time", (entry.end - entry.start) / 60, "minutes");
    //     }
    // });
    res.send(ans);
});

loadDataFromCSV('./data/input_1.csv').then(() => {
    console.log("data loaded");
    app.listen(port, () => {
        console.log(`Server is Fire at http://localhost:${port}`);
    });
}).catch((err) => {
    console.log(err);
});
