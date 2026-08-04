# Isolated Gemini AI Gateway

This Phase 14 service is an authenticated FastAPI boundary for Gemini-assisted **draft** itinerary
suggestions. It has no database driver, database connection setting, booking/payment operation, or
direct customer access. The ASP.NET Core API must authenticate and authorise every request before
forwarding minimum-necessary, approved context to this service.

The gateway sends only the provided destinations, interests, dates, and approved catalogue metadata
to Gemini. It requests JSON output and then validates every returned catalogue item ID against that
approved list. A draft cannot confirm availability, set a final price or quote, create/cancel a
booking, charge a payment method, or persist a conversation.

## Configure Gemini

1. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey) using the Google
   account and Google Cloud project that will own billing and quota.
2. Copy `.env.example` to a local, ignored `.env` file or add the values to your deployment secret
   manager. Never place the key in a browser variable, source file, committed `.env` file, or chat.
3. Set `GEMINI_API_KEY`, `AI_GATEWAY_SHARED_SECRET` (at least 32 random characters), and
   `BACKEND_API_BASE_URL`. `GEMINI_MODEL=gemini-3.5-flash` is the cost-conscious default and can be
   changed to another supported structured-output Gemini model after a controlled evaluation.

The service refuses to start if its Gemini key or gateway secret is absent, a database-like
environment setting is present, the backend URL is invalid, or the model/timeout settings are
unsafe. It never returns a provider error body or API key to its caller.

## Run locally

From `apps/ai-service`, install the pinned package and start Uvicorn with the variables above:

```sh
set -a
source .env
set +a
python3 -m pip install .
uvicorn dceylon_ai.main:app --host 127.0.0.1 --port 8000
```

The backend-to-gateway call remains a separate, reviewable integration step. The public browser
must never call this service or hold a Gemini API key.
