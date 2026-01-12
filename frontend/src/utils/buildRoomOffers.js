function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function bedsOf(g) {
  const b = Number(g?.beds);
  return Number.isFinite(b) ? b : 0;
}

function canTake(group, qty) {
  return (group?.roomIds?.length ?? 0) >= qty && (group?.count ?? 0) >= qty;
}

function buildOffer(parts, guestCount) {
  let totalBeds = 0;
  let totalPrice = 0;
  let roomsCount = 0;
  let availability = Infinity;

  const roomIds = [];
  const labels = [];

  for (const p of parts) {
    const g = p.group;
    const qty = p.qty;

    roomsCount += qty;
    totalBeds += bedsOf(g) * qty;
    totalPrice += num(g.price) * qty;

    roomIds.push(...(g.roomIds || []).slice(0, qty));

    availability = Math.min(availability, Math.floor((g.count || 0) / qty));

    const type = g.type || "Pokój";
    labels.push(qty === 1 ? type : `${type} x${qty}`);
  }

  if (roomIds.length !== roomsCount) return null;
  if (totalBeds < guestCount) return null;

  const key = parts
    .map((p) => `${p.group.key}:${p.qty}`)
    .sort()
    .join("+");

  return {
    key,
    parts: parts.map((p) => ({
      type: p.group.type,
      beds: p.group.beds,
      price: p.group.price,
      qty: p.qty,
    })),
    title:
      roomsCount === 1
        ? `${labels[0]} • ${totalBeds} łóżka`
        : `Pakiet: ${labels.join(" + ")} • ${totalBeds} łóżka`,
    roomsCount,
    totalBeds,
    totalPricePerNight: totalPrice,
    availability: Number.isFinite(availability) ? availability : 0,
    roomIds,
  };
}


export function buildRoomOffers(groups, guestCount, limit = 30) {
  const g = (groups || []).filter((x) => bedsOf(x) > 0 && (x.roomIds?.length ?? 0) > 0);

  const offers = [];
  const seen = new Set();


  for (let i = 0; i < g.length; i++) {
    const a = g[i];
    if (!canTake(a, 1)) continue;
    const offer = buildOffer([{ group: a, qty: 1 }], guestCount);
    if (offer && !seen.has(offer.key)) {
      seen.add(offer.key);
      offers.push(offer);
    }
  }


  for (let i = 0; i < g.length; i++) {
    const a = g[i];
    for (let j = i; j < g.length; j++) {
      const b = g[j];


      const needA = i === j ? 2 : 1;
      const needB = 1;

      if (i === j) {
        if (!canTake(a, 2)) continue;
        const offer = buildOffer([{ group: a, qty: 2 }], guestCount);
        if (offer && !seen.has(offer.key)) {
          seen.add(offer.key);
          offers.push(offer);
        }
      } else {
        if (!canTake(a, 1) || !canTake(b, 1)) continue;
        const offer = buildOffer(
          [
            { group: a, qty: 1 },
            { group: b, qty: 1 },
          ],
          guestCount
        );
        if (offer && !seen.has(offer.key)) {
          seen.add(offer.key);
          offers.push(offer);
        }
      }
    }
  }


  for (let i = 0; i < g.length; i++) {
    for (let j = i; j < g.length; j++) {
      for (let k = j; k < g.length; k++) {
        const a = g[i],
          b = g[j],
          c = g[k];


        const counts = new Map();
        counts.set(a.key, (counts.get(a.key) || 0) + 1);
        counts.set(b.key, (counts.get(b.key) || 0) + 1);
        counts.set(c.key, (counts.get(c.key) || 0) + 1);


        let ok = true;
        for (const [key, qty] of counts.entries()) {
          const group = g.find((x) => x.key === key);
          if (!group || !canTake(group, qty)) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;


        const parts = [];
        for (const [key, qty] of counts.entries()) {
          const group = g.find((x) => x.key === key);
          parts.push({ group, qty });
        }

        const offer = buildOffer(parts, guestCount);
        if (offer && !seen.has(offer.key)) {
          seen.add(offer.key);
          offers.push(offer);
        }
      }
    }
  }

  offers.sort((x, y) => {
    if (x.totalPricePerNight !== y.totalPricePerNight) return x.totalPricePerNight - y.totalPricePerNight;
    return x.roomsCount - y.roomsCount;
  });

  return offers.slice(0, limit);
}
