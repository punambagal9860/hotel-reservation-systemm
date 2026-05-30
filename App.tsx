import { useState, useCallback } from "react";

const FLOORS = 10;
const ROOMS_PER_FLOOR = 10;
const TOP_FLOOR_ROOMS = 7;

function initRooms(): Record<number, any> {
  const rooms: Record<number, any> = {};
  for (let f = 1; f <= FLOORS; f++) {
    const count = f === 10 ? TOP_FLOOR_ROOMS : ROOMS_PER_FLOOR;
    for (let r = 1; r <= count; r++) {
      const id = f === 10 ? 1000 + r : f * 100 + r;
      rooms[id] = {
        id,
        floor: f,
        position: r,
        status: "available",
        bookingId: null,
      };
    }
  }
  return rooms;
}

function getRoomNumber(floor: number, position: number) {
  return floor === 10 ? 1000 + position : floor * 100 + position;
}

function travelTime(rooms: any[]) {
  if (rooms.length <= 1) return 0;
  const sorted = [...rooms].sort((a, b) =>
    a.floor !== b.floor ? a.floor - b.floor : a.position - b.position
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return (
    Math.abs(last.floor - first.floor) * 2 +
    Math.abs(last.position - first.position)
  );
}

function combinations(arr: any[], k: number): any[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map((c: any[]) => [first, ...c]),
    ...combinations(rest, k),
  ];
}

function findOptimalRooms(roomsMap: Record<number, any>, count: number) {
  const available = Object.values(roomsMap).filter(
    (r: any) => r.status === "available"
  );
  if (available.length < count) return null;

  const byFloor: Record<number, any[]> = {};
  available.forEach((r: any) => {
    if (!byFloor[r.floor]) byFloor[r.floor] = [];
    byFloor[r.floor].push(r);
  });

  for (const floor of Object.keys(byFloor).map(Number).sort()) {
    const floorRooms = byFloor[floor].sort(
      (a: any, b: any) => a.position - b.position
    );
    if (floorRooms.length >= count) {
      let best = null,
        bestTime = Infinity;
      for (let i = 0; i <= floorRooms.length - count; i++) {
        const group = floorRooms.slice(i, i + count);
        const t = travelTime(group);
        if (t < bestTime) {
          bestTime = t;
          best = group;
        }
      }
      if (best) return { rooms: best, time: bestTime };
    }
  }

  const candidates = available.slice(0, Math.min(available.length, 40));
  const combos = combinations(candidates, count);
  let bestCombo = null,
    bestTime = Infinity;
  for (const combo of combos) {
    const t = travelTime(combo);
    if (t < bestTime) {
      bestTime = t;
      bestCombo = combo;
    }
  }
  return bestCombo ? { rooms: bestCombo, time: bestTime } : null;
}

let bookingCounter = 1;
const BOOKING_COLORS = [
  "#4F8EF7",
  "#E2605A",
  "#48B67A",
  "#F5A623",
  "#9B59B6",
  "#1ABC9C",
  "#E67E22",
  "#3498DB",
  "#E91E63",
  "#00BCD4",
];

