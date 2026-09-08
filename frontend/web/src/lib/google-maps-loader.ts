type GoogleMapsWindow = Window & {
  gm_authFailure?: () => void;
  google?: { maps?: typeof google.maps };
};

let googleMapsLoad: Promise<typeof google.maps> | undefined;

export function loadGoogleMapsApi(apiKey: string): Promise<typeof google.maps> {
  const browserWindow = window as GoogleMapsWindow;
  if (browserWindow.google?.maps) return Promise.resolve(browserWindow.google.maps);
  if (googleMapsLoad) return googleMapsLoad;

  googleMapsLoad = new Promise((resolve, reject) => {
    const rejectLoad = (message: string) => {
      googleMapsLoad = undefined;
      reject(new Error(message));
    };

    browserWindow.gm_authFailure = () => rejectLoad("Google Maps rejected the configured API key.");

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-maps]");
    const script = existingScript ?? document.createElement("script");

    const handleLoad = () => {
      const maps = (window as GoogleMapsWindow).google?.maps;
      if (!maps) {
        rejectLoad("Google Maps did not initialise.");
        return;
      }
      resolve(maps);
    };

    script.addEventListener("error", () => rejectLoad("Google Maps could not be loaded."), {
      once: true,
    });
    script.addEventListener("load", handleLoad, { once: true });

    if (!existingScript) {
      const parameters = new URLSearchParams({
        auth_referrer_policy: "origin",
        key: apiKey,
        language: "en",
        region: "LK",
        v: "weekly",
      });
      script.async = true;
      script.dataset.googleMaps = "true";
      script.src = `https://maps.googleapis.com/maps/api/js?${parameters.toString()}`;
      document.head.append(script);
    }
  });

  return googleMapsLoad;
}
