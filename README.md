# E-Commerce Website Setup Guide
Prerequisites

Make sure you have the following installed:

Node.js
pgAdmin
 (PostgreSQL database)

Step 1: Set Up the Database
Open pgAdmin

Create a new database named:

ecommerce

Make sure your PostgreSQL username is:

postgres
Note your database password (you will use it in the .env file)

Step 2: Configure Environment Variables

Create a file named .env in the root folder and add:

DB_USER=postgres
DB_HOST=localhost
DB_NAME=ecommerce
DB_PASSWORD=YOURPASSWORD
DB_PORT=5432
JWT_SECRET=mysecretkey123

Replace:

YOURPASSWORD

with your actual PostgreSQL password.

Step 3: Install Dependencies

In your project folder, run:

npm install

Step 4: Initialize Default Admin

Run:

node defaultAdmin.js

This creates a default admin user for the system.

Step 5: Start the Application

Run:

node app.js

Step 6: Open the Website

Open your browser and go to:

http://localhost:3000
Notes
Ensure PostgreSQL is running before starting the app
The .env file must be in the root directory
If the port is different, update it in your code or .env
Default Admin Access

(If applicable, based on your setup)

Email: admin@example.com
Password: admin123
Troubleshooting
Database connection error: Check .env credentials
Port already in use: Change the port in your app
Modules not found: Run npm install again
