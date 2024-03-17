import PageView from "./types/pageView";
import {Session} from "./types/session";
import {readDataFromCSV} from "./util/csvReader";
import {logger} from "./logger";

function getWithDefault<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
    if (map.has(key)) {
        return map.get(key)!;
    }
    map.set(key, defaultValue);
    return defaultValue;
}

export class AnalyticsDataLoader {
    visitorUniqueSites: Map<string, Set<string>> = new Map();
    sessionsBySite: Map<string, Session[]> = new Map<string, Session[]>();
    private latsSessionsBySiteByUser: Map<string, Map<string, Session | null>> = new Map();

    async init() {
        await this.loadDataFromCSV();
        this.latsSessionsBySiteByUser = new Map(); // clear this to save memory
    }

    calcSessions(view: PageView) {
        const {visitor_id: visitorId, site} = view;

        // this is to store the sessions for each site
        const siteSessions = getWithDefault(this.sessionsBySite, site, []);

        const relevantSessionsByUser = getWithDefault(this.latsSessionsBySiteByUser, site, new Map());

        if (!relevantSessionsByUser.has(visitorId)) {
            // first session of user to site
            const newSession = {visitor_id: visitorId, site, start: view.timestamp, end: view.timestamp, length: 0};
            relevantSessionsByUser.set(visitorId, newSession);
            siteSessions.push(newSession);
        } else {
            const lastSession = relevantSessionsByUser.get(visitorId)!;

            if (view.timestamp - lastSession.end <= 1800) {
                // the view is within 30 minutes of the last session, add it to the last session
                lastSession.end = view.timestamp;
                lastSession.length = lastSession.end - lastSession.start;
            } else {
                // the view is after 30 minutes of the last session, create a new session
                const newSession = {
                    visitor_id: visitorId,
                    site,
                    start: view.timestamp,
                    end: view.timestamp,
                    length: 0
                };
                relevantSessionsByUser.set(visitorId, newSession);
                siteSessions.push(newSession);
            }
        }
    }

    async loadDataFromCSV(): Promise<void> {
        let allRecords: PageView[] = [];
        for (const filePath of ['./data/input_1.csv', './data/input_2.csv', './data/input_3.csv']) {
            const records: PageView[] = await readDataFromCSV(filePath);
            logger.info("records found:", records.length, "in file", filePath);
            allRecords.push(...records);
        }
        logger.info("allRecords found:", allRecords.length);

        // Sort allRecords by timestamp - this could be done more efficiently by using k-way merge sort (more on the Readme file)
        allRecords.sort((a: PageView, b: PageView) => (a.timestamp) - (b.timestamp));

        for (const view of allRecords) {
            const visitorId = view.visitor_id;
            const site = view.site;

            // Initialize visitor unique sites with getWithDefault
            const uniqueSites = getWithDefault(this.visitorUniqueSites, visitorId, new Set<string>());
            uniqueSites.add(site);

            this.calcSessions(view);
        }

        // just for logging
        let totalSessions = 0;
        this.sessionsBySite.forEach((sessions, site) => {
            totalSessions += sessions.length;
            logger.info("site:", site, "sessions:", sessions.length);
        });

        logger.info("sessions calculated, total sessions: ", totalSessions);
    }
}


