/**
 * Parses Google Maps URL, DMS degrees string, or coordinate string
 * and extracts accurate latitude and longitude numbers.
 */
export function parseGoogleLocationString(input) {
  if (!input || typeof input !== "string") return null;

  let text = input.trim();
  try {
    text = decodeURIComponent(text.replace(/\+/g, " "));
  } catch (e) {
    // ignore decode error
  }

  // 1. Check for exact Google Maps place pin parameters: !3d21.133640!4d80.198853
  const d3d4Match = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (d3d4Match) {
    return {
      lat: parseFloat(d3d4Match[1]),
      lng: parseFloat(d3d4Match[2]),
    };
  }

  // 2. Check for DMS (Degrees Minutes Seconds) format: e.g. 21°08'01.1"N 80°11'55.9"E
  const dmsRegex = /(\d+)[°\s]+(\d+)[`'\s]+(\d+(?:\.\d+)?)[`"\s]*([NnSs])[\s,]+(\d+)[°\s]+(\d+)[`'\s]+(\d+(?:\.\d+)?)[`"\s]*([EeWw])/;
  const dmsMatch = text.match(dmsRegex);
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]);
    const latMin = parseFloat(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3]);
    const latDir = dmsMatch[4].toUpperCase();

    const lngDeg = parseFloat(dmsMatch[5]);
    const lngMin = parseFloat(dmsMatch[6]);
    const lngSec = parseFloat(dmsMatch[7]);
    const lngDir = dmsMatch[8].toUpperCase();

    let lat = latDeg + latMin / 60 + latSec / 3600;
    if (latDir === "S") lat = -lat;

    let lng = lngDeg + lngMin / 60 + lngSec / 3600;
    if (lngDir === "W") lng = -lng;

    return {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
    };
  }

  // 3. Check for query parameter: q=21.133640,80.198853
  const qMatch = text.match(/[?&](?:q|ll)=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
  if (qMatch) {
    return {
      lat: parseFloat(qMatch[1]),
      lng: parseFloat(qMatch[2]),
    };
  }

  // 4. Check for URL viewport center parameter: @21.133640,80.198853
  const atMatch = text.match(/@(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      lat: parseFloat(atMatch[1]),
      lng: parseFloat(atMatch[2]),
    };
  }

  // 5. Fallback: Raw comma separated latitude, longitude e.g. "21.133640, 80.198853"
  const rawMatch = text.match(/^(-?\d+\.\d+)[\s,]+(-?\d+\.\d+)$/);
  if (rawMatch) {
    return {
      lat: parseFloat(rawMatch[1]),
      lng: parseFloat(rawMatch[2]),
    };
  }

  return null;
}
