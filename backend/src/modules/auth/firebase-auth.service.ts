import { Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export interface VerifiedGoogleIdentity {
  uid: string;
  email: string;
  displayName: string;
}

@Injectable()
export class FirebaseAuthService {
  public constructor(private readonly config: ConfigService) {}

  public async verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
    const projectId = this.config.get<string>("FIREBASE_PROJECT_ID");
    const clientEmail = this.config.get<string>("FIREBASE_CLIENT_EMAIL");
    const privateKey = this.config.get<string>("FIREBASE_PRIVATE_KEY")?.replace(/\\n/gu, "\n");
    if (!projectId || !clientEmail || !privateKey) {
      throw new ServiceUnavailableException("Google sign-in is not configured.");
    }
    const app =
      getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    try {
      const decoded = await getAuth(app).verifyIdToken(idToken, true);
      if (
        decoded.firebase?.sign_in_provider !== "google.com" ||
        decoded.email_verified !== true ||
        !decoded.email
      ) {
        throw new UnauthorizedException("A verified Google identity is required.");
      }
      return {
        uid: decoded.uid,
        email: decoded.email.trim().toLowerCase(),
        displayName: typeof decoded.name === "string" ? decoded.name : decoded.email,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("The Google identity token is invalid or expired.");
    }
  }
}
