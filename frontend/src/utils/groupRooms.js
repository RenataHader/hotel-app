function pick(obj, keys, fallback = null) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return fallback;
}

function toNumberMaybe(v) {
  if (v === null || v === undefined) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function groupRooms(rooms) {
  const map = new Map();

  for (const r of rooms || []) {
    const hotelId = pick(r, ["hotelId"], null);
    const type = pick(r, ["type"], "");
    const beds = pick(r, ["numberOfBeds"], null);
    const price = pick(r, ["pricePerNight", "price"], null);
    const description = pick(r, ["description", "desc"], "");
    const key = [hotelId, type, beds, String(price)].join("|");

    if (!map.has(key)) {
      map.set(key, {
        key,
        hotelId,
        type,
        beds,
        price,
        description: description || "",
        count: 0,
        roomIds: [],
        sampleRoomNumbers: [],
      });
    }

    const g = map.get(key);
    g.count += 1;

    if (!g.description && description) g.description = description;

    if (r.id !== undefined && r.id !== null) g.roomIds.push(r.id);
    if (r.roomNumber && g.sampleRoomNumbers.length < 3) g.sampleRoomNumbers.push(r.roomNumber);
  }

  return Array.from(map.values()).sort((a, b) => {
    const ap = toNumberMaybe(a.price);
    const bp = toNumberMaybe(b.price);
    if (Number.isFinite(ap) && Number.isFinite(bp) && ap !== bp) return ap - bp;

    const ab = a.beds ?? 0;
    const bb = b.beds ?? 0;
    if (ab !== bb) return ab - bb;

    return String(a.type).localeCompare(String(b.type));
  });
}
