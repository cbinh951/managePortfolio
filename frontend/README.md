# Portfolio Management Frontend

Next.js frontend for Personal Asset Management application.

## Tech Stack
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Hook Form** for form handling
- **TanStack Table** for data tables

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
Create `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. Run development server:
```bash
npm run dev
```

4. Open browser at `http://localhost:3000`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard (homepage)
│   ├── portfolios/        # Portfolio pages
│   ├── cash/              # Cash account pages
│   ├── transactions/      # Transaction pages
│   └── analytics/         # Analytics pages
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── portfolio/        # Portfolio components
│   ├── cash/             # Cash components
│   ├── charts/           # Chart components
│   └── common/           # Reusable components
├── services/             # API client
│   └── api.ts           # Axios client with typed methods
├── types/                # TypeScript definitions
│   ├── models.ts        # Data models
│   └── api.ts           # API types
└── styles/              # Global styles
    └── globals.css
```

## Features

- ✅ TypeScript for type safety
- ✅ Tailwind CSS for modern styling
- ✅ API client with typed methods
- ✅ Responsive design
- ✅ Component-based architecture
- 🔄 Dashboard (in progress)
- 🔄 Portfolio management (in progress)
- 🔄 Cash account tracking (in progress)
- 🔄 Transaction logging (in progress)
- 🔄 Performance analytics (in progress)

## Important Notes

1. **Environment Variables**: Create `.env.local` manually (gitignored by default)
2. **Backend Required**: Frontend needs backend running on port 3001
3. **Data**: All data is managed by backend CSV files
