# Hosted Services
| Service                  | Purpose                       | Suggested Provider                    |
| ------------------------ | ----------------------------- | ------------------------------------- |
| **MongoDB Atlas**        | Database                      | MongoDB                               |
| **AWS S3**               | File uploads                  | Amazon                                |
| **Stripe**               | Subscriptions                 | Stripe                                |
| **DocuSign / HelloSign** | E-signatures                  | Dropbox Sign (HelloSign)              |
| **Google / Outlook API** | Calendar sync                 | OAuth + API                           |
| **Email**                | Password reset, notifications | SendGrid / Resend / Postmark          |
| **Auth**                 | User login / JWT              | Custom (JWT + cookies) or Clerk/Auth0 |

## Auth System Overview
Use JWT-based auth with cookie-parser:
On login: create JWT + send via HTTP-only cookie
Middleware: check token + decode + attach user to request
Refresh token (optional): store a secure, rotating refresh token

# Tech Stack
## Frontend
Framework: React (with Vite)
Styling: Tailwind CSS or Material UI
State Management: Zustand or Redux Toolkit
Routing: React Router
Calendar UI: FullCalendar, React Big Calendar
Date Utils: date-fns or Luxon

## Backend
Runtime: Node.js
Framework: Express.js or NestJS (Nest has excellent MongoDB support too)
ORM/ODM: Mongoose for MongoDB
Language: TypeScript

## Database
Database: MongoDB Atlas (fully managed, scalable, secure)
ODM: Mongoose (for schema modeling and validation)

## Authentication
Auth service: Clerk or Auth0 (email/password, SSO, forgot password, OTP)
Or Custom JWT auth using Passport.js or NextAuth (if full control is preferred)

## File Upload + Storage
Storage: AWS S3 (via SDK or using a library like multer-s3)
E-signatures: DocuSign API or HelloSign API

## Calendar Integrations
Google Calendar API
Microsoft Graph API (for Outlook calendar)
Token refresh and OAuth flow will be needed for each

## Payments
Stripe API (subscriptions, webhooks for billing status)


# Dependencies to Install
## Backend
```bash
npm install express mongoose cors dotenv
npm install jsonwebtoken bcryptjs
npm install multer aws-sdk
npm install stripe
npm install nodemailer
npm install cookie-parser
```
## Frontend
```bash
npm install react react-dom react-router-dom
npm install tailwindcss @headlessui/react @heroicons/react
npm install axios zustand
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction
npm install date-fns
```

#   f i n a l  
 