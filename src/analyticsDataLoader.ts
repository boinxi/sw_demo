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
    private userToSiteToViews: Map<string, Map<string, PageView[]>> = new Map();
    visitorUniqueSites: Map<string, Set<string>> = new Map();
    sessionsBySite: Map<string, Session[]> = new Map<string, Session[]>();

    async init() {
        await this.loadDataFromCSV();
        this.initSessionData();
        this.userToSiteToViews = new Map(); // to free up memory, as we don't need this data anymore (it is used to calculate sessions)
    }

    async loadDataFromCSV(): Promise<void> {
        let allRecords: PageView[] = [];
        for (const filePath of ['./data/input_1.csv', './data/input_2.csv', './data/input_3.csv']) {
            const records: PageView[] = await readDataFromCSV(filePath);
            logger.info("records found:", records.length, "in file", filePath);
            allRecords.push(...records);
        }
        logger.info("allRecords found:", allRecords.length);

        // Sort allRecords by timestamp
        allRecords.sort((a: PageView, b: PageView) => (a.timestamp) - (b.timestamp));

        for (const view of allRecords) {
            const visitorId = view.visitor_id;
            const site = view.site;

            // Initialize visitor to site to views mapping
            const siteToViewsMap = getWithDefault(this.userToSiteToViews, visitorId, new Map<string, PageView[]>());
            const views = getWithDefault(siteToViewsMap, site, []);
            views.push(view);

            // Initialize visitor unique sites with getWithDefault
            const uniqueSites = getWithDefault(this.visitorUniqueSites, visitorId, new Set<string>());
            uniqueSites.add(site);
        }
        logger.info("data loaded, unique users: ", this.userToSiteToViews.size);
    }

    initSessionData() {
        let numSessions = 0;
        const sessionsPerSite: Map<string, Session[]> = new Map<string, Session[]>();

        for (const [user, siteToViews] of this.userToSiteToViews) {
            for (const [site, views] of siteToViews) {
                let start = views[0].timestamp;
                let end = views[0].timestamp;
                for (let i = 1; i < views.length; i++) {
                    if (views[i].timestamp - end <= 1800) {
                        end = views[i].timestamp; // update end of session
                    } else {
                        // end of session detected, push the session to array
                        const newSession = {visitor_id: user, site, start, end, length: end - start};
                        numSessions++;
                        const sessions = getWithDefault(sessionsPerSite, site, []);
                        sessions.push(newSession);
                        start = views[i].timestamp;
                        end = views[i].timestamp;
                    }
                }

                // After the loop, add the last session for this site
                const lastSession = {visitor_id: user, site, start, end, length: end - start};
                numSessions++;
                const sessions = getWithDefault(sessionsPerSite, site, []);
                sessions.push(lastSession);
            }
        }
        this.sessionsBySite = sessionsPerSite;
        sessionsPerSite.forEach((sessions, site) => {
            logger.info("site:", site, "sessions:", sessions.length);
        });
        logger.info("sessions calculated, total sessions: ", numSessions);
    }
}


