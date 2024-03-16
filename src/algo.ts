import * as fs from "fs";
import csv from "csv-parser";
import PageView from "./pageView";

export const data: Map<string, PageView[]> = new Map<string, PageView[]>();
export const userToSiteToViews: Map<string, Map<string, PageView[]>> = new Map();
export const visitorUniqueSites: Map<string, Set<string>> = new Map();

export async function loadDataFromCSV(filePath: string): Promise<void> {
    const stream = fs.createReadStream(filePath).pipe(csv({
        headers: ['visitor_id', 'site', 'path', 'timestamp'],
        skipLines: 0, // this is to handle no headers line
    }));

    for await (const chunk of stream) {
        const view: PageView = chunk;

        // add to data
        if (!data.get(view.visitor_id)?.length) {
            data.set(view.visitor_id, []);
        }
        data.get(view.visitor_id)?.push(view);

        // add to userToSiteToViews
        if (!userToSiteToViews.get(view.visitor_id)) {
            userToSiteToViews.set(view.visitor_id, new Map<string, PageView[]>());
        }
        if (!userToSiteToViews.get(view.visitor_id)!.get(view.site)) {
            userToSiteToViews.get(view.visitor_id)!.set(view.site, []);
        }
        userToSiteToViews.get(view.visitor_id)!.get(view.site)!.push(view);

        // add to visitorUniqueSites
        if (!visitorUniqueSites.get(view.visitor_id)) {
            visitorUniqueSites.set(view.visitor_id, new Set<string>());
        }
        visitorUniqueSites.get(view.visitor_id)!.add(view.site);
    }
    console.log("data loaded, unique users: ", userToSiteToViews.size);
}

export interface session {
    visitor_id: string;
    site: string;
    start: number;
    end: number;
}

export function getSessionData(): session[] {
    const sessions: session[] = [];
    const sessionsPerSite: Map<string, session[]> = new Map<string, session[]>();
    for (let [user, siteToViews] of userToSiteToViews) {
        for (let [site, views] of siteToViews) {
            let s = views[0].timestamp;
            let e = views[0].timestamp;
            for (let i = 1; i < views.length; i++) { // start from second item
                if (views[i].timestamp - e <= 1800) {
                    e = views[i].timestamp; // update end of session
                } else {
                    // end of session detected, push the session to array
                    let newSession = {
                        visitor_id: user,
                        site: site,
                        start: s,
                        end: e,
                    };
                    sessions.push(newSession);
                    if (!sessionsPerSite.get(site)) {
                        sessionsPerSite.set(site, []);
                    }
                    sessionsPerSite.get(site)!.push(newSession);
                    s = views[i].timestamp; // reset start and end for new session
                    e = views[i].timestamp;
                }
            }
            // After the loop, add the last session for this site
            sessions.push({
                visitor_id: user,
                site: site,
                start: s,
                end: e,
            });
        }
    }
    console.log("sessions for www.s_10.com: ", sessionsPerSite.get('www.s_10.com'));
    return sessions;
}
