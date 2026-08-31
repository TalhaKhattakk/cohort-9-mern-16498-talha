# cohort-9-mern-16498-talha
Cohort 9 — MERN (NodeJS+ReactJS) assignment for Talha Khan Khattak

# NoteNest

A full-stack notes app I built for my MERN cohort assignment (Cohort 9, Node.js + React). You sign up, log in, and can create/edit/delete notes with a rich text editor. Every note is private to the user who created it.

## Table of contents

- [What it does](#what-it-does)
- [Stack](#stack)
- [Project structure](#project-structure)
- [How to run this](#how-to-run-this)
- [Environment variables](#environment-variables)
- [API endpoints](#api-endpoints)
- [Tests](#tests)
- [SonarQube / code quality](#sonarqube--code-quality)
- [Things I know aren't perfect](#things-i-know-arent-perfect)
- [Screens](#screens)

## What it does

**Auth**
- Sign up, log in, log out
- JWT based sessions - token is issued on login/signup and sent as a Bearer token on every request after that
- Passwords need to be at least 8 characters and have one special character, checked on both the frontend (so you get instant feedback) and the backend (so it can't be skipped by hitting the API directly)
- If you visit the dashboard without being logged in, it redirects you to login instead of showing a broken page
- If your token expires while you're using the app, the next request that fails with a 401 automatically logs you out instead of just silently breaking

**Notes**
- Create, view, update, delete - each note belongs to exactly one user
- Notes use TipTap for the actual text editing, with a toolbar that shows bold, italic, strikethrough, headings (H1/H2), and bullet/numbered lists. The toolbar buttons highlight based on what formatting is active under your cursor
- Search filters by both the note title and the actual note content (not just the title)
- Saving/deleting shows a toast confirming it worked, and deleting asks you to confirm first so you don't lose a note by misclicking

**Other stuff**
- User's name/email and a logout button sit in the sidebar
- Notes show a timestamp (today's notes just say "Today, 3:45 PM" style, older ones show the date)

## Stack

| | |
|---|---|
| Frontend | React (built with Vite), React Router, Axios, TipTap |
| Backend | Node.js, Express |
| Database | MongoDB, using Mongoose |
| Auth | JWT + bcrypt |
| Logging | Pino |
| Backend tests | Mocha, Chai, Sinon |
| Frontend tests | Jest, React Testing Library |
| Code quality | SonarQube (self hosted locally through Docker) |

## Project structure

```
cohort-9-mern-16498-talha/
├── backend/
│   ├── app.js                 # express app setup - routes, middleware, cors. no side effects, so it's testable
│   ├── server.js               # connects to mongo and starts the server
│   ├── controllers/
│   │   ├── authController.js   # signup, login, getMe
│   │   └── noteController.js   # create/read/update/delete notes
│   ├── middleware/
│   │   ├── auth.js             # checks the jwt on protected routes
│   │   ├── errorHandler.js     # turns any error into a clean json response
│   │   ├── httpLogger.js       # logs every request/response, redacts passwords/auth headers
│   │   └── notFound.js         # handles unmatched routes
│   ├── models/
│   │   ├── User.js
│   │   └── Note.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── notes.js
│   ├── config/
│   │   └── logger.js           # pino setup, pretty print in dev / json in prod
│   ├── utils/
│   │   ├── AppError.js         # custom error class with a status code attached
│   │   └── asyncHandler.js     # wraps async route handlers so errors go to next() automatically
│   └── test/                   # backend tests
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   └── Dashboard.jsx   # the whole notes UI - sidebar, editor, everything
│       ├── api/
│       │   └── axiosClient.js  # axios instance + interceptor that logs you out on a 401
│       └── App.jsx             # routes, plus the logic that redirects to /login if there's no token
└── sonar-project.properties
```

## How to run this

You need Node installed, and a MongoDB connection string - I used a free MongoDB Atlas cluster for this.

### Backend

```
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=make_up_a_long_random_string
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

If `JWT_SECRET` is missing, the server won't start at all - it throws right away instead of quietly falling back to some hardcoded default. Same with `CORS_ORIGIN`, but only if `NODE_ENV=production`, so it won't get in your way during local dev.

```
npm start
```
or if you want it to auto-restart when you save a file:
```
npm run dev
```

### Frontend

```
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

```
npm run dev
```

Vite will print a localhost URL, usually `http://localhost:5173`.

## Environment variables

**backend/.env**

| Variable | Required? | What it's for |
|---|---|---|
| `MONGO_URI` | yes | your MongoDB connection string |
| `JWT_SECRET` | yes | used to sign/verify auth tokens - server refuses to start without it |
| `PORT` | no, defaults to 5000 | which port the server listens on |
| `CORS_ORIGIN` | required in production only | which frontend origin(s) are allowed to call the API. Comma separated if you need more than one |
| `DNS_SERVERS` | no | I had trouble connecting to Atlas from my home network, so the server sets custom DNS servers on startup (defaults to Google's 8.8.8.8/8.8.4.4). Only really matters if you hit the same issue |

**frontend/.env**

| Variable | Required? | What it's for |
|---|---|---|
| `VITE_API_BASE_URL` | yes | where the frontend sends its API requests |

## API endpoints

**Auth** (`/api/auth`)
| Method | Route | What it does |
|---|---|---|
| POST | `/signup` | creates a new user, returns a token |
| POST | `/login` | logs in, returns a token |
| GET | `/me` | returns the logged in user's info (needs a valid token) |

**Notes** (`/api/notes`) - all of these need a valid token
| Method | Route | What it does |
|---|---|---|
| GET | `/` | returns all notes belonging to the logged in user |
| POST | `/` | creates a note |
| PUT | `/:id` | updates a note (only if it belongs to you) |
| DELETE | `/:id` | deletes a note (only if it belongs to you) |

## Tests

Consists 17 backend and 27 frontend tests

**Backend**
```
cd backend
npm test              # runs everything once
npm run test:coverage # same thing but generates a coverage report
```

**Frontend**
```
cd frontend
npm test
npm run test:coverage
```

Backend tests mostly stub out Mongoose/bcrypt/jwt calls with Sinon and test the controllers directly - checking that the right status codes and error messages come back for both the happy path and things like duplicate emails, wrong passwords, missing fields, etc.

Frontend tests use Jest + React Testing Library and mock the axios client, so nothing actually hits the backend during a test run. They cover form validation, error messages, the whole note CRUD flow through the dashboard, search, delete confirmation, and the route protection logic in App.jsx.

## SonarQube / code quality

I ran SonarQube locally through Docker instead of using SonarCloud. Getting Docker to actually start was honestly the most annoying part of this whole assignment - had to enable virtualization in the BIOS, install WSL, and then turn on WSL integration inside Docker's own settings before it would run at all. Once that was sorted the scan itself was straightforward.

If you want to run it yourself:
```
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
```
Then go to `http://localhost:9000`, create a project, generate a token, and run:
```
npx sonar-scanner "-Dsonar.host.url=http://localhost:9000" "-Dsonar.token=YOUR_TOKEN"
```

`sonar-project.properties` at the repo root has all the scan config - what counts as source vs tests, what's excluded, and where the coverage reports live.

Current state: quality gate passes, reliability and maintainability are both rated A. A couple of security hotspots (like CORS being open to a default localhost origin) got reviewed and marked as safe with a comment explaining why, rather than "fixed" - since there's no deployed frontend origin yet to actually lock it to.

For coverage - I excluded the bootstrap/wiring files (`server.js`, the route files, `main.jsx`, `axiosClient.js`'s base setup) from the coverage number, since they're mostly plumbing rather than logic and are better proven by actually running the app than by unit tests. The real logic - auth, note CRUD, validation, the dashboard's various flows - is what the test suite is actually aimed at.

## Screens

- **Login / Signup** - matching card layout, tabs to switch between the two, show/hide password toggle
- **Dashboard** - sidebar with search + note list + user info + logout, main area shows either an empty state, a read-only note view, or the editor depending on what you're doing

