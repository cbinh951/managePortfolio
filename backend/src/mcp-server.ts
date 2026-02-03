
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SupabaseService } from './services/supabase-service';
import dotenv from 'dotenv';
import { Portfolio, DashboardData } from './types/models';

// Load environment variables
dotenv.config();

// Initialize Supabase Service
const supabaseService = new SupabaseService();

// Create MCP Server
const server = new Server(
    {
        name: "manage-portfolio-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

/**
 * TOOLS
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_dashboard_data",
                description: "Get the high-level dashboard data including Net Worth, total cash, active portfolios summary.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_portfolios",
                description: "Get the list of all portfolios (investment and cash).",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_portfolio_details",
                description: "Get detailed information about a specific portfolio, including assets and performance.",
                inputSchema: {
                    type: "object",
                    properties: {
                        portfolio_id: {
                            type: "string",
                            description: "The unique ID of the portfolio",
                        },
                    },
                    required: ["portfolio_id"],
                },
            },
            {
                name: "get_transactions",
                description: "Get transactions for a specific portfolio.",
                inputSchema: {
                    type: "object",
                    properties: {
                        portfolio_id: {
                            type: "string",
                            description: "The unique ID of the portfolio to fetch transactions for",
                        },
                    },
                    required: ["portfolio_id"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        switch (name) {
            case "get_dashboard_data": {
                const data = await supabaseService.getDashboardData();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }

            case "get_portfolios": {
                const portfolios = await supabaseService.getAllPortfolios();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(portfolios, null, 2),
                        },
                    ],
                };
            }

            case "get_portfolio_details": {
                const portfolioId = (args as { portfolio_id: string }).portfolio_id;
                if (!portfolioId) {
                    throw new Error("Missing portfolio_id");
                }

                // Parallel fetch for details and transactions/snapshot if needed, 
                // but for now let's just use getPortfolioById which gives basic info.
                // If we need the "Performance", we might need to recalculate or fetch from dashboard data.

                // Let's reuse the existing getPortfolioById
                const portfolio = await supabaseService.getPortfolioById(portfolioId);

                if (!portfolio) {
                    return {
                        content: [{ type: "text", text: `Portfolio with ID ${portfolioId} not found.` }],
                        isError: true,
                    }
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(portfolio, null, 2),
                        },
                    ],
                };
            }

            case "get_transactions": {
                const portfolioId = (args as { portfolio_id: string }).portfolio_id;
                if (!portfolioId) {
                    throw new Error("Missing portfolio_id");
                }
                const transactions = await supabaseService.getTransactionsByPortfolio(portfolioId);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(transactions, null, 2),
                        }
                    ]
                }
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error executing tool ${request.params.name}: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});

/**
 * RESOURCES
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    // We can list portfolios as resources for direct reading if we want
    const portfolios = await supabaseService.getAllPortfolios();

    return {
        resources: portfolios.map(p => ({
            uri: `portfolio://${p.portfolio_id}/summary`,
            name: `Portfolio: ${p.name}`,
            mimeType: "application/json",
            description: `Summary of portfolio ${p.name}`
        }))
    }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const url = new URL(uri);

    // Pattern: portfolio://{id}/summary
    if (url.protocol === 'portfolio:') {
        const pathParts = url.pathname.split('/');
        // pathParts[0] is empty because of leading /
        // pathParts[1] is {id} if host is used logic varies, let's parse carefully
        // URL 'portfolio://abc-123/summary' -> host='abc-123', pathname='/summary'

        const portfolioId = url.hostname;
        const resourceType = url.pathname; // /summary

        if (portfolioId && resourceType === '/summary') {
            const portfolio = await supabaseService.getPortfolioById(portfolioId);
            return {
                contents: [{
                    uri: uri,
                    mimeType: "application/json",
                    text: JSON.stringify(portfolio, null, 2)
                }]
            }
        }
    }

    throw new Error(`Resource not found: ${uri}`);
});


// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("ManagePortfolio MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