export default function App() {
  const [rooms, setRooms] = useState<Record<number, any>>(initRooms);
  const [bookings, setBookings] = useState<any[]>([]);
  const [inputCount, setInputCount] = useState(1);
  const [message, setMessage] = useState<any>(null);
  const [lastBooked, setLastBooked] = useState<number[]>([]);

  const showMsg = (text: string, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleBook = useCallback(() => {
    const count = parseInt(String(inputCount));
    if (!count || count < 1 || count > 5) {
      showMsg("Enter a number between 1 and 5.", "error");
      return;
    }
    const result = findOptimalRooms(rooms, count);
    if (!result) {
      showMsg("Not enough available rooms.", "error");
      return;
    }
    const bId = bookingCounter++;
    const color = BOOKING_COLORS[(bId - 1) % BOOKING_COLORS.length];
    const newRooms = { ...rooms };
    result.rooms.forEach((r: any) => {
      newRooms[r.id] = { ...r, status: "booked", bookingId: bId };
    });
    setRooms(newRooms);
    setBookings((prev) => [
      ...prev,
      {
        id: bId,
        color,
        roomIds: result.rooms.map((r: any) => r.id),
        travelTime: result.time,
      },
    ]);
    setLastBooked(result.rooms.map((r: any) => r.id));
    showMsg(
      `Booked ${count} room(s) — travel time: ${result.time} min`,
      "success"
    );
  }, [rooms, inputCount]);

  const handleReset = () => {
    setRooms(initRooms());
    setBookings([]);
    setLastBooked([]);
    bookingCounter = 1;
    showMsg("All bookings cleared.", "info");
  };

  const handleRandom = () => {
    const newRooms = initRooms();
    const allIds = Object.keys(newRooms).map(Number);
    const shuffled = allIds.sort(() => Math.random() - 0.5);
    const occupyCount = Math.floor(allIds.length * (0.3 + Math.random() * 0.4));
    const newBookings: any[] = [];
    bookingCounter = 1;
    for (let i = 0; i < occupyCount; i++) {
      const id = shuffled[i];
      const bId = bookingCounter++;
      const color = BOOKING_COLORS[(bId - 1) % BOOKING_COLORS.length];
      newRooms[id] = { ...newRooms[id], status: "booked", bookingId: bId };
      newBookings.push({ id: bId, color, roomIds: [id], travelTime: 0 });
    }
    setRooms(newRooms);
    setBookings(newBookings);
    setLastBooked([]);
    showMsg(`Random occupancy set (${occupyCount} rooms occupied).`, "info");
  };

  const availableCount = Object.values(rooms).filter(
    (r: any) => r.status === "available"
  ).length;
  const bookedCount = 97 - availableCount;

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "1.5rem",
        maxWidth: 900,
        margin: "0 auto",
        background: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          margin: "0 0 4px",
          color: "#1a1a2e",
        }}
      >
        🏨 Hotel Room Reservation
      </h1>
      <p style={{ fontSize: 13, color: "#666", margin: "0 0 1.25rem" }}>
        97 rooms · 10 floors · Optimal allocation by travel time
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "1.25rem",
          flexWrap: "wrap" as const,
        }}
      >
        {[
          ["Total Rooms", 97, "#4F8EF7"],
          ["Available", availableCount, "#48B67A"],
          ["Occupied", bookedCount, "#E2605A"],
          ["Bookings", bookings.length, "#F5A623"],
        ].map(([l, v, c]: any) => (
          <div
            key={l}
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "10px 16px",
              minWidth: 100,
              flex: 1,
              border: "1px solid #eee",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#999",
                fontWeight: 600,
                textTransform: "uppercase" as const,
              }}
            >
              {l}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap" as const,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "6px 14px",
          }}
        >
          <label style={{ fontSize: 13, color: "#666" }}>Rooms (1–5):</label>
          <input
            type="number"
            min={1}
            max={5}
            value={inputCount}
            onChange={(e) => setInputCount(Number(e.target.value))}
            style={{
              width: 48,
              fontSize: 15,
              fontWeight: 600,
              textAlign: "center" as const,
              border: "none",
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={handleBook}
          style={{
            padding: "9px 22px",
            borderRadius: 8,
            border: "none",
            background: "#4F8EF7",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Book Rooms
        </button>
        <button
          onClick={handleRandom}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: "#fff",
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          🎲 Random
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: "#fff",
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ↺ Reset
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: "1rem",
            fontSize: 13,
            fontWeight: 500,
            background:
              message.type === "success"
                ? "#eafaf1"
                : message.type === "error"
                ? "#fdecea"
                : "#e8f4fd",
            color:
              message.type === "success"
                ? "#1a7a45"
                : message.type === "error"
                ? "#b71c1c"
                : "#1565c0",
            border: `1px solid ${
              message.type === "success"
                ? "#a8e6c3"
                : message.type === "error"
                ? "#f5b7b1"
                : "#b3d4f5"
            }`,
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: "1rem 1.25rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#999",
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          BUILDING LAYOUT
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[
            ["🟩 Available", ""],
            ["🟥 Booked", ""],
            ["🟨 Just Booked", ""],
          ].map(([l]) => (
            <span
              key={l}
              style={{ fontSize: 11, color: "#666", marginRight: 12 }}
            >
              {l}
            </span>
          ))}
        </div>
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column" as const,
              marginRight: 6,
            }}
          >
            {Array.from({ length: FLOORS }, (_, i) => FLOORS - i).map((f) => (
              <div
                key={f}
                style={{
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#888",
                    minWidth: 30,
                    textAlign: "right" as const,
                    paddingRight: 4,
                  }}
                >
                  {f === 10 ? "10F" : `F${f}`}
                </span>
                <div
                  style={{
                    width: 18,
                    height: 22,
                    background: "#546e7a",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 4,
                  }}
                >
                  <span style={{ fontSize: 8, color: "#fff", fontWeight: 700 }}>
                    ↕
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            {Array.from({ length: FLOORS }, (_, i) => FLOORS - i).map(
              (floor) => {
                const count = floor === 10 ? TOP_FLOOR_ROOMS : ROOMS_PER_FLOOR;
                return (
                  <div
                    key={floor}
                    style={{
                      display: "flex",
                      gap: 3,
                      marginBottom: 3,
                      height: 28,
                    }}
                  >
                    {Array.from({ length: count }, (_, j) => {
                      const pos = j + 1;
                      const id = getRoomNumber(floor, pos);
                      const room = rooms[id];
                      const isLast = lastBooked.includes(id);
                      const booking = room.bookingId
                        ? bookings.find((b: any) => b.id === room.bookingId)
                        : null;
                      const bg = isLast
                        ? "#fffde7"
                        : room.status === "booked"
                        ? booking
                          ? booking.color + "33"
                          : "#fce4e4"
                        : "#e8f5e9";
                      const border = isLast
                        ? "#f9a825"
                        : room.status === "booked"
                        ? booking
                          ? booking.color
                          : "#e53935"
                        : "#43a047";
                      const textColor = isLast
                        ? "#e65100"
                        : room.status === "booked"
                        ? booking
                          ? booking.color
                          : "#c62828"
                        : "#2e7d32";
                      return (
                        <div
                          key={id}
                          title={`Room ${id} — ${room.status}`}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            height: "100%",
                            borderRadius: 4,
                            background: bg,
                            border: `1.5px solid ${border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxSizing: "border-box" as const,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: textColor,
                              lineHeight: 1,
                            }}
                          >
                            {id}
                          </span>
                        </div>
                      );
                    })}
                    {floor === 10 &&
                      Array.from(
                        { length: ROOMS_PER_FLOOR - TOP_FLOOR_ROOMS },
                        (_, j) => (
                          <div key={`e${j}`} style={{ flex: 1, minWidth: 0 }} />
                        )
                      )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {bookings.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 12,
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#999",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            BOOKING LOG
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column" as const,
              gap: 6,
              maxHeight: 180,
              overflowY: "auto" as const,
            }}
          >
            {bookings
              .slice(-10)
              .reverse()
              .map((b: any) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 10px",
                    background: "#f8f9fa",
                    borderRadius: 7,
                    borderLeft: `3px solid ${b.color}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: b.color,
                      minWidth: 55,
                    }}
                  >
                    Booking #{b.id}
                  </span>
                  <span style={{ fontSize: 12, flex: 1 }}>
                    Rooms: {b.roomIds.join(", ")}
                  </span>
                  {b.travelTime > 0 && (
                    <span style={{ fontSize: 11, color: "#888" }}>
                      {b.travelTime} min travel
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

