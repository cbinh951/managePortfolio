
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        const url = `https://www.cophieu68.vn/quote/summary.php?id=${symbol.toUpperCase()}`;
        // console.log(`Proxying request to: ${url}`);

        const response = await fetch(url, {
            headers: {
                // Mimic a browser to avoid some bot detection
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch from source: ${response.statusText}` }, { status: response.status });
        }

        const html = await response.text();

        // Return the HTML (or we could parse it here, but let's keep logic in service for now to minimize change)
        // Actually, parsing here is cleaner for the client. Let's parse here.

        const regex = /<div id="stockname_close"[^>]*>([\d.,]+)<\/div>/;
        const match = html.match(regex);

        let price = null;
        if (match && match[1]) {
            // Replace ',' with '' (assuming 1,234 format)
            let rawVal = parseFloat(match[1].replace(/,/g, ""));

            // Correction for 'k VND'
            if (rawVal < 1000) {
                rawVal = rawVal * 1000;
            }
            price = rawVal;
        }

        return NextResponse.json({ symbol: symbol.toUpperCase(), price, found: !!price });

    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
