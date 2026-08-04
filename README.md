# Momentum Landscaping — customer app

A thin iOS shell around the customer portal at
`https://portal.momentumlandscapingut.com`. Every screen lives in the portal
(`app/(portal)` in `Sharplifee/momentum-crm`). The only native code here is push
registration and notification-tap routing — the two things a webview can't do.

No background location. That's the crew app.

## Identifiers

| | |
|---|---|
| Bundle ID | `com.momentumlandscapingut.customer` (Apple ID `H4D69J5QN4`) |
| Team | `XF783932R2` |
| APNs key | `LBBQ4LVMY4` — team-scoped, already covers this bundle |
| App Store Connect | app record must be created by hand — see below |

## Push

The server talks to APNs directly (`lib/apns.ts` in `momentum-crm`), so the app
calls `getDevicePushTokenAsync()`, **not** `getExpoPushTokenAsync()` — an Expo
relay token comes back `BadDeviceToken`.

The token is injected into the webview rather than posted from native, because
the portal owns the signed-in cookie session. `components/portal/PushBridge.tsx`
receives it and registers it with `bundle_id` so `push_tokens.bundle_id` carries
the right `apns-topic`. Sending a customer token under the crew topic returns
`DeviceTokenNotForTopic`, which permanently retires the token — hence the
per-token topic.

## Build and upload

EAS holds project records but has never built these apps; builds are local
`xcodebuild` + `altool`, same as the crew app.

```sh
npm install
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
# open ios/momentumcustomer.xcworkspace, set team XF783932R2, archive, upload
```

## One manual step Apple requires

The App Store Connect *app record* cannot be created through the API — `POST
/v1/apps` returns `403 FORBIDDEN_ERROR: The resource 'apps' does not allow
'CREATE'`. Create it once in App Store Connect → Apps → **+ New App**, pick the
existing bundle ID `com.momentumlandscapingut.customer`, SKU `momentum-customer`.
Everything after that — TestFlight groups, builds, metadata, submission — is
API-drivable with the Admin key `36HS532VZU`.

## Review note

This is a wrapper, which is Apple guideline 4.2 territory. What earns it a place
on the store is push: service-day reminders, crew-on-the-way alerts, and invoice
notices tied to the customer's own schedule. Keep the review notes pointed at
that, and give the reviewer a working test phone number for the OTP login —
review will fail without one, since the whole app is behind that gate.
