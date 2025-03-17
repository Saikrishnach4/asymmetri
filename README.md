# Next.js Chatbot Project

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org) (Recommended: v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) (or any database supported by Prisma)

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/Saikrishnach4/asymmetri.git
cd asymmetri
npm install  # or yarn install
```

### Environment Variables
Create a `.env` file and configure the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup
Run the Prisma migration to set up your database schema:

```bash
npx prisma migrate dev --name init
npx prisma generate  # Generates Prisma Client
```

### Running the Development Server
Start the development server with:

```bash
npm run dev  # or yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Extra Features
- **Authentication**: Integrated with `next-auth`
- **Database ORM**: Prisma for easy database interactions
- **API Routes**: Custom API endpoints for chatbot functionality
- **Session Handling**: Secure session management

## Building and Deployment
To create a production build:

```bash
npm run build
npm start  # Run production build
```

For deployment, check out [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying).

## Troubleshooting
- If `prisma generate` fails, check if the database connection is correctly set up in `.env`
- If Next.js build fails, ensure TypeScript types are correctly defined
- Restart the server after modifying environment variables: `npm run dev`

---

Happy coding! 🚀

