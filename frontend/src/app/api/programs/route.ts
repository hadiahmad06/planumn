import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// fetch("https://app.coursedog.com/api/v1/cm/umn_umntc_peoplesoft/programs?programGroupIds=000821107&effectiveDatesRange=2025-09-02%2C2032-12-15&doNotDisplayAllMappedRevisionsAsDependencies=true&formatDependents=true&includeMappedDocumentItems=true", {
//     "headers": {
//         "accept": "application/json, text/plain, */*",
//         "accept-language": "en-US,en;q=0.9",
//         "priority": "u=1, i",
//         "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
//         "sec-ch-ua-mobile": "?0",
//         "sec-ch-ua-platform": "\"macOS\"",
//         "sec-fetch-dest": "empty",
//         "sec-fetch-mode": "cors",
//         "sec-fetch-site": "same-site",
//         "x-requested-with": "catalog",
//         "Referer": "https://umtc.catalog.prod.coursedog.com/",
//         "Referrer-Policy": "strict-origin-when-cross-origin"
//     },
//     "body": null,
//     "method": "GET"
// });



export async function POST(req: Request) {
    const { programGroupIds } = await req.json();

    if (!Array.isArray(programGroupIds)) {
        return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }

    const results = [];

    for (const id of programGroupIds) {

        try {
            const res = await fetch(`https://app.coursedog.com/api/v1/cm/umn_umntc_peoplesoft/programs?programGroupIds=${id}&effectiveDatesRange=2025-09-02%2C2032-12-15&doNotDisplayAllMappedRevisionsAsDependencies=true&formatDependents=true&includeMappedDocumentItems=true`, {
              method: "GET",
              headers: {
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Origin": "https://umtc.catalog.prod.coursedog.com",
                "Referer": "https://umtc.catalog.prod.coursedog.com/",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
                "x-requested-with": "catalog"
              },
              credentials: "omit"
            });

            if (!res.ok) {
              throw new Error(`Fetch failed for programGroupId=${id}: ${res.statusText}`);
            }

            const data = await res.json();
            results.push(data);
            
        } catch (err) {
            console.error("Fetch error:", err);
            // results.push({ error: "Curl failed", detail: err.message });
        }
    }

    return new Response(JSON.stringify({ data: results }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}