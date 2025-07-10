# AI Thesis Proposal Analyzer

This is a web application designed to help academic advisors analyze student project proposals using the Google Gemini AI. An advisor can upload a PDF of a project proposal and receive structured feedback, including strengths, areas for improvement, and scores based on predefined criteria tailored for Cooperative Education Theses.

This project has been set up for secure public deployment.

## Key Features

- **PDF Upload & Text Extraction:** Securely processes PDF files in the browser.
- **AI-Powered Analysis:** Uses Google Gemini to provide in-depth, structured feedback.
- **Secure API Key Handling:** All communication with the Google Gemini API is proxied through a secure backend API route, ensuring the API key is never exposed to the public.
- **Actionable Output:** Generates an "Advisor's Executive Summary", scores, and formatted text ready to be copied to LINE or sent via email.
- **Ready to Deploy:** Configured for easy, free deployment on platforms like Vercel.

---

## How the Secure Deployment Works

To prevent exposing your secret `API_KEY` to the public, this application uses a **backend proxy** (also known as an API route).

1.  **Frontend (`App.tsx`)**: When you click "Analyze", the app does **not** call Google's API directly.
2.  **API Route (`/api/analyze`)**: Instead, the frontend sends the proposal text to a special API route within our own project.
3.  **Secure Server**: This API route runs on a secure server (at Vercel). It is the *only* part of the application that has access to your `API_KEY` (which we will set as a secret environment variable).
4.  **Google Gemini API**: The server-side API route then securely makes the request to Google's API.
5.  **Response**: The server gets the analysis from Google and sends it back down to the frontend for display.

This ensures your API key remains 100% secret.

---

## Deployment Guide (Using Vercel)

Follow these steps to deploy your own live version of this application.

### Prerequisites

-   A [**GitHub**](https://github.com/) account.
-   A [**Vercel**](https://vercel.com/) account (you can sign up for free with your GitHub account).
-   Your [**Google AI API Key**](https://aistudio.google.com/app/apikey).

### Step 1: Get the Code on Your GitHub

1.  Download or clone this project's code to your local machine.
2.  Create a new, empty repository on your GitHub account.
3.  Push the project code from your local machine to your new GitHub repository.

### Step 2: Deploy on Vercel

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** and select **"Project"**.
3.  On the "Import Git Repository" screen, import the GitHub repository you just created.
4.  Vercel will automatically detect the project settings. You don't need to change anything here.
5.  Find the **"Environment Variables"** section and expand it.

### Step 3: Add Your Secret API Key

This is the most important step for security.

1.  In the "Environment Variables" section, add a new variable:
    -   **Name:** `API_KEY`
    -   **Value:** Paste your secret Google AI API Key here.
2.  Ensure the variable is set for all environments (Production, Preview, Development).
3.  Click **"Add"**.

![Vercel Environment Variable Setup](https://user-images.githubusercontent.com/1628097/233026362-7e279867-08a6-4320-9759-198188a87556.png)

### Step 4: Deploy

1.  After adding the environment variable, click the **"Deploy"** button.
2.  Vercel will now build your project and deploy it. This might take a couple of minutes.
3.  Once finished, you will get a public URL (e.g., `your-project-name.vercel.app`).

**Congratulations!** Your application is now live, and you can share the URL with your friends and colleagues.
